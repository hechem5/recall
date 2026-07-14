import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import prisma from "../prisma";
import { signToken, verifyToken } from "../lib/jwt";

const router = Router();

// Global IP-based rate limiter for the recovery code path
const recoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 recovery attempts per window
  message: { error: "Too many recovery attempts from this IP, please try again after an hour" },
  skip: (req) => {
    // Skip rate limiting if they aren't trying to use a recovery code
    return !req.body.recoveryCode;
  }
});

// IP + Device Token composite rate limiter to prevent NAT lockouts
const unlockIpDeviceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  keyGenerator: (req) => `${ipKeyGenerator(req.ip || '')}_${req.body.deviceToken || 'no-device'}`,
  message: { error: "Too many login attempts. For your security, please wait 15 minutes before trying again." }
});

// Strict Account/Device rate limiter to prevent IP rotation brute-forcing
const unlockAccountLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 20, // 20 attempts
  keyGenerator: (req) => req.body.deviceToken || req.body.recoveryCode || 'unknown',
  message: { error: "Too many login attempts on this device. Please wait 30 minutes." },
  skip: (req) => !req.body.deviceToken && !req.body.recoveryCode
});

const generateRandomCode = () => {
  return crypto.randomBytes(6).toString("hex").toUpperCase().match(/.{1,4}/g)?.join("-") || "ERRR-ORRR";
};

router.post("/create-safe", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const safe = await prisma.safe.create({ data: { passwordHash } });

    // Generate Device Token
    const deviceToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(deviceToken).digest("hex");
    
    await prisma.trustedDevice.create({
      data: { safeId: safe.id, tokenHash }
    });

    // Generate Recovery Codes
    const plainCodes: string[] = [];
    const codePromises = [];
    for (let i = 0; i < 10; i++) {
      const code = generateRandomCode();
      plainCodes.push(code);
      const codeHash = crypto.createHash("sha256").update(code).digest("hex");
      codePromises.push(prisma.recoveryCode.create({
        data: { safeId: safe.id, codeHash }
      }));
    }
    await Promise.all(codePromises);

    const token = signToken({ safeId: safe.id }, '30d');
    res.json({ token, safeId: safe.id, deviceToken, recoveryCodes: plainCodes });
  } catch (error) {
    console.error("Create safe error:", error);
    res.status(500).json({ error: "Failed to create safe" });
  }
});

router.post("/unlock", recoveryLimiter, unlockIpDeviceLimiter, unlockAccountLimiter, async (req, res) => {
  try {
    const { password, deviceToken, recoveryCode } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    if (!deviceToken && !recoveryCode) {
      return res.status(401).json({ error: "Unrecognized device. Please provide a recovery code." });
    }

    let safeId: string | null = null;

    if (deviceToken) {
      const tokenHash = crypto.createHash("sha256").update(deviceToken).digest("hex");
      const trustedDevice = await prisma.trustedDevice.findUnique({ where: { tokenHash } });
      if (trustedDevice) {
        safeId = trustedDevice.safeId;
        await prisma.trustedDevice.update({
          where: { id: trustedDevice.id },
          data: { lastUsed: new Date() }
        });
      }
    }

    let usedRecoveryCodeId: string | null = null;

    if (!safeId && recoveryCode) {
      const codeHash = crypto.createHash("sha256").update(recoveryCode).digest("hex");
      const dbCode = await prisma.recoveryCode.findUnique({ where: { codeHash } });
      if (dbCode && !dbCode.used) {
        safeId = dbCode.safeId;
        usedRecoveryCodeId = dbCode.id;
      }
    }

    if (!safeId) {
      return res.status(401).json({ error: "Unrecognized device or invalid recovery code. Please provide a valid recovery code." });
    }

    const safe = await prisma.safe.findUnique({ where: { id: safeId } });
    if (!safe) return res.status(401).json({ error: "Invalid password or unrecognized device." });

    const match = await bcrypt.compare(password, safe.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid password or unrecognized device." });
    }

    let newDeviceToken = deviceToken;

    if (usedRecoveryCodeId) {
      // Burn the code
      await prisma.recoveryCode.update({
        where: { id: usedRecoveryCodeId },
        data: { used: true }
      });
      
      // Issue new device token for this unrecognized device
      newDeviceToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(newDeviceToken).digest("hex");
      await prisma.trustedDevice.create({
        data: { safeId: safe.id, tokenHash }
      });
    }

    const remainingRecoveryCodes = await prisma.recoveryCode.count({
      where: { safeId: safe.id, used: false }
    });

    const token = signToken({ safeId: safe.id }, '30d');
    res.json({ 
      token, 
      safeId: safe.id, 
      deviceToken: newDeviceToken, 
      usedRecoveryCode: !!usedRecoveryCodeId,
      remainingRecoveryCodes
    });
  } catch (error) {
    console.error("Unlock error:", error);
    res.status(500).json({ error: "Failed to unlock safe" });
  }
});

// Need to manually verify JWT for this specific route since it's under /auth
router.post("/regenerate-recovery-codes", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1] as string;
    const decoded = verifyToken(token) as unknown as { safeId: string };
    const safeId = decoded.safeId;

    // Delete unused codes
    await prisma.recoveryCode.deleteMany({
      where: { safeId, used: false }
    });

    // Generate new batch
    const plainCodes: string[] = [];
    const codePromises = [];
    for (let i = 0; i < 10; i++) {
      const code = generateRandomCode();
      plainCodes.push(code);
      const codeHash = crypto.createHash("sha256").update(code).digest("hex");
      codePromises.push(prisma.recoveryCode.create({
        data: { safeId, codeHash }
      }));
    }
    await Promise.all(codePromises);

    res.json({ recoveryCodes: plainCodes });
  } catch (error) {
    console.error("Regenerate error:", error);
    res.status(500).json({ error: "Failed to regenerate recovery codes" });
  }
});

export default router;

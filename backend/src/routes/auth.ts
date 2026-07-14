import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET || "fallback-secret-key-for-jwt";

router.post("/create-safe", async (req, res) => {
  try {
    const { password, deviceId } = req.body;

    if (!password || !deviceId) {
      return res.status(400).json({ error: "Password and device ID are required" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const safe = await prisma.safe.create({
      data: {
        passwordHash,
        deviceId
      }
    });

    const token = jwt.sign({ safeId: safe.id, deviceId }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, safeId: safe.id });
  } catch (error) {
    console.error("Create safe error:", error);
    res.status(500).json({ error: "Failed to create safe" });
  }
});

router.post("/unlock", async (req, res) => {
  try {
    const { password, deviceId } = req.body;

    if (!password || !deviceId) {
      return res.status(400).json({ error: "Password and device ID are required" });
    }

    const safesOnDevice = await prisma.safe.findMany({
      where: { deviceId }
    });

    for (const safe of safesOnDevice) {
      const match = await bcrypt.compare(password, safe.passwordHash);
      if (match) {
        const token = jwt.sign({ safeId: safe.id, deviceId }, JWT_SECRET, { expiresIn: '30d' });
        return res.json({ token, safeId: safe.id });
      }
    }
    
    res.status(401).json({ error: "Invalid password or unrecognized device." });
  } catch (error) {
    console.error("Unlock error:", error);
    res.status(500).json({ error: "Failed to unlock safe" });
  }
});

export default router;

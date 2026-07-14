import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import DashboardAlerts from "./DashboardAlerts";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session.isLoggedIn || !session.safeId) {
    redirect("/unlock");
  }

  return (
    <>
      <DashboardAlerts 
        usedRecoveryCode={session.usedRecoveryCode} 
        remainingRecoveryCodes={session.remainingRecoveryCodes} 
      />
      {children}
    </>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { getAppMessages } from "@/lib/i18n/app-server";

export const instant = false;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthLayout({ children }: { children: ReactNode }) {
  // Auth screens depend on the visitor's session and language cookie.
  await connection();

  const { dict, lang } = await getAppMessages();
  return (
    <AuthShell dict={dict} lang={lang}>
      {children}
    </AuthShell>
  );
}

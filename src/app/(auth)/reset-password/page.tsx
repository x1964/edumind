import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Sign in · EduMind" };

export const instant = false;

// Authentication is Google-only now, so password recovery is not part of the
// product. Keep the route as a safe redirect for old bookmarks and links.
export default function ResetPasswordPage() {
  redirect("/login");
}

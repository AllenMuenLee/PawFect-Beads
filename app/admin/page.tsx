import { redirect } from "next/navigation";

import { hasAdminSession } from "@/src/lib/admin-guard";
import { AdminLoginForm } from "@/src/components/admin/login-form";

export default async function AdminLoginPage() {
  const authenticated = await hasAdminSession();

  if (authenticated) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <AdminLoginForm />
    </main>
  );
}

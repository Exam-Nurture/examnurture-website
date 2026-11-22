import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/app/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.get("en_token")?.value) {
    redirect("/");
  }
  return <AppShell>{children}</AppShell>;
}

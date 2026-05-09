import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.get("en_token")?.value) {
    redirect("/");
  }
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Collapsible sidebar — desktop only */}
      <Sidebar />

      {/* Right column: topbar + content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar hideSidebarItems />

        <main className="flex-1 pt-14 pb-20 md:pb-6" style={{ minHeight: "100vh" }}>
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
            {children}
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}

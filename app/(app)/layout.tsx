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
    /* `dash` scopes the Student Focus Hub token layer (light + dark pairs);
       `dash-ambient` paints the fixed, very soft brand glow behind content. */
    <div className="dash dash-ambient min-h-screen flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar hideSidebarItems />

        <main className="flex-1 pt-14 pb-24 md:pb-10">
          <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-5 md:py-7">
            {children}
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}

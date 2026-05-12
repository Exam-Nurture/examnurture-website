import MarketingHeader from "@/components/layout/MarketingHeader";
import MarketingFooter from "@/components/layout/MarketingFooter";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] transition-colors duration-300">
      <MarketingHeader />
      <main className="flex-1 pt-16 lg:pt-[68px] pb-28 lg:pb-0">
        {children}
      </main>
      <div className="pb-28 lg:pb-0">
        <MarketingFooter />
      </div>
    </div>
  );
}

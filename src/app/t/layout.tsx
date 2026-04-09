import { SiteHeader } from "@/components/layout/site-header";

export default function PublicTripLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="pt-16">{children}</div>
    </>
  );
}

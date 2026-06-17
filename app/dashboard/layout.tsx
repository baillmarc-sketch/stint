import { getProviderContext } from "@/lib/auth";
import { DashboardNav } from "./dashboard-nav";

/**
 * Provider dashboard shell. The storefront/availability/media editors only appear
 * once the user actually owns a provider (DB mode); the zero-config demo just
 * shows the Overview.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const provider = await getProviderContext();
  const tabs = [{ href: "/dashboard", label: "Overview" }];
  if (provider) {
    tabs.push(
      { href: "/dashboard/storefront", label: "Storefront" },
      { href: "/dashboard/availability", label: "Availability" },
      { href: "/dashboard/media", label: "Media" },
      { href: "/dashboard/payouts", label: "Payouts" },
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {tabs.length > 1 && <DashboardNav tabs={tabs} />}
      <div className={tabs.length > 1 ? "mt-7" : ""}>{children}</div>
    </div>
  );
}

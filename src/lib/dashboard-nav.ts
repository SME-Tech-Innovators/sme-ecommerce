export const DASHBOARD_NAV_IDS = [
  "dashboard",
  "orders",
  "products",
  "storefront",
  "templates",
  "analytics",
  "inventory",
  "settings",
] as const;

export type DashboardNavId = (typeof DASHBOARD_NAV_IDS)[number];

export type DashboardSectionAction =
  | { kind: "href"; label: string; href: string }
  | { kind: "section"; label: string; section: DashboardNavId };

export type DashboardSectionEmpty = {
  title: string;
  description: string;
  action?: DashboardSectionAction;
};

export type DashboardSectionConfig = {
  id: DashboardNavId;
  label: string;
  icon:
    | "grid"
    | "orders"
    | "box"
    | "store"
    | "layout"
    | "chart"
    | "inventory"
    | "gear";
  /** Main column heading */
  panelTitle: string;
  panelSubtitle: string;
  /** Primary panel when this section has no data yet */
  empty: DashboardSectionEmpty;
  /** When true, show a primary “New order” style control in the header */
  showHeaderCta?: boolean;
  headerCtaLabel?: string;
};

export const DASHBOARD_SECTIONS: readonly DashboardSectionConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "grid",
    panelTitle: "Dashboard overview",
    panelSubtitle:
      "Paid revenue, orders, and stock health for the last weeks.",
    empty: {
      title: "Overview",
      description:
        "Charts and KPIs appear here once you have storefront orders.",
    },
  },
  {
    id: "orders",
    label: "Orders",
    icon: "orders",
    panelTitle: "Orders",
    panelSubtitle:
      "Paid and pending storefront orders — customer email, phone, and totals.",
    empty: {
      title: "No orders yet",
      description:
        "When customers check out on your live store, orders show up here with contact details and payment status.",
      action: {
        kind: "section",
        label: "Make your site",
        section: "storefront",
      },
    },
  },
  {
    id: "products",
    label: "Products",
    icon: "box",
    panelTitle: "Products",
    panelSubtitle: "Catalog, pricing, and what you sell in one catalogue.",
    empty: {
      title: "No products yet",
      description:
        "Add what you sell once—use it on your storefront and in order flows so customers always see accurate items and prices.",
      action: { kind: "href", label: "Add a product", href: "#" },
    },
  },
  {
    id: "storefront",
    label: "My Store",
    icon: "store",
    panelTitle: "My Store",
    panelSubtitle:
      "Edit your public shop—branding, pages, and publish when you are ready.",
    empty: {
      title: "No storefront published",
      description:
        "Choose a template, customize your draft, then publish so customers can visit your store.",
      action: {
        kind: "section",
        label: "Browse templates",
        section: "templates",
      },
    },
  },
  {
    id: "templates",
    label: "Templates",
    icon: "layout",
    panelTitle: "Templates",
    panelSubtitle:
      "Preview layouts and choose one for your store. Your current template stays selected.",
    empty: {
      title: "No templates",
      description: "Templates will appear here when available.",
    },
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: "chart",
    panelTitle: "Analytics",
    panelSubtitle:
      "Revenue trends, status mix, top products, and category sales.",
    empty: {
      title: "No analytics yet",
      description:
        "Once there is order volume, trends and simple reports will show here so you can decide with numbers, not guesswork.",
    },
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "inventory",
    panelTitle: "Inventory",
    panelSubtitle: "Stock levels for active products — adjust counts anytime.",
    empty: {
      title: "No stock records yet",
      description:
        "Publish products first, then set quantities here so sold-out states stay honest.",
    },
  },
  {
    id: "settings",
    label: "Settings",
    icon: "gear",
    panelTitle: "Settings",
    panelSubtitle: "Payments, WhatsApp catalog, and workspace preferences.",
    empty: {
      title: "Workspace settings",
      description:
        "Connect Paystack payouts and Meta WhatsApp catalog sync from the tabs below.",
    },
  },
] as const;

export function getDashboardSection(
  id: DashboardNavId,
): DashboardSectionConfig {
  const found = DASHBOARD_SECTIONS.find((s) => s.id === id);
  if (!found) return DASHBOARD_SECTIONS[0];
  return found;
}

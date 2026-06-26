export interface NavItem {
  label: string;
  href: string;
  icon: string; // Material Symbols name
  /** Extra path prefixes that should mark this item active. */
  match?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "My Roadmaps", href: "/roadmaps", icon: "map", match: ["/roadmaps"] },
  { label: "Profile", href: "/profile", icon: "person" },
];

export function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  return (item.match ?? []).some((p) => pathname.startsWith(p));
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./components/icons";

const LINKS: [string, string, IconName, string?][] = [
  ["/", "Overview", "home"],
  ["/analytics", "Analytics", "chart"],
  ["/advisory", "Advisory", "bulb"],
  ["/studio/write", "Studio", "pen", "/studio"],
  ["/queue", "Queue", "clock"],
  ["/comments", "Comments", "chat"],
  ["/leads", "Leads", "users"],
  ["/targets", "Targets", "flag"],
  ["/alerts", "Alerts", "bell"],
  ["/calendar", "Calendar", "calendar"],
  ["/compose", "Compose", "send"],
  ["/bulk", "Bulk schedule", "layers"],
  ["/import", "Import data", "upload"],
  ["/settings", "Settings", "settings"],
  ["/features", "Features", "grid"],
];

const active = (path: string, href: string, match?: string) => { const m = match ?? href; return m === "/" ? path === "/" : path.startsWith(m); };

export function SideNav({ open = 0, alerts = 0 }: { open?: number; alerts?: number }) {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Main">
      {LINKS.map(([href, label, icon, match]) => (
        <Link key={href} href={href} className={active(path, href, match) ? "active" : ""}><Icon name={icon} />{label}{href === "/comments" && open > 0 && <span className="nav-badge" aria-label={`${open} comments need a reply`}>{open > 99 ? "99+" : open}</span>}{href === "/alerts" && alerts > 0 && <span className="nav-badge" aria-label={`${alerts} new alerts`}>{alerts > 99 ? "99+" : alerts}</span>}</Link>
      ))}
    </nav>
  );
}

export function MobileNav({ open = 0, alerts = 0 }: { open?: number; alerts?: number }) {
  const path = usePathname();
  return (
    <nav className="mobile-top" aria-label="Main">
      {LINKS.map(([href, label, icon, match]) => (
        <Link key={href} href={href} className={active(path, href, match) ? "active" : ""}><Icon name={icon} size={16} />{label}{href === "/comments" && open > 0 && <span className="nav-badge">{open > 99 ? "99+" : open}</span>}{href === "/alerts" && alerts > 0 && <span className="nav-badge">{alerts > 99 ? "99+" : alerts}</span>}</Link>
      ))}
    </nav>
  );
}

import type { Metadata } from "next";
import { isAuthed } from "@/lib/auth";
import { newCount } from "@/lib/comments/store";
import { unseenAlerts } from "@/lib/pulse/store";
import { Icon } from "./components/icons";
import { ToastProvider } from "./components/toast";
import { MobileNav, SideNav } from "./nav";
import "./globals.css";

export const metadata: Metadata = { title: "Li X Analyzer", description: "Schedule and measure LinkedIn and X posts" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthed();
  // The number on the Comments tab. A database hiccup must never stop the page from rendering.
  const open = authed ? await newCount().catch(() => 0) : 0;
  const alerts = authed ? await unseenAlerts().catch(() => 0) : 0;
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {authed ? (
            <div className="app">
              <aside className="side">
                <div className="brand"><span className="logo"><Icon name="chart" size={18} /></span>Li X Analyzer</div>
                <SideNav open={open} alerts={alerts} />
                <div className="side-foot">
                  <form action="/api/logout" method="post"><button className="btn ghost sm" style={{ width: "100%" }}><Icon name="logout" size={15} />Log out</button></form>
                </div>
              </aside>
              <div style={{ minWidth: 0 }}>
                <MobileNav open={open} alerts={alerts} />
                <main className="main">{children}</main>
              </div>
            </div>
          ) : (
            children
          )}
        </ToastProvider>
      </body>
    </html>
  );
}

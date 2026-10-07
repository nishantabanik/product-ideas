"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Icon } from "./icons";

type Tone = "ok" | "error" | "info";
type Toast = { id: number; title: string; body?: string; tone: Tone };
const Ctx = createContext<(t: { title: string; body?: string; tone?: Tone }) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((t: { title: string; body?: string; tone?: Tone }) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, title: t.title, body: t.body, tone: t.tone ?? "info" }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), t.tone === "error" ? 8000 : 4500);
  }, []);
  const value = useMemo(() => push, [push]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>
            <Icon name={t.tone === "ok" ? "check" : t.tone === "error" ? "alert" : "info"} size={18} />
            <div><b>{t.title}</b>{t.body && <p>{t.body}</p>}</div>
            <button className="icon-btn" aria-label="Dismiss" onClick={() => setList((l) => l.filter((x) => x.id !== t.id))}><Icon name="x" size={14} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

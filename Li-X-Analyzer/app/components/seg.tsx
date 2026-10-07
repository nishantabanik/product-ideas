"use client";
import Link, { useLinkStatus } from "next/link";

function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <span className="topbar" aria-hidden="true" /> : null;
}

export type SegOption = { value: string; label: string; href?: string };

/** Segmented control with a thumb that slides to the chosen option. Options are links, or buttons when onChange is given. */
export default function Seg({ options, value, onChange, label, small }: {
  options: SegOption[]; value: string; onChange?: (v: string) => void; label: string; small?: boolean;
}) {
  const i = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div className={`seg${small ? " small" : ""}`} role="tablist" aria-label={label}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`, ["--n" as string]: options.length, ["--i" as string]: i }}>
      <span className="thumb" aria-hidden="true" />
      {options.map((o) =>
        o.href ? (
          <Link key={o.value} href={o.href} scroll={false} role="tab" aria-selected={o.value === value} className={o.value === value ? "on" : ""}>{o.label}<Pending /></Link>
        ) : (
          <button key={o.value} type="button" role="tab" aria-selected={o.value === value} className={o.value === value ? "on" : ""} onClick={() => onChange?.(o.value)}>{o.label}</button>
        ),
      )}
    </div>
  );
}

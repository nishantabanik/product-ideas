"use client";
import { useEffect, useState } from "react";

export type Channel = { id: string; name: string; identifier: string };
export type Platform = "x" | "linkedin";

export const platformOf = (c: Channel): Platform => (c.identifier === "x" ? "x" : "linkedin");

/** Loads the connected X and LinkedIn channels and remembers which one is picked for each platform. */
export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [chosen, setChosen] = useState<Partial<Record<Platform, string>>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/channels").then(async (r) => {
      const d = await r.json();
      if (!r.ok) return setError(d.error ?? "Could not load channels");
      const list = (d as Channel[]).filter((c) => c.identifier === "x" || c.identifier.startsWith("linkedin"));
      setChannels(list);
      const first = (p: Platform) => list.find((c) => platformOf(c) === p)?.id;
      setChosen({ x: first("x"), linkedin: first("linkedin") });
    }).catch(() => setError("Could not reach the server"));
  }, []);

  return { channels, chosen, setChosen, error };
}

export function ChannelSelects({ channels, chosen, setChosen }: {
  channels: Channel[]; chosen: Partial<Record<Platform, string>>; setChosen: (v: Partial<Record<Platform, string>>) => void;
}) {
  const multi = (["x", "linkedin"] as const).filter((p) => channels.filter((c) => platformOf(c) === p).length > 1);
  if (!multi.length) return null;
  return (
    <div className="row">
      {multi.map((p) => (
        <label key={p} className="field">
          <span>{p === "x" ? "X account" : "LinkedIn account"}</span>
          <select className="input" value={chosen[p]} onChange={(e) => setChosen({ ...chosen, [p]: e.target.value })}>
            {channels.filter((c) => platformOf(c) === p).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

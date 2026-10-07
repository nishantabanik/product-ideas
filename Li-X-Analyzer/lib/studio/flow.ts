import type { DraftStatus } from "./types.ts";

export type Action = "promote" | "submit" | "approve" | "changes" | "reopen" | "schedule";

/** Where a draft can go from each state. A single person can also approve their own draft, unless approval is made mandatory. */
export function nextStatus(from: DraftStatus, action: Action, requireApproval = false): DraftStatus {
  const bad = (): never => { throw new Error(`We cannot ${action === "schedule" ? "schedule" : action === "promote" ? "turn into a draft" : action} a ${from} from here.`); };
  switch (action) {
    case "promote": return from === "idea" ? "draft" : bad();
    case "submit": return from === "draft" ? "review" : bad();
    case "approve": return from === "review" || (from === "draft" && !requireApproval) ? "approved" : bad();
    case "changes": return from === "review" || from === "approved" ? "draft" : bad();
    case "reopen": return from === "approved" || from === "review" ? "draft" : bad();
    case "schedule":
      if (from === "approved" || (!requireApproval && (from === "draft" || from === "review"))) return "scheduled";
      throw new Error(requireApproval ? "Approval is required before scheduling. Submit the draft for review and approve it first." : `We cannot schedule a ${from} from here.`);
  }
}

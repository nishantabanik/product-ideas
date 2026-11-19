# ADR 001: Modular browser application for the first release

Status: Accepted for the local release. Date: 2026-11-03.

Use native ES modules, CSS, semantic HTML and a small Node static server. The repository contains independently structured apps; there is no shared framework requirement. Unlike the earlier provisional Next.js suggestion, this release has no server-side accounts or payments and needs no framework dependencies. This keeps local setup reproducible with the installed Node 22 runtime.

Alternatives: Next.js/React would help a future server-backed commercial version but introduces dependency installation and deployment decisions now. A hosted site would provide a public URL but publication has not been approved. Native apps duplicate delivery effort before validation.

Separate content, bilingual UI strings, state/scoring and view modules. Use versioned localStorage with defensive parsing, validation and failure notices. Escape text before DOM insertion. No student data leaves the browser. Save answer drafts and an absolute mock deadline; timers derive from wall-clock time. Subjective writing/speaking are self-reviewed and excluded from objective grades. Do not collect microphone recordings.

Limitations: no cross-device sync, no tamper-proof exam scores, synthetic voice availability varies by platform, no official certification or human content validation. Static architecture can be retained or migrated when accounts/payment requirements are approved.

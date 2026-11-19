# DevOps Decisions: exams-curriculum-apple-design
Date: 2026-11-04

## Deployment Readiness
- Production build requires no transpilation or bundler step.
- All files serve statically through Node `server.mjs` or any static web host.
- Static assets and tests verified via `npm test`.

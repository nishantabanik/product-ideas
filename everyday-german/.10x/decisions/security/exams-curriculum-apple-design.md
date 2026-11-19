# Security Decisions: exams-curriculum-apple-design
Date: 2026-11-04

## Security Assessment
- All newly rendered templates use strict HTML entity escaping `esc()` for dynamic inputs.
- Hash-based client routing strictly routes through predefined page matchers or falls back to `notFound()`.
- Local storage inputs are bounded and sanitized against whitelisted enums.
- Zero external CDN or script dependencies added.

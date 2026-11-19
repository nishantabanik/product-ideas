# CTO Decisions: Exams Hub, Multi-Level Curriculum & Apple Design
Feature: exams-curriculum-apple-design
Date: 2026-11-04

## Business Case & Strategic Value
Expats, international students, and foreign professionals preparing for life in Germany face strict language milestones:
- A1 for spouse visa and basic residency.
- A2 for initial integration.
- B1 for Niederlassungserlaubnis (permanent residency) and Einbürgerung (citizenship).
- Both telc and Goethe are recognized certifying bodies. Offering both test formats gives users complete exam confidence without costly subscriptions.

## Tech Direction
- Single-page vanilla JavaScript client with local storage persistence.
- Zero server database overhead; all curriculum packs bundled client-side with instant navigation.
- High-performance Apple-grade design language using modern CSS variables and backdrop-filter without heavyweight UI framework dependencies.

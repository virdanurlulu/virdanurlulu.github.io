# Pressure Vessel Builder — Domain Refactor

Domain-based engineering refactor:
- Body
- Nozzles / Manholes
- Supports
- External Attachments
- Internal Attachments
- Removable Internals

This version moves the project from a builder-per-shape structure to a domain-based architecture that is closer to a real fabrication breakdown.

Status:
- Project structure has been refactored
- Standard Vessel, Pig Launcher, and Reboiler are assembled from domain modules and assemblies
- The UI is organized by engineering family
- Basic naming, validation, and BOM features are active

Notes:
- Some domains are still in the initial implementation or scaffold stage so the project remains clean and scalable
- Run through localhost or GitHub Pages, not `file:///`

---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# NST Web — local console

Scope: the whole NST web console single-page app (this repo). Visitor mode: Operate.
Audience: the author operating NST on their own network, and portfolio reviewers watching real sessions.
Job: see what is being watched, what was detected and how severe, investigate a finding to its evidence, run TLS / GeoIP / reports.
Constraints: dark (brief-pinned), English, every figure from the live API, blocked/unavailable states explicit, secrets never shown.

## Direction contract

THESIS: Findings are departures. The console is a live gate board where every finding holds its row identity, re-ranks in place, and a new or changed row stays lit until someone opens it. Refuses the KPI-tile-and-alert-table SOC template.

OWN-WORLD: Ink #0B0D10 ground, slate #1C2127 panels, steel #6B7178 secondary, panel-white #E6E8EB type; one alert yellow #FFD400 reserved for new/changed rows and the primary action; severity red only where it carries meaning. Condensed tabular mono for board labels and figures, a workhorse sans for prose. Segmented pass with perforation for evidence; flap cells for assets.

STORY: The operator sees which sensors are running and on what, watches findings arrive at the top of the board lit yellow, opens one into a pass that shows from → to, sensor, time, and the raw evidence, then reports or moves on.

FIRST VIEWPORT: Left rail nav. Top bar: wordmark, live clock, stream status, capture permission. Sensor strip of four sensor rows with interface, state line and start/stop. Below, the findings board fills the centre (time, severity, finding, asset, sensor, status columns); the selected finding opens as a pass in a right column. Primary action: start sensors.

FORM: Gate board and boarding pass, catalog challenger vernacular-ephemera-boarding-pass-and-gate-board; seed key b215df94.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

---
name: NST Web
description: Local live console for the Network Security Toolkit, drawn as a departures gate board with a boarding pass for evidence.
colors:
  ink: "#0b0d10"
  ink-raised: "#111418"
  slate: "#1c2127"
  slate-raised: "#252b33"
  slate-selected: "#303740"
  line: "#2a3038"
  line-strong: "#3a424c"
  steel: "#6b7178"
  text-secondary: "#959ca5"
  panel-white: "#e6e8eb"
  white: "#ffffff"
  alert-yellow: "#ffd400"
  alert-yellow-bright: "#ffe04d"
  alert-ink: "#1a1500"
  ok-green: "#3dd68c"
  critical-red: "#e5484d"
  high-coral: "#ff8a65"
  medium-sand: "#e2c27a"
  low-mist: "#9fb0c3"
  info-grey: "#7d858e"
  pass-label: "#545b63"
  pass-rule: "#cdd1d6"
typography:
  display:
    fontFamily: "Martian Mono Variable, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "2.5rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.02em"
    fontFeature: "\"tnum\""
    fontVariation: "\"wdth\" 75"
  headline:
    fontFamily: "Inter Variable, -apple-system, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter Variable, -apple-system, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.005em"
  board-figure:
    fontFamily: "Martian Mono Variable, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "0.02em"
    fontFeature: "\"tnum\""
    fontVariation: "\"wdth\" 75"
  body:
    fontFamily: "Inter Variable, -apple-system, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"cv11\", \"ss01\""
  body-small:
    fontFamily: "Inter Variable, -apple-system, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Martian Mono Variable, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    letterSpacing: "0.12em"
    fontVariation: "\"wdth\" 75"
  button:
    fontFamily: "Martian Mono Variable, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.1em"
    fontVariation: "\"wdth\" 75"
  code:
    fontFamily: "Martian Mono Variable, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    fontFeature: "\"tnum\""
    fontVariation: "\"wdth\" 85"
rounded:
  cell: "3px"
  s: "4px"
  m: "8px"
  l: "12px"
  pill: "99px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  button:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.panel-white}"
    typography: "{typography.button}"
    rounded: "{rounded.s}"
    padding: "0 14px"
    height: "34px"
  button-hover:
    backgroundColor: "{colors.slate-raised}"
  button-primary:
    backgroundColor: "{colors.alert-yellow}"
    textColor: "{colors.alert-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.s}"
    padding: "0 14px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "{colors.alert-yellow-bright}"
  button-ghost:
    textColor: "{colors.panel-white}"
    typography: "{typography.button}"
    rounded: "{rounded.s}"
    padding: "0 10px"
    height: "28px"
  button-small:
    padding: "0 10px"
    height: "28px"
  input:
    backgroundColor: "{colors.ink-raised}"
    textColor: "{colors.panel-white}"
    typography: "{typography.body-small}"
    rounded: "{rounded.s}"
    padding: "0 10px"
    height: "34px"
  nav-item:
    textColor: "{colors.text-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.m}"
    padding: "8px 10px"
  nav-item-active:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.panel-white}"
  nav-count:
    backgroundColor: "{colors.alert-yellow}"
    textColor: "{colors.alert-ink}"
    rounded: "{rounded.pill}"
    height: "18px"
  status-pill:
    textColor: "{colors.panel-white}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "28px"
  panel:
    backgroundColor: "{colors.slate}"
    rounded: "{rounded.l}"
    padding: "16px"
  severity-tag:
    typography: "{typography.label}"
    rounded: "{rounded.cell}"
    padding: "0 7px"
    height: "22px"
  severity-tag-critical:
    backgroundColor: "{colors.critical-red}"
    textColor: "{colors.white}"
  flap-cell:
    backgroundColor: "#20252c"
    textColor: "{colors.panel-white}"
    rounded: "{rounded.cell}"
    padding: "3px 7px"
  board-row:
    textColor: "{colors.text-secondary}"
    padding: "0 12px"
    height: "46px"
  board-row-new:
    textColor: "{colors.panel-white}"
  board-row-selected:
    backgroundColor: "{colors.slate-selected}"
  pass:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.ink-raised}"
    rounded: "{rounded.l}"
    width: "400px"
  pass-head:
    backgroundColor: "{colors.ink-raised}"
    textColor: "{colors.panel-white}"
    padding: "12px 18px"
  pass-head-critical:
    backgroundColor: "{colors.critical-red}"
    textColor: "{colors.white}"
  tab-active:
    textColor: "{colors.panel-white}"
    typography: "{typography.button}"
    height: "38px"
    padding: "0 14px"
---

# Design System: NST Web

## Overview

**Creative North Star: "The Departures Board"**

NST Web is an airport gate board at night. Findings arrive like departures: each holds its row, re-ranks in place, and a new or changed row carries a lit yellow status until someone opens it. Opening a row issues a boarding pass, the one light-paper object in a dark hall, which shows the route (from → to), the gate details (finding, asset, sensor, filed time), and the raw evidence below a perforated tear line. Everything else stays quiet: ink ground, slate panels, hairline rules.

Density is operational. Rows sit at 46px, labels are small condensed uppercase mono, and figures are tabular so columns of numbers hold still while they update. The world uses two voices: a condensed board mono (Martian Mono at 75% width) for anything you would see on a departures display (labels, times, codes, figures, buttons), and a workhorse sans (Inter) for sentences a person reads. Colour is held back so it can carry meaning: one alert yellow for new and act-now, a severity ramp from coral to mist, and solid red only for critical.

The world rejects the SOC template of KPI tiles above an alert table. Figures live in rows and in joined, hairline-divided strips, never in a grid of separate cards.

**Key Characteristics:**
- Dark ink ground (#0b0d10) with slate panels and 1px hairlines; depth is tonal.
- Condensed tabular board mono for labels, figures and actions; Inter for prose.
- Alert yellow is scarce and semantic: new, primary action, focus, current tab.
- The boarding pass is the only light, shadowed surface, with perforation, notches and a scan code.
- Split-flap cells for assets and interfaces; state carried in line form on sensor leaders.

## Colors

A near-black airport hall with one sodium-yellow signal and a severity ramp that only speaks when something is wrong.

### Primary
- **Gate Yellow** (alert-yellow): the only accent. Primary action button, the NEW status in board rows, the new-findings count badge, the active tab underline, the focus ring, text caret and selection, the arrival flash on a freshly ranked row, and the chart's event marker. Hover brightens to Gate Yellow Bright (alert-yellow-bright). Text on yellow is Alert Ink (alert-ink), never white.

### Secondary
- **Running Green** (ok-green): operational state only. Running sensor status, the pulsing leader line, the Live and Capture-allowed pill dots.
- **Critical Red** (critical-red): critical severity (solid tag, red pass head), error and blocked states, the bad-tone pill and notice.

### Tertiary
- **Severity ramp**: High Coral (high-coral), Medium Sand (medium-sand), Low Mist (low-mist), Info Grey (info-grey). Used as text and 1px outline on severity tags; never as fills.

### Neutral
- **Ink** (ink): page ground and top bar.
- **Raised Ink** (ink-raised): left rail, inputs, notices, disabled buttons, and the dark ink printed on the pass (head band, buttons, scan code, redaction chip).
- **Slate** (slate): panels, default buttons, hover and active nav, sticky board header.
- **Slate Raised** (slate-raised) and **Slate Selected** (slate-selected): row hover and the selected row; button hover and active.
- **Line** (line) and **Line Strong** (line-strong): hairline dividers and control strokes.
- **Steel** (steel): disabled text, SEEN status, hover stroke on controls.
- **Secondary Text** (text-secondary): table cells at rest, labels, meta, hints.
- **Panel White** (panel-white): primary text on dark, and the paper of the pass.
- **Pass Label** (pass-label) and **Pass Rule** (pass-rule): labels and segment dividers printed on the pass paper.

### Named Rules
**The Lit Status Rule.** Yellow marks what is new or what to do next, and nothing else. A new row lights its status cell and brightens its text; the row background stays on ink, so yellow remains scarce however many findings arrive.

**The Red Is Earned Rule.** Solid red fills only critical severity and the critical pass head. High, medium, low and info are outlined text tags in their ramp colour.

## Typography

**Display Font:** Martian Mono Variable, condensed to 75% width (with ui-monospace, SF Mono, Menlo)
**Body Font:** Inter Variable with cv11 and ss01 (with -apple-system, Segoe UI, Helvetica, Arial)

**Character:** The condensed mono is the board: uppercase, tracked, tabular, it makes times, IPs, serials and buttons read like a departures display. Inter carries summaries, descriptions and page copy so long sentences stay readable.

### Hierarchy
- **Display** (500, 2.5rem, line-height 1): the live clock in the top bar only; drops to 1.125rem under 820px.
- **Headline** (600, 1.375rem): page headings in Inter.
- **Title** (600, 1.125rem, 1.35): the pass title, the finding summary.
- **Board Figure** (600, 1.375rem, 1.15, tabular): the from → to route on the pass and figure strip values; steps down to 1rem and 0.8125rem for long values.
- **Body** (400, 0.875rem, 1.5): default text; Body Small (0.8125rem) for tables, notices and form fields. Page descriptions cap at 70ch.
- **Label** (500, 0.6875rem, 0.12em, uppercase): column headers, field labels, pass segment labels, figure labels.
- **Button** (600, 0.75rem, 0.1em, uppercase): buttons, tabs, segmented controls, status words.
- **Code** (400, 0.8125rem, 85% width, tabular): evidence values, inline code, mono inputs.

### Named Rules
**The Two Voices Rule.** If it would appear on a departures board (time, code, address, count, status, action), set it in condensed board mono; if it is a sentence, set it in Inter. Never set prose in the mono.

**The Still Figures Rule.** Every live number uses tabular figures so columns do not jitter as values change.

## Layout

A fixed application shell: a 216px left rail spanning full height, a 72px top bar (title, clock, status pills), and a scrolling main area with 20px 24px page padding and 20px vertical gaps between blocks. The Board page stacks the sensor strip (one row per sensor on a six-column grid: name, leader line, status, figures, interface, action) above a two-column board layout: the findings table fills the centre and the pass docks in a 400px sticky right column, 16px apart.

Spacing steps on 4px: 4, 8, 12, 16, 20, 24. Panels pad 16px; panel heads 14px 16px; the pass pads 18px horizontally.

Responsive: at 1280px the pass narrows to 360px and the sensor leader line hides. At 1080px the board goes single-column, the open pass becomes a bottom sheet (max 82vh) with a close button, and the sensor and status columns hide. At 820px the rail turns into a horizontally scrolling top nav, the page title hides, the top bar shrinks to 52px, sensor rows re-flow into a name/status, figures, interface/action grid, and the asset column hides. At 560px board rows grow to auto height with a three-line clamped finding.

## Elevation & Depth

The hall is flat. Depth comes from tone (ink, raised ink, slate, slate raised, slate selected) and 1px hairlines, not shadows. The pass is the one object lifted off the board, and the split-flap cell carries a 1px physical seam.

### Shadow Vocabulary
- **Pass lift** (`box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.7)`): the docked pass.
- **Sheet lift** (`box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.6)`): the pass as a bottom sheet below 1080px.
- **Flap seam** (`box-shadow: 0 1px 0 rgba(0, 0, 0, 0.5)`): the lower edge of a split-flap cell.
- **Active inset** (`box-shadow: inset 0 0 0 1px #3a424c`): the current nav item.

### Named Rules
**The One Paper Rule.** The boarding pass is the only light surface and the only element that casts a real shadow. Panels, cards and rows stay flat on ink.

## Shapes

Corners are gentle and graded by scale: 3px for small printed cells (severity tags, flap cells, inline code), 4px for controls (buttons, inputs, segmented and filter toggles), 8px for nav items and notices, 12px for panels and the pass. Pills (99px) are reserved for the top-bar status pills and the nav count. The pass adds its own geometry: a dashed perforation line with two 10px semicircular notches cut through the paper at its ends (a CSS mask, so the page shows through), and a 48-bar scan code derived from the finding id.

## Components

### Buttons
Board-type labels on squared plates.
- **Shape:** gently squared (4px), 34px tall, 28px for small.
- **Default:** slate plate with a strong-line stroke and panel-white board type (600, 0.75rem, 0.1em, uppercase).
- **Primary:** Gate Yellow plate with Alert Ink text, used for the screen's one start or run action. Disabled primary dims to #4a4220 with #9a8c4a text.
- **Hover / Active:** slate raised with a steel stroke, slate selected when pressed; primary brightens to Gate Yellow Bright. Transitions 150ms on the house ease.
- **Ghost:** transparent until hover; **Danger:** red stroke and pink text on hover only.
- **On the pass:** buttons invert to raised-ink plates; the secondary is transparent with a #9aa0a7 stroke.

### Chips
- **Severity tag:** 22px, 3px corners, 1px outline in its ramp colour with matching text; critical is a solid red plate with white text.
- **Filter toggles:** 30px outlined board-type buttons with counts; pressed inverts to a panel-white plate with ink text. The new-only toggle uses a yellow outline and turns solid yellow when pressed.
- **Status pills:** 28px pills with a strong-line stroke and a 7px dot (green ok, yellow warn, red bad).

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** slate on ink.
- **Shadow Strategy:** none; see The One Paper Rule.
- **Border:** 1px line, with a hairline-divided head (board-type 0.8125rem title, meta, tools on the right).
- **Internal Padding:** 16px.
- **Notices:** raised ink, 8px corners, strong-line stroke; warn and bad tones tint the stroke and wash.

### Inputs / Fields
- **Style:** raised ink fill, 1px strong-line stroke, 4px corners, 34px (30px inside filters and sensor rows).
- **Hover:** stroke to steel. **Focus:** stroke and 1px ring in Gate Yellow.
- **Error:** red stroke via aria-invalid. Labels above fields use the Label style.

### Navigation
- **Rail:** raised ink, 216px, wordmark at top, footer note at bottom. Items are Inter 0.875rem with an icon, secondary text at rest, slate fill with a strong inset stroke when current, and a yellow pill count for new findings.
- **Tabs:** board-type, 38px, with a 2px Gate Yellow underline on the selected tab.
- **Mobile:** below 820px the rail becomes a single horizontally scrolling row.

### Findings Board (signature)
A sticky-headed table of 46px rows: time, severity tag, finding, asset as a flap cell, sensor code, and status (NEW in yellow board type, SEEN in steel). Rows at rest read in secondary text; unread rows brighten to panel white with a 500-weight finding. A newly ranked row flashes a yellow wash that fades over 1.6s. Hover uses slate raised; the selected row uses slate selected.

### Sensor Row (signature)
A sensor name and hint joined to its status by a leader line whose form is the state: dotted strong line when idle, solid pulsing green when running, dashed yellow when stopping, solid red on error or blocked. Interface and filter display as flap cells; tabular figures sit beside them.

### Split-flap Cell (signature)
Two leaves meeting at a hairline seam (#20252c over #1a1e24 with a dark centre line), 3px corners, condensed mono 0.75rem, ellipsis on overflow. Used for assets and interfaces.

### Boarding Pass (signature)
Panel-white paper with 12px corners and the pass lift. A raised-ink head band carries severity and serial in board type (red band for critical). Below: the Inter title, the from → to route in board figures with small labels, the perforation with notches, a two-column segment grid divided by pass-rule lines, the evidence list (key in condensed mono, value in code style, redacted values as an ink chip), the scan code, and a footer of inverted buttons. TLS results reuse the same pass.

## Do's and Don'ts

### Do:
- **Do** reserve Gate Yellow for new, act-now and focus: the primary action, NEW status, new count, active tab, focus ring and the arrival flash.
- **Do** set times, addresses, serials, counts, status words and buttons in the condensed board mono (75% width, tabular), and sentences in Inter.
- **Do** show evidence on a pass: route on top, perforation, labelled segments, then evidence.
- **Do** carry sensor state in the leader line form as well as the status word.
- **Do** keep panels flat slate on ink with 1px hairlines and 12px corners.
- **Do** honour reduced motion; the house ease is cubic-bezier(0.16, 1, 0.3, 1) at 150ms for state changes.

### Don't:
- **Don't** build screens as a grid of separate KPI tiles over an alert table; put figures in rows or a joined, hairline-divided strip.
- **Don't** fill a whole row or panel with yellow; the status cell lights, the row does not.
- **Don't** use solid red for anything below critical severity.
- **Don't** add drop shadows to panels, rows or controls; only the pass lifts.
- **Don't** introduce a light theme or a second accent hue; the hall is dark and the signal is yellow.

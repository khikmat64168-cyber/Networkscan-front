# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript single-page app in its own repository (Networkscan-front). The backend is the NST Python package (network-security-toolkit repo, FastAPI under `nst web`). The built `dist/` is served as static files by Caddy on the VPS and is also bundled into the NST Python package by the backend's CI so a local `nst web` serves it. Node is a build-time dependency only.

## Users

The author, running NST on their own home/lab network to watch for LAN attacks and audit TLS endpoints, and — through the same running tool — reviewers of the author's security engineering portfolio (recruiters, interviewers) seeing it demonstrated or in screenshots. Both are technical; neither is a full-time SOC analyst.

## Product Purpose

NST Web is the local browser console for the Network Security Toolkit: it starts and stops the toolkit's capture sensors (traffic analyzer, ARP / DNS / MAC detectors), streams their findings live, and gives access to TLS inspection, GeoIP lookups and HTML reports. Success means an operator can tell at a glance what is being watched, what has been detected and how severe it is, and can investigate any finding down to its evidence — with every number on screen coming from the running pipeline.

## Positioning

Not a hosted SIEM: a single-user console bound to loopback that drives real packet capture on the machine it runs on. Findings are normalized into a CHIMERA-style `security.event` shape (category, severity info→critical, summary, asset reference, evidence), with secrets redacted at the boundary.

## Operating Context

- Started from a terminal with `nst web` (often `sudo nst web`), opened via a one-time tokenized loopback URL.
- Capture permission depends on the host (root, CAP_NET_RAW, macOS access_bpf); it is probed live, not assumed.
- Sessions are ad hoc: start sensors, watch for minutes to hours, investigate, generate a report, stop.

## Capabilities and Constraints

- Operational: live traffic analysis (protocol mix, top talkers/ports, packet rate, recent packets, credential and threat findings), ARP spoofing / DNS spoofing / MAC flooding detection with their observed tables, TLS certificate scanning, GeoIP (ip-api.com over plain HTTP), HTML report generation and viewing.
- Unavailable in the web UI: PCAP export (CLI only: `nst sniff -o`). Public deployment is a later, separate phase.
- Plaintext passwords and raw credential context are never sent to the browser.
- The UI must never invent metrics or simulate successful operations; unavailable and blocked features are shown as such.

## Brand Commitments

- Name: NST / Network Security Toolkit. CHIMERA is a conceptual influence (event contract, severity scale, sensor-module idea), not a visible brand.
- Interface language: English, matching the CLI and docs.

## Evidence on Hand

Real data only comes from a running backend: no sample datasets, screenshots, testimonials or benchmarks exist. Portfolio screenshots must be captured from real sessions.

## Product Principles

1. Truth over theatre: every figure is traceable to the running pipeline; empty means empty.
2. State is explicit: operational, blocked (with the reason and the fix) and unavailable are visually distinct.
3. Severity leads attention; evidence settles questions.
4. Local and private by default: loopback only, token-gated, secrets redacted.

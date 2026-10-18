import { describe, expect, it } from "vitest";

import type { SecurityEvent, SensorStatus } from "../api/types";
import { filterEvents, initialState, MAX_EVENTS, reducer } from "./reducer";

function ev(seq: number, overrides: Partial<SecurityEvent> = {}): SecurityEvent {
  return {
    id: `id-${seq}`,
    seq,
    occurred_at: new Date(2026, 9, 17, 1, 0, seq).toISOString(),
    sensor: "arp",
    module: "nst.arp_detector",
    category: "arp.mac_change",
    severity: "high",
    summary: `event ${seq}`,
    asset_ref: `10.0.0.${seq}`,
    evidence: {},
    schema_version: 1,
    ...overrides,
  };
}

const base = () => initialState("ok", new Set());

describe("reducer", () => {
  it("merges events newest first and ignores duplicates", () => {
    let s = reducer(base(), { type: "events", events: [ev(1), ev(3)] });
    s = reducer(s, { type: "events", events: [ev(2), ev(3)], live: true });
    expect(s.events.map((e) => e.seq)).toEqual([3, 2, 1]);
    expect(s.lastSeq).toBe(3);
    expect(s.counts.high).toBe(3);
    expect([...s.live]).toEqual(["id-2"]);
  });

  it("uses server counts when provided (they are not capped)", () => {
    const s = reducer(base(), { type: "events", events: [ev(1)], counts: { high: 40, critical: 2 }, lastSeq: 42 });
    expect(s.counts).toEqual({ high: 40, critical: 2 });
    expect(s.lastSeq).toBe(42);
  });

  it("caps the client-side list", () => {
    const many = Array.from({ length: MAX_EVENTS + 10 }, (_, i) => ev(i + 1));
    const s = reducer(base(), { type: "events", events: many });
    expect(s.events).toHaveLength(MAX_EVENTS);
    expect(s.events[0]?.seq).toBe(MAX_EVENTS + 10);
  });

  it("selecting marks a finding as seen", () => {
    let s = reducer(base(), { type: "events", events: [ev(1), ev(2)] });
    s = reducer(s, { type: "select", id: "id-1" });
    expect(s.selectedId).toBe("id-1");
    expect(s.seen.has("id-1")).toBe(true);
    expect(s.seen.has("id-2")).toBe(false);
  });

  it("updates one sensor without touching the others", () => {
    const status = (kind: SensorStatus["kind"], state: SensorStatus["state"]): SensorStatus => ({
      kind, label: kind, state, interface: null, bpf_filter: null, started_at: null,
      stopped_at: null, error: null, packets: null, events: null,
    });
    let s = reducer(base(), { type: "sensors", sensors: [status("arp", "idle"), status("dns", "idle")] });
    s = reducer(s, { type: "sensor", sensor: status("arp", "running") });
    expect(s.sensors.arp?.state).toBe("running");
    expect(s.sensors.dns?.state).toBe("idle");
  });
});

describe("server instance", () => {
  it("adopts the first instance and resets history when it changes", () => {
    let s = reducer(base(), { type: "instance", instanceId: "run-1" });
    s = reducer(s, { type: "events", events: [ev(5), ev(6)] });
    s = reducer(s, { type: "select", id: "id-5" });
    expect(reducer(s, { type: "instance", instanceId: "run-1" })).toBe(s);

    const next = reducer(s, { type: "instance", instanceId: "run-2" });
    expect(next.events).toEqual([]);
    expect(next.lastSeq).toBe(0);
    expect(next.selectedId).toBeNull();
    expect(next.instanceId).toBe("run-2");
    expect(next.seen.has("id-5")).toBe(true);
  });
});

describe("filterEvents", () => {
  const events = [
    ev(3, { severity: "low", sensor: "dns", summary: "zero TTL", asset_ref: "example.com" }),
    ev(2, { severity: "critical" }),
    ev(1, { severity: "medium", sensor: "traffic" }),
  ];
  const none = { severities: new Set<never>(), sensor: "all" as const, query: "", unreadOnly: false };

  it("keeps time order by default and ranks by severity on request", () => {
    expect(filterEvents(events, none, new Set(), "time").map((e) => e.seq)).toEqual([3, 2, 1]);
    expect(filterEvents(events, none, new Set(), "severity").map((e) => e.seq)).toEqual([2, 1, 3]);
  });

  it("filters by severity, sensor, query and unread", () => {
    expect(filterEvents(events, { ...none, severities: new Set(["critical"]) }, new Set(), "time")).toHaveLength(1);
    expect(filterEvents(events, { ...none, sensor: "dns" }, new Set(), "time")[0]?.seq).toBe(3);
    expect(filterEvents(events, { ...none, query: "EXAMPLE" }, new Set(), "time")[0]?.seq).toBe(3);
    expect(filterEvents(events, { ...none, unreadOnly: true }, new Set(["id-3"]), "time").map((e) => e.seq)).toEqual([2, 1]);
  });
});

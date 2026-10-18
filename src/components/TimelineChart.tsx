// Packets-per-second line for the running capture.  Seconds inside the
// capture window with no bucket really had zero packets (the backend only
// emits buckets for seconds that saw traffic), so they are drawn as zero;
// nothing is drawn outside the window the sensor was running.

import { useLayoutEffect, useMemo, useRef, useState } from "react";

import type { TimelinePoint } from "../api/types";

interface Marker {
  t: number;
  label: string;
}

interface Props {
  points: TimelinePoint[];
  /** Epoch seconds of the capture window. */
  start: number;
  end: number;
  markers?: Marker[];
  windowSeconds?: number;
}

const H = 200;
const PAD = { top: 12, right: 12, bottom: 22, left: 40 };

export function TimelineChart({ points, start, end, markers = [], windowSeconds = 120 }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(1000);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setW(Math.max(280, Math.round(entry.contentRect.width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const model = useMemo(() => {
    const from = Math.max(start, end - windowSeconds + 1);
    const byT = new Map(points.map((p) => [p.t, p.packets]));
    const series: { t: number; v: number }[] = [];
    for (let t = from; t <= end; t += 1) series.push({ t, v: byT.get(t) ?? 0 });
    const max = Math.max(1, ...series.map((s) => s.v));
    const niceMax = niceCeil(max);
    return { from, series, max: niceMax };
  }, [points, start, end, windowSeconds]);

  const span = Math.max(1, windowSeconds - 1);
  const x = (t: number) => PAD.left + ((t - (end - span)) / span) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - v / model.max) * (H - PAD.top - PAD.bottom);

  const line = model.series.map((s, i) => `${i ? "L" : "M"}${x(s.t).toFixed(1)},${y(s.v).toFixed(1)}`).join(" ");
  const first = model.series[0];
  const last = model.series[model.series.length - 1];
  const area =
    first && last ? `${line} L${x(last.t).toFixed(1)},${y(0)} L${x(first.t).toFixed(1)},${y(0)} Z` : "";
  const ticks = model.max >= 2 ? [0, model.max / 2, model.max] : [0, model.max];
  const visibleMarkers = markers.filter((m) => m.t >= model.from && m.t <= end);
  const total = model.series.reduce((sum, s) => sum + s.v, 0);

  return (
    <div ref={box}>
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Packets per second over the last ${model.series.length} seconds: ${total} packets, peak ${Math.max(0, ...model.series.map((s) => s.v))} per second`}>
      {ticks.map((v) => (
        <g key={v}>
          <line className="grid-line" x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} />
          <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end">
            {Number.isInteger(v) ? v : v.toFixed(1)}
          </text>
        </g>
      ))}
      {area ? <path className="area" d={area} /> : null}
      {line ? <path className="stroke" d={line} /> : null}
      {visibleMarkers.map((m, i) => (
        <g key={`${m.t}-${i}`}>
          <title>{m.label}</title>
          <line className="marker" x1={x(m.t)} x2={x(m.t)} y1={PAD.top} y2={H - PAD.bottom} />
          <circle className="marker-dot" cx={x(m.t)} cy={PAD.top + 3} r={3.5} />
        </g>
      ))}
      <text x={PAD.left} y={H - 6}>
        −{Math.min(windowSeconds, end - model.from + 1)}s
      </text>
      <text x={W - PAD.right} y={H - 6} textAnchor="end">
        {end >= Math.floor(Date.now() / 1000) - 2 ? "now" : "capture end"}
      </text>
    </svg>
    </div>
  );
}

function niceCeil(value: number): number {
  const exp = 10 ** Math.floor(Math.log10(value));
  const f = value / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
}

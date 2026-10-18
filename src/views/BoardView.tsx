// The live findings board.  Rows keep their identity: when the order
// changes (a new finding arrives, the sort flips) each row glides from
// its old position to its new one instead of the list being redrawn.

import { CheckCheck } from "lucide-react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { Capabilities, NetworkInterface, SecurityEvent, Severity } from "../api/types";
import { SEVERITIES } from "../api/types";
import { Empty, Notice, SeverityTag } from "../components/common";
import { Pass } from "../components/Pass";
import { SensorStrip } from "../components/SensorStrip";
import { categoryLabel, findingChange, formatTime, middleEllipsis } from "../format";
import { useApp } from "../state/AppState";
import { filterEvents } from "../state/reducer";
import type { BoardFilter, SortMode } from "../state/reducer";

const MAX_ROWS = 400;

interface Props {
  interfaces: NetworkInterface[] | null;
  defaultInterface: string | null;
  capabilities: Capabilities | null;
}

export function BoardView({ interfaces, defaultInterface, capabilities }: Props) {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<BoardFilter>({
    severities: new Set(),
    sensor: "all",
    query: "",
    unreadOnly: false,
  });
  const [sort, setSort] = useState<SortMode>("time");

  const rows = useMemo(
    () => filterEvents(state.events, filter, state.seen, sort),
    [state.events, filter, state.seen, sort],
  );
  const visible = rows.slice(0, MAX_ROWS);
  const unread = useMemo(() => state.events.filter((e) => !state.seen.has(e.id)), [state.events, state.seen]);
  const selected = state.events.find((e) => e.id === state.selectedId) ?? null;
  const anySensorStarted = Object.values(state.sensors).some((s) => s?.started_at);

  const toggleSeverity = (sev: Severity) =>
    setFilter((f) => {
      const severities = new Set(f.severities);
      if (severities.has(sev)) severities.delete(sev);
      else severities.add(sev);
      return { ...f, severities };
    });

  const select = useCallback((id: string) => dispatch({ type: "select", id }), [dispatch]);
  const nextUnread = () => {
    const next = rows.find((e) => !state.seen.has(e.id)) ?? unread[0];
    if (next) select(next.id);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTableSectionElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const index = visible.findIndex((e) => e.id === state.selectedId);
    const next = visible[event.key === "ArrowDown" ? Math.min(visible.length - 1, index + 1) : Math.max(0, index - 1)];
    if (next) {
      select(next.id);
      document.getElementById(`row-${next.id}`)?.focus();
    }
  };

  const tbodyRef = useFlip(visible);

  return (
    <div className="page">
      <SensorStrip interfaces={interfaces} defaultInterface={defaultInterface} capabilities={capabilities} />

      <div className="board-layout">
        <section className="panel" aria-labelledby="board-title">
          <div className="panel-head">
            <h3 id="board-title">Findings board</h3>
            <span className="meta num">
              {rows.length === state.events.length
                ? `${state.events.length} findings`
                : `${rows.length} of ${state.events.length}`}
              {unread.length ? ` · ${unread.length} new` : ""}
            </span>
            <div className="tools">
              <div className="segmented" role="group" aria-label="Sort">
                <button type="button" aria-pressed={sort === "time"} onClick={() => setSort("time")}>
                  Latest
                </button>
                <button type="button" aria-pressed={sort === "severity"} onClick={() => setSort("severity")}>
                  Severity
                </button>
              </div>
              <button
                type="button"
                className="btn small ghost"
                disabled={!unread.length}
                onClick={() => dispatch({ type: "seen", ids: unread.map((e) => e.id) })}
              >
                <CheckCheck size={14} aria-hidden="true" />
                Mark all seen
              </button>
            </div>
          </div>
          <div className="panel-head" style={{ borderBottom: "1px solid var(--line)" }}>
            <div className="filters">
              <div className="sev-filter" role="group" aria-label="Severity filter">
                {SEVERITIES.map((sev) => (
                  <button key={sev} type="button" aria-pressed={filter.severities.has(sev)} onClick={() => toggleSeverity(sev)}>
                    {sev === "medium" ? "med" : sev}
                    <span className="num">{state.counts[sev] ?? 0}</span>
                  </button>
                ))}
              </div>
              <label className="sr-only" htmlFor="sensor-filter">
                Sensor
              </label>
              <select
                id="sensor-filter"
                className="select"
                value={filter.sensor}
                onChange={(e) => setFilter((f) => ({ ...f, sensor: e.target.value as BoardFilter["sensor"] }))}
              >
                <option value="all">All sensors</option>
                <option value="traffic">Traffic</option>
                <option value="arp">ARP</option>
                <option value="dns">DNS</option>
                <option value="mac">MAC</option>
              </select>
              <label className="sr-only" htmlFor="board-search">
                Search findings
              </label>
              <input
                id="board-search"
                className="input"
                type="search"
                placeholder="Search finding or asset"
                value={filter.query}
                onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
              />
              <button
                type="button"
                className="new-toggle"
                aria-pressed={filter.unreadOnly}
                onClick={() => setFilter((f) => ({ ...f, unreadOnly: !f.unreadOnly }))}
              >
                New only <span className="num">{unread.length}</span>
              </button>
            </div>
          </div>

          {state.events.length === 0 ? (
            <Empty title={anySensorStarted ? "No findings yet" : "The board is empty"}>
              {anySensorStarted
                ? "Sensors are running. Findings appear here the moment a detector flags something — a quiet board on a healthy network is normal."
                : "Start a sensor above. Every finding the detectors raise lands on this board, newest first, and stays lit until you open it."}
            </Empty>
          ) : rows.length === 0 ? (
            <Empty title="No findings match these filters">Clear a filter to see the rest of the board.</Empty>
          ) : (
            <div className="board-scroll">
              <table className="board">
                <colgroup>
                  <col className="col-time" style={{ width: 90 }} />
                  <col style={{ width: 80 }} />
                  <col />
                  <col className="col-asset" style={{ width: 150 }} />
                  <col className="col-sensor" style={{ width: 80 }} />
                  <col className="col-status" style={{ width: 60 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col" className="col-time">Time</th>
                    <th scope="col">Severity</th>
                    <th scope="col">Finding</th>
                    <th scope="col" className="col-asset">Asset</th>
                    <th scope="col" className="col-sensor">Sensor</th>
                    <th scope="col" className="col-status">Status</th>
                  </tr>
                </thead>
                <tbody ref={tbodyRef} onKeyDown={onKeyDown}>
                  {visible.map((event, index) => (
                    <BoardRow
                      key={event.id}
                      event={event}
                      focusable={event.id === state.selectedId || (!selected && index === 0)}
                      unread={!state.seen.has(event.id)}
                      fresh={state.live.has(event.id) && !state.seen.has(event.id)}
                      selected={event.id === state.selectedId}
                      onSelect={select}
                    />
                  ))}
                </tbody>
              </table>
              {rows.length > MAX_ROWS ? (
                <p className="hint" style={{ padding: "10px 12px" }}>
                  Showing the first {MAX_ROWS} of {rows.length}. Narrow the filters to see older findings.
                </p>
              ) : null}
            </div>
          )}
        </section>

        <aside aria-label="Selected finding" className="pass-dock" data-open={Boolean(selected)}>
          {selected ? (
            <Pass
              event={selected}
              unreadCount={unread.length}
              onNextUnread={nextUnread}
              onClose={() => dispatch({ type: "select", id: null })}
            />
          ) : (
            <div className="pass-empty">
              <h4>Open a finding</h4>
              <p>Select a row to issue its pass: what changed, on which asset, which sensor saw it, and the full evidence.</p>
              {unread.length ? (
                <button type="button" className="btn small primary" onClick={nextUnread} style={{ justifySelf: "start" }}>
                  Open newest ({unread.length} new)
                </button>
              ) : null}
            </div>
          )}
          {state.stream !== "live" && state.events.length ? (
            <div style={{ marginTop: 12 }}>
              <Notice tone="warn" title="Live updates paused">
                The board shows what was received before the stream dropped. It resumes and backfills automatically.
              </Notice>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function BoardRow({
  event,
  focusable,
  unread,
  fresh,
  selected,
  onSelect,
}: {
  event: SecurityEvent;
  focusable: boolean;
  unread: boolean;
  fresh: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <tr
      id={`row-${event.id}`}
      data-id={event.id}
      data-unread={unread}
      data-fresh={fresh}
      aria-selected={selected}
      tabIndex={focusable ? 0 : -1}
      onClick={() => onSelect(event.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(event.id);
        }
      }}
    >
      <td className="time col-time">{formatTime(event.occurred_at)}</td>
      <td>
        <SeverityTag severity={event.severity} />
      </td>
      <td className="finding" title={event.summary}>
        <FindingCell event={event} />
      </td>
      <td className="col-asset">
        {event.asset_ref ? (
          <span className="flap" title={event.asset_ref}>
            {middleEllipsis(event.asset_ref, 14)}
          </span>
        ) : null}
      </td>
      <td className="sensor-col col-sensor">{event.sensor}</td>
      <td className="col-status">{unread ? <span className="status-new">NEW</span> : <span className="status-seen">SEEN</span>}</td>
    </tr>
  );
}

// Changes that read as "old → new" need no label: the arrow says it.
const SELF_EVIDENT = new Set(["dns.ip_change", "arp.mac_change"]);

function FindingCell({ event }: { event: SecurityEvent }) {
  const change = findingChange(event.category, event.evidence, event.summary);
  if (!change) return <span className="finding-text">{event.summary}</span>;
  return (
    <span className="finding-text">
      {SELF_EVIDENT.has(event.category) ? null : (
        <span className="change-label">{categoryLabel(event.category)}</span>
      )}
      <span className="change">{change}</span>
    </span>
  );
}

/** FLIP: animate rows from their previous offset to the new one. */
function useFlip(items: SecurityEvent[]) {
  const ref = useRef<HTMLTableSectionElement>(null);
  const positions = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const body = ref.current;
    if (!body) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, number>();
    body.querySelectorAll<HTMLTableRowElement>("tr[data-id]").forEach((row) => {
      const id = row.dataset.id ?? "";
      const top = row.offsetTop;
      next.set(id, top);
      const before = positions.current.get(id);
      if (!reduce && before !== undefined && before !== top) {
        row.animate([{ transform: `translateY(${before - top}px)` }, { transform: "translateY(0)" }], {
          duration: 260,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        });
      }
    });
    positions.current = next;
  }, [items]);

  return ref;
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CityGraph } from "@/components/CityGraph";
import { ALGO_INFO, api, loadEngine, type Algo, type GraphData, type GraphStats, type RouteResult } from "@/lib/engine";
import type { RouteEngine } from "@/wasm/route_engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart City Route Finder | Graph Shortest Path" },
      { name: "description", content: "Graph-based shortest path and route navigation using BFS, DFS and Dijkstra on a C++ backend." },
      { property: "og:title", content: "Smart City Route Finder" },
      { property: "og:description", content: "Graph-Based Shortest Path & Route Navigation with BFS, DFS and Dijkstra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Section = "Dashboard" | "Locations" | "Add Road" | "Find Route" | "Shortest Path" | "Algorithm Comparison" | "Route History" | "Search Location";
const SECTIONS: Section[] = ["Dashboard", "Locations", "Add Road", "Find Route", "Shortest Path", "Algorithm Comparison", "Route History", "Search Location"];
const ALGOS: Algo[] = ["BFS", "DFS", "Dijkstra"];

type HistoryItem = { id: number; source: string; dest: string; algorithm: string; path: string[]; distance: number; at: string };

const STEP_MS = 350;
const EMPTY_STATS: GraphStats = { locations: 0, roads: 0, connected: 0, avgDistance: 0 };
const fmtUs = (us: number) => (us >= 1000 ? `${(us / 1000).toFixed(2)} ms` : `${us.toFixed(1)} µs`);
const LABEL = "mb-1 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground";

function Index() {
  const [engine, setEngine] = useState<RouteEngine | null>(null);
  const [graph, setGraph] = useState<GraphData>({ nodes: [], edges: [] });
  const [stats, setStats] = useState<GraphStats>(EMPTY_STATS);
  const [section, setSection] = useState<Section>("Dashboard");
  const [source, setSource] = useState("Nagpur");
  const [dest, setDest] = useState("Airport");
  const [algo, setAlgo] = useState<Algo>("Dijkstra");
  const [result, setResult] = useState<RouteResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newLoc, setNewLoc] = useState("");
  const [locFilter, setLocFilter] = useState("");
  const [roadA, setRoadA] = useState("Nagpur");
  const [roadB, setRoadB] = useState("Sitabuldi");
  const [roadKm, setRoadKm] = useState("5");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [comparison, setComparison] = useState<RouteResult[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  // Animation state: how many of result.visited are revealed so far.
  const [step, setStep] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadEngine().then((e) => {
      setEngine(e);
      setGraph(api.graph(e));
      setStats(api.stats(e));
    });
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const refresh = (e: RouteEngine) => {
    setGraph(api.graph(e));
    setStats(api.stats(e));
  };

  const stopAnim = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };

  // Replays the real traversal order returned by the C++ algorithm.
  const animate = (r: RouteResult) => {
    stopAnim();
    setStep(0);
    if (r.visited.length === 0) return;
    timer.current = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= r.visited.length) stopAnim();
        return s + 1;
      });
    }, STEP_MS);
  };

  const run = (a: Algo) => {
    if (!engine) return;
    setAlgo(a);
    setFocus(null);
    if (source === dest) return setNotice("Source and destination must be different.");
    const r = api.run(engine, a, source, dest);
    setResult(r);
    animate(r);
    setNotice(r.found ? null : "No route available between these locations.");
    if (r.found) {
      setHistory((h) => [{ id: Date.now(), source, dest, algorithm: r.algorithm, path: r.path, distance: r.distance, at: new Date().toLocaleString() }, ...h]);
    }
  };

  const compareAll = () => {
    if (!engine) return;
    if (source === dest) return setNotice("Source and destination must be different.");
    const rs = ALGOS.map((a) => api.run(engine, a, source, dest));
    setComparison(rs);
    const best = rs[2];
    setResult(best);
    setAlgo("Dijkstra");
    animate(best);
    setNotice(best.found ? null : "No route available between these locations.");
    rs.filter((r) => r.found).forEach((r) =>
      setHistory((h) => [{ id: Date.now() + Math.random(), source, dest, algorithm: r.algorithm, path: r.path, distance: r.distance, at: new Date().toLocaleString() }, ...h]),
    );
  };

  const clearResult = () => { stopAnim(); setResult(null); setStep(0); setComparison([]); };

  const reset = () => {
    if (!engine) return;
    engine.resetCity();
    refresh(engine);
    clearResult();
    setNotice(null);
    setFocus(null);
    setSource("Nagpur");
    setDest("Airport");
  };

  const addLocation = () => {
    if (!engine) return;
    const name = newLoc.trim();
    const ok = engine.addLocation(name);
    setNotice(ok ? `Location "${name}" added to the graph.` : "Location is empty or already exists.");
    if (ok) { refresh(engine); setNewLoc(""); }
  };

  const deleteLocation = (name: string) => {
    if (!engine) return;
    if (!engine.removeLocation(name)) return;
    refresh(engine);
    clearResult();
    const remaining = graph.nodes.filter((n) => n !== name);
    if (source === name) setSource(remaining[0] ?? "");
    if (dest === name) setDest(remaining[1] ?? remaining[0] ?? "");
    if (roadA === name) setRoadA(remaining[0] ?? "");
    if (roadB === name) setRoadB(remaining[1] ?? remaining[0] ?? "");
    if (focus === name) setFocus(null);
    setNotice(`Location "${name}" and its roads removed.`);
  };

  const addRoad = () => {
    if (!engine) return;
    const km = parseInt(roadKm, 10);
    const existed = graph.edges.some((e) => (e.a === roadA && e.b === roadB) || (e.a === roadB && e.b === roadA));
    const ok = engine.addRoad(roadA, roadB, km);
    setNotice(ok ? `Road ${roadA} — ${roadB} ${existed ? "updated to" : "added with"} ${km} km.` : "Invalid road: pick two different locations and a positive distance.");
    if (ok) { refresh(engine); clearResult(); }
  };

  const deleteRoad = (a: string, b: string) => {
    if (!engine || !engine.removeRoad(a, b)) return;
    refresh(engine);
    clearResult();
    setNotice(`Road ${a} — ${b} removed.`);
  };

  const updateRoad = (a: string, b: string, w: number) => {
    if (!engine) return;
    const v = prompt(`New distance for ${a} — ${b} (km)`, String(w));
    if (v === null) return;
    const km = parseInt(v, 10);
    if (!engine.addRoad(a, b, km)) return setNotice("Distance must be a positive number.");
    refresh(engine);
    clearResult();
    setNotice(`Road ${a} — ${b} updated to ${km} km.`);
  };

  const onNodeSelect = (n: string) => {
    if (section === "Search Location") return setFocus(n);
    if (!source || n === dest) setSource(n);
    else if (n === source) return;
    else setDest(n);
  };

  const Select = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {graph.nodes.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </label>
  );

  const visitedShown = result ? result.visited.slice(0, step) : [];
  const animDone = !result || step >= result.visited.length;
  const currentNode = result && !animDone ? result.visited[step - 1] ?? null : null;
  const focusRoads = focus ? graph.edges.filter((e) => e.a === focus || e.b === focus) : [];
  const searchMatches = searchQ.trim() ? graph.nodes.filter((n) => n.toLowerCase().includes(searchQ.trim().toLowerCase())) : [];
  const filteredLocs = graph.nodes.filter((n) => n.toLowerCase().includes(locFilter.toLowerCase()));
  const plannerVisible = section === "Dashboard" || section === "Find Route" || section === "Shortest Path" || section === "Algorithm Comparison";

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full flex-col border-b border-border bg-sidebar p-5 lg:w-64 lg:border-r lg:border-b-0">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-mono text-lg font-bold">SC</div>
          <div>
            <h1 className="text-base font-bold leading-tight">Smart City Route Finder</h1>
            <p className="text-[11px] text-muted-foreground">Graph-Based Shortest Path &amp; Route Navigation</p>
          </div>
        </div>
        <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`rounded-md px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors ${
                section === s ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </nav>
        <div className="mt-auto hidden pt-8 font-mono text-[11px] text-muted-foreground lg:block">
          <p>Backend: C++ → WebAssembly</p>
          <p>Adjacency list · Queue · Min-heap</p>
          <p className={engine ? "text-success" : ""}>{engine ? "● engine ready" : "○ loading engine…"}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">{section}</p>
            <h2 className="text-2xl font-bold">City Road Network</h2>
          </div>
          <div className="flex gap-4 font-mono text-xs text-muted-foreground">
            <span>{graph.nodes.length} locations</span>
            <span>{graph.edges.length} roads</span>
          </div>
        </header>

        {/* Graph statistics */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Total Locations" value={stats.locations} />
          <Stat label="Total Roads" value={stats.roads} />
          <Stat label="Connected Locations" value={stats.connected} />
          <Stat label="Avg Road Distance" value={`${stats.avgDistance.toFixed(1)} km`} />
          <Stat label="Routes Searched" value={history.length} />
        </div>

        <div className="grid flex-1 gap-4 xl:grid-cols-[1fr_340px]">
          {/* Graph canvas */}
          <section className="panel grid-bg relative min-h-[420px] overflow-hidden p-2">
            {engine ? (
              <CityGraph
                graph={graph}
                path={result?.found && animDone ? result.path : []}
                visited={visitedShown}
                current={currentNode}
                focus={focus}
                source={source}
                dest={dest}
                onSelect={onNodeSelect}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading C++ graph engine…</div>
            )}
            {result && result.visited.length > 0 && (
              <div className="absolute top-3 left-3 right-3 rounded-md bg-background/85 px-3 py-2 font-mono text-[11px]">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{result.algorithm} · {animDone ? (result.found ? "route highlighted" : "traversal complete — no route") : `visiting ${currentNode}`}</span>
                  <span>{Math.min(step, result.visited.length)} / {result.visited.length} nodes</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(step, result.visited.length) / result.visited.length) * 100}%` }} />
                </div>
                <p className="mt-1.5 truncate text-foreground">Order: {visitedShown.join(" → ") || "—"}</p>
              </div>
            )}
            <div className="absolute bottom-3 left-3 flex gap-3 rounded-md bg-background/80 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-node-source" />source</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-node-dest" />destination</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-primary/60" />visited</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-route" />route</span>
            </div>
          </section>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {plannerVisible && (
              <section className="panel space-y-3 p-4">
                <h3 className="text-sm font-bold">Route Planner</h3>
                <Select label="Source" value={source} onChange={setSource} />
                <Select label="Destination" value={dest} onChange={setDest} />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button className="btn btn-primary col-span-2" disabled={!engine} onClick={() => run("Dijkstra")}>Find Route</button>
                  <button className="btn btn-secondary" disabled={!engine} onClick={() => run("BFS")}>BFS</button>
                  <button className="btn btn-secondary" disabled={!engine} onClick={() => run("DFS")}>DFS</button>
                  <button className="btn btn-secondary" disabled={!engine} onClick={() => run("Dijkstra")}>Shortest Path</button>
                  <button className="btn btn-ghost" disabled={!engine} onClick={reset}>Reset</button>
                  {section === "Algorithm Comparison" && (
                    <button className="btn btn-secondary col-span-2" disabled={!engine} onClick={compareAll}>Compare BFS vs DFS vs Dijkstra</button>
                  )}
                </div>
              </section>
            )}

            {section === "Algorithm Comparison" && (
              <section className="panel space-y-2 p-4">
                <h3 className="text-sm font-bold">Algorithm Comparison</h3>
                {comparison.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Run the comparison to execute all three algorithms on the same source and destination.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full font-mono text-[11px]">
                      <thead className="text-left text-muted-foreground">
                        <tr><th className="py-1 pr-2">Algo</th><th className="pr-2">Visited</th><th className="pr-2">Stops</th><th className="pr-2">Dist</th><th className="pr-2">Time</th></tr>
                      </thead>
                      <tbody>
                        {comparison.map((r) => (
                          <tr key={r.algorithm} className="border-t border-border/60">
                            <td className="py-1.5 pr-2 font-semibold text-primary">{r.algorithm}</td>
                            <td className="pr-2">{r.visited.length}</td>
                            <td className="pr-2">{r.found ? r.path.length : "—"}</td>
                            <td className="pr-2">{r.found ? `${r.distance} km` : "—"}</td>
                            <td className="pr-2">{fmtUs(r.timeUs)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                      {comparison.map((r) => <li key={r.algorithm}><span className="text-foreground">{r.algorithm}</span>: {r.dataStructure}</li>)}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {section === "Locations" && (
              <section className="panel space-y-3 p-4">
                <h3 className="text-sm font-bold">Add Location</h3>
                <input className="field" placeholder="e.g. Civil Lines" value={newLoc} onChange={(e) => setNewLoc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLocation()} />
                <button className="btn btn-primary w-full" disabled={!engine || !newLoc.trim()} onClick={addLocation}>Add Location</button>
                <input className="field" placeholder="Search locations…" value={locFilter} onChange={(e) => setLocFilter(e.target.value)} aria-label="Filter locations" />
                <ul className="max-h-56 space-y-1 overflow-auto font-mono text-xs text-muted-foreground">
                  {filteredLocs.map((n) => (
                    <li key={n} className="flex items-center justify-between border-b border-border/60 py-1">
                      <span>{n} <span className="opacity-60">v{graph.nodes.indexOf(n)}</span></span>
                      <button className="text-destructive hover:underline" onClick={() => deleteLocation(n)} aria-label={`Delete ${n}`}>delete</button>
                    </li>
                  ))}
                  {filteredLocs.length === 0 && <li className="py-1">No matching locations.</li>}
                </ul>
              </section>
            )}

            {section === "Add Road" && (
              <section className="panel space-y-3 p-4">
                <h3 className="text-sm font-bold">Add / Update Road</h3>
                <Select label="Source Location" value={roadA} onChange={setRoadA} />
                <Select label="Destination Location" value={roadB} onChange={setRoadB} />
                <label className="block">
                  <span className={LABEL}>Distance (km)</span>
                  <input className="field" type="number" min={1} value={roadKm} onChange={(e) => setRoadKm(e.target.value)} />
                </label>
                <button className="btn btn-primary w-full" disabled={!engine} onClick={addRoad}>Add Road</button>
                <p className={LABEL}>All roads ({graph.edges.length})</p>
                <ul className="max-h-56 space-y-1 overflow-auto font-mono text-xs text-muted-foreground">
                  {graph.edges.map((e) => (
                    <li key={`${e.a}-${e.b}`} className="flex items-center justify-between gap-2 border-b border-border/60 py-1">
                      <span className="truncate">{e.a} — {e.b} <span className="text-primary">{e.w} km</span></span>
                      <span className="flex shrink-0 gap-2">
                        <button className="text-accent hover:underline" onClick={() => updateRoad(e.a, e.b, e.w)}>edit</button>
                        <button className="text-destructive hover:underline" onClick={() => deleteRoad(e.a, e.b)}>delete</button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {section === "Route History" && (
              <section className="panel space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">Route History</h3>
                  <button className="btn btn-ghost px-2 py-1 text-[11px]" disabled={history.length === 0} onClick={() => setHistory([])}>Clear History</button>
                </div>
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No routes searched yet.</p>
                ) : (
                  <ul className="max-h-80 space-y-2 overflow-auto">
                    {history.map((h) => (
                      <li key={h.id} className="rounded-md bg-secondary/60 p-2 font-mono text-[11px]">
                        <div className="flex justify-between text-muted-foreground"><span>{h.algorithm}</span><span>{h.at}</span></div>
                        <div className="mt-1 text-foreground">{h.path.join(" → ")}</div>
                        <div className="mt-1 flex justify-between"><span>{h.source} → {h.dest}</span><span className="font-bold text-primary">{h.distance} km</span></div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {section === "Search Location" && (
              <section className="panel space-y-3 p-4">
                <h3 className="text-sm font-bold">Search Location</h3>
                <input className="field" placeholder="Type a location name…" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchMatches[0] && setFocus(searchMatches[0])} />
                {searchMatches.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {searchMatches.map((n) => (
                      <button key={n} className={`rounded px-2 py-0.5 font-mono text-[11px] ${focus === n ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"}`} onClick={() => setFocus(n)}>{n}</button>
                    ))}
                  </div>
                )}
                {focus ? (
                  <dl className="space-y-2 text-sm">
                    <Row k="Location" v={focus} />
                    <Row k="Vertex ID" v={`v${graph.nodes.indexOf(focus)}`} />
                    <Row k="Degree" v={String(focusRoads.length)} />
                    <div>
                      <dt className={LABEL}>Connected roads</dt>
                      <dd className="space-y-1 font-mono text-xs">
                        {focusRoads.length === 0 && <span className="text-muted-foreground">Isolated — no roads.</span>}
                        {focusRoads.map((e) => {
                          const other = e.a === focus ? e.b : e.a;
                          return <div key={other} className="flex justify-between"><span>{other}</span><span className="text-primary">{e.w} km</span></div>;
                        })}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-xs text-muted-foreground">Search or click a node on the map to inspect it.</p>
                )}
              </section>
            )}

            {/* Result panel */}
            <section className="panel space-y-2 p-4">
              <h3 className="text-sm font-bold">Result</h3>
              {notice && <p className={`rounded-md px-3 py-2 text-xs ${result && !result.found ? "bg-destructive/15 text-destructive" : "bg-accent/15 text-accent"}`}>{notice}</p>}
              <dl className="space-y-2 text-sm">
                <Row k="Source" v={source} />
                <Row k="Destination" v={dest} />
                <Row k="Algorithm" v={result?.algorithm ?? "—"} />
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">Route</dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-1 font-mono text-xs">
                    {result?.found
                      ? result.path.map((p, i) => (
                          <span key={p} className="flex items-center gap-1">
                            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-primary">{p}</span>
                            {i < result.path.length - 1 && <span className="text-muted-foreground">→</span>}
                          </span>
                        ))
                      : <span className="text-muted-foreground">—</span>}
                  </dd>
                </div>
                <Row k="Number of Stops" v={result?.found ? String(result.path.length) : "—"} />
                <Row k="Nodes Visited" v={result ? String(result.visited.length) : "—"} />
                <Row k="Execution Time" v={result ? fmtUs(result.timeUs) : "—"} />
                <Row k="Data Structure" v={result?.dataStructure || "—"} />
                <div className="flex items-baseline justify-between border-t border-border pt-2">
                  <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">Total Distance</dt>
                  <dd className="font-mono text-2xl font-bold text-primary">{result?.found ? `${result.distance} km` : "—"}</dd>
                </div>
              </dl>
            </section>

            {/* Algorithm info */}
            <section className="panel space-y-2 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Algorithm Info</h3>
                <div className="flex gap-1">
                  {ALGOS.map((a) => (
                    <button key={a} onClick={() => setAlgo(a)} className={`rounded px-2 py-0.5 font-mono text-[11px] ${algo === a ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{a}</button>
                  ))}
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground">{algo}</span> — {ALGO_INFO[algo].text}</p>
              <p className="font-mono text-[11px] text-accent">Data structure: {ALGO_INFO[algo].ds}</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel relative overflow-hidden p-3">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary/70" />
      <p className="pl-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="pl-2 font-mono text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

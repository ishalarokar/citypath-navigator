import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CityGraph } from "@/components/CityGraph";
import { api, loadEngine, type Algo, type GraphData, type RouteResult } from "@/lib/engine";
import type { RouteEngine } from "@/wasm/route_engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart City Route Finder | Graph Shortest Path" },
      { name: "description", content: "Graph-based shortest path and route navigation using BFS, DFS and Dijkstra on a C++ backend." },
      { property: "og:title", content: "Smart City Route Finder" },
      { property: "og:description", content: "Graph-Based Shortest Path & Route Navigation with BFS, DFS and Dijkstra." },
    ],
  }),
  component: Index,
});

type Section = "Dashboard" | "Locations" | "Add Road" | "Find Route" | "Shortest Path";
const SECTIONS: Section[] = ["Dashboard", "Locations", "Add Road", "Find Route", "Shortest Path"];

function Index() {
  const [engine, setEngine] = useState<RouteEngine | null>(null);
  const [graph, setGraph] = useState<GraphData>({ nodes: [], edges: [] });
  const [section, setSection] = useState<Section>("Dashboard");
  const [source, setSource] = useState("Nagpur");
  const [dest, setDest] = useState("Airport");
  const [result, setResult] = useState<RouteResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newLoc, setNewLoc] = useState("");
  const [roadA, setRoadA] = useState("Nagpur");
  const [roadB, setRoadB] = useState("Sitabuldi");
  const [roadKm, setRoadKm] = useState("5");

  useEffect(() => {
    loadEngine().then((e) => {
      setEngine(e);
      setGraph(api.graph(e));
    });
  }, []);

  const refresh = (e: RouteEngine) => setGraph(api.graph(e));

  const run = (algo: Algo) => {
    if (!engine) return;
    if (source === dest) return setNotice("Source and destination must be different.");
    const r = api.run(engine, algo, source, dest);
    setResult(r);
    setNotice(r.found ? null : "No route available between selected locations.");
  };

  const reset = () => {
    if (!engine) return;
    engine.resetCity();
    refresh(engine);
    setResult(null);
    setNotice(null);
    setSource("Nagpur");
    setDest("Airport");
  };

  const addLocation = () => {
    if (!engine) return;
    const name = newLoc.trim();
    const ok = engine.addLocation(name);
    setNotice(ok ? `Location "${name}" added to the graph.` : "Location is empty or already exists.");
    if (ok) {
      refresh(engine);
      setNewLoc("");
    }
  };

  const addRoad = () => {
    if (!engine) return;
    const km = parseInt(roadKm, 10);
    const ok = engine.addRoad(roadA, roadB, km);
    setNotice(ok ? `Road ${roadA} — ${roadB} (${km} km) added.` : "Invalid road: pick two different locations and a positive distance.");
    if (ok) {
      refresh(engine);
      setResult(null);
    }
  };

  const onNodeSelect = (n: string) => {
    if (!source || n === dest) setSource(n);
    else if (n === source) return;
    else setDest(n);
  };

  const Select = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {graph.nodes.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </label>
  );

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

        <div className="grid flex-1 gap-4 xl:grid-cols-[1fr_320px]">
          {/* Graph canvas */}
          <section className="panel grid-bg relative min-h-[420px] overflow-hidden p-2">
            {engine ? (
              <CityGraph graph={graph} path={result?.found ? result.path : []} source={source} dest={dest} onSelect={onNodeSelect} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading C++ graph engine…</div>
            )}
            <div className="absolute bottom-3 left-3 flex gap-3 rounded-md bg-background/80 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-node-source" />source</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-node-dest" />destination</span>
              <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-route" />route</span>
            </div>
          </section>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {(section === "Dashboard" || section === "Find Route" || section === "Shortest Path") && (
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
                </div>
              </section>
            )}

            {section === "Locations" && (
              <section className="panel space-y-3 p-4">
                <h3 className="text-sm font-bold">Add Location</h3>
                <input className="field" placeholder="e.g. Civil Lines" value={newLoc} onChange={(e) => setNewLoc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLocation()} />
                <button className="btn btn-primary w-full" disabled={!engine || !newLoc.trim()} onClick={addLocation}>Add Location</button>
                <ul className="max-h-48 space-y-1 overflow-auto font-mono text-xs text-muted-foreground">
                  {graph.nodes.map((n, i) => (
                    <li key={n} className="flex justify-between border-b border-border/60 py-1"><span>{n}</span><span>v{i}</span></li>
                  ))}
                </ul>
              </section>
            )}

            {section === "Add Road" && (
              <section className="panel space-y-3 p-4">
                <h3 className="text-sm font-bold">Add Road</h3>
                <Select label="Source Location" value={roadA} onChange={setRoadA} />
                <Select label="Destination Location" value={roadB} onChange={setRoadB} />
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Distance (km)</span>
                  <input className="field" type="number" min={1} value={roadKm} onChange={(e) => setRoadKm(e.target.value)} />
                </label>
                <button className="btn btn-primary w-full" disabled={!engine} onClick={addRoad}>Add Road</button>
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
                <div className="flex items-baseline justify-between border-t border-border pt-2">
                  <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">Total Distance</dt>
                  <dd className="font-mono text-2xl font-bold text-primary">{result?.found ? `${result.distance} km` : "—"}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </main>
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

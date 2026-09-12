// Bridge between the React GUI and the C++ WebAssembly graph engine.
import type { RouteEngine } from "@/wasm/route_engine";

export type GraphData = { nodes: string[]; edges: { a: string; b: string; w: number }[] };
export type GraphStats = { locations: number; roads: number; connected: number; avgDistance: number };
export type RouteResult = {
  found: boolean;
  distance: number;
  algorithm: string;
  dataStructure: string;
  timeUs: number;
  path: string[];
  visited: string[];
};
export type Algo = "BFS" | "DFS" | "Dijkstra";

export const ALGO_INFO: Record<Algo, { ds: string; text: string }> = {
  BFS: { ds: "Queue", text: "Uses a Queue and explores the graph level by level, so it finds the route with the fewest stops." },
  DFS: { ds: "Stack", text: "Uses a Stack and explores depth-first, following one road as far as possible before backtracking." },
  Dijkstra: { ds: "Priority Queue", text: "Uses a Priority Queue (min-heap) and always settles the closest node next, finding the minimum weighted path." },
};

let enginePromise: Promise<RouteEngine> | null = null;

export function loadEngine(): Promise<RouteEngine> {
  if (!enginePromise) {
    enginePromise = import("@/wasm/route_engine.js").then((m) => m.default());
  }
  return enginePromise;
}

export const api = {
  graph: (e: RouteEngine): GraphData => JSON.parse(e.getGraphJSON()),
  stats: (e: RouteEngine): GraphStats => JSON.parse(e.getStatsJSON()),
  run: (e: RouteEngine, algo: Algo, s: string, d: string): RouteResult => {
    // Browser clocks are more precise than the WASM steady_clock for sub-ms runs.
    const t0 = performance.now();
    const r: RouteResult = JSON.parse(e.runAlgorithm(algo, s, d));
    const jsUs = (performance.now() - t0) * 1000;
    r.timeUs = r.timeUs > 0 ? r.timeUs : jsUs;
    return r;
  },
};

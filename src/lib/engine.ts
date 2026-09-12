// Bridge between the React GUI and the C++ WebAssembly graph engine.
import type { RouteEngine } from "@/wasm/route_engine";

export type GraphData = { nodes: string[]; edges: { a: string; b: string; w: number }[] };
export type RouteResult = {
  found: boolean;
  distance: number;
  algorithm: string;
  path: string[];
};
export type Algo = "BFS" | "DFS" | "Dijkstra";

let enginePromise: Promise<RouteEngine> | null = null;

export function loadEngine(): Promise<RouteEngine> {
  if (!enginePromise) {
    enginePromise = import("@/wasm/route_engine.js").then((m) => m.default());
  }
  return enginePromise;
}

export const api = {
  graph: (e: RouteEngine): GraphData => JSON.parse(e.getGraphJSON()),
  run: (e: RouteEngine, algo: Algo, s: string, d: string): RouteResult =>
    JSON.parse(e.runAlgorithm(algo, s, d)),
};

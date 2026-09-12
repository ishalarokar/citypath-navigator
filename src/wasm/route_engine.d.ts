export interface RouteEngine {
  getGraphJSON(): string;
  getStatsJSON(): string;
  runAlgorithm(algo: "BFS" | "DFS" | "Dijkstra", src: string, dst: string): string;
  addLocation(name: string): boolean;
  removeLocation(name: string): boolean;
  addRoad(a: string, b: string, distance: number): boolean;
  removeRoad(a: string, b: string): boolean;
  resetCity(): void;
}
export default function createRouteEngine(): Promise<RouteEngine>;

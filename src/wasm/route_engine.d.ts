export interface RouteEngine {
  getGraphJSON(): string;
  runAlgorithm(algo: "BFS" | "DFS" | "Dijkstra", src: string, dst: string): string;
  addLocation(name: string): boolean;
  addRoad(a: string, b: string, distance: number): boolean;
  resetCity(): void;
}
export default function createRouteEngine(): Promise<RouteEngine>;

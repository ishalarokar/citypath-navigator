import type { GraphData } from "@/lib/engine";

// Fixed map-like positions for the sample city; new nodes are placed on a ring.
const PRESET: Record<string, [number, number]> = {
  Nagpur: [50, 50],
  Sitabuldi: [36, 36],
  Dharampeth: [18, 30],
  Sadar: [50, 18],
  Airport: [40, 84],
  "Railway Station": [68, 30],
  "Manish Nagar": [70, 78],
  "Wardha Road": [66, 60],
  Hingna: [12, 66],
  "Katol Road": [26, 10],
};

const W = 1000;
const H = 620;

function layout(nodes: string[]) {
  const pos: Record<string, [number, number]> = {};
  const extra = nodes.filter((n) => !PRESET[n]);
  nodes.forEach((n) => {
    if (PRESET[n]) pos[n] = [(PRESET[n][0] / 100) * W, (PRESET[n][1] / 100) * H];
  });
  extra.forEach((n, i) => {
    const t = (i / Math.max(extra.length, 1)) * Math.PI * 2 - Math.PI / 2;
    pos[n] = [W / 2 + Math.cos(t) * 420, H / 2 + Math.sin(t) * 270];
  });
  return pos;
}

type Props = {
  graph: GraphData;
  path: string[];
  source: string;
  dest: string;
  onSelect: (name: string) => void;
};

export function CityGraph({ graph, path, source, dest, onSelect }: Props) {
  const pos = layout(graph.nodes);
  const onPath = new Set<string>();
  for (let i = 0; i + 1 < path.length; i++) {
    onPath.add(`${path[i]}|${path[i + 1]}`);
    onPath.add(`${path[i + 1]}|${path[i]}`);
  }
  const pathNodes = new Set(path);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="City road network">
      {graph.edges.map((e) => {
        const [x1, y1] = pos[e.a] ?? [0, 0];
        const [x2, y2] = pos[e.b] ?? [0, 0];
        const hot = onPath.has(`${e.a}|${e.b}`);
        return (
          <g key={`${e.a}-${e.b}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-road" strokeWidth={hot ? 0 : 3} strokeLinecap="round" />
            {hot && <line x1={x1} y1={y1} x2={x2} y2={y2} className="route-line" strokeWidth={5} strokeLinecap="round" />}
            <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
              <rect x={-22} y={-11} width={44} height={22} rx={6} className={hot ? "fill-route" : "fill-background"} />
              <text textAnchor="middle" dy={4} className={`font-mono text-[12px] font-semibold ${hot ? "fill-primary-foreground" : "fill-muted-foreground"}`}>
                {e.w} km
              </text>
            </g>
          </g>
        );
      })}
      {graph.nodes.map((n) => {
        const [x, y] = pos[n] ?? [0, 0];
        const role = n === source ? "fill-node-source" : n === dest ? "fill-node-dest" : pathNodes.has(n) ? "fill-route" : "fill-node";
        return (
          <g key={n} transform={`translate(${x}, ${y})`} className="cursor-pointer" onClick={() => onSelect(n)}>
            {(n === source || n === dest) && <circle r={22} className={`${role} opacity-25 animate-pulse`} />}
            <circle r={13} className={`${role} stroke-background`} strokeWidth={3} />
            <text y={-20} textAnchor="middle" className="fill-foreground text-[14px] font-semibold select-none">
              {n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

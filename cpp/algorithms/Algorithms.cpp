#include "Algorithms.h"
#include <queue>
#include <stack>
#include <limits>
#include <algorithm>
#include <functional>

// Rebuilds path from parent[] and computes the distance along it.
static RouteResult reconstruct(const Graph& g, const std::vector<int>& parent,
                               int src, int dst, const std::string& algo) {
    RouteResult r;
    r.algorithm = algo;
    if (dst < 0 || parent[dst] == -1 && dst != src) return r;
    for (int v = dst; v != -1; v = parent[v]) {
        r.path.push_back(v);
        if (v == src) break;
    }
    std::reverse(r.path.begin(), r.path.end());
    if (r.path.empty() || r.path.front() != src) return r;
    r.found = true;
    for (size_t i = 0; i + 1 < r.path.size(); ++i) {
        for (const Edge& e : g.neighbors(r.path[i])) {
            if (e.to == r.path[i + 1]) { r.distance += e.weight; break; }
        }
    }
    return r;
}

RouteResult bfs(const Graph& g, int src, int dst) {
    int n = g.size();
    std::vector<int> parent(n, -1);
    std::vector<bool> visited(n, false);
    std::queue<int> q;
    q.push(src);
    visited[src] = true;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        if (u == dst) break;
        for (const Edge& e : g.neighbors(u)) {
            if (!visited[e.to]) {
                visited[e.to] = true;
                parent[e.to] = u;
                q.push(e.to);
            }
        }
    }
    return reconstruct(g, parent, src, dst, "BFS");
}

RouteResult dfs(const Graph& g, int src, int dst) {
    int n = g.size();
    std::vector<int> parent(n, -1);
    std::vector<bool> visited(n, false);
    std::stack<int> st;
    st.push(src);
    while (!st.empty()) {
        int u = st.top(); st.pop();
        if (visited[u]) continue;
        visited[u] = true;
        if (u == dst) break;
        const auto& nb = g.neighbors(u);
        // Push in reverse so the first neighbor is explored first.
        for (int i = (int)nb.size() - 1; i >= 0; --i) {
            int v = nb[i].to;
            if (!visited[v]) {
                if (parent[v] == -1) parent[v] = u;
                st.push(v);
            }
        }
    }
    // parent may reference an unvisited chain; fix by re-tracing only visited nodes.
    if (!visited[dst]) { RouteResult r; r.algorithm = "DFS"; return r; }
    return reconstruct(g, parent, src, dst, "DFS");
}

RouteResult dijkstra(const Graph& g, int src, int dst) {
    const int INF = std::numeric_limits<int>::max();
    int n = g.size();
    std::vector<int> dist(n, INF), parent(n, -1);
    using P = std::pair<int, int>; // (distance, vertex)
    std::priority_queue<P, std::vector<P>, std::greater<P>> pq; // min-heap
    dist[src] = 0;
    pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;      // stale entry
        if (u == dst) break;
        for (const Edge& e : g.neighbors(u)) {
            int nd = d + e.weight;
            if (nd < dist[e.to]) {
                dist[e.to] = nd;
                parent[e.to] = u;
                pq.push({nd, e.to});
            }
        }
    }
    if (dist[dst] == INF) { RouteResult r; r.algorithm = "Dijkstra"; return r; }
    RouteResult r = reconstruct(g, parent, src, dst, "Dijkstra");
    r.distance = dist[dst];
    return r;
}

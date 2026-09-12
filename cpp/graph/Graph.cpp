#include "Graph.h"

int Graph::addLocation(const std::string& name) {
    auto it = ids.find(name);
    if (it != ids.end()) return it->second;
    int id = (int)names.size();
    names.push_back(name);
    ids[name] = id;
    adj.emplace_back();
    return id;
}

bool Graph::hasLocation(const std::string& name) const {
    return ids.count(name) > 0;
}

int Graph::indexOf(const std::string& name) const {
    auto it = ids.find(name);
    return it == ids.end() ? -1 : it->second;
}

bool Graph::addRoad(const std::string& a, const std::string& b, int distance) {
    if (a.empty() || b.empty() || a == b || distance <= 0) return false;
    int u = addLocation(a);
    int v = addLocation(b);
    // Update weight if the road already exists.
    for (auto& e : adj[u]) {
        if (e.to == v) {
            e.weight = distance;
            for (auto& r : adj[v]) if (r.to == u) r.weight = distance;
            return true;
        }
    }
    adj[u].push_back({v, distance});
    adj[v].push_back({u, distance});
    return true;
}

bool Graph::removeRoad(const std::string& a, const std::string& b) {
    int u = indexOf(a), v = indexOf(b);
    if (u < 0 || v < 0 || u == v) return false;
    bool removed = false;
    auto drop = [&](int from, int to) {
        auto& list = adj[from];
        for (size_t i = 0; i < list.size(); ++i) {
            if (list[i].to == to) { list.erase(list.begin() + i); removed = true; return; }
        }
    };
    drop(u, v);
    drop(v, u);
    return removed;
}

bool Graph::removeLocation(const std::string& name) {
    int id = indexOf(name);
    if (id < 0) return false;
    names.erase(names.begin() + id);
    adj.erase(adj.begin() + id);
    // Drop incident edges and shift indices above the removed vertex.
    for (auto& list : adj) {
        std::vector<Edge> kept;
        for (const Edge& e : list) {
            if (e.to == id) continue;
            kept.push_back({e.to > id ? e.to - 1 : e.to, e.weight});
        }
        list = kept;
    }
    ids.clear();
    for (int i = 0; i < (int)names.size(); ++i) ids[names[i]] = i;
    return true;
}

int Graph::roadCount() const {
    int total = 0;
    for (const auto& list : adj) total += (int)list.size();
    return total / 2;
}

void Graph::clear() {
    names.clear();
    ids.clear();
    adj.clear();
}

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

void Graph::clear() {
    names.clear();
    ids.clear();
    adj.clear();
}

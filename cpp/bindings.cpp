// WebAssembly bindings: exposes the C++ graph engine to the GUI.
#include <emscripten/bind.h>
#include <sstream>
#include <chrono>
#include "graph/Graph.h"
#include "algorithms/Algorithms.h"
#include "model/CityData.h"

static Graph city;

static std::string esc(const std::string& s) {
    std::string o;
    for (char c : s) { if (c == '"' || c == '\\') o += '\\'; o += c; }
    return o;
}

static void namesJSON(std::ostringstream& os, const std::vector<int>& ids) {
    os << "[";
    for (size_t i = 0; i < ids.size(); ++i) {
        if (i) os << ",";
        os << "\"" << esc(city.nameOf(ids[i])) << "\"";
    }
    os << "]";
}

std::string getGraphJSON() {
    std::ostringstream os;
    os << "{\"nodes\":[";
    for (int i = 0; i < city.size(); ++i) {
        if (i) os << ",";
        os << "\"" << esc(city.nameOf(i)) << "\"";
    }
    os << "],\"edges\":[";
    bool first = true;
    for (int u = 0; u < city.size(); ++u) {
        for (const Edge& e : city.neighbors(u)) {
            if (u < e.to) {
                if (!first) os << ",";
                first = false;
                os << "{\"a\":\"" << esc(city.nameOf(u)) << "\",\"b\":\"" << esc(city.nameOf(e.to))
                   << "\",\"w\":" << e.weight << "}";
            }
        }
    }
    os << "]}";
    return os.str();
}

// Live statistics computed directly from the adjacency list.
std::string getStatsJSON() {
    int connected = 0;
    long total = 0;
    for (int u = 0; u < city.size(); ++u) {
        if (!city.neighbors(u).empty()) ++connected;
        for (const Edge& e : city.neighbors(u)) total += e.weight;
    }
    int roads = city.roadCount();
    double avg = roads ? (double)total / 2.0 / roads : 0.0;
    std::ostringstream os;
    os << "{\"locations\":" << city.size() << ",\"roads\":" << roads
       << ",\"connected\":" << connected << ",\"avgDistance\":" << avg << "}";
    return os.str();
}

std::string runAlgorithm(std::string algo, std::string src, std::string dst) {
    int s = city.indexOf(src), d = city.indexOf(dst);
    RouteResult r;
    double us = 0;
    if (s >= 0 && d >= 0) {
        auto t0 = std::chrono::steady_clock::now();
        if (algo == "BFS") r = bfs(city, s, d);
        else if (algo == "DFS") r = dfs(city, s, d);
        else r = dijkstra(city, s, d);
        auto t1 = std::chrono::steady_clock::now();
        us = std::chrono::duration<double, std::micro>(t1 - t0).count();
    } else {
        r.algorithm = algo;
    }
    std::ostringstream os;
    os << "{\"found\":" << (r.found ? "true" : "false") << ",\"distance\":" << r.distance
       << ",\"algorithm\":\"" << r.algorithm << "\",\"dataStructure\":\"" << r.dataStructure
       << "\",\"timeUs\":" << us << ",\"path\":";
    namesJSON(os, r.path);
    os << ",\"visited\":";
    namesJSON(os, r.visited);
    os << "}";
    return os.str();
}

bool addLocation(std::string name) {
    if (name.empty() || city.hasLocation(name)) return false;
    city.addLocation(name);
    return true;
}

bool removeLocation(std::string name) { return city.removeLocation(name); }

bool addRoad(std::string a, std::string b, int distance) {
    return city.addRoad(a, b, distance);
}

bool removeRoad(std::string a, std::string b) { return city.removeRoad(a, b); }

void resetCity() { loadSampleCity(city); }

EMSCRIPTEN_BINDINGS(route_engine) {
    emscripten::function("getGraphJSON", &getGraphJSON);
    emscripten::function("getStatsJSON", &getStatsJSON);
    emscripten::function("runAlgorithm", &runAlgorithm);
    emscripten::function("addLocation", &addLocation);
    emscripten::function("removeLocation", &removeLocation);
    emscripten::function("addRoad", &addRoad);
    emscripten::function("removeRoad", &removeRoad);
    emscripten::function("resetCity", &resetCity);
}

int main() { loadSampleCity(city); return 0; }

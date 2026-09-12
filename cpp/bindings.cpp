// WebAssembly bindings: exposes the C++ graph engine to the GUI.
#include <emscripten/bind.h>
#include <sstream>
#include "graph/Graph.h"
#include "algorithms/Algorithms.h"
#include "model/CityData.h"

static Graph city;

static std::string esc(const std::string& s) {
    std::string o;
    for (char c : s) { if (c == '"' || c == '\\') o += '\\'; o += c; }
    return o;
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

static std::string toJSON(const RouteResult& r) {
    std::ostringstream os;
    os << "{\"found\":" << (r.found ? "true" : "false") << ",\"distance\":" << r.distance
       << ",\"algorithm\":\"" << r.algorithm << "\",\"path\":[";
    for (size_t i = 0; i < r.path.size(); ++i) {
        if (i) os << ",";
        os << "\"" << esc(city.nameOf(r.path[i])) << "\"";
    }
    os << "]}";
    return os.str();
}

std::string runAlgorithm(std::string algo, std::string src, std::string dst) {
    int s = city.indexOf(src), d = city.indexOf(dst);
    if (s < 0 || d < 0) return "{\"found\":false,\"distance\":0,\"algorithm\":\"" + algo + "\",\"path\":[]}";
    RouteResult r;
    if (algo == "BFS") r = bfs(city, s, d);
    else if (algo == "DFS") r = dfs(city, s, d);
    else r = dijkstra(city, s, d);
    return toJSON(r);
}

bool addLocation(std::string name) {
    if (name.empty() || city.hasLocation(name)) return false;
    city.addLocation(name);
    return true;
}

bool addRoad(std::string a, std::string b, int distance) {
    return city.addRoad(a, b, distance);
}

void resetCity() { loadSampleCity(city); }

EMSCRIPTEN_BINDINGS(route_engine) {
    emscripten::function("getGraphJSON", &getGraphJSON);
    emscripten::function("runAlgorithm", &runAlgorithm);
    emscripten::function("addLocation", &addLocation);
    emscripten::function("addRoad", &addRoad);
    emscripten::function("resetCity", &resetCity);
}

int main() { loadSampleCity(city); return 0; }

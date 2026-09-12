#pragma once
#include <string>
#include <vector>
#include <unordered_map>

// Weighted, undirected city graph stored as an adjacency list.
struct Edge {
    int to;
    int weight; // distance in km
};

class Graph {
public:
    // Returns the index of the location (creating it if needed).
    int addLocation(const std::string& name);
    bool hasLocation(const std::string& name) const;
    int indexOf(const std::string& name) const; // -1 if missing

    // Adds an undirected weighted road. Returns false on invalid input.
    bool addRoad(const std::string& a, const std::string& b, int distance);

    int size() const { return (int)names.size(); }
    const std::string& nameOf(int idx) const { return names[idx]; }
    const std::vector<Edge>& neighbors(int idx) const { return adj[idx]; }

    void clear();

private:
    std::vector<std::string> names;                 // vertex id -> name
    std::unordered_map<std::string, int> ids;       // name -> vertex id
    std::vector<std::vector<Edge>> adj;             // adjacency list
};

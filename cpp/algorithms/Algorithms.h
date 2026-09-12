#pragma once
#include "../graph/Graph.h"
#include <string>
#include <vector>

struct RouteResult {
    bool found = false;
    std::vector<int> path;   // vertex ids from source to destination
    int distance = 0;        // sum of edge weights along path
    std::string algorithm;
};

// Breadth First Search using a queue (fewest hops).
RouteResult bfs(const Graph& g, int src, int dst);

// Depth First Search using an explicit stack.
RouteResult dfs(const Graph& g, int src, int dst);

// Dijkstra's algorithm using a min-heap priority queue (minimum distance).
RouteResult dijkstra(const Graph& g, int src, int dst);

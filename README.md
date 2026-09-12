# City Navigator

Create a complete and fully functional C++ DSA project called “Smart City Route Finder”.

Build the complete project within 5 credits, so keep the implementation efficient and avoid unnecessary features.

PROJECT LOOK & FRONTEND

Create a modern, attractive desktop-style GUI interface for the project instead of a plain boring console.

The main screen should have:

Project title: Smart City Route Finder

Subtitle: Graph-Based Shortest Path & Route Navigation

A clean navigation/sidebar with:

Dashboard

Locations

Add Road

Find Route

Shortest Path

A central area showing a visual city/road network graph

Locations displayed as nodes

Roads displayed as connecting lines

Distance displayed on roads

Different visual indication for the selected/shortest route

Source and destination selection boxes

Buttons for:

Find Route

BFS

DFS

Shortest Path

Reset

A result panel showing:

Selected source

Selected destination

Route

Total distance

Algorithm used

Make the interface clean, professional, responsive and suitable for a college project demonstration.

HOW THE PROJECT WILL WORK

When the application starts, load sample locations and roads automatically.

Example locations:

Nagpur, Sitabuldi, Dharampeth, Sadar, Airport, Railway Station, Manish Nagar, Wardha Road, Hingna and Katol Road.

The user selects:

Source → Destination

Then the user can select an algorithm.

For BFS:

Traverse the graph using Breadth First Search.

Display the discovered route.

Highlight the route on the graph.

For DFS:

Traverse the graph using Depth First Search.

Display the discovered route.

Highlight the route on the graph.

For Shortest Path:

Use Dijkstra’s Algorithm.

Calculate the minimum-distance route.

Highlight the shortest route visually.

Display the total distance.

Example:

Nagpur → Wardha Road → Airport

Total Distance: 12 km

BACKEND / DSA

Implement the complete backend in C++.

Use:

Graph

Adjacency List

Nodes/vertices

Weighted edges

BFS

DFS

Dijkstra’s Algorithm

Queue

Priority Queue / Min Heap

Path reconstruction

The frontend must be connected to the actual C++ DSA backend.

Do NOT create fake buttons or static outputs.

Every button must execute the actual corresponding algorithm and update the interface.

When a road is added, update the graph.

When a location is added, update the graph.

When the user searches for a route, calculate it from the actual graph data.

When Dijkstra is selected, calculate the actual minimum-distance path using the stored edge weights.

DATA FLOW

Use this flow:

User Interface → User Input → C++ Graph Backend → DSA Algorithm → Calculated Result → Update Graph Visualization + Result Panel

Store the city network using an adjacency list.

Use weighted edges for road distances.

Use a priority queue for Dijkstra’s algorithm.

ADD ROAD

Provide an Add Road interface where the user can enter:

Source Location
Destination Location
Distance in km

After clicking Add Road, immediately update the graph visualization and backend data.

ADD LOCATION

Allow the user to add a new location.

After adding it, immediately display the new node in the graph.

VISUAL ROUTE

When a route is found, visually highlight the path from source to destination.

For example:

Nagpur → Sitabuldi → Dharampeth → Airport

The selected route should be clearly distinguishable from other roads.

If no route exists, display:

“No route available between selected locations.”

PROJECT STRUCTURE

Create a clean project structure separating:

Frontend / GUI

C++ backend

Graph implementation

Algorithm logic

Data/model handling

Keep all files necessary to run the project.

The final result must be a working, attractive Smart City Route Finder application, not just source-code snippets.

Do not add unnecessary documentation, PPT, report, certificate, or viva content.

Focus only on:

How the project looks + Frontend + Backend + DSA implementation + How it works + Fully functional integration.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://citypath-navigator.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/94275cc9-9314-4d71-a3f5-209f2794a6bf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

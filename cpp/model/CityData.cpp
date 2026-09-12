#include "CityData.h"

// Sample Nagpur city network loaded at startup.
void loadSampleCity(Graph& g) {
    g.clear();
    const char* locations[] = {
        "Nagpur", "Sitabuldi", "Dharampeth", "Sadar", "Airport",
        "Railway Station", "Manish Nagar", "Wardha Road", "Hingna", "Katol Road"
    };
    for (const char* l : locations) g.addLocation(l);

    g.addRoad("Nagpur", "Sitabuldi", 3);
    g.addRoad("Nagpur", "Railway Station", 4);
    g.addRoad("Nagpur", "Wardha Road", 7);
    g.addRoad("Sitabuldi", "Dharampeth", 4);
    g.addRoad("Sitabuldi", "Sadar", 3);
    g.addRoad("Sadar", "Railway Station", 2);
    g.addRoad("Sadar", "Katol Road", 6);
    g.addRoad("Katol Road", "Dharampeth", 5);
    g.addRoad("Dharampeth", "Airport", 9);
    g.addRoad("Dharampeth", "Hingna", 8);
    g.addRoad("Hingna", "Wardha Road", 9);
    g.addRoad("Wardha Road", "Airport", 5);
    g.addRoad("Wardha Road", "Manish Nagar", 4);
    g.addRoad("Manish Nagar", "Airport", 6);
}

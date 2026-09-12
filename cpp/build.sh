#!/usr/bin/env bash
# Compiles the C++ backend to a single WebAssembly ES module used by the GUI.
set -e
cd "$(dirname "$0")"
mkdir -p ../src/wasm
emcc -O2 -std=c++17 \
  graph/Graph.cpp algorithms/Algorithms.cpp model/CityData.cpp bindings.cpp \
  -lembind -sMODULARIZE=1 -sEXPORT_ES6=1 -sSINGLE_FILE=1 -sENVIRONMENT=web \
  -sEXPORT_NAME=createRouteEngine -sALLOW_MEMORY_GROWTH=1 \
  -o ../src/wasm/route_engine.js
echo "Built src/wasm/route_engine.js"

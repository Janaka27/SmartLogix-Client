export type GraphNode = {
  id: string;
  lat: number;
  lng: number;
  name?: string;
};

export type GraphEdge = {
  from: string;
  to: string;
  weight: number;
};

// Haversine formula to calculate distance in km
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function findShortestPath(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): { path: GraphNode[]; distance: number; lastLegDistance: number; corridorDistance: number } | null {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  for (const node of nodes) {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  }
  distances[startId] = 0;

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let currentId: string | null = null;
    let minDistance = Infinity;
    for (const id of unvisited) {
      if (distances[id] < minDistance) {
        minDistance = distances[id];
        currentId = id;
      }
    }

    if (currentId === null || minDistance === Infinity) {
      break; // No reachable nodes left
    }

    if (currentId === endId) {
      break; // Reached the destination
    }

    unvisited.delete(currentId);

    // Update distances to neighbors
    const neighbors = edges.filter((e) => e.from === currentId || e.to === currentId);
    for (const edge of neighbors) {
      const neighborId = edge.from === currentId ? edge.to : edge.from;
      if (unvisited.has(neighborId)) {
        const newDistance = distances[currentId] + edge.weight;
        if (newDistance < distances[neighborId]) {
          distances[neighborId] = newDistance;
          previous[neighborId] = currentId;
        }
      }
    }
  }

  if (distances[endId] === Infinity) {
    return null; // No path found
  }

  // Reconstruct path
  const path: GraphNode[] = [];
  let current: string | null = endId;
  while (current !== null) {
    const node = nodes.find((n) => n.id === current);
    if (node) path.unshift(node);
    current = previous[current];
  }

  const totalDistance = distances[endId];
  
  // Calculate last leg distance (from last warehouse to end point)
  let lastLegDistance = 0;
  if (path.length >= 2) {
    const lastNode = path[path.length - 1];
    const prevNode = path[path.length - 2];
    lastLegDistance = calculateDistance(prevNode.lat, prevNode.lng, lastNode.lat, lastNode.lng);
  }

  return { 
    path, 
    distance: totalDistance,
    corridorDistance: totalDistance - lastLegDistance,
    lastLegDistance
  };
}

// Helper to build a fully connected graph or simulated corridors
export function buildGraph(warehouses: any[], maxCorridorDistance: number = 50): { nodes: GraphNode[], edges: GraphEdge[] } {
  const nodes: GraphNode[] = warehouses.map(w => ({
    id: w.id,
    lat: w.latitude,
    lng: w.longitude,
    name: w.name,
  }));

  const edges: GraphEdge[] = [];
  
  // Create edges between warehouses if they are within maxCorridorDistance
  // Alternatively, just fully connect them to ensure a path always exists.
  // For realism, let's connect every warehouse to its 2 nearest neighbors to create a sparse network
  for (let i = 0; i < nodes.length; i++) {
    const distances = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i !== j) {
        distances.push({
          to: nodes[j].id,
          dist: calculateDistance(nodes[i].lat, nodes[i].lng, nodes[j].lat, nodes[j].lng)
        });
      }
    }
    // Sort by distance and connect to closest 3 to ensure connectedness
    distances.sort((a, b) => a.dist - b.dist);
    for (let k = 0; k < Math.min(3, distances.length); k++) {
      const exists = edges.some(e => (e.from === nodes[i].id && e.to === distances[k].to) || (e.to === nodes[i].id && e.from === distances[k].to));
      if (!exists) {
        edges.push({
          from: nodes[i].id,
          to: distances[k].to,
          weight: distances[k].dist
        });
      }
    }
  }

  return { nodes, edges };
}

export function getRoute(warehouses: any[], sourceId: string, dropPoint: {lat: number, lng: number}) {
  const { nodes, edges } = buildGraph(warehouses);
  
  // Add user drop point as a node
  const dropNodeId = "user-drop-point";
  nodes.push({ id: dropNodeId, lat: dropPoint.lat, lng: dropPoint.lng, name: "Delivery point" });

  // Connect drop point to the nearest warehouse to represent the "last-mile leg"
  let nearestDist = Infinity;
  let nearestWarehouseId = "";
  for (const w of warehouses) {
    const dist = calculateDistance(dropPoint.lat, dropPoint.lng, w.latitude, w.longitude);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestWarehouseId = w.id;
    }
  }

  edges.push({
    from: nearestWarehouseId,
    to: dropNodeId,
    weight: nearestDist
  });

  return findShortestPath(nodes, edges, sourceId, dropNodeId);
}

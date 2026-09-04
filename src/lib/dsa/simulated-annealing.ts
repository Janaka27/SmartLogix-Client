// Multi-stop "batch delivery" route optimization.
//
// When several ready orders from the same warehouse are consolidated onto a single drone
// flight, the drone must visit every drop point once and return to the warehouse. Finding the
// shortest such closed tour is the (symmetric) Travelling Salesperson Problem: NP-hard, so an
// exact solver is only usable for a handful of stops (see the brute-force / Held-Karp
// discussion in the accompanying report). This module instead uses Simulated Annealing, a
// probabilistic local-search heuristic, over a tour represented as a circularly linked list.

export type Stop = {
  id: string;
  lat: number;
  lng: number;
  name?: string;
};

// ---------------------------------------------------------------------------
// Circularly linked list: the natural representation of a closed tour. There is no first or
// last stop to special-case, no modulo arithmetic to wrap the index around, and the local move
// used by the heuristic below -- swapping two adjacent stops -- only touches the handful of
// pointers immediately around them, independent of tour length.
// ---------------------------------------------------------------------------

export class TourNode {
  stop: Stop;
  next: TourNode;
  prev: TourNode;
  constructor(stop: Stop) {
    this.stop = stop;
    this.next = this;
    this.prev = this;
  }
}

export class CircularTour {
  head: TourNode | null = null;
  size = 0;

  static fromStops(stops: Stop[]): CircularTour {
    const tour = new CircularTour();
    for (const s of stops) tour.append(s);
    return tour;
  }

  append(stop: Stop): TourNode {
    const node = new TourNode(stop);
    if (!this.head) {
      this.head = node;
    } else {
      const tail = this.head.prev;
      tail.next = node;
      node.prev = tail;
      node.next = this.head;
      this.head.prev = node;
    }
    this.size++;
    return node;
  }

  toArray(): Stop[] {
    const out: Stop[] = [];
    if (!this.head) return out;
    let cur = this.head;
    do {
      out.push(cur.stop);
      cur = cur.next;
    } while (cur !== this.head);
    return out;
  }

  // Node references, captured once by the caller and reused for the whole search -- swapping
  // two adjacent nodes rewires their pointers in place, it never allocates or discards node
  // objects, so a list of references taken before the search starts stays valid throughout it.
  nodes(): TourNode[] {
    const out: TourNode[] = [];
    if (!this.head) return out;
    let cur = this.head;
    do {
      out.push(cur);
      cur = cur.next;
    } while (cur !== this.head);
    return out;
  }

  clone(): CircularTour {
    return CircularTour.fromStops(this.toArray());
  }

  // Swap node `a` with its immediate successor -- O(1): exactly four pointers are relinked, and
  // nothing else in the list is touched, shifted or reindexed.
  swapWithNext(a: TourNode): void {
    if (this.size < 2 || a.next === a) return;
    const b = a.next;
    const beforeA = a.prev;
    const afterB = b.next;

    if (beforeA === b) {
      // exactly two nodes in the tour: swapping them is a no-op on the cycle itself
      return;
    }

    beforeA.next = b;
    b.prev = beforeA;
    b.next = a;
    a.prev = b;
    a.next = afterB;
    afterB.prev = a;

    if (this.head === a) this.head = b;
  }
}

// ---------------------------------------------------------------------------
// 2D distance matrix: every pairwise distance is computed once and looked up in O(1) for the
// rest of the search, instead of being recomputed on every candidate move.
// ---------------------------------------------------------------------------

export function distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function buildDistanceMatrix(stops: Stop[]): number[][] {
  const n = stops.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = distance(stops[i].lat, stops[i].lng, stops[j].lat, stops[j].lng);
      matrix[i][j] = d;
      matrix[j][i] = d;
    }
  }
  return matrix;
}

export function tourLength(tour: CircularTour, indexOf: Map<string, number>, matrix: number[][]): number {
  if (!tour.head || tour.size < 2) return 0;
  let total = 0;
  let cur = tour.head;
  do {
    const a = indexOf.get(cur.stop.id)!;
    const b = indexOf.get(cur.next.stop.id)!;
    total += matrix[a][b];
    cur = cur.next;
  } while (cur !== tour.head);
  return total;
}

// ---------------------------------------------------------------------------
// Simulated Annealing
// ---------------------------------------------------------------------------

export type SAOptions = {
  initialTemperature?: number;
  coolingRate?: number;
  minTemperature?: number;
  iterationsPerTemperature?: number;
  seed?: number;
};

export type SAResult = {
  route: Stop[];
  distance: number;
  iterations: number;
  history: number[]; // best-known length sampled once per temperature step
};

function mulberry32(seed: number) {
  let s = seed;
  return function random(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Find a short closed tour starting and ending at `depot` that visits every stop in
 * `deliveryStops` exactly once, using Simulated Annealing over a circularly linked list.
 *
 * Neighbour moves are adjacent-node swaps (O(1) each, Section 5 of the report); the cost delta
 * of a swap only depends on the (at most) four edges touching the two swapped nodes, so it is
 * evaluated in O(1) via the precomputed distance matrix rather than by re-summing the tour.
 */
export function simulatedAnnealingTSP(
  depot: Stop,
  deliveryStops: Stop[],
  options: SAOptions = {}
): SAResult {
  const {
    initialTemperature = 100,
    coolingRate = 0.995,
    minTemperature = 1e-3,
    iterationsPerTemperature = 50,
    seed = 42,
  } = options;

  const stops = [depot, ...deliveryStops];
  const matrix = buildDistanceMatrix(stops);
  const indexOf = new Map(stops.map((s, i) => [s.id, i] as const));
  const random = mulberry32(seed);

  const tour = CircularTour.fromStops(stops);
  const nodeRefs = tour.nodes(); // captured once; still valid after any number of swaps

  let currentLength = tourLength(tour, indexOf, matrix);
  let best = tour.clone();
  let bestLength = currentLength;
  const history: number[] = [bestLength];

  let temperature = initialTemperature;
  let iterations = 0;

  while (temperature > minTemperature) {
    for (let i = 0; i < iterationsPerTemperature; i++) {
      if (tour.size < 3) break;
      const a = nodeRefs[Math.floor(random() * nodeRefs.length)];
      const b = a.next;
      const beforeA = a.prev;
      const afterB = b.next;

      const ia = indexOf.get(a.stop.id)!;
      const ib = indexOf.get(b.stop.id)!;
      const ibefore = indexOf.get(beforeA.stop.id)!;
      const iafter = indexOf.get(afterB.stop.id)!;

      // edges touched: (beforeA,a) (a,b) (b,afterB) -> (beforeA,b) (b,a) (a,afterB)
      // (a,b) and (b,a) are equal for symmetric distances and cancel out of the delta.
      const removed = matrix[ibefore][ia] + matrix[ib][iafter];
      const added = matrix[ibefore][ib] + matrix[ia][iafter];
      const delta = added - removed;

      const accept = delta < 0 || random() < Math.exp(-delta / temperature);
      if (accept) {
        tour.swapWithNext(a);
        currentLength += delta;
        if (currentLength < bestLength - 1e-9) {
          bestLength = currentLength;
          best = tour.clone();
        }
      }
      iterations++;
    }
    temperature *= coolingRate;
    history.push(bestLength);
  }

  return { route: best.toArray(), distance: bestLength, iterations, history };
}

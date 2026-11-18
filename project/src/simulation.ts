export const PLACE_CREATION_COST = 100;
export const MAINTENANCE_COST_PER_SEC = 20;
export const REVENUE_PER_CAR = 300;
export const INITIAL_PLACES = 3;

export const spotStaySeconds = () => 5 + Math.floor(Math.random() * 6);

export interface Spot {
  id: number;
  occupied: boolean;
  secondsLeft: number;
}

export interface SimState {
  tick: number;
  nextSpotId: number;
  spots: Spot[];
  served: number;
  rejected: number;
  revenue: number;
  costs: number;
  occupiedSum: number;
}

export const createInitialState = (places = INITIAL_PLACES): SimState => ({
  tick: 0,
  nextSpotId: places,
  spots: Array.from({ length: places }, (_, i) => ({
    id: i,
    occupied: false,
    secondsLeft: 0,
  })),
  served: 0,
  rejected: 0,
  revenue: 0,
  costs: 0,
  occupiedSum: 0,
});

export const occupiedCount = (state: SimState) =>
  state.spots.reduce((n, s) => n + (s.occupied ? 1 : 0), 0);

export const currentOccupancy = (state: SimState) =>
  state.spots.length === 0 ? 0 : (occupiedCount(state) / state.spots.length) * 100;

export const averageOccupancy = (state: SimState) =>
  state.tick === 0 ? 0 : (state.occupiedSum / state.tick / state.spots.length) * 100;

export const netProfit = (state: SimState) => state.revenue - state.costs;

export const addPlace = (state: SimState): SimState => ({
  ...state,
  spots: [...state.spots, { id: state.nextSpotId, occupied: false, secondsLeft: 0 }],
  nextSpotId: state.nextSpotId + 1,
  costs: state.costs + PLACE_CREATION_COST,
});

export const step = (state: SimState): SimState => {
  const spots = state.spots.map((s) =>
    s.occupied && s.secondsLeft <= 1
      ? { ...s, occupied: false, secondsLeft: 0 }
      : s.occupied
        ? { ...s, secondsLeft: s.secondsLeft - 1 }
        : s,
  );

  let served = state.served;
  let revenue = state.revenue;

  const freeIndex = spots.findIndex((s) => !s.occupied);
  if (freeIndex !== -1) {
    spots[freeIndex] = { ...spots[freeIndex], occupied: true, secondsLeft: spotStaySeconds() };
    served += 1;
    revenue += REVENUE_PER_CAR;
  }

  const occupied = spots.reduce((n, s) => n + (s.occupied ? 1 : 0), 0);

  return {
    ...state,
    tick: state.tick + 1,
    nextSpotId: state.nextSpotId,
    spots,
    served,
    rejected: state.rejected + (freeIndex === -1 ? 1 : 0),
    revenue,
    costs: state.costs + MAINTENANCE_COST_PER_SEC * spots.length,
    occupiedSum: state.occupiedSum + occupied,
  };
};

export interface StaticResult {
  places: number;
  served: number;
  rejected: number;
  occupancy: number;
  profit: number;
}

const simulateStatic = (places: number, ticks: number): StaticResult => {
  let state: SimState = {
    ...createInitialState(places),
  };
  for (let i = 0; i < ticks; i++) state = step(state);
  return {
    places,
    served: state.served,
    rejected: state.rejected,
    occupancy: state.tick === 0 ? 0 : (state.occupiedSum / state.tick / places) * 100,
    profit: netProfit(state) - PLACE_CREATION_COST * Math.max(0, places - INITIAL_PLACES),
  };
};

export const findOptimalPlaces = (maxPlaces = 14, ticks = 900, runs = 5): StaticResult[] => {
  const results: StaticResult[] = [];
  for (let n = INITIAL_PLACES; n <= maxPlaces; n++) {
    let served = 0;
    let rejected = 0;
    let occupancy = 0;
    let profit = 0;
    for (let r = 0; r < runs; r++) {
      const res = simulateStatic(n, ticks);
      served += res.served;
      rejected += res.rejected;
      occupancy += res.occupancy;
      profit += res.profit;
    }
    results.push({
      places: n,
      served: Math.round(served / runs),
      rejected: Math.round(rejected / runs),
      occupancy: occupancy / runs,
      profit: profit / runs,
    });
  }
  return results;
};

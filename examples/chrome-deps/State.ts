
type Selection = {
  selected?: string;
  suggest?: Set<string>;
  // query: string
};


interface State {
  hoveredNode?: string;
  searchQuery: string[];
  sq2: string;
  inNeighbors: boolean;
  outNeighbors: boolean;

  selectedNeighbor?: string;
  selected: Selection[];
  paths: Map<string, number>[];
  pathIndex: number;

  hoveredNeighbors?: Set<string>;
  sizeMult: number;
}
export const state: State = {
  searchQuery: ["", ""],
  sq2: "",
  inNeighbors: true,
  outNeighbors: false,
  selected: [
    { selected: undefined, suggest: undefined },
    { selected: undefined, suggest: undefined },
  ],
  paths: [],
  pathIndex: 0,
  sizeMult: 1,
};
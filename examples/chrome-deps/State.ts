import { appendText, nodeEditor } from "./Editors";
import { fileText, getTextBetweenPositions } from "./FilePiece";
import { graph } from "./Graph";

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
  ],
  paths: [],
  pathIndex: 0,
  sizeMult: 1,
};

export const updateStateSelection = async (diff, selectionId) => {
  // Object.assign(state, diff);
  if (diff.hasOwnProperty("selected")) {
    let event = null;
    if (fileText.length === 0) {
      console.log("test")
      event = new Event("click");
      document.getElementById("fileButton").dispatchEvent(event);
    }
    // if (state.selected[selectionId].selected !== undefined) {
      state.selected[selectionId] = diff;
    const attrs = graph.getNodeAttributes(state.selected[selectionId].selected);
    const loc = attrs.location;
    graph.setNodeAttribute(state.selected[selectionId].selected, "code", getTextBetweenPositions(loc.line, loc.column, loc.endLine, loc.endColumn));
    appendText(JSON.stringify(attrs, null, 1), nodeEditor.getModel());
    // }
  }
}
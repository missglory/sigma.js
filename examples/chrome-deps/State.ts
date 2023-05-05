import { appendText, fileNameEditor, nodeEditor, cppEditor, cppLinesEditor } from "./Editors";
import { fileName, fileText, getTextBetweenPositions } from "./LoadFile";
import { graph } from "./Graph";
import { sveltePreprocess } from "svelte-preprocess/dist/autoProcess";

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
    if (fileName !== fileNameEditor.getModel().getValue()) {
      console.log("test")
      event = new Event("click");
      document.getElementById("fileButton").dispatchEvent(event);
      // await new Promise(r => setTimeout(r, 100));
    }
    // if (state.selected[selectionId].selected !== undefined) {
      state.selected[selectionId] = diff;
    const attrs = graph.getNodeAttributes(state.selected[selectionId].selected);
    delete attrs.code;
    const loc = attrs.location;
    graph.setNodeAttribute(state.selected[selectionId].selected, "code", getTextBetweenPositions(loc.line, loc.column, loc.endLine, loc.endColumn));
    appendText(JSON.stringify(attrs, null, 1), nodeEditor.getModel());
    // }
    let codeRaw = JSON.stringify(attrs.code.text).replaceAll("\\n", "\n");
    if (codeRaw.length > 3) {
      codeRaw = codeRaw.substring(1, codeRaw.length - 1);
    }
    appendText(codeRaw, cppEditor.getModel());
    appendText(attrs.code.lineNumbers
      .replaceAll("'", "")
      .replaceAll(",", "\n"),
      cppLinesEditor.getModel());
  }
}
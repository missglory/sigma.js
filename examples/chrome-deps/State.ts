import { graph } from "./Graph";
import { appendText, fileNameEditor, nodeEditor, cppEditor, cppLinesEditor } from "./Editors";
import { fileName, fileText, getTextBetweenPositions } from "./LoadFile";
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
  state.selected[selectionId] = diff;
  if (diff["selected"] !== undefined) {
    const attrs = graph.getNodeAttributes(state.selected[selectionId].selected);
    // delete attrs.code;
    const loc = attrs.location;
    // graph.setNodeAttribute(state.selected[selectionId].selected, "code", );
    const codeAndLines = getTextBetweenPositions(loc.line, loc.column, loc.endLine, loc.endColumn);
    appendText(JSON.stringify(attrs, null, 1), nodeEditor.getModel());
    // }
    let codeRaw = codeAndLines.text;
    // if (codeRaw.length > 3) {
    //   codeRaw = codeRaw.substring(1, codeRaw.length - 1);
    // }
    appendText(codeRaw, cppEditor.getModel());
    appendText(codeAndLines.lineNumbers
      .replaceAll("'", "")
      .replaceAll(",", "\n"),
      cppLinesEditor.getModel());
  }
}
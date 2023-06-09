import { graph } from "./Graph";
import { appendText, fileNameEditor, nodeEditor, cppEditor, cppLinesEditor } from "./Editors";
import * as LoadFile from "./LoadFile";
import { sveltePreprocess } from "svelte-preprocess/dist/autoProcess";
import * as Ranges from "./Ranges";

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
  selected: [{ selected: undefined, suggest: undefined }],
  paths: [],
  pathIndex: 0,
  sizeMult: 1,
};

export const updateStateSelection = async (diff, selectionId) => {
  state.selected[selectionId] = diff;
  if (diff["selected"] === undefined) {
    return;
  }
  const attrs = graph.getNodeAttributes(state.selected[selectionId].selected);
  // delete attrs.code;
  const loc = attrs.location !== undefined ? attrs.location : attrs.location2;
  const file = attrs.location !== undefined ? LoadFile.fileText[0] : LoadFile.fileText[1];
  if (loc === undefined || loc.line === undefined) {
    //   Object.assign(loc, {
    //     ...Utils.getLineColumn(fileText, loc.offset),
    //     // ...Utils.getLineColumn(loc.endOffset, fileText),
    //   });
    try {
      appendText(JSON.stringify(attrs, null, 1), nodeEditor.getModel());
      appendText(Ranges.getTextSliceByByteOffset(file, loc.offset, loc.endOffset), cppEditor.getModel());
      const { line, column } = Ranges.getLineColumn(file, loc.offset);
      const end = Ranges.getLineColumn(file, loc.endOffset);
      appendText(Ranges.getLineNumbersString(line, end.line), cppLinesEditor.getModel());
    } catch (e) {
      console.error("error\n", file, loc);
    }
    } else {
    try {
      // graph.setNodeAttribute(state.selected[selectionId].selected, "code", );
      appendText(JSON.stringify(attrs, null, 1), nodeEditor.getModel());
      // }
      // if (codeRaw.length > 3) {
      //   codeRaw = codeRaw.substring(1, codeRaw.length - 1);
      // }
      const codeAndLines = Ranges.getTextBetweenPositions(loc.line, loc.column, loc.endLine, loc.endColumn, file);
      let codeRaw = codeAndLines.text;
      appendText(codeRaw, cppEditor.getModel());
      appendText(codeAndLines.lineNumbers.replaceAll("'", "").replaceAll(",", "\n"), cppLinesEditor.getModel());
    } catch (e) {
      console.error("error\n", file, loc);
    }
  }
};

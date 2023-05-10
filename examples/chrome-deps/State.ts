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
  if (diff["selected"] !== undefined) {
    const attrs = graph.getNodeAttributes(state.selected[selectionId].selected);
    // delete attrs.code;
    const loc = attrs.location;
    if (loc.line === undefined) {
      //   Object.assign(loc, {
        //     ...Utils.getLineColumn(fileText, loc.offset),
        //     // ...Utils.getLineColumn(loc.endOffset, fileText),
        //   });
          appendText(JSON.stringify(attrs, null, 1), nodeEditor.getModel());
          appendText(Ranges.getTextSliceByByteOffset(LoadFile.fileText, loc.offset, loc.endOffset), cppEditor.getModel());
          const {line, column} = Ranges.getLineColumn(LoadFile.fileText, loc.offset);
          const end = Ranges.getLineColumn(LoadFile.fileText, loc.endOffset);
          appendText(Ranges.getLineNumbersString(line, end.line), cppLinesEditor.getModel());
        } else {
          // graph.setNodeAttribute(state.selected[selectionId].selected, "code", );
          const codeAndLines = Ranges.getTextBetweenPositions(loc.line, loc.column, loc.endLine, loc.endColumn);
          appendText(JSON.stringify(attrs, null, 1), nodeEditor.getModel());
          // }
          let codeRaw = codeAndLines.text;
          // if (codeRaw.length > 3) {
            //   codeRaw = codeRaw.substring(1, codeRaw.length - 1);
            // }
            appendText(codeRaw, cppEditor.getModel());
            appendText(codeAndLines.lineNumbers.replaceAll("'", "").replaceAll(",", "\n"), cppLinesEditor.getModel());
          }
  }
};

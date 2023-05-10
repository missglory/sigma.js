import { editor } from "monaco-editor";
import { renderer } from "./Renderer";
import { state, updateStateSelection } from "./State";
import { plainParams, searchParams } from "./Editors";
import { assignPath } from "./Paths";
import { graph, graphRoot } from "./Graph";
import { Coordinates } from "sigma/types";
import * as Ranges from "./Ranges";
import { fileText } from "./LoadFile";

export const searchInputs = [0, 1].map((v) => {
  return editor.create(document.getElementById(`search-input${v.toString()}`), {
    ...searchParams,
  });
});

const testRange = (n, pattern, suggestions): boolean => {
   const ranges= new Ranges.RangeFinder([n.location.offset, n.location.endOffset]);
   ranges.findHolesByRegex(fileText, pattern);
    const occurences = ranges.isContainedInRange([location['offset'], location['endOffset']]);
     if (occurences.length > 0) {
      // suggestions.push({
        // id: n,
        // label: "root",
        // range: occurences,
      // });
      // suggestions.push(id);
      return true;
    } else {
      return false;
    }

};

export function setSearchQuery(query: string, selection: number) {
  state.paths = [];
  if (!query) {
    updateStateSelection({ selected: undefined, suggest: undefined }, selection);
    renderer.refresh();
    return;
  }

  if (query[0] === '"') {
    query = "^" + query.substring(1);
  }

  if (query.at(-1) === '"') {
    query = query.substring(0, query.length - 1) + "$";
  }

  state.searchQuery[selection] = query;
  if (searchInputs[selection].getModel().getValue() !== query) {
    searchInputs[selection].getModel().setValue(query);
  }

  const pattern = new RegExp(query);

  const suggestionsCode = [];
  const suggestions = graph
    .nodes()
    .map((n) => ({
      id: n,
      // label: "^" + n + "$",
      label: graph.getNodeAttribute(n, "label"),
      // label: n
      location: graph.getNodeAttribute(n, "location"),
    }))
    // .filter(({ label }) => label.includes(query));
    .filter((n) => pattern.test(n.label) || addGlobalFlag(pattern).test(n.id)
     || testRange(n, pattern, suggestions)
    );

  // updateStateSelection({ selected: undefined, suggest: suggestions }, selection);
  // renderer.refresh();

  if (suggestions.length === 1) {
    updateStateSelection({ selected: suggestions[0].id, suggest: undefined }, selection);
    const selectedOther = state.selected[(selection + 1) % 2]?.selected;
    if (selectedOther !== undefined) {
      assignPath(selectedOther, state.selected[selection].selected);
    }

    const nodePosition = renderer.getNodeDisplayData(state.selected[selection].selected) as Coordinates;
    renderer.getCamera().animate(nodePosition, {
      duration: 500,
    });
  } else {
    updateStateSelection({ selected: undefined, suggest: new Set(suggestions.map(({ id }) => id)) }, selection);
  }

  renderer.refresh();
}

function addGlobalFlag(pattern: RegExp): RegExp {
  const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
  return new RegExp(pattern.source, flags);
}

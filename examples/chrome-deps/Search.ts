import { editor } from "monaco-editor";
import { renderer } from "./Renderer";
import { state, updateStateSelection } from "./State";
import { plainParams, searchParams } from "./Editors";
import { assignPath } from "./Paths";
import { graph } from "./Graph";
import { Coordinates } from "sigma/types";


export const searchInputs = [0, 1].map((v) => {
  return editor.create(document.getElementById(`search-input${v.toString()}`), {
    ...searchParams,
  });
});

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

  const suggestions = graph
    .nodes()
    .map((n) => ({
      id: n,
      // label: "^" + n + "$",
      label: graph.getNodeAttribute(n, "label"),
      // label: n
    }))
    // .filter(({ label }) => label.includes(query));
    .filter((n) => pattern.test(n.label) || pattern.test(n.id));

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

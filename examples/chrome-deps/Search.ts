import { editor } from "monaco-editor";
import { renderer } from "./Renderer";
import { state, updateStateSelection } from "./State";
import { appendText, plainParams, searchParams } from "./Editors";
import { assignPath } from "./Paths";
import { graph, graphRoots, diffGraph, diffGraphRoots } from "./Graph";
import { Coordinates } from "sigma/types";
import * as Ranges from "./Ranges";
import { fileText } from "./LoadFile";

const findInclusions = (content: string, inclusion: string): Ranges.Range[] => {
  const matches: Ranges.Range[] = [];

  let startIndex = 0;
  let matchStart: number;
  while ((matchStart = content.indexOf(inclusion, startIndex)) !== -1) {
    const matchEnd: number = matchStart + inclusion.length;
    matches.push([matchStart, matchEnd]);

    // Move to the next character after the found match to avoid infinite loop
    startIndex = matchStart + 1;
  }

  return matches;
};

const findHolesByRegex = (content: string, regex: RegExp): Ranges.Range[] => {
  const matches: Ranges.Range[] = [];

  // Make sure the regex has the global flag
  const globalRegex = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");

  let match: RegExpExecArray | null;
  while ((match = globalRegex.exec(content)) !== null) {
    const matchIdx: Ranges.Range = [match.index, match.index + match[0].length];
    // if (range[0] <= matchIdx[0] && range[1] >= matchIdx[1]) {
    // if (this.isContainedInRange(matchIdx)) {
    matches.push(matchIdx);
    // }

    // Prevent infinite loop with zero-length matches
    if (match[0].length === 0) {
      globalRegex.lastIndex++;
    }
  }

  if (matches.length === 0) {
  }

  return matches;
  // for (const match of matches) {
  //   this.addRange(match);
  // }

  // return this.getHoles();
};

export const searchInputs = [0, 1].map((v) => {
  return editor.create(document.getElementById(`search-input${v.toString()}`), {
    ...searchParams,
  });
});

export const search0Scope = editor.create(document.getElementById("search0Scope"), {
  ...searchParams
});

const testRange = (n, finds, graph): boolean => {
  // const attr = graph.getNodeAttributes(n);
  // console.log(n.location);
  if (n.location === undefined || n.location.offset === undefined || n.location.endOffset === undefined) {
    return false;
  }
  const ranges = new Ranges.RangeFinder([n.location.offset, n.location.endOffset]);
  // findHolesByRegex(fileText, pattern, ranges.getHoles().at(0));

  // const occurences = ranges.isContainedInRange([n.location.offset, n.location.endOffset]);
  // if (occurences) {
  // suggestions.push({
  // id: n,
  // label: "root",
  // range: occurences,
  // });
  // suggestions.push(id);
  // finds.forEach((f) => {
  //   const v = ranges.isContainedInRange(f);
  //   if (v) {
  //     return true;
  //   }
  // });
  for (const find of finds) {
    // const v = ranges.isContainedInRange(find);
    const v = n.location.offset <= find[0] && n.location.endOffset >= find[1];
    if (v) {
      return true;
    }
  }
  return false;
  //   return true;
  // } else {
  //   return false;
  // }
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
    appendText(query, searchInputs[selection].getModel());
  }

  let idSelected = false;
  let suggestions = [];
  try {
    const pattern = new RegExp(query);
    suggestions = graph
      .nodes()
      .map((n) => {
        return {
          id: n,
          label: graph.getNodeAttribute(n, "label"),
          location: graph.getNodeAttribute(n, "location"),
          kind: graph.getNodeAttribute(n, "kind")
        };
      })
      .filter((n) => pattern.test(n.kind) || pattern.test(n.id));
      // .filter((n) => pattern.test(n.id));
      if (suggestions.length) {
        idSelected = true;
      }
    } catch (e) {
    console.log('catch id regex');
  }
  if (!idSelected) {
    // const finds = findHolesByRegex(fileText[0], pattern);
    try {
      const finds = findInclusions(fileText[0], query);
      suggestions = graph
        .nodes()
        .map((n) => {
          return {
            id: n,
            label: graph.getNodeAttribute(n, "label"),
            location: graph.getNodeAttribute(n, "location"),
          };
        })
        .filter((n) => testRange(n, finds, graph));
    } catch (e) {
      suggestions = [];
    }
    if (suggestions.length) {
      idSelected = true;
    }
  }

  if (!idSelected) {
    const pattern = new RegExp(query);
    suggestions = graph
      .nodes()
      .map((n) => {
        return {
          id: n,
          label: graph.getNodeAttribute(n, "label"),
          // location: graph.getNodeAttribute(n, "location"),
          // kind: graph.getNodeAttribute(n, "kind")
        };
      })
      .filter((n) => n.label.includes(query));
  }

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

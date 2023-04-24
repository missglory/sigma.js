import * as graphology from "graphology";
import { allSimplePaths } from "graphology-simple-path";
import { Coordinates, EdgeDisplayData, NodeDisplayData } from "sigma/types";
import chroma from "chroma-js";

import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";
import * as Surreal from './Surreal';
import { appendText, diffEditor } from "./Editors";
import { state } from "./State";
import { graph } from "./Graph";
import { getHeatMapColor, renderer } from "./Renderer";



Promise.all([fetch("./chrome_deps.json")])
  .then((rs) =>
    Promise.all(
      rs.map((r) => {
        return r.json();
      }),
    ),
  )
  .then(
    Function.prototype.apply.bind(start, start),
  );

export const searchInputs = [0, 1].map((v) => {
  return document.getElementById("search-input" + v.toString()) as HTMLInputElement;
});
const searchSuggestions = document.getElementById("suggestions") as HTMLDataListElement;

// let DELIMETER = ":";

const layers = new Set([0]);

const downscaleConst = 1;


let ctrlPressed = false;
window.addEventListener("keydown", (e) => {
  // if (e.keyCode == 32) {
  //   e.preventDefault();
  //   document.getElementById("fa2").dispatchEvent(new Event("click"));
  // }
  if (e.keyCode == 17) {
    ctrlPressed = true;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.keyCode == 17) {
    ctrlPressed = false;
  }
});

window.scrollTo({
  top: 0,
});

window.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

let ctrl = false;
window.onkeydown = (e: KeyboardEvent) => {
  ctrl = e.ctrlKey;
};

window.onkeyup = (e: KeyboardEvent) => {
  ctrl = !e.ctrlKey;
};

const removeParent = (elem: Node) => {
  elem.parentNode.parentNode.removeChild(elem.parentNode);
};


let layout: FA2Layout;

const appendButton = document.getElementById("appendButton") as HTMLButtonElement;
appendButton.onclick = (e) => {
  const v = diffEditor.getValue();
  try {
    const obj = JSON.parse(v);
    start(obj);
  } catch (e) {
    alert("Invalid JSON");
  }
};

const subtractButton = document.getElementById("subtractButton") as HTMLButtonElement;
subtractButton.onclick = (e) => {
  const v = diffEditor.getValue();
  const cur = graph2Object(graph);
  // let obj;
  let res = {};
  try {
    // const obj = JSON.parse(v);
    // for (const o in cur) {
    //   if (!(o in obj)) {
    //     // res[o] = obj[o];
    //     const deps = cur[o].deps;
    //     // console.log(cur[o]);
    //     // const resDeps = [];
    //     // for (const dep of deps) {
    //     //   console.log(dep);
    //     //   if (!(dep in obj[o].deps)) {
    //     //     resDeps.push(dep);
    //     //   }
    //     // }
    //     // res[o].deps = resDeps;
    //     res[o] = { deps: deps };
    //   }
    // }
    // console.log(res);
    start(JSON.parse(v), false);
  } catch (e) {
    alert("JSON error");
  }
};

const fa2Button = document.getElementById("fa2") as HTMLButtonElement;
function toggleFA2Layout() {
  if (layout.isRunning()) {
    layout.stop();
    fa2Button.innerHTML = `Start layout ▶`;
  } else {
    layout.start();
    fa2Button.innerHTML = `Stop layout ⏸`;
    // setTimeout(fa2Button.click, 2000);
  }
}

document.getElementById("resetBtn").onclick = (e) => {
  graph.forEachNode((node) => {
    const c = chroma.random()._rgb;
    graph.setNodeAttribute(node, "x", c[0] * downscaleConst);
    graph.setNodeAttribute(node, "y", c[1] * downscaleConst);
  });
};

document.getElementById("reroute").onclick = (ev) => {
  const vals = searchInputs.map((input) => input.value);
  searchInputs.forEach((input, index) => {
    input.value = vals[(index + 1) % vals.length];
    input.dispatchEvent(new Event("input"));
  });
};

const addLayerButton = document.getElementById("addLayer");
addLayerButton.addEventListener("click", (e: MouseEvent) => {
  const layerNum = document.getElementById("layerNum");
  if (!(layerNum instanceof HTMLInputElement)) {
    console.error("input element type error");
    throw new Error("err");
  }
  const lnValue = layerNum.value;
  const lnNum = Number(lnValue);
  const liId = "li" + lnValue;
  if (layers.has(lnNum) || lnNum < 0 || lnNum > 9 || document.getElementById(liId) !== null) {
    return;
  }
  layers.add(lnNum);
  const ul = document.getElementById("layerList");
  const li = document.createElement("div");
  li.id = liId;
  const checkBox = document.createElement("input");
  checkBox.setAttribute("type", "checkbox");
  checkBox.id = "checkBox";
  //  + toString(Number(layerNum.value))
  li.appendChild(checkBox);
  const label = document.createElement("b");
  label.innerHTML = layerNum.value;
  li.appendChild(label);
  const buttonDelete = document.createElement("button");
  buttonDelete.innerHTML = "⌫";
  buttonDelete.onclick = (e: MouseEvent) => {
    if (!(e.target instanceof Node)) {
      return;
    }
    removeParent(e.target as Node);
    layers.delete(Number((e.target.previousSibling as HTMLElement).innerHTML));
    return;
  };
  li.appendChild(buttonDelete);
  ul.appendChild(li);
  return;
});

for (const el of document.getElementsByClassName("collapseButton")) {
  (el as HTMLButtonElement).onclick = (e) => {
    const button = e.target as HTMLButtonElement;
    const sw = button.innerHTML === "▸" ? true : false;
    for (const ch of button.parentElement.children) {
      if (ch === button) {
        continue;
      }
      (ch as HTMLElement).hidden = !sw;
    }
    button.innerHTML = sw ? "▼" : "▸";
    button.parentElement.style.border = sw ? "0" : "2px";
  };
}

const graph2Object = (graph: graphology.DirectedGraph) => {
  let res = {};
  graph.forEachNode((n) => {
    let nodeObj = {};
    nodeObj[n] = { deps: graph.neighbors(n) };
    Object.assign(res, nodeObj);
  });
  return res;
};

const graph2JSON = async (graph: graphology.DirectedGraph) => {
  return JSON.stringify(graph2Object(graph), null, 1);
};


const line2diff = async (n, graph, editor = diffEditor) => {
  let nodeObj = {};
  nodeObj[n] = { deps: graph.neighbors(n) };
  const model = editor.getModel();
  const textToAppend = JSON.stringify(nodeObj, null, 2);
  appendText(textToAppend, model);
};

const graph2diff = async (graph: graphology.DirectedGraph) => {
  graph.nodes().forEach((n) => {
    line2diff(n, graph);
  });
};

const graph2diffFull = async (graph: graphology.DirectedGraph) => {
  const v = await graph2JSON(graph);
  appendText(v, diffEditor.getModel());
};

const someEdgeI = (e) => true;

const forEachLine = (line, rootNode, hierarchy, append) => {
    const lvl = line.lastIndexOf(" ");
  
    const l = line
    .replace(/^\s+/g, '')
    .replace(/\.\.\.$/g, '');

    if (l.length > 3 && l.at(-1) == "." && l.at(-2) === "." && l.at(-3) === ".") {
      return;
    }

    if (!append) {
      try{
        graph.dropEdge(l, rootNode);
      } catch (e) {}
      return;
    }

    try {
      const c = chroma.random()._rgb;
      graph.addNode(
        l, 
        {
        x: c[0] * downscaleConst,
        y: c[1] * downscaleConst,
        // size: Math.pow(15 / (lvl + 2), 0.5),
        size: 4,
        color: chroma.random().hex(),
      });
      graph.setNodeAttribute(l, "label", l);
    } catch (err) {
      appendText(l + "\n", diffEditor.getModel());
    }

    try {
      if (hierarchy.length > 0) {
        graph.addDirectedEdge(l, hierarchy.at(-1).name, {
          color: "#aaa",
        });
      }
    } catch (err) {}

    if (hierarchy.length === 0 || lvl > hierarchy.at(-1).lvl) {
      hierarchy.push({
        name: l,
        lvl: lvl,
      });
    }

    while (hierarchy.length > 0 && lvl < hierarchy.at(-1).lvl) {
      hierarchy.pop();
    }
};

const dropNodeF = (node, i, graph) => { graph.dropNode(node); }
const string2Graph = (rootNode, i, dataRaw, graph, append = true) => {
  const cRoot = chroma.random()._rgb;
  const lines: string[] | undefined = dataRaw.deps;
  try {
    if (append) {
      graph.addNode(rootNode, {
        x: cRoot[0],
        y: cRoot[1],
        size: 4,
        color: chroma.random().hex(),
        // label: rootNode.substring(rootNode.lastIndexOf(DELIMETER) + 1),
        label: rootNode,
      });
    } else if (lines === undefined) {
      const pattern = new RegExp(rootNode);
      // graph.dropNode(rootNode);
      for (let node of graph.filterNodes((node) => pattern.test(node))) {
        graph.dropNode(node);
      }
    }
  } catch (e) {}

  const hierarchy: {
    name: string;
    lvl: number;
  }[] = [
    {
      name: rootNode,
      lvl: -1,
    },
  ];

  const fel = (line) => {
    forEachLine(line, rootNode, hierarchy, append);
  };
  lines.forEach(fel);

  if (!append) {
    if (!graph.someInEdge(rootNode, someEdgeI)) {
      graph.dropNode(rootNode);
    } 
  }
};

const object2Graph = async (dataRaw, graph: graphology.DirectedGraph, append = true) => {
  Object.entries(dataRaw).forEach((rootNode, i) => {
    string2Graph(rootNode[0], i, rootNode[1], graph, append);
  });
  document.getElementById("nEdges").innerHTML = graph.edges().length.toString();
};


function start(dataRaw, append = true) {
  // object2Graph(dataRaw, graph, append);
  // graph2diffFull(graph);

  // ReachableCounts.reachableCounts.clear();
  // ReachableCounts.countReachableNodes(graph)
  // ReachableCounts.assignReachableCounts(graph);
  // // .assignReachableCounts(graph);
  // ReachableCounts.reachableCounts2Editor(graph, sortEditor);
  Surreal.surrealConnect();

  if (append) {
    layout?.kill();
    const sensibleSettings = forceAtlas2.inferSettings(graph);
    layout = new FA2Layout(graph, {
      settings: sensibleSettings,
    });
    layout.start();
  }
  fa2Button.onclick = toggleFA2Layout;

  // Feed the datalist autocomplete values:
  searchSuggestions.innerHTML = graph
    .nodes()
    .map((node) => `<option value="${graph.getNodeAttribute(node, "label")}"></option>`)
    .join("\n");

  async function assignPath(node1, node2) {
    const maxDepthInput = document.getElementById("maxDepthInput") as HTMLInputElement;
    const v = parseInt(maxDepthInput.value)
    state.paths = allSimplePaths(graph, node1, node2, { maxDepth: v }).map(
      (path) => new Map(path.map((p, i, ar) => [p, i / ar.length])),
    );
    state.paths.sort((path1, path2) => (path1.size < path2.size ? -1 : path1.size === path2.size ? 0 : 1));
    document.getElementById("pathsLabel").innerHTML = state.paths.length.toString() + " paths";
    const pathsList = document.getElementById("pathList");
    const pathIndex = document.getElementById("pathIndex") as HTMLInputElement;
    const pathLeftButton = document.getElementById("pathLeftButton") as HTMLButtonElement;
    pathLeftButton.onclick = (e) => {
      const v = Math.max(0, parseInt(pathIndex.value) - 1);
      pathIndex.value = v.toString();
      pathIndex.dispatchEvent(new Event("input"));
    };
    const pathRightButton = document.getElementById("pathRightButton") as HTMLButtonElement;
    pathRightButton.onclick = (e) => {
      const v = Math.min(state.paths.length, parseInt(pathIndex.value) + 1);
      pathIndex.value = v.toString();
      pathIndex.dispatchEvent(new Event("input"));
    };

    pathIndex.oninput = (ev) => {
      pathsList.replaceChildren();
      const idx = parseInt((ev.target as HTMLInputElement).value) - 1;
      if (state.paths.length > idx) {
        state.paths[idx].forEach((percent, path) => {
          const el = document.createElement("tt");
          el.innerHTML = path;
          el.style.borderColor = getHeatMapColor(percent);
          el.style.borderStyle = "solid";
          el.style.padding = "3px";
          const divWrap = document.createElement("div");
          divWrap.style.marginBottom = "8px";
          divWrap.appendChild(el);
          pathsList.appendChild(divWrap);
        });
        state.pathIndex = idx;
      }
      renderer.refresh();
    };
    pathIndex.dispatchEvent(new InputEvent("input"));
  }

  function setSearchQuery(query: string, selection: number) {
    state.paths = [];
    if (!query) {
      state.selected[selection] = { selected: undefined, suggest: undefined };
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
    if (searchInputs[selection].value !== query) {
      searchInputs[selection].value = query;
    }

    const pattern = new RegExp(query);

    const suggestions = graph
      .nodes()
      .map((n) => ({
        id: n,
        // label: "^" + n + "$",
        label: n
        // label: n
      }))
      // .filter(({ label }) => label.includes(query));
      .filter(({label}) => pattern.test(label));

    if (suggestions.length === 1) {
      state.selected[selection] = { selected: suggestions[0].id, suggest: undefined };
      const selectedOther = state.selected[(selection + 1) % 2]?.selected;
      if (selectedOther !== undefined) {
        assignPath(selectedOther, state.selected[selection].selected);
      }

      const nodePosition = renderer.getNodeDisplayData(state.selected[selection].selected) as Coordinates;
      renderer.getCamera().animate(nodePosition, {
        duration: 500,
      });
    } else {
      state.selected[selection] = { selected: undefined, suggest: new Set(suggestions.map(({ id }) => id)) };
    }

    renderer.refresh();
  }

  searchInputs.forEach((searchInput, index) => {
    searchInput.addEventListener("input", (e) => {
      setSearchQuery(searchInput.value || "", index);
      const tt = document.getElementById("searchTT" + index.toString());
      const clrStr = state.selected[index].selected !== undefined ? "rgb(128,255,220)" : "#fff";
      (e.target as HTMLInputElement).style.color = clrStr;
      (e.target as HTMLInputElement).style.borderColor = clrStr;
      tt.style.color = clrStr;
      tt.innerHTML = (
        state.selected[index].suggest !== undefined
          ? state.selected[index].suggest.size
          : state.selected[index].selected !== undefined
          ? 1
          : 0
      ).toString();
    });
  });

  const scaryFunction = (node) => {
    const boundarySet = new Set([node]);
    const layers = [new Set(), new Set(), new Set()];
    let inSet = new Set([node]);
    let outSet = new Set();

    for (let i = 0; i < 3; i++) {
      inSet.forEach((val) => {
        graph.forEachInNeighbor(val, (neighbor) => {
          if (boundarySet.has(neighbor)) {
          } else {
            boundarySet.add(neighbor);
            outSet.add(neighbor);
          }
        });
      });
      inSet = new Set(outSet);
      layers[i] = outSet;
      outSet = new Set();
    }
    return layers;
  };

}

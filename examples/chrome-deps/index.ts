import * as graphology from "graphology";
import { allSimplePaths } from "graphology-simple-path";
// import dijkstra from 'graphology-shortest-path/dijkstra';
import { singleSource } from "graphology-shortest-path/unweighted";
import Sigma from "sigma";
import { Coordinates, EdgeDisplayData, NodeDisplayData } from "sigma/types";
import chroma from "chroma-js";
import EdgesDefaultProgram from "sigma/rendering/webgl/programs/edge";
import EdgesFastProgram from "sigma/rendering/webgl/programs/edge.fast";

import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { editor } from "monaco-editor";

const diffEditor = editor.create(document.getElementById("diffContainer"), {
  language: "json",
  automaticLayout: true,
  // renderValidationDecorations: "on"
  fontSize: 10,
  wordWrap: "on",
  tabSize: 1,
});
let editorWW = true;

Promise.all([fetch("./chrome_deps.json")])
  .then((rs) =>
    Promise.all(
      rs.map((r) => {
        // console.log(r);
        // diffEditor.setValue(JSON.stringify(r));
        // diffEditor.setValue(r.json());
        return r.json();
      }),
    ),
  )
  .then(
    // .then((v) => {
    // console.log(JSON.parse(v[0]));
    // console.log(JSON.stringify(v[0]));
    // diffEditor.setValue(JSON.parse(v[0]));
    // }
    Function.prototype.apply.bind(start, start),
    // Function.prototype.apply.bind(diffEditor.setValue, diffEditor.setValue)
  );

const searchInputs = [0, 1].map((v) => {
  return document.getElementById("search-input" + v.toString()) as HTMLInputElement;
});
const searchSuggestions = document.getElementById("suggestions") as HTMLDataListElement;

// let DELIMETER = ":";

const layers = new Set([0]);

const downscaleConst = 1;

const getHeatMapColor = (v: number) => {
  v = Math.min(v, 1.1);
  const colorScale = [
    ["0.00000", "rgb(165,0,38)"],
    ["0.11111", "rgb(215,48,39)"],
    ["0.22222", "rgb(244,109,67)"],
    ["0.33333", "rgb(253,174,97)"],
    ["0.44444", "rgb(254,224,144)"],
    ["0.55555", "rgb(224,243,248)"],
    ["0.66666", "rgb(171,217,233)"],
    ["0.77777", "rgb(116,173,209)"],
    ["0.88888", "rgb(69,117,180)"],
    ["1.00000", "rgb(49,54,149)"],
    ["1.10000", "rgb(29,10,100)"],
  ];
  let i = 0;
  while (parseFloat(colorScale[i][0]) < v) {
    i++;
  }
  return colorScale[Math.min(colorScale.length, i)][1];
};

window.addEventListener("keydown", function (e) {
  if (e.keyCode == 32) {
    e.preventDefault();
    document.getElementById("fa2").dispatchEvent(new Event("click"));
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

type Selection = {
  selected?: string;
  suggest?: Set<string>;
  // query: string
};

const container = document.getElementById("sigma-container") as HTMLElement;
const graph = new graphology.DirectedGraph({});
const renderer = new Sigma(graph, container, {
  defaultEdgeType: "edges-fast",
  edgeProgramClasses: {
    // "edges-default": EdgesDefaultProgram,
    "edges-fast": EdgesFastProgram,
  },
});

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
const state: State = {
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

document.getElementById("wwButton").onclick = (e) => {
  // diffEditor.getOption(");
  editorWW = !editorWW;
  diffEditor.updateOptions({
    wordWrap: editorWW ? "on" : "off",
  });
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

document.getElementById("inn").onclick = (ev) => {
  const val = (ev.target as HTMLInputElement).checked;
  state.inNeighbors = val;
  document.getElementById("inContainer").hidden = !val;
  // const ttInn = document.getElementById("ttInn");
  // ttIn.innerHTML = graph.neighbors()
  renderer.refresh();
};

document.getElementById("outn").onclick = (ev) => {
  state.outNeighbors = (ev.target as HTMLInputElement).checked;
  renderer.refresh();
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
  graph.nodes().forEach((n) => {
    let nodeObj = {};
    nodeObj[n] = { deps: graph.neighbors(n) };
    Object.assign(res, nodeObj);
  });
  return res;
};

const graph2JSON = async (graph: graphology.DirectedGraph) => {
  return JSON.stringify(graph2Object(graph), null, 1);
};

function appendText(text, model) {
  const range = model.getFullModelRange();
  const op = {
    identifier: { major: 1, minor: 1 },
    range: range,
    text: "\n" + text,
    forceMoveMarkers: true,
  };
  model.pushEditOperations([], [op], null);
}

const line2diff = async (n, graph) => {
  let nodeObj = {};
  nodeObj[n] = { deps: graph.neighbors(n) };
  // Object.assign(res, nodeObj);
  const model = diffEditor.getModel();
  // const textToAppend = "This is some new text to append.";
  const textToAppend = JSON.stringify(nodeObj, null, 2);

  // const range = model.getFullModelRange();
  // const op = {
  //   identifier: { major: 1, minor: 1 },
  //   range: range,
  //   text: textToAppend,
  //   forceMoveMarkers: true,
  // };

  // model.pushEditOperations([], [op], null);
  appendText(textToAppend, model);
};

const graph2diff = async (graph: graphology.DirectedGraph) => {
  graph.nodes().forEach((n) => {
    // let nodeObj = {};
    // nodeObj[n] = { deps: graph.neighbors(n) };
    // Object.assign(res, nodeObj);
    line2diff(n, graph);
  });
};

const graph2diffFull = async (graph: graphology.DirectedGraph) => {
  const v = await graph2JSON(graph);
  appendText(v, diffEditor.getModel());
};

const string2Graph = async (rootNode, i, dataRaw, graph, append = true) => {
  const cRoot = chroma.random()._rgb;
  try {
    if (append) {
      graph.addNode(rootNode, {
        x: cRoot[0],
        y: cRoot[1],
        size: 20,
        color: chroma.random().hex(),
        // label: rootNode.substring(rootNode.lastIndexOf(DELIMETER) + 1),
        label: rootNode,
      });
    } else {
      graph.dropNode(rootNode);
    }
  } catch (e) {}
  const lines: string[] = dataRaw[rootNode].deps;

  const hierarchy: {
    name: string;
    lvl: number;
  }[] = [
    {
      name: rootNode,
      lvl: -2,
    },
  ];
  lines.forEach((line) => {
    const lvl = line.lastIndexOf(" ");

    const l = line.replaceAll(" ", "").replaceAll("...", "");
    // const l = line;

    if (!append) {
      return;
    }

    try {
      const c = chroma.random()._rgb;
      graph.addNode(l, {
        x: c[0] * downscaleConst,
        y: c[1] * downscaleConst,
        size: Math.pow(30 / (lvl + 2), 0.5),
        // size: 4,
        color: chroma.random().hex(),
      });
      // graph.setNodeAttribute(l, "label", l.substring(l.lastIndexOf(DELIMETER) + 1));
      graph.setNodeAttribute(l, "label", l);
    } catch (err) {}

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
  });
};

const object2Graph = async (dataRaw, graph: graphology.DirectedGraph, append = true) => {
  Object.keys(dataRaw).forEach((rootNode, i) => {
    string2Graph(rootNode, i, dataRaw, graph, append);
  });
};

const setupRenderer = () => {
  let draggedNode: string | null = null;
  let isDragging = false;

  // renderer = new Sigma
  renderer.on("downNode", (e) => {
    isDragging = true;
    draggedNode = e.node;
    graph.setNodeAttribute(draggedNode, "highlighted", true);
  });

  const clickFunc = (event, index) => {
    searchInputs[index].select();
    const v = "^" + event.node + "$";
    searchInputs[index].value = v;
    searchInputs[index].dispatchEvent(new Event("input"));
  };
  renderer.on("clickNode", (e) => {
    // if (searchInputs)
    searchInputs.forEach((input, i) => {
      if (document.activeElement === input) {
        clickFunc(e, i);
      }
    });
  });
  renderer.on("rightClickNode", (e) => {
    clickFunc(e, 1);
  });

  // On mouse move, if the drag mode is enabled, we change the position of the draggedNode
  renderer.getMouseCaptor().on("mousemovebody", (e) => {
    if (!isDragging || !draggedNode) return;

    // Get new position of node
    const pos = renderer.viewportToGraph(e);

    graph.setNodeAttribute(draggedNode, "x", pos.x);
    graph.setNodeAttribute(draggedNode, "y", pos.y);

    // Prevent sigma to move camera:
    e.preventSigmaDefault();
    e.original.preventDefault();
    e.original.stopPropagation();
  });

  // On mouse up, we reset the autoscale and the dragging mode
  renderer.getMouseCaptor().on("mouseup", () => {
    if (draggedNode) {
      graph.removeNodeAttribute(draggedNode, "highlighted");
    }
    isDragging = false;
    draggedNode = null;
  });

  // Disable the autoscale at the first down interaction
  renderer.getMouseCaptor().on("mousedown", () => {
    if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
  });

  renderer.on("clickStage", ({ event }: { event: { x: number; y: number } }) => {
    const coordForGraph = renderer.viewportToGraph({ x: event.x, y: event.y });
  });

  function setHoveredNode(node?: string) {
    if (node) {
      state.hoveredNode = node;
      state.hoveredNeighbors = new Set(graph.neighbors(node));
    } else {
      state.hoveredNode = undefined;
      state.hoveredNeighbors = undefined;
    }

    renderer.refresh();
  }

  renderer.on("enterNode", ({ node }) => {
    setHoveredNode(node);
  });
  renderer.on("leaveNode", () => {
    setHoveredNode(undefined);
  });
};

setupRenderer();

function start(dataRaw, append = true) {
  object2Graph(dataRaw, graph, append);
  graph2diffFull(graph);

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
    state.paths = allSimplePaths(graph, node1, node2, { maxDepth: 5 }).map(
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

    const suggestions = graph
      .nodes()
      .map((n) => ({
        id: n,
        label: "^" + n + "$",
      }))
      .filter(({ label }) => label.includes(query));

    if (suggestions.length === 1 && suggestions[0].label.includes(query)) {
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

  renderer.setSetting("nodeReducer", (node, data) => {
    const res: Partial<NodeDisplayData> = { ...data };

    if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
      res.label = "";
      res.color = "#877";
    }

    if (state.paths.length > state.pathIndex && state.paths[state.pathIndex].has(node)) {
      res.highlighted = true;
      res.color = getHeatMapColor(state.paths[state.pathIndex].get(node));
      return res;
    }

    const nodeOut = state.selected[0].selected;
    if (
      nodeOut === node ||
      (state.inNeighbors && graph.areInNeighbors(node, nodeOut)) ||
      (state.outNeighbors && graph.areOutNeighbors(node, nodeOut))
    ) {
      res.highlighted = true;
      return res;
    }
    if (state.selected[0].suggest && !state.selected[0].suggest.has(node)) {
      res.label = "";
      res.color = "#877";
    }

    return res;
  });

  renderer.setSetting("edgeReducer", (edge, data) => {
    const res: Partial<EdgeDisplayData> = { ...data };

    const currPath = state.paths.length > state.pathIndex ? state.paths[state.pathIndex] : null;
    if (currPath && currPath.has(graph.source(edge)) && currPath.has(graph.target(edge))) {
      res.color = getHeatMapColor(currPath.get(graph.source(edge)));
      res.zIndex = 10;
      return res;
    }

    if (
      (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) ||
      (state.selected[0].suggest &&
        (!state.selected[0].suggest.has(graph.source(edge)) || !state.selected[0].suggest.has(graph.target(edge))))
    ) {
      res.hidden = true;
      return res;
    }

    return res;
  });
}

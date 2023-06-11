import Sigma from "sigma";
import { graph } from "./Graph";
import EdgesFastProgram from "sigma/rendering/webgl/programs/edge.fast";
import { state } from "./State";
import { EdgeDisplayData, NodeDisplayData } from "sigma/types";
import { searchInputs } from "./Search";
import { editor } from "monaco-editor";
import { appendText } from "./Editors";

const container = document.getElementById("sigma-container") as HTMLElement;
export const renderer = new Sigma(graph, container, {
  defaultEdgeType: "edges-fast",
  edgeProgramClasses: {
    // "edges-default": EdgesDefaultProgram,
    "edges-fast": EdgesFastProgram,
  },
});

let scaleMult = 10;
export const downscaleConst = 1;


document.getElementById("inn").onclick = (ev) => {
  const val = (ev.target as HTMLInputElement).checked;
  state.inNeighbors = val;
  // document.getElementById("inContainer").hidden = !val;
  // const ttInn = document.getElementById("ttInn");
  // ttIn.innerHTML = graph.neighbors()
  renderer.refresh();
};

document.getElementById("outn").onclick = (ev) => {
  state.outNeighbors = (ev.target as HTMLInputElement).checked;
  renderer.refresh();
};

document.getElementById("sizeInput").oninput = (e) => {
  try {
    const v = parseFloat((e.target as HTMLInputElement).value);
    if (v == 0) {
      return;
    }
    scaleMult = v;
    renderer.refresh();
  } catch (e) {}
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
    const v = event.node;
    appendText(v, searchInputs[index].getModel());
  };
  renderer.on("clickNode", (e) => {
    // if (searchInputs)
    // searchInputs.forEach((input, i) => {
    //   if (document.activeElement === input) {
    //     clickFunc(e, i);
    //   }
    // });
    clickFunc(e, 0);
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

export const getHeatMapColor = (v: number) => {
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

renderer.setSetting("nodeReducer", (node, data) => {
  const res: Partial<NodeDisplayData> = { ...data };

  res.size = (graph.getNodeAttribute(node, "size") * scaleMult) / 10;

  if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
    res.label = "";
    res.color = "#846464";
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
    res.color = "#846464";
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

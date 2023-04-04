import * as graphology from "graphology";
import Sigma from "sigma";
import { Coordinates, EdgeDisplayData, NodeDisplayData } from "sigma/types";
import chroma from "chroma-js";
import $ from "jquery";
import EdgesDefaultProgram from "sigma/rendering/webgl/programs/edge";
import EdgesFastProgram from "sigma/rendering/webgl/programs/edge.fast";

import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";

Promise.all([
  fetch("./chrome_deps.json")
]).then((rs) => Promise.all(rs.map((r) => r.json()))).then(
  Function.prototype.apply.bind(start, start));


const searchSuggestions = document.getElementById("suggestions") as HTMLDataListElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;


const g_state = {
  edgesRenderer: document.querySelector<HTMLInputElement>('[name="edges-renderer"]:checked')?.value,
};

let DELIMETER = ":";

window.addEventListener('keydown', function (e) {
  if (e.keyCode == 32) {
    e.preventDefault();
    $("#fa2").click();
  }
});
window.scrollTo({
  top: 0
});

function start(dataRaw) {
  DELIMETER = Object.keys(dataRaw)[0].search(DELIMETER) > -1 ? DELIMETER : "/";
  const container = document.getElementById("sigma-container") as HTMLElement;
  const graph = new graphology.DirectedGraph({});

  Object.keys(dataRaw).forEach((rootNode) => {
    const cRoot = chroma.random()._rgb;
    try {
      graph.addNode(rootNode, {
        x: cRoot[0],
        y: cRoot[1],
        size: 20,
        color: chroma.random().hex(),
        label: rootNode.substring(rootNode.lastIndexOf(DELIMETER) + 1),
      });
    } catch (e) { }
    var lines: string[] = dataRaw[rootNode].deps;

    const hierarchy: {
      name: string,
      lvl: number
    }[] = [{
      name: rootNode,
      lvl: -2
    }];
    lines.forEach((line) => {
      const lvl = line.lastIndexOf(" ");

      let l = line.replaceAll(" ", "").replaceAll("...", "");
      try {
        const c = chroma.random()._rgb;
        graph.addNode(l, {
          x: c[0],
          y: c[1],
          size: Math.pow(30 / (lvl + 2), 0.5),
          // size: 4,
          color: chroma.random().hex()
        });
        graph.setNodeAttribute(l, "label", l.substring(l.lastIndexOf(DELIMETER) + 1));
      } catch (err) { }
      try {
        if (hierarchy.length > 0) { graph.addDirectedEdge(l, hierarchy.at(-1).name); }
      } catch (err) { }


      if (hierarchy.length === 0 || lvl > hierarchy.at(-1).lvl) {
        hierarchy.push({
          name: l,
          lvl: lvl
        });
      }

      while (hierarchy.length > 0 && lvl < hierarchy.at(-1).lvl) {
        hierarchy.pop();
      }

    });
  });

  const sensibleSettings = forceAtlas2.inferSettings(graph);
  const layout = new FA2Layout(graph, {
    settings: sensibleSettings,
  });

  const fa2Button = document.getElementById("fa2") as HTMLButtonElement;
  function toggleFA2Layout() {
    if (layout.isRunning()) {
      layout.stop();
      fa2Button.innerHTML = `Start layout ▶`;
    } else {
      layout.start();
      fa2Button.innerHTML = `Stop layout ⏸`;
    }
  }
  fa2Button.addEventListener("click", toggleFA2Layout);


  $("#resetBtn").click(() => {
    graph.forEachNode(node => {
      const c = chroma.random()._rgb;
      graph.setNodeAttribute(node, "x", c[0]);
      graph.setNodeAttribute(node, "y", c[1]);
    });
  });

  layout.start();

  // Create the sigma
  const renderer = new Sigma(graph, container, {
    defaultEdgeType: g_state.edgesRenderer,
    edgeProgramClasses: {
      "edges-default": EdgesDefaultProgram,
      "edges-fast": EdgesFastProgram,
    },
  });

  //
  // Drag'n'drop feature
  // ~~~~~~~~~~~~~~~~~~~
  //

  // State for drag'n'drop
  let draggedNode: string | null = null;
  let isDragging = false;

  // On mouse down on a node
  // - we enable the drag mode
  // - save in the dragged node in the state
  // - highlight the node
  // - disable the camera so its state is not updated
  renderer.on("downNode", (e) => {
    isDragging = true;
    draggedNode = e.node;
    graph.setNodeAttribute(draggedNode, "highlighted", true);
  });

  renderer.on("clickNode", (e) => {
    searchInput.select();
    const v = '"' + e.node + '"';
    searchInput.value = v;
    setSearchQuery(v);
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

  //
  // Create node (and edge) by click
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //

  // When clicking on the stage, we add a new node and connect it to the closest node
  renderer.on("clickStage", ({ event }: { event: { x: number; y: number } }) => {
    // Sigma (ie. graph) and screen (viewport) coordinates are not the same.
    // So we need to translate the screen x & y coordinates to the graph one by calling the sigma helper `viewportToGraph`
    const coordForGraph = renderer.viewportToGraph({ x: event.x, y: event.y });

    // We create a new node

    // const node = {
    // ...coordForGraph,
    // size: 10,
    // color: chroma.random().hex(),
    // };

    // Searching the two closest nodes to auto-create an edge to it

    // const closestNodes = graph
    // .nodes()
    // .map((nodeId) => {
    // const attrs = graph.getNodeAttributes(nodeId);
    // const distance = Math.pow(node.x - attrs.x, 2) + Math.pow(node.y - attrs.y, 2);
    // return { nodeId, distance };
    // })
    // .sort((a, b) => a.distance - b.distance)
    // .slice(0, 2);

    // We register the new node into graphology instance
    // const id = uuid();
    // graph.addNode(id, node);

    // We create the edges
    // closestNodes.forEach((e) => graph.addEdge(id, e.nodeId));
  });

  // $("#stopBtn").click(() => {
  // layoutPaused = !layoutPaused;
  // if (!layoutPaused) {
  // layout.stop();
  // $("#stopBtn").html("▶");
  // } else {
  // layout.start();
  // $("#stopBtn").html("⏸");
  // }
  // });



  interface State {
    hoveredNode?: string;
    searchQuery: string;

    // State derived from query:
    selectedNode?: string;
    suggestions?: Set<string>;

    // State derived from hovered node:
    hoveredNeighbors?: Set<string>;
  }
  const state: State = {
    searchQuery: "",
  };

  // Feed the datalist autocomplete values:
  searchSuggestions.innerHTML = graph
    .nodes()
    .map((node) => `<option value="${graph.getNodeAttribute(node, "label")}"></option>`)
    .join("\n");

  // Actions:
  function setSearchQuery(query: string) {
    state.searchQuery = query;

    if (searchInput.value !== query) searchInput.value = query;

    if (query) {
      const lcQuery = query;
      const suggestions = graph
        .nodes()
        .map((n) => ({
          id: n,
          label: lcQuery.length > 0 && lcQuery[0] === '"' && lcQuery.at(-1) === '"' ?
            '"' + n + '"' :
            n,
        }))
        .filter(({ label }) => label.includes(lcQuery));

      // If we have a single perfect match, them we remove the suggestions, and
      // we consider the user has selected a node through the datalist
      // autocomplete:
      if (suggestions.length === 1 && suggestions[0].label === query) {
        state.selectedNode = suggestions[0].id;
        state.suggestions = undefined;

        // Move the camera to center it on the selected node:
        const nodePosition = renderer.getNodeDisplayData(state.selectedNode) as Coordinates;
        renderer.getCamera().animate(nodePosition, {
          duration: 500,
        });
      }
      // Else, we display the suggestions list:
      else {
        state.selectedNode = undefined;
        state.suggestions = new Set(suggestions.map(({ id }) => id));
      }
    }
    // If the query is empty, then we reset the selectedNode / suggestions state:
    else {
      state.selectedNode = undefined;
      state.suggestions = undefined;
    }

    // Refresh rendering:
    renderer.refresh();
  }
  function setHoveredNode(node?: string) {
    if (node) {
      state.hoveredNode = node;
      state.hoveredNeighbors = new Set(graph.neighbors(node));
    } else {
      state.hoveredNode = undefined;
      state.hoveredNeighbors = undefined;
    }

    // Refresh rendering:
    renderer.refresh();
  }

  // Bind search input interactions:
  searchInput.addEventListener("input", () => {
    setSearchQuery(searchInput.value || "");
  });
  searchInput.addEventListener("blur", () => {
    // setSearchQuery("");
  });

  // Bind graph interactions:
  renderer.on("enterNode", ({ node }) => {
    setHoveredNode(node);
  });
  renderer.on("leaveNode", () => {
    setHoveredNode(undefined);
  });

  // Render nodes accordingly to the internal state:
  // 1. If a node is selected, it is highlighted
  // 2. If there is query, all non-matching nodes are greyed
  // 3. If there is a hovered node, all non-neighbor nodes are greyed
  renderer.setSetting("nodeReducer", (node, data) => {
    const res: Partial<NodeDisplayData> = { ...data };

    if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
      res.label = "";
      res.color = "#f6f6f6";
    }

    if (state.selectedNode === node || graph.areOutNeighbors(node, state.selectedNode)) {
      res.highlighted = true;
    } else if (state.suggestions && !state.suggestions.has(node)) {
      res.label = "";
      res.color = "#f6f6f6";
    }

    return res;
  });

  // Render edges accordingly to the internal state:
  // 1. If a node is hovered, the edge is hidden if it is not connected to the
  // node
  // 2. If there is a query, the edge is only visible if it connects two
  // suggestions
  renderer.setSetting("edgeReducer", (edge, data) => {
    const res: Partial<EdgeDisplayData> = { ...data };

    if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
      res.hidden = true;
    }

    if (state.suggestions && (!state.suggestions.has(graph.source(edge)) || !state.suggestions.has(graph.target(edge)))) {
      res.hidden = true;
    }

    return res;
  });


}

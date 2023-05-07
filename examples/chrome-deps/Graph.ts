import * as graphology from "graphology";
import chroma from "chroma-js";
import { appendText, graphEditor } from "./Editors";
import { v4 as uuidv4 } from 'uuid';

export const graph = new graphology.DirectedGraph({});
import { downscaleConst, renderer } from "./Renderer";

export const object2Graph = async (dataRaw, graph: graphology.DirectedGraph, append = true) => {
  Object.entries(dataRaw).forEach((rootNode, i) => {
    string2Graph(rootNode[0], i, rootNode[1], graph, append);
  });
  document.getElementById("nEdges").innerHTML = graph.edges().length.toString();
};

function polar2Cartesian(angle, distance) {
  var radians = (angle * Math.PI * 2);
  return { x: distance * Math.cos(radians), y:  distance * Math.sin(radians) };
}


let _normalize = 0;

const tree2GraphRecursion = (tree, graph, parentId = null, lvl) => {
  // if (lvl > 2) { return; }
  const nodeId = uuidv4();
  const angle = (tree.location.endLine + tree.location.line) / (2 * _normalize);
  const distance = lvl * 100;
  const coord = polar2Cartesian(angle, distance);
  graph.addNode(
		nodeId,
		{
      ...coord,
			size: (Math.pow(tree.location.endLine - tree.location.line + 1, 0.15)) + 0.5,
			...tree,
			children: undefined,
      label: tree.kind.replace("CursorKind.", ""),
		}
	);

  // If there's a parent, add an edge between the parent and the current node
  if (parentId !== null) {
    graph.addEdge(parentId, nodeId);
  }

  // If the current node has children, recursively process them
  if (Array.isArray(tree.children)) {
    tree.children.forEach(child => tree2GraphRecursion(child, graph, nodeId, lvl + 1));
  }
}

export const tree2Graph = async (tree, graph, refresh = false) => {
  if (refresh) {
    graph.clear();
    _normalize = tree.location.endLine - tree.location.line;
  }
  tree2GraphRecursion(tree, graph, null, 0);
  renderer.refresh();
  return graph;
}

export const string2Graph = (rootNode, i, dataRaw, graph, append = true) => {
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
      for (const node of graph.filterNodes((node) => pattern.test(node))) {
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

const someEdgeI = (e) => true;

export const forEachLine = (line, rootNode, hierarchy, append) => {
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
      appendText(l + "\n", graphEditor.getModel());
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

export const graph2Object = (graph: graphology.DirectedGraph) => {
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


const line2diff = async (n, graph, editor = graphEditor) => {
  let nodeObj = {};
  nodeObj[n] = { deps: graph.neighbors(n) };
  const model = editor.getModel();
  const textToAppend = JSON.stringify(nodeObj, null, 2);
  appendText(textToAppend, model);
};

export const graph2diff = async (graph: graphology.DirectedGraph) => {
  graph.nodes().forEach((n) => {
    line2diff(n, graph);
  });
};

export const graph2diffFull = async (graph: graphology.DirectedGraph) => {
  const v = await graph2JSON(graph);
  appendText(v, graphEditor.getModel());
};


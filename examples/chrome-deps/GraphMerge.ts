/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as graphology from "graphology";
import * as immutable from "immutable";
import * as chroma from "chroma-js";
import { graph } from "./Graph";
import { TwoWayMultiMap } from "./TwoWayMultiMap";
import * as Util from "./Util";
import * as Equality from "./Equality";

const handleQueue = (
  graph: graphology.DirectedGraph,
  queue: string[],
  visited: Set<string>,
  node: string | null,
  color: string,
  mergedGraph: graphology.DirectedGraph,
  props: object | undefined = {},
  mergeOrNot: boolean = true,
) => {
  if (node) {
    if (mergeOrNot) {
      mergedGraph.mergeNode(node, { color, ...props });
    }
    // if (!mergedGraph.hasNodeAttribute(node, "x")) {
    //   const c = chroma.random()._rgb;
    //   mergedGraph.setNodeAttribute(node, "x", c[0]);
    //   mergedGraph.setNodeAttribute(node, "y", c[1]);
    //   mergedGraph.setNodeAttribute(node, "size", 2);
    // }
    const comparator = (a: string, b: string): number =>
      graph.getNodeAttribute(a, "offset") - graph.getNodeAttribute(b, "offset");
    const children = graph.outNeighbors(node).sort(comparator);
    for (const child of children) {
      if (!visited.has(child)) {
        queue.push(child);
        visited.add(child);
      }
    }
  }
};

interface NodeAttributes {
  level?: number;
  kind?: string;
  order?: number;
  color?: string;
  spelling?: string;
  location?: object;
  location2?: object;
}

export function getNodeIndex(graph: graphology.DirectedGraph): Record<string, any> {
  const nodeIndex: Record<string, any> = {};

  // Initialize nodeIndex
  graph.forEachNode((node) => {
    const nodeData: NodeAttributes = graph.getNodeAttributes(node);
    const level = nodeData && nodeData.level !== undefined ? nodeData.level : -1;
    const spelling = nodeData && nodeData.spelling !== undefined ? nodeData.spelling : "";
    const kind = (nodeData && nodeData.kind !== undefined ? nodeData.kind : "") + spelling;
    const order = nodeData && nodeData.order !== undefined ? nodeData.order : -1;

    nodeIndex[node] = { level, kind, order };
  });

  // Group nodes by level, kind, and order
  const result: Record<number, Record<string, Record<number, string[]>>> = {};
  Object.entries(nodeIndex).forEach(([node, { level, kind, order }]) => {
    if (!result[level]) {
      result[level] = {};
    }

    if (!result[level][kind]) {
      result[level][kind] = {};
    }

    if (!result[level][kind][order]) {
      result[level][kind][order] = [];
    }

    result[level][kind][order].push(node);
  });

  return result;
}

export async function mergeGraphsByAttrs(
  graph1: graphology.DirectedGraph,
  graph2: graphology.DirectedGraph,
  mergedGraph: graphology.DirectedGraph,
) {
  const nodeIndex1 = getNodeIndex(graph1);
  const nodeIndex2 = getNodeIndex(graph2);
  // const mappings: Map<string, string> = new Map();
  const mappings = new TwoWayMultiMap();

  // const mergedGraph = new graphology.DirectedGraph();

  // Traverse nodes in graph1
  const ni1 = Object.entries(nodeIndex1);
  for (const [level, levelNodes1] of Object.entries(nodeIndex1)) {
    const levelNum = parseInt(level, 10);
    const li1 = Object.entries(levelNodes1);
    for (const [kind, kindNodes1] of Object.entries(levelNodes1)) {
      const ki1 =  Object.entries(kindNodes1);
      for (const [order, nodes1] of Object.entries(kindNodes1)) {
        const orderNum = parseInt(order, 10);

        const nodes2 = nodeIndex2[level]?.[kind]?.[order] || [];

        // Add unmatched nodes from graph1 to graph2
        // const unmatchedNodes = nodes1.filter((node1) => !nodes2.includes(node1));
        const unmatchedNodes = nodes1.filter((node1) => {
          // let n2 = nodes2;
          // while (!n2.includes(root2)) {

          // }
          if (nodes2.length === 0) {
            // mappings.set(node1, "");
            return true;
          }

          for (const n2 of nodes2) {
            // if (!Equality.compareNodeOrders(graph1, graph2, node1, n2)) {
            //   continue;
            // }

            mappings.set(n2, node1);
            mergedGraph.setNodeAttribute(n2, "location2", graph1.getNodeAttribute(node1, "location"));
          }
          if (!mappings.hasValue(node1)) {
            return true;
          }
          return false;
        });

        unmatchedNodes.forEach((unmatchedNode) => {
          const attributes: NodeAttributes = {
            ...graph1.getNodeAttributes(unmatchedNode),
            color: "#0f0",
          };
          attributes.location2 = attributes.location;

          for (
            let higherOrder = orderNum;
            higherOrder <= Object.keys(nodeIndex2[level]?.[kind] || {}).length;
            higherOrder++
          ) {
            const higherOrderNodes = nodeIndex2[level]?.[kind]?.[higherOrder];
            if (higherOrderNodes) {
              higherOrderNodes.forEach((higherOrderNode) => {
                mergedGraph.setNodeAttribute(higherOrderNode, "order", higherOrder + 1);
              });
            }
          }

          const mergedNode = mergedGraph.addNode(unmatchedNode, attributes);
          mergedGraph.removeNodeAttribute(unmatchedNode, "location");
          mappings.set(unmatchedNode, unmatchedNode);

          // console.log(graph1.inNeighbors(unmatchedNode).length);
          graph1.forEachInNeighbor(unmatchedNode, (node) => {
            const mapping = mappings.get(node);
            console.log(mapping.size);
            console.log("parent DFS: ", graph1.getNodeAttributes(node).dfsOrder);
            // console.log("mergeGraphByAttrs::\n");
            // console.log("")
            // Util.logFileLineFunction();
            // console.log(mapping.forEach)
            mapping.forEach(m => {
              console.log("dfsOrd: ", graph2.getNodeAttributes(m).dfsOrder);
            })
            if (!mapping) {
              return;
            }
            // const inN = graph1.inNeighbors(node);
            // console.log("INN SIZE " + inN.length);
            // const p1 = inN[0];
            mapping.forEach(mapp => {
              // if (!mergedGraph.hasEdge(unmatchedNode, mapp)) {
              //   mergedGraph.addEdge(unmatchedNode, mapp);
              //   return;
              // }
              // const p2 = graph2.inNeighbors(mapp);
              // console.log("P2 size "+ p2.length);
              // if (!p2.includes(p1) && !mappings.includes(p2, p1)) {
              //   return;
              
              // console.log(graph2.inNeighbors(mapp).length);
              console.log("sim score: ", Equality.similarityScore(graph1, graph2, node, mapp as string));
              console.log("child score: ", Equality.similarityScore(graph1, graph2, unmatchedNode, mapp as string));

              // }
              // if(Equality.compareNodeOrders(graph1, graph2, node, mapp)) {
              //   return;
              // }

              mergedGraph.mergeEdge(unmatchedNode, mapp, {});
              return;
            })
          });
        });
      }
    }
  }

  for (const n2 of graph2.nodes()) {
    if (!mappings.hasKey(n2)) {
      mergedGraph.mergeNode(n2, { color: "#f00" });
    }
  }

  // return mergedGraph;
}

/**
 * Merges two graphology DirectedGraphs into one using BFS
 * @param {graphology.DirectedGraph} graph1 First graph to merge
 * @param {graphology.DirectedGraph} graph2 Second graph to merge
 * @param {string} root1 Root node ID of the first graph
 * @param {string} root2 Root node ID of the second graph
//  * @param {graphology.DirectedGraph} mergedGraph Merged graph
 */
export const mergeGraphs = (
  graph1: graphology.DirectedGraph,
  graph2: graphology.DirectedGraph,
  root1: string,
  root2: string,
  // mergedGraph: graphology.DirectedGraph,
) => {
  const queue1: string[] = [root1];
  const queue2: string[] = [root2];
  const visited1 = new Set<string>();
  const visited2 = new Set<string>();
  let node1 = null;
  let node2 = null;

  const equalityComparator = (a: string, b: string): boolean =>
    graph1.getNodeAttribute(a, "kind") === graph2.getNodeAttribute(b, "kind");

  while (queue1.length > 0 || queue2.length > 0) {
    if (node1 === null) {
      node1 = queue1.length > 0 ? queue1.shift()! : null;
    }
    if (node2 === null) {
      node2 = queue2.length > 0 ? queue2.shift()! : null;
    }
    if (node1 && node2 && equalityComparator(node1, node2)) {
      // graph1.mergeNode(node1, { color: "#555" });
      handleQueue(graph1, queue1, visited1, node1, "#555", graph1);
      handleQueue(graph2, queue2, visited2, node2, "#555", graph1, {}, false);
      node1 = null;
      node2 = null;
    } else if (
      !node2 ||
      (node1 && graph1.getNodeAttribute(node1, "offset") <= graph2.getNodeAttribute(node2, "offset"))
    ) {
      handleQueue(graph1, queue1, visited1, node1, "#f00", graph1);
      node1 = null;
    } else if (
      !node1
      //|| (node2 && graph2.getNodeAttribute(node2, "offset") < graph1.getNodeAttribute(node1, "offset"))
    ) {
      handleQueue(graph2, queue2, visited2, node2, "#0f0", graph1, graph2.getNodeAttributes(node2));
      node2 = null;
    }
  }
};

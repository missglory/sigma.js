import * as graphology from "graphology";

export interface NodeAttributes {
  level?: number;
  kind?: string;
  order?: number;
  color?: string;
  spelling?: string;
  location?: object;
  location2?: object;
  nodeType?: string;
}

type NodeKey = string;

export function compareNodeOrders(
  graph1: graphology.DirectedGraph,
  graph2: graphology.DirectedGraph,
  n1: NodeKey,
  n2: NodeKey,
): boolean {
  let node1 = n1;
  let node2 = n2;
  while (true) {
    let inNeighbors1 = graph1.inNeighbors(node1);
    let inNeighbors2 = graph2.inNeighbors(node2);

    if (inNeighbors1.length === 0 && inNeighbors2.length === 0) {
      return true;
    }
    // Check that each node has exactly one parent
    if (inNeighbors1.length !== 1 || inNeighbors2.length !== 1) {
      // console.log("L: ", inNeighbors1.length, inNeighbors2.length);
      return true;
    }

    node1 = inNeighbors1[0];
    node2 = inNeighbors2[0];

    let nodeAttributes1 = graph1.getNodeAttributes(node1);
    let nodeAttributes2 = graph2.getNodeAttributes(node2);

    // Check the 'order' property
    if (!equal(nodeAttributes1, nodeAttributes2)) {
      return false;
    }
  }

  return true;
}

export function similarityScore(
  graph1: graphology.DirectedGraph,
  graph2: graphology.DirectedGraph,
  node1: NodeKey,
  node2: NodeKey,
): number {
  let score = 0;

  while (true) {
    let inNeighbors1 = graph1.inNeighbors(node1);
    let inNeighbors2 = graph2.inNeighbors(node2);

    // Check that each node has exactly one parent
    if (inNeighbors1.length !== 1 || inNeighbors2.length !== 1) {
      break;
    }

    node1 = inNeighbors1[0];
    node2 = inNeighbors2[0];

    let nodeAttributes1 = graph1.getNodeAttributes(node1);
    let nodeAttributes2 = graph2.getNodeAttributes(node2);

    // Check the 'order' property and increment score if equal
    if (equal(nodeAttributes1, nodeAttributes2)) {
      score++;
    } else {
      break;
    }
  }

  return score;
}

export function signature(nodeData: NodeAttributes) {
  const spelling = nodeData && nodeData.spelling !== undefined ? nodeData.spelling : "";
  // const nodeType = nodeData && nodeData.nodeType !== undefined ? nodeData.nodeType : nodeData.nodeType.includes("lambda") ? "lambda" : "";
  const nodeType =
    nodeData && nodeData.nodeType && nodeData.nodeType.includes("lambda")
      ? "lambda"
      : nodeData.nodeType !== undefined
      ? nodeData.nodeType
      : "";
  return (nodeData && nodeData.kind !== undefined ? nodeData.kind : "") + "-" + spelling + "-" + nodeType;
}

export function equal(nodeAttributes1: NodeAttributes, nodeAttributes2: NodeAttributes) {
  return (
    // nodeAttributes1.order === nodeAttributes2.order &&
    nodeAttributes1.level === nodeAttributes2.level &&
    signature(nodeAttributes1) === signature(nodeAttributes2)
  );
}

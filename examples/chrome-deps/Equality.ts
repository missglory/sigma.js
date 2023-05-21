import * as graphology from 'graphology';

type Node = {
  order: number,
  // Add other properties as needed
}

type NodeKey = string;

export function compareNodeOrders(graph1: graphology.DirectedGraph, graph2: graphology.DirectedGraph, n1: NodeKey, n2: NodeKey): boolean {
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
    if (nodeAttributes1.order !== nodeAttributes2.order) {
      return false;
    }
  }

  return true;
}


export function similarityScore(graph1: graphology.DirectedGraph, graph2: graphology.DirectedGraph, node1: NodeKey, node2: NodeKey): number {
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
    if (nodeAttributes1.order === nodeAttributes2.order && nodeAttributes1.kind === nodeAttributes2.kind && nodeAttributes1.level === nodeAttributes2.level) {
      score++;
    } else {
			break;
		}
  }

  return score;
}
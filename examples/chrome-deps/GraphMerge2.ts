import { dfsFromNode } from 'graphology-traversal';
import Graph from 'graphology';

function featureSet2Id (node, graph) {
	const attrs = graph.getNodeAttributes(node);
	return `${attrs.level}-${attrs.dfsOrder}-${attrs.type}`;
}

export async function merge(graph1: Graph, graph2: Graph, root: string) {
  // Create a mapping from level-order-type to node ID for the second graph
  const nodeMap2 = new Map<string, string>();
  graph2.forEachNode((node, attributes) => {
    const key = `${attributes.level}-${attributes.dfsOrder}-${attributes.type}`;
    nodeMap2.set(key, node);
  });

	// let bfs_order = 0;
  // Perform BFS on the first graph
	let added_nodes = 0;
  dfsFromNode(graph1, root, (node: string, attr: any, depth: number) => {
    const key = `${attr.level}-${attr.dfsOrder - added_nodes}-${attr.type}`;

    // If no match found in graph2, insert the node from graph1 to graph2
    if (!nodeMap2.has(key)) {
      graph2.addNode(node, {
				...attr,
				// bfsOrder: bfs_order,
				color: "#f00",
				presence: 0
			});
			nodeMap2.set(key, node);
      added_nodes++;
      
      // Increase order of all nodes in the same level and with order > current order

      // graph2.forEachNode((node2, attr2) => {
      //   if (attr2.level === attr.level && attr2.dfsOrder > attr.dfsOrder) {
      //     attr2.dfsOrder++;
      //     graph2.setNodeAttributes(node2, attr2);
      //   }
      // });

      // Add an edge to its parent if possible
      const p1 = graph1.inNeighbors(node)[0];
			const p2 = nodeMap2.get(featureSet2Id(p1, graph1));
      if (p1 && graph2.hasNode(p2)) {
        graph2.addEdgeWithKey(node, p2, node);
      }
    } else {
			graph2.setNodeAttribute(nodeMap2.get(key), "color", "#fff");
			graph2.setNodeAttribute(nodeMap2.get(key), "presence", 2);
		}
  });

  // Traverse children of each node in graph2 in ascending order
  graph2.forEachNode((node, attr) => {
		if (attr.presence === undefined) {
			graph2.setNodeAttribute(node, "presence", 1);
			graph2.setNodeAttribute(node, "color", "#0f0");
		}
    // const children = graph2.outNeighbors(node);
    // children.sort((a, b) => graph2.getNodeAttributes(a).order - graph2.getNodeAttributes(b).order);
    // for (let child of children) {
    //   // Perform operation on each child node
    // }
  });
}

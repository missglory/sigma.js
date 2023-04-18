import * as graphology from "graphology";

export type NodeKey = string;
export const reachableCounts = new Map<NodeKey, number>();

// export function countReachableNodes(graph: graphology.DirectedGraph): Map<NodeKey, number> {

// 	// const nodePredicate = (node: NodeKey) => {
// 	// 	if (node.)
// 	// }

//   graph.forEachNode((node) => {
// 		let count = 0;
// 		const visited = new Set<NodeKey>();
// 		assignReachableCounts(graph);
// 		reachableCounts.clear();

//     function dfs(node: NodeKey) {
//       visited.add(node);
//       count++;

//       graph.forEachOutNeighbor(node, (neighbor) => {
//         if (!visited.has(neighbor)) {
//           if (!reachableCounts.has(neighbor)) {
//             dfs(neighbor);
//           } else {
//             count += reachableCounts.get(neighbor)!;
//           }
//         }
//       });

// 			if (reachableCounts.has(node)) {
// 				alert("eror");
// 			}
//       reachableCounts.set(node, count);
//     }

//     if (!reachableCounts.has(node)) {
//       dfs(node);
//     }
//   });

//   return reachableCounts;
// }

// export function countReachableNodes(graph: graphology.DirectedGraph): Map<NodeKey, number> {
//   const reachableCounts = new Map<NodeKey, number>();

//   graph.forEachNode((node) => {
//     const visited = new Set<NodeKey>();
//     let count = 0;

//     function dfs(node: NodeKey) {
//       visited.add(node);
//       count++;

//       graph.forEachOutNeighbor(node, (neighbor) => {
//         if (!visited.has(neighbor)) {
//           dfs(neighbor);
//         }
//       });
//     }

//     dfs(node);

//     reachableCounts.set(node, count);
//   });

//   return reachableCounts;
// }


// export function countReachableNodes(graph: graphology.DirectedGraph): Map<NodeKey, number> {
//   const reachableCounts = new Map<NodeKey, number>();

//   graph.forEachNode((node) => {
//     const visited = new Set<NodeKey>();
//     let count = 0;

//     function dfs(node: NodeKey) {
//       visited.add(node);
//       count++;

//       graph.forEachOutNeighbor(node, (neighbor) => {
//         if (!visited.has(neighbor)) {
//           if (!reachableCounts.has(neighbor)) {
//             dfs(neighbor);
//           } else {
//             count += reachableCounts.get(neighbor)!;
//           }
//         }
//       });
//     }

//     dfs(node);

//     reachableCounts.set(node, count);
//   });

//   return reachableCounts;
// }

// export function countReachableNodes(graph: graphology.DirectedGraph): Map<NodeKey, number> {
//   // const reachableCounts = new Map<NodeKey, number>();

//   graph.forEachNode((node) => {
//     const visited = new Set<NodeKey>([node]);
//     const stack: NodeKey[] = [node];
//     let count = 0;

//     while (stack.length > 0) {
//       const currentNode = stack.pop()!;
//       graph.forEachOutNeighbor(currentNode, (neighbor) => {
//         if (!visited.has(neighbor)) {
//           visited.add(neighbor);
//           stack.push(neighbor);
//           count++;
//         }
//       });
//     }

//     reachableCounts.set(node, count);
//   });

// 	// console.log(reachableCounts)
//   return reachableCounts;
// }


export function countReachableNodes(graph) {
	graph.forEachNode((node) => {
		reachableCounts.set(node, getReachableNodes(graph, node, true).size);
	});
	return reachableCounts;
}

export function fillEditorWithLines(lines: string[], editor): void {
  // const editor = monaco.editor.getModels()[0]; // get the first editor instance
  editor.getModel().setValue(lines.join('\n'));
}


export function assignReachableCounts(graph: graphology.DirectedGraph) {
	for (const [k, v] of reachableCounts.entries()) {
		graph.setNodeAttribute(k, "reachable", v);
		graph.updateNodeAttribute(k, 'label', n => n + "_" + v);
	}
}

export async function assignReachableCountsAsync(graph: graphology.DirectedGraph, reachableCounts: Map<NodeKey, number>) {
	for (const [k, v] of reachableCounts.entries()) {
		graph.setNodeAttribute(k, "reachable", v);
		// graph.updateNodeAttribute(k, 'label', n => n + "_" + v);
	}
}

export async function reachableCounts2Editor(graph: graphology.DirectedGraph, editor) {
	fillEditorWithLines(
		graph.nodes()
		.map(n => { return {
			n: n,
			reachable: graph.getNodeAttribute(n, "reachable") as number
		}})
		.sort((a, b) => 
			{ return a.reachable > b.reachable ? 1 : -1 }
		)
		.map (a => a.reachable.toString() + ": " + a.n),
		editor
	);
}


export function getReachableNodes(graph: graphology.DirectedGraph, source: NodeKey, inFlag = true): Set<NodeKey> {
  const reachableNodes = new Set<NodeKey>();
  const visited = new Set<NodeKey>();

  function dfs(node: NodeKey) {
    visited.add(node);
    reachableNodes.add(node);

		if (inFlag) {
			graph.forEachInNeighbor(node, (neighbor) => {
				if (!visited.has(neighbor)) {
					dfs(neighbor);
				}
			});
		} else {
			graph.forEachOutNeighbor(node, (neighbor) => {
				if (!visited.has(neighbor)) {
					dfs(neighbor);
				}
			});
		}
  }

  dfs(source);

  return reachableNodes;
}
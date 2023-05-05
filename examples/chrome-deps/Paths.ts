import { allSimplePaths } from "graphology-simple-path";
import { state } from "./State";
import { getHeatMapColor, renderer } from "./Renderer";
import { graph } from "./Graph";

export async function assignPath(node1, node2) {
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
import chroma from "chroma-js";

import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";
import * as Surreal from './Surreal';
import { graph } from "./Graph";
import { downscaleConst, getHeatMapColor, renderer } from "./Renderer";
import { graph2Object, graph2diffFull, object2Graph, tree2Graph } from "./Graph";
import { searchInputs, setSearchQuery } from "./Search";
import { diffEditor } from "./Editors";
import { state } from "./State";



Promise.all([fetch("./chrome_deps.json")])
  .then((rs) =>
    Promise.all(
      rs.map((r) => {
        return r.json();
      }),
    ),
  )
  .then(
    Function.prototype.apply.bind(start, start),
  );

const searchSuggestions = document.getElementById("suggestions") as HTMLDataListElement;


const layers = new Set([0]);


let ctrlPressed = false;
window.addEventListener("keydown", (e) => {
  if (e.keyCode == 32 && e.ctrlKey) {
    e.preventDefault();
    document.getElementById("fa2").dispatchEvent(new Event("click"));
  }
  if (e.keyCode == 17) {
    ctrlPressed = true;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.keyCode == 17) {
    ctrlPressed = false;
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
  const vals = searchInputs.map((input) => input.getModel().getValue());
  searchInputs.forEach((input, index) => {
    input.getModel().setValue(vals[(index + 1) % vals.length]);
    // input.dispatchEvent(new Event("input"));
  });
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


Surreal.surrealConnect();

export async function start(dataRaw, append = true, refresh = false) {
  // object2Graph(dataRaw, graph, append);
  tree2Graph(dataRaw, graph, refresh);
  graph2diffFull(graph);

  // ReachableCounts.reachableCounts.clear();
  // ReachableCounts.countReachableNodes(graph)
  // ReachableCounts.assignReachableCounts(graph);
  // // .assignReachableCounts(graph);
  // ReachableCounts.reachableCounts2Editor(graph, sortEditor);

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


  // const scaryFunction = (node) => {
  //   const boundarySet = new Set([node]);
  //   const layers = [new Set(), new Set(), new Set()];
  //   let inSet = new Set([node]);
  //   let outSet = new Set();

  //   for (let i = 0; i < 3; i++) {
  //     inSet.forEach((val) => {
  //       graph.forEachInNeighbor(val, (neighbor) => {
  //         if (boundarySet.has(neighbor)) {
  //         } else {
  //           boundarySet.add(neighbor);
  //           outSet.add(neighbor);
  //         }
  //       });
  //     });
  //     inSet = new Set(outSet);
  //     layers[i] = outSet;
  //     outSet = new Set();
  //   }
  //   return layers;
  // };

searchInputs.forEach((searchInput, index) => {
  searchInput.onDidChangeModelContent((e) => {
    setSearchQuery(searchInput.getModel().getValue() || "", index);
    const tt = document.getElementById("searchTT" + index.toString());
    const clrStr = state.selected[index].selected !== undefined ? "rgb(128,255,220)" : "#fff";
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
}

import chroma from "chroma-js";

import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";
import * as Surreal from "./Surreal";
import { downscaleConst, getHeatMapColor, renderer } from "./Renderer";
import * as Graph from "./Graph";
import { searchInputs, setSearchQuery } from "./Search";
import * as Editors from "./Editors";
import { state } from "./State";
import { fileButton } from "./LoadFile";
import * as Plotly from "./Plotly";
import * as GraphMerge from "./GraphMerge";
import * as GraphMerge2 from "./GraphMerge2";
// import GoldenLayout, {ContentItem} from 'golden-layout';
import {
    ComponentContainer,
    ComponentItemConfig,
    ContentItem,
    EventEmitter,
    GoldenLayout,
    JsonValue,
    LayoutConfig,
    LogicalZIndex,
    ResolvedComponentItemConfig,
    ResolvedLayoutConfig,
    Stack
} from "golden-layout";


// Promise.all([fetch("./chrome_deps.json")])
//   .then((rs) =>
//     Promise.all(
//       rs.map((r) => {
//         return r.json();
//       }),
//     ),
//   )
//   .then(
//     Function.prototype.apply.bind(start, start),
//   );

fileButton.dispatchEvent(new Event("click"));

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

// const appendButton = document.getElementById("appendButton") as HTMLButtonElement;
// appendButton.onclick = (e) => {
//   const v = diffEditor.getValue();
//   try {
//     const obj = JSON.parse(v);
//     start(obj);
//   } catch (e) {
//     alert("Invalid JSON");
//   }
// };

const subtractButton = document.getElementById("subtractButton") as HTMLButtonElement;
subtractButton.onclick = (e) => {
  const v = Editors.graphEditor.getValue();
  const cur = Graph.graph2Object(Graph.graph);
  // let obj;
  console.log(cur);
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
    start(JSON.parse(v), {}, false);
  } catch (e) {
    // alert("JSON error");
    console.log("JSON error");
  }
};

const cutButton = document.getElementById("cutButton") as HTMLButtonElement;
cutButton.onclick = (e) => {
  const v = searchInputs[0].getValue();
  const sel = state.selected[0];
  const suggests = sel === undefined || sel.suggest === undefined ? [] : Array.from(sel.suggest);
  if (sel && sel.selected) {
    Graph.dropNodePreservePaths(Graph.graph, sel.selected);
  } else if (suggests && suggests.length > 0) {
    for (const s of suggests) {
      Graph.dropNodePreservePaths(Graph.graph, s);
    }
  }
  Graph.graph2diffFull(Graph.graph);
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
  Graph.graph.forEachNode((node) => {
    const c = chroma.random()._rgb;
    Graph.graph.setNodeAttribute(node, "x", c[0] * downscaleConst);
    Graph.graph.setNodeAttribute(node, "y", c[1] * downscaleConst);
  });
};

document.getElementById("reroute").onclick = (ev) => {
  const vals = searchInputs.map((input) => input.getModel().getValue());
  searchInputs.forEach((input, index) => {
    Editors.appendText(vals[(index + 1) % vals.length], input.getModel());
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

document.getElementById("plotButton").addEventListener("click", (e) => {
  // console.log("tst")
  // document.getElementById("sigma-container").style.display = "none";
  // document.getElementById("plot").style.display = "block";
  Plotly.drawHistogram();
});

document.getElementById("plotButton").dispatchEvent(new Event("click"));

Surreal.surrealConnect();

//css
// require('bootstrap/dist/css/bootstrap.min.css');
// require('golden-layout/src/css/goldenlayout-base.css');
// require('tom-select/dist/css/tom-select.bootstrap4.css');
// require('./colours.scss');
// require('./styles/explorer.scss');

// const config = {
//   content: [{
//     type: 'stack',
//     content: [{
//       type: 'component',
//       componentName: 'example',
//       componentState: { text: 'Hello, world!' }
//     }]
//   }]
// };

// // const testGL = 
// function handleBindComponentEvent(container: ComponentContainer, itemConfig: ResolvedComponentItemConfig): ComponentContainer.BindableComponent {
//         const componentTypeName = ResolvedComponentItemConfig.resolveComponentTypeName(itemConfig);
//         if (componentTypeName === undefined) {
//             throw new Error('handleBindComponentEvent: Undefined componentTypeName');
//         }
//         const component = this.createComponent(container, componentTypeName, itemConfig.componentState, this._useVirtualEventBinding);
//         this._boundComponentMap.set(container, component);

// const myLayout = new GoldenLayout(config, "goldenLayout");


const asyncStartBlock = async (dataRaw, dataDiff, refresh) => {
  Graph.tree2Graph(dataRaw, Graph.graph, refresh, Graph.graphRoots);
  if (dataDiff) {
    Graph.tree2Graph(dataDiff, Graph.diffGraph, refresh, Graph.diffGraphRoots);
    await GraphMerge.mergeGraphsByAttrs(
      Graph.diffGraph,
      Graph.graph,
      Graph.graph,
      // Graph.graphRoots[0],
      // Graph.diffGraphRoots[0],
      // Graph.graph,
    );
  }
};

export async function start(dataRaw, dataDiff, append = true, refresh = false) {
  // object2Graph(dataRaw, graph, append);
  // await GraphMerge.mergeGraphsByAttrs(
  //   Graph.diffGraph,
  //   Graph.graph,
  //   Graph.graph
  //   // Graph.graphRoots[0],
  //   // Graph.diffGraphRoots[0],
  //   // Graph.graph,
  // );

  // GraphMerge2.merge(Graph.diffGraph, Graph.graph, Graph.diffGraphRoots[0]);

  // Graph.graph = mergedGraph;
  // ReachableCounts.reachableCounts.clear();
  // ReachableCounts.countReachableNodes(graph)
  // ReachableCounts.assignReachableCounts(graph);
  // // .assignReachableCounts(graph);
  // ReachableCounts.reachableCounts2Editor(graph, sortEditor);

  if (append) {
    await asyncStartBlock(dataRaw, dataDiff, refresh);
    // Graph.graph2diffFull(Graph.graph);

    const isRunning = layout?.isRunning() ?? true;
    layout?.kill();
    const v = parseFloat(document.getElementById("layoutInput")["value"]);
    const sensibleSettings = Object.assign(
      forceAtlas2.inferSettings(Graph.graph),
      // { gravity: 0.1 }
      { gravity: v ?? 0.1 },
      // {}
    );
    layout = new FA2Layout(Graph.graph, {
      settings: sensibleSettings,
    });
    if (isRunning) {
      layout.start();
    }
  } else {
    Graph.object2Graph(dataRaw, Graph.graph, false);
    Graph.graph2diffFull(Graph.graph);
  }
  fa2Button.onclick = toggleFA2Layout;

  document.getElementById("layoutInput").oninput = (e) => {
    try {
      const v = parseFloat((e.target as HTMLInputElement).value);
      const sensibleSettings = Object.assign(
        forceAtlas2.inferSettings(Graph.graph),
        // { gravity: 0.1 }
        { gravity: v ?? 0.1 },
        // {}
      );
      layout?.kill();
      layout = new FA2Layout(Graph.graph, {
        settings: sensibleSettings,
      });
      // if (v == 0) {
      //   return;
      // }
      // scaleMult = v;
      // renderer.refresh();
      // if (state.
      layout.start();
      renderer.refresh();
    } catch (e) {}
  };

  document.getElementById("inferInput").oninput = (e) => {
    try {
      const v = Math.max(
        0,
        parseInt((e.target as HTMLInputElement).value === "" ? "0" : (e.target as HTMLInputElement).value) ?? 0,
      );
      const inferred = forceAtlas2.inferSettings(v);
      const isRunning = layout.isRunning();
      layout?.kill();
      layout = new FA2Layout(Graph.graph, {
        settings: inferred,
      });
      // if (v == 0) {
      //   return;
      // }
      // scaleMult = v;
      // renderer.refresh();
      // if (state.
      if (isRunning) {
        layout.start();
      }
      renderer.refresh();
    } catch (e) {}
  };

  // Feed the datalist autocomplete values:
  searchSuggestions.innerHTML = Graph.graph
    .nodes()
    .map((node) => `<option value="${Graph.graph.getNodeAttribute(node, "label")}"></option>`)
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

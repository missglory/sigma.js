import { editor } from "monaco-editor";
import * as ReachableCounts from './ReachableCounts';
import { state } from "./State";
import { appendText } from "./Editors";
import { graph } from "./Graph";

export const reachableEditor = editor.create(document.getElementById("reachableContainer"), {
  language: "json",
  automaticLayout: true,
  renderValidationDecorations: "on",
  fontSize: 9,
  wordWrap: "on",
  tabSize: 1,
});

let reachableInOut = "In";
document.getElementById("reachableInOutButton").onclick = (e) => {
  const html = (e.target as HTMLElement).innerHTML;
  reachableInOut = html;
  if (html === "In") {
    (e.target as HTMLElement).innerHTML = "Out";
  } else {
    (e.target as HTMLElement).innerHTML = "In";
  }
}

document.getElementById("reachableGetButton").onclick = (e) => {
  if (state.selected[0].selected === undefined) {
    alert("No selected 1st");
    return;
  }
  const rs = ReachableCounts.getReachableNodes(graph, state.selected[0].selected, reachableInOut === "In");
  appendText(Array.from(rs).join('\n'), reachableEditor.getModel());
}
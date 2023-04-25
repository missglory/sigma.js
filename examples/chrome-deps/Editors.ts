import { editor } from "monaco-editor";

export const diffEditor = editor.create(document.getElementById("diffContainer"), {
  language: "json",
  automaticLayout: true,
  // renderValidationDecorations: "on"
  fontSize: 9,
  wordWrap: "on",
  tabSize: 1,
});
export let editorWW = true;

export const nameEditor = editor.create(document.getElementById("nameContainer"), {
  language: "json",
  automaticLayout: true,
  // renderValidationDecorations: "on"
  fontSize: 9,
  wordWrap: "on",
  tabSize: 1,
});

export const sortEditor = editor.create(document.getElementById("sortContainer"), {
  language: "json",
  automaticLayout: true,
  formatOnType: true,
  // renderValidationDecorations: "on"
  fontSize: 9,
  wordWrap: "on",
  tabSize: 1,
});

export const reachableEditor = editor.create(document.getElementById("reachableContainer"), {
  language: "json",
  automaticLayout: true,
  renderValidationDecorations: "on",
  fontSize: 9,
  wordWrap: "on",
  tabSize: 1,
});

document.getElementById("wwButton").onclick = (e) => {
  editorWW = !editorWW;

  for (let edi of document.getElementsByClassName("editor")) {
    (edi as any).updateOptions({
      wordWrap: editorWW ? "on" : "off",
    });
  }
};

export function appendText(text, model) {
  const range = model.getFullModelRange();
  const op = {
    identifier: { major: 1, minor: 1 },
    range: range,
    text: "\n" + text,
    forceMoveMarkers: true,
  };
  model.pushEditOperations([], [op], null);
}

//////////////////////////////////////////////////////

import * as ReachableCounts from "./ReachableCounts";
import { state } from "./State";
import { graph } from "./Graph";

let reachableInOut = "In";
document.getElementById("reachableInOutButton").onclick = (e) => {
  const html = (e.target as HTMLElement).innerHTML;
  reachableInOut = html;
  if (html === "In") {
    (e.target as HTMLElement).innerHTML = "Out";
  } else {
    (e.target as HTMLElement).innerHTML = "In";
  }
};

document.getElementById("reachableGetButton").onclick = (e) => {
  if (state.selected[0].selected === undefined) {
    alert("No selected 1st");
    return;
  }
  const rs = ReachableCounts.getReachableNodes(graph, state.selected[0].selected, reachableInOut === "In");
  appendText(Array.from(rs).join("\n"), reachableEditor.getModel());
};

/////////////////////////////////////////////////////////////

// const themeData = {
//   base: "vs-dark",
//   inherit: true,
//   rules: [
//     {
//       background: "282a36",
//       token: "",
//     },
//     {
//       foreground: "6272a4",
//       token: "comment",
//     },
//     {
//       foreground: "f1fa8c",
//       token: "string",
//     },
//     {
//       foreground: "bd93f9",
//       token: "constant.numeric",
//     },
//     {
//       foreground: "bd93f9",
//       token: "constant.language",
//     },
//     {
//       foreground: "bd93f9",
//       token: "constant.character",
//     },
//     {
//       foreground: "bd93f9",
//       token: "constant.other",
//     },
//     {
//       foreground: "ffb86c",
//       token: "variable.other.readwrite.instance",
//     },
//     {
//       foreground: "ff79c6",
//       token: "constant.character.escaped",
//     },
//     {
//       foreground: "ff79c6",
//       token: "constant.character.escape",
//     },
//     {
//       foreground: "ff79c6",
//       token: "string source",
//     },
//     {
//       foreground: "ff79c6",
//       token: "string source.ruby",
//     },
//     {
//       foreground: "ff79c6",
//       token: "keyword",
//     },
//     {
//       foreground: "ff79c6",
//       token: "storage",
//     },
//     {
//       foreground: "8be9fd",
//       fontStyle: "italic",
//       token: "storage.type",
//     },
//     {
//       foreground: "50fa7b",
//       fontStyle: "underline",
//       token: "entity.name.class",
//     },
//     {
//       foreground: "50fa7b",
//       fontStyle: "italic underline",
//       token: "entity.other.inherited-class",
//     },
//     {
//       foreground: "50fa7b",
//       token: "entity.name.function",
//     },
//     {
//       foreground: "ffb86c",
//       fontStyle: "italic",
//       token: "variable.parameter",
//     },
//     {
//       foreground: "ff79c6",
//       token: "entity.name.tag",
//     },
//     {
//       foreground: "50fa7b",
//       token: "entity.other.attribute-name",
//     },
//     {
//       foreground: "8be9fd",
//       token: "support.function",
//     },
//     {
//       foreground: "6be5fd",
//       token: "support.constant",
//     },
//     {
//       foreground: "66d9ef",
//       fontStyle: " italic",
//       token: "support.type",
//     },
//     {
//       foreground: "66d9ef",
//       fontStyle: " italic",
//       token: "support.class",
//     },
//     {
//       foreground: "f8f8f0",
//       background: "ff79c6",
//       token: "invalid",
//     },
//     {
//       foreground: "f8f8f0",
//       background: "bd93f9",
//       token: "invalid.deprecated",
//     },
//     {
//       foreground: "cfcfc2",
//       token: "meta.structure.dictionary.json string.quoted.double.json",
//     },
//     {
//       foreground: "6272a4",
//       token: "meta.diff",
//     },
//     {
//       foreground: "6272a4",
//       token: "meta.diff.header",
//     },
//     {
//       foreground: "ff79c6",
//       token: "markup.deleted",
//     },
//     {
//       foreground: "50fa7b",
//       token: "markup.inserted",
//     },
//     {
//       foreground: "e6db74",
//       token: "markup.changed",
//     },
//     {
//       foreground: "bd93f9",
//       token: "constant.numeric.line-number.find-in-files - match",
//     },
//     {
//       foreground: "e6db74",
//       token: "entity.name.filename",
//     },
//     {
//       foreground: "f83333",
//       token: "message.error",
//     },
//     {
//       foreground: "eeeeee",
//       token: "punctuation.definition.string.begin.json - meta.structure.dictionary.value.json",
//     },
//     {
//       foreground: "eeeeee",
//       token: "punctuation.definition.string.end.json - meta.structure.dictionary.value.json",
//     },
//     {
//       foreground: "8be9fd",
//       token: "meta.structure.dictionary.json string.quoted.double.json",
//     },
//     {
//       foreground: "f1fa8c",
//       token: "meta.structure.dictionary.value.json string.quoted.double.json",
//     },
//     {
//       foreground: "50fa7b",
//       token: "meta meta meta meta meta meta meta.structure.dictionary.value string",
//     },
//     {
//       foreground: "ffb86c",
//       token: "meta meta meta meta meta meta.structure.dictionary.value string",
//     },
//     {
//       foreground: "ff79c6",
//       token: "meta meta meta meta meta.structure.dictionary.value string",
//     },
//     {
//       foreground: "bd93f9",
//       token: "meta meta meta meta.structure.dictionary.value string",
//     },
//     {
//       foreground: "50fa7b",
//       token: "meta meta meta.structure.dictionary.value string",
//     },
//     {
//       foreground: "ffb86c",
//       token: "meta meta.structure.dictionary.value string",
//     },
//   ],
//   colors: {
//     "editor.foreground": "#f8f8f2",
//     "editor.background": "#282a36",
//     "editor.selectionBackground": "#44475a",
//     "editor.lineHighlightBackground": "#44475a",
//     "editorCursor.foreground": "#f8f8f0",
//     "editorWhitespace.foreground": "#3B3A32",
//     "editorIndentGuide.activeBackground": "#9D550FB0",
//     "editor.selectionHighlightBorder": "#222218",
//   },
// };

// editor.defineTheme("vscode-dark", themeData);
// editor.setTheme("vscode-dark");
editor.setTheme("vs-dark");

// for (const edi of document.getElementsByClassName("editor")) {
// 	// (edi as any).updateOptions({
// 		// theme: 'vscode-dark'
// 	// });
// 	(edi as any).defineTheme('vscode-dark');
// 	(edi as any).setTheme('vscode-dark');
// }

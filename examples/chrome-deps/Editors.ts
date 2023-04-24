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

export const sortEditor = editor.create(document.getElementById("sortContainer"), {
  language: "json",
  automaticLayout: true,
	  formatOnType: true,
  // renderValidationDecorations: "on"
  fontSize: 9,
  // wordWrap: "on",
  tabSize: 1,
});


document.getElementById("wwButton").onclick = (e) => {
  editorWW = !editorWW;
  diffEditor.updateOptions({
    wordWrap: editorWW ? "on" : "off",
  });
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
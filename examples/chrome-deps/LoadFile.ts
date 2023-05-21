import { start } from ".";
import * as Editors from "./Editors";
import { tree2Graph } from "./Graph";
import { graph } from "./Graph";
import { searchParams } from "./Editors";
import { editor } from "monaco-editor";
import * as monaco from "monaco-editor";

export let fileText = ["", ""];
export let fileNames = ["", ""];
export let fileDiff = "";

export function getFileContents(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // Set up the onload event handler to resolve the promise with the file contents
    reader.onload = () => {
      resolve(reader.result);
    };

    // Set up the onerror event handler to reject the promise with the error message
    reader.onerror = () => {
      reject(reader.error.message);
    };

    // Read the file as text
    reader.readAsText(file);
  });
}

// export async function getFileContentsFromEndpoint(endpointUrl, file) {
//   const formData = new FormData();
//   formData.append('data', file);

//   const response = await fetch(endpointUrl, {
//     method: 'POST',
//     body: formData,
//     // data: file
//   });

//   if (!response.ok) {
//     throw new Error(`Failed to get file contents: ${response.status} ${response.statusText}`);
//   }

//   const data = await response.json();
//   return data.file_contents;
// }

// async function getFileContentsFromEndpoint(endpointUrl, filePath) {
//   const headers = new Headers();
//   headers.append('Content-Type', 'text/plain');
//   headers.append('Access-Control-Allow-Origin', '*');
//   const response = await fetch(endpointUrl, {
//     method: 'POST',
//     headers: headers,
//     body: filePath,
//   });

//   if (!response.ok) {
//     throw new Error(`Failed to get file contents: ${response.status} ${response.statusText}`);
//   }

//   const data = await response.json();
//   return data.contents;

export const fileButton = document.getElementById("fileButton");
// }

fileButton.addEventListener("click", async () => {
  const file = Editors.fileNameEditor.getModel().getValue();
  console.log("get file: " + file);
  try {
    // const fileAST = await getFileContentsFromEndpoint('http://localhost:5000/ast_from_file', file);
    const graphs = await Promise.all(
      revEditors.map(async function (ed, i) {
        // const graphs = [];
        // for (let i = 0; i < 2; i++) {
        // const ed = revEditors[i];
        const commit = ed.getModel().getValue();
        const srcResponse = await fetch(
          `http://localhost:5000/src?file=${encodeURIComponent(file)}&commit=${encodeURIComponent(commit)}`,
        );
        // let response;
        const response = await fetch(
          `http://localhost:5000/ast_from_file?file=${encodeURIComponent(file)}&commit=${encodeURIComponent(commit)}`,
        );
        if (!response.ok) {
          const message = `An error has occurred: ${response.status}`;
          throw new Error(message);
        }

        if (!srcResponse.ok) {
          const message = `SRC error: ${response.status}`;
          throw new Error(message);
        }
        const fileAST = await response.json();
        fileNames[i] = file;
        fileText[i] = (await srcResponse.json()).contents;
        // console.log(fileText[i]);
        return fileAST.contents;
        // graphs.push(fileAST.contents);
      }),
    );
    console.log(graphs);
    // }));
    // Editors.graphEditor.getModel().setValue(graphs[0]);
    // Editors.graphEditor2.getModel().setValue(graphs[1]);
    Editors.appendText(JSON.stringify(graphs[0], null, 1), Editors.graphEditor.getModel());
    Editors.appendText(JSON.stringify(graphs[1], null, 1), Editors.graphEditor2.getModel());
    start(graphs[0], graphs[1], true, true);
    console.log("file AST");
  } catch (err) {
    console.error(err);
  }
  // ed.getModel().getValue());

  // const asts = graphs.map(
  //   (g) =>
  //     g
  //      .split("\n")
  //      .map((l) => `"${l.trim()}"`)
  //      .join("\n")
  // );
});

export const revEditors = [0, 1].map((v) => {
  return editor.create(document.getElementById(`revContainer${v.toString()}`), {
    ...searchParams,
  });
});

let decorations = [];
/**
 * @param {monaco.editor} editr: an instance of an editor
 * @param {string} color: CSS Class w/ decoration rules
 */
export function applyEditorBackground(editr, color) {
  const model = editr.getModel();
  const fullRange = model.getFullModelRange();
  const background = { range: fullRange, options: { inlineClassName: color } };
  decorations = editr.deltaDecorations(decorations, [background]);
}

revEditors.forEach((ed) => {
  ed.onDidChangeModelContent(async (event) => {
    const editorContent = ed.getModel().getValue();
    try {
      const response = await gitRevParse(editorContent);

      if (!response.success) {
        applyEditorBackground(ed, "editorErrorDecoration");
      } else {
        applyEditorBackground(ed, "editorSuccessDecoration");
      }
    } catch (error) {
      console.error(error);
      applyEditorBackground(ed, "editorErrorDecoration");
    }
  });
});

revEditors[0].getModel().setValue("HEAD");
revEditors[1].getModel().setValue("HEAD~1");

async function gitRevParse(revArg) {
  const response = await fetch(`http://localhost:5000/git?rev=${encodeURIComponent(revArg)}`);

  if (!response.ok) {
    const message = `An error has occurred: ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  // if (!data.success) {
  //   console.log(`Error: ${data.message}`);
  // } else {
  //   console.log(`Success: ${data.message}`);
  // }
  return data;
}

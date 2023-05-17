import { start } from ".";
import { fileNameEditor } from "./Editors";
import { tree2Graph } from "./Graph";
import { graph } from "./Graph";
import { searchParams } from "./Editors";
import { editor } from 'monaco-editor';
import * as monaco from "monaco-editor";
export let fileText = '';
export let fileName = '';

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

async function getFileContentsFromEndpoint(endpointUrl, filePath) {
  const headers = new Headers();
  headers.append('Content-Type', 'text/plain');
  headers.append('Access-Control-Allow-Origin', '*');
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: headers,
    body: filePath,
  });

  if (!response.ok) {
    throw new Error(`Failed to get file contents: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.contents;
}

export const fileButton = document.getElementById("fileButton")

fileButton.addEventListener('click', async () => {
  const file = fileNameEditor.getModel().getValue();
  console.log("get file: " + file)
  const fileContents = await getFileContentsFromEndpoint('http://localhost:5000/src', file);
  console.log(fileContents);
  if (fileContents) {
    try {
      fileName = file;
      const fileAST = await getFileContentsFromEndpoint('http://localhost:5000/ast_from_file', file);
      console.log(fileAST);
      start(fileAST, true, true);
      console.log("file AST")
      fileText = fileContents;
    } catch (err) {
      console.error(err);
    }
  }
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

revEditors[0].onDidChangeModelContent(async (event) => {
    const editorContent = revEditors[0].getModel().getValue();
    try {
        const response = await gitRevParse(editorContent);

        if (!response.success) {
          applyEditorBackground(revEditors[0], "editorErrorDecoration");
        } else {
          applyEditorBackground(revEditors[0], "editorSuccessDecoration");
        }
    } catch (error) {
        console.error(error);
        applyEditorBackground(revEditors[0], "editorErrorDecoration");
    }
});

async function gitRevParse(revArg) {
    const response = await fetch(`http://localhost:5000/git?rev=${encodeURIComponent(revArg)}`);

    if (!response.ok) {
        const message = `An error has occurred: ${response.status}`;
        throw new Error(message);
    }

    const data = await response.json();
    if (!data.success) {
        console.log(`Error: ${data.message}`);
    } else {
        console.log(`Success: ${data.message}`);
    }
    return data;
}

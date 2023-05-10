import { start } from ".";
import { fileNameEditor } from "./Editors";
import { tree2Graph } from "./Graph";
import { graph } from "./Graph";

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

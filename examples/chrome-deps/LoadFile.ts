import { start } from ".";
import { fileNameEditor } from "./Editors";
import { tree2Graph } from "./Graph";
import { graph } from "./Graph";

export let fileText = '';
let lines = fileText.split('\n');
export let fileName = '';
export const getTextBetweenPositions = (startLine, startColumn, endLine, endColumn) => {
  // Split the file text into an array of lines

  // Get the text between the starting and ending positions
  let text = '';
  for (let i = startLine - 1; i < endLine; i++) {
    const line = lines[i];

    // If this is the starting line, start at the starting column
    const startIndex = i === startLine - 1 ? startColumn - 1 : 0;

    // If this is the ending line, end at the ending column
    const endIndex = i === endLine - 1 ? endColumn : line.length;

    // Add the text between the start and end positions to the result
    text += line.substring(startIndex, endIndex);

    // If this isn't the last line, add a newline character
    if (i < endLine - 1) {
      text += '\n';
    }
  }

  // Concatenate the line numbers
  const lineNumbers = Array.from({ length: endLine - startLine + 1 }, (_, i) => startLine + i).join(',');

  // Return the result and the line numbers
  return { text, lineNumbers };
}

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

const fileButton = document.getElementById("fileButton")

fileButton.addEventListener('click', async () => {
  const file = fileNameEditor.getModel().getValue();
  console.log("get file: " + file)
  const fileContents = await getFileContentsFromEndpoint('http://95.84.195.102:5000/src', file);
  console.log(fileContents);
  if (fileContents) {
    try {
      fileName = file;
      const fileAST = await getFileContentsFromEndpoint('http://95.84.195.102:5000/ast_from_file', file);
      console.log(fileAST);
      start(fileAST, false, true);
      console.log("file AST")
      fileText = fileContents;
      lines = fileText.split('\n');
    } catch (err) {
      console.error(err);
    }
  }
});

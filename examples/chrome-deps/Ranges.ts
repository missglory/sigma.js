import { fileText } from "./LoadFile";
import { Buffer } from "buffer";

export type Gap = [number, number];

export type Range = [number, number];

export class RangeFinder {
  private holes: Range[];

  constructor(parent: Range) {
    this.holes = [parent];
  }

  addRange(child: Range) {
    const newHoles: Range[] = [];

    for (const hole of this.holes) {
      if (child[1] <= hole[0] || child[0] >= hole[1]) {
        newHoles.push(hole);
      } else {
        if (child[0] > hole[0]) {
          newHoles.push([hole[0], child[0]]);
        }
        if (child[1] < hole[1]) {
          newHoles.push([child[1], hole[1]]);
        }
      }
    }

    this.holes = newHoles;
    return this;
  }

  addRanges(children: Range[]) {
    const addCh = (ch) => {
      this.addRange(ch);
    };
    children.forEach(addCh);
    return this;
  }

  getHoles(): Range[] {
    return this.holes;
  }

  isContainedInRange(testRange: Range) {
    for (const hole of this.holes) {
      if (testRange[0] >= hole[0] && testRange[1] <= hole[1]) {
        // return hole;
        return true;
      }
    }
    return false;
    // return null;
  }
/**
 * 
 * @param filePath 
 * @param regex 
 * @param {string} fileText 
 * @returns 
 */
  async findHolesByRegexInFile(filePath: string, regex: RegExp, fileText): Promise<Range[]> {
    // const content = await fs.promises.readFile(filePath, 'utf8');

    const matches = Array.from(fileText.matchAll(regex), (m: any) => [m.index, m.index + m[0].length] as Range);

    for (const match of matches) {
      this.addRange(match);
    }

    return this.getHoles();
  }
}

type LineColumn = {
  line: number;
  column: number;
};

export const getLineColumn = (content: string, byteOffset: number): LineColumn => {
  const buffer = Buffer.from(content);
  let line = 1;
  let column = 1;

  for (let i = 0; i < Math.min(byteOffset, buffer.length); i++) {
    if (buffer[i] === 10) {
      // 10 is the byte value for the newline character '\n'
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return { line, column };
};

export const getTextSliceByByteOffset = (text: string, startByteOffset: number, endByteOffset: number): string => {
  const buffer = Buffer.from(text);
  const startIndex = Math.max(0, Math.min(startByteOffset, buffer.length));
  const endIndex = Math.max(0, Math.min(endByteOffset, buffer.length));
  const slicedBuffer = buffer.slice(startIndex, endIndex);
  return slicedBuffer.toString();
};

export const getTextBetweenPositions = (startLine, startColumn, endLine, endColumn, fileText) => {
  // Split the file text into an array of lines

  // Get the text between the starting and ending positions
  let text = "";
  const lines = fileText.split("\n");
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
      text += "\n";
    }
  }

  // Concatenate the line numbers
  const lineNumbers = Array.from({ length: endLine - startLine + 1 }, (_, i) => startLine + i).join(",");

  // Return the result and the line numbers
  return { text, lineNumbers };
};

export function getLineNumbersString(start: number, end: number): string {
  let lineNumbers = "";
  for (let i = start; i <= end; i++) {
    lineNumbers += i.toString();
    if (i < end) {
      lineNumbers += "\n";
    }
  }
  return lineNumbers;
}

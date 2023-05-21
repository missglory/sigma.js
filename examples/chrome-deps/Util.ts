export function logFileLineFunction() {
  const stackTrace = new Error().stack;
  if (stackTrace) {
    // Parsing the stack trace to extract file, line, and function information
    const lines = stackTrace.split('\n');
    // The second line usually contains the file, line, and function information
    const [, callerLine] = lines[2].trim().split('at ');
    console.log(callerLine);
  }
}
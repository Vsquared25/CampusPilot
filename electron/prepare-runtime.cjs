const { copyFileSync, existsSync, mkdirSync } = require("node:fs");
const path = require("node:path");

const outputDirectory = path.join(__dirname, "runtime");
const outputPath = path.join(outputDirectory, "node.exe");

if (!existsSync(process.execPath)) {
  throw new Error("A local Node.js runtime could not be found.");
}

mkdirSync(outputDirectory, { recursive: true });
copyFileSync(process.execPath, outputPath);
console.log(`Bundled Node.js runtime at ${outputPath}`);

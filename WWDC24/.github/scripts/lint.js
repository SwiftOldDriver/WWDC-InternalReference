import chalk from "chalk";
import { defaultTable, getLocalTargetFiles, lint_results } from "./helper.js";

let files = getLocalTargetFiles();
let results = lint_results(files);

if (results.length <= 0) {
  console.log(chalk.bgGreen("No lint errors found in the target files."));
  process.exit(0);
}

var errorCounter = 0;
var fixableCounter = 0;

for (let result of results) {
  if (result.errors.length === 0) {
    continue;
  }

  console.log(`${result.file}:`);

  const items = [];

  for (let error of result.errors) {
    errorCounter += 1;

    let { start, end, text, type, description } = error;
    let pos = `${start.line}:${start.column}-${end.line}:${end.column}`;

    const item = [
      chalk.grey(pos),
      chalk.bgRed(text?.trim().slice(0, 30) || ""),
      chalk.red(description.trim()),
    ] 

    if (error.linter === "lint-md" || error.fixInfo) {
      item.push(chalk.bgBlue("Auto-Fixable"))
      fixableCounter += 1
    } else if (error.linter === "markdownlint") {
      item.push(chalk.bgYellow("Not Auto-Fixable"))
    }

    items.push(item);
  }
  const output = defaultTable(items);
  console.log(output);
}

console.log(
  chalk.bgBlue(`Auto-Fixable`),
  "    errors could be auto fixed by running",
  chalk.bgGreen("npm run fix"),
)
console.log(
  chalk.bgYellow(`Not Auto-Fixable`),
  "errors need to be fixed manually."
)

console.log(
  "For more details about",
  chalk.red("MD0XX"),
  "errors, please refer to https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md",
)

console.log(
  `\nLint total ${files.length} files`,
  chalk.red(`${errorCounter} errors`)
);

if (errorCounter > 0) {
  process.exit(1);
}

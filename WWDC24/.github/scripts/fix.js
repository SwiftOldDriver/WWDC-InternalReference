import { fixMarkdownFormat, getLocalTargetFiles, lint_results } from "./helper.js";
import chalk from "chalk";

const files = getLocalTargetFiles();
const lintResults =  lint_results(files);
const fixResult = fixMarkdownFormat(lintResults);

console.log(
  chalk.bgYellow(`Not Auto-Fixable`),
  "errors need to be fixed manually."
)
console.log(
  `Lint total ${files.length} files`,
  chalk.red(`${fixResult.errorCount} errors`),
  chalk.green(`${fixResult.fixCount} fixed`),
);

console.log(
  "\nFor more details about",
  chalk.red("MD0XX"),
  "errors, please refer to https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md",
)

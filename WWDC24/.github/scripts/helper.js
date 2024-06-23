import { parse } from "hexo-front-matter";
import { lintMarkdown } from "@lint-md/core";
import { readFileSync, writeFileSync } from "fs";
import MDL from "markdownlint";
import { applyFixes } from "markdownlint/helpers";
import { execSync } from "child_process";
import { error as annotate_error, isDebug } from "@actions/core";
import chalk from "chalk";
import { getBorderCharacters, table } from "table";
import fetch from "node-fetch";

function debugLog(...args) {
  // if (!isDebug()) return;
  console.log(...args);
}

function getPullRequestIds(url) {
  const regex = /https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;
  const match = url.match(regex);
  if (match && match.length === 4) {
    const owner = match[1];
    const repo = match[2];
    const pull_number = match[3];
    return { owner, repo, pull_number };
  } else {
    throw new Error("无法从给定的 URL 中提取 Pull Request 信息");
  }
}

function getPRTargetFiles(files) {
  return files
    .filter(f => f.filename.endsWith(".md"))
    .filter(f => f.status === "added" || f.status === "modified")
    .map(f => f.filename);
}

function getLocalTargetFiles() {
  const addedModifiedFiles = execSync("git diff main..HEAD --name-only --diff-filter=AM").toString().trim().split("\n");
  const cachedFiles = execSync("git diff --cached --name-only").toString().trim().split("\n");
  const untrackedFiles = execSync("git ls-files --others --exclude-standard").toString().trim().split("\n");

  const files = new Set();
  for (const file of [...addedModifiedFiles, ...cachedFiles, ...untrackedFiles]) {
    if (file.endsWith(".md")) {
      files.add(file);
    }
  }
  return Array.from(files);
}

function getSessionIds(files) {
  const sessionIds = [];
  for (const file of files) {
    const str = readFileSync(file, "utf8");
    const fm = parse(str);
    if (fm.session_ids) {
      sessionIds.push(...fm.session_ids);
    }
  }
  return sessionIds;
}

async function sendRequest(endpoint, body) {
  try {
    debugLog(endpoint, body);

    const response = await fetch("http://127.0.0.1:4040" + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    debugLog(response);

    if (response.status !== 200) {
      throw new Error(await response.json());
    }

    debugLog(await response.text());
  } catch (error) {
    debugLog(error);
    annotate_error("通知失败，请联系管理员检查服务器是否正常运行")
  }
}

async function sendMessage(message, at_user_list) {
  return sendRequest("/wwdc/mention", { message, at_user_list });
}

async function sendGroupMessage(message, session_ids, type) {
  return sendRequest("/wwdc/notify", { message, session_ids, type });
}

function sessionIdsNotFoundMessage() {
  return `
  Markdown 文件中无法识别到 session_id，请在 markdown 文件前面加上对应的 session_id。范例：

  \`\`\`markdown
  ---
  session_ids: [10118]
  ---

  # Session 10118 - CloudKit 自动化开发

  本文基于[Session 10118](https://developer.apple.com/videos/play/wwdc2021/10118/)梳理...
  \`\`\`
  `;
}

function defaultTable(data) {
  return table(data, {
    border: getBorderCharacters("void"),
    columnDefault: {
      paddingLeft: 0,
      paddingRight: 2,
    },
    columns: [
      {},
      {},
      {},
      { paddingRight: 0 },
    ],
    drawHorizontalLine: () => false,
  });
}

function fixMarkdownFormat(lintResults) {
  console.log(`Fixing the format of files [${lintResults.map(r => r.file).join(", ")}]...\n`);

  var fixCount = 0;
  var errorCount = 0

  const lintmdOptions = JSON.parse(
    readFileSync(".github/scripts/documentlint.json")
  ).rules;

  for (const result of lintResults) {
    const originContent = readFileSync(result.file, "utf8");
    let fixedContent = originContent;
    if (result.fixInfos && result.fixInfos.length > 0) {
      fixedContent = applyFixes(originContent, result.fixInfos);
    }
    if (result.fixedResult) {
      fixedContent = lintMarkdown(fixedContent, lintmdOptions, true).fixedResult.result;
    }
    if (originContent !== fixedContent) {
      writeFileSync(result.file, fixedContent);
    }

    console.log(`${result.file}:`);

    const items = [];

    for (let error of result.errors) {
      let { start, end, text, type, description } = error;
      let pos = `${start.line}:${start.column}-${end.line}:${end.column}`;

      const item = [
        chalk.grey(pos),
        chalk.bgRed(text?.trim().slice(0, 30) || ""),
        chalk.red(description.trim()),
      ] 

      if (error.linter === "lint-md" || error.fixInfo) {
        item.push(chalk.bgGreen("Fixed"))
        fixCount += 1;
      } else if (error.linter === "markdownlint") {
        item.push(chalk.bgYellow("Not Auto-Fixable"))
      }

      errorCount += 1;

      items.push(item);
    }
    const output = defaultTable(items);
    console.log(output);
  }

  return { errorCount, fixCount };
}

function lint_results(files) {
  console.log(`Linting the format of files [${files.join(", ")}]...\n`);

  const config = JSON.parse(
    readFileSync(".github/scripts/markdownlint.json")
  );
  let markdownlintOptions = {
    config,
    files,
    resultVersion: 3,
  };

  var errorCounter = 0;
  var results = new Map();

  let markdownlint_results = MDL.sync(markdownlintOptions);
  for (let [file, violations] of Object.entries(markdownlint_results)) {
    var fileLintResult = {
      fixInfos: [],
      errors: [],
    };
    for (let violation of violations) {
      var description = `[${violation.ruleNames[0]}] ${violation.ruleDescription}`;
      let startColumn = violation.errorRange?.[0] || 0;
      let endColumn = violation.errorRange?.[1] || 0;
      if (startColumn > endColumn) {
        endColumn = startColumn;
      }
      if (violation.fixInfo) {
        fileLintResult.fixInfos.push(violation);
      }
      fileLintResult.errors.push({
        start: {
          line: violation.lineNumber,
          column: startColumn,
        },
        end: {
          line: violation.lineNumber,
          column: endColumn,
        },
        text: violation.errorContext,
        type: violation.ruleNames[1],
        description,
        ruleInformation: violation.ruleInformation,
        raw: violation,
        fixInfo: violation.fixInfo,
        linter: "markdownlint"
      });
      errorCounter += 1;
    }
    if (fileLintResult.errors.length > 0) {
      results.set(file, fileLintResult);
    }
  }

  let lintmdOptions = JSON.parse(
    readFileSync(".github/scripts/documentlint.json")
  ).rules;
  for (let file of files) {
    let markdown = readFileSync(file, "utf8");
    let lintResults = lintMarkdown(markdown, lintmdOptions, true); 
    let errors = lintResults.lintResult;
    var fileLintResult = results.get(file);
    if (!fileLintResult) {
      fileLintResult = {
        errors: [],
      };
    }
    fileLintResult.fixedResult = lintResults.fixedResult;
    for (let error of errors) {
      fileLintResult.errors.push({
        start: error.loc.start,
        end: error.loc.end,
        type: error.name,
        description: error.message,
        text: error.content,
        raw: error,
        linter: "lint-md",
      });
      errorCounter += 1;
    }
    if (fileLintResult.errors.length > 0) {
      results.set(file, fileLintResult);
    }
  }

  var structuredResult = new Array();

  for (let [file, lintResult] of results) {
    lintResult.errors.sort((lhs, rhs) => {
      if (lhs.start.line > rhs.start.line) {
        return 1;
      }
      if (lhs.start.line < rhs.start.line) {
        return -1;
      }
      return 0;
    });

    structuredResult.push({
      file,
      ...lintResult
    });
  }

  structuredResult.sort((lhs, rhs) => {
    if (lhs.file > rhs.file) {
      return 1;
    }
    if (lhs.file < rhs.file) {
      return -1;
    }
    return 0;
  });

  return structuredResult;
}

export {
  debugLog,
  defaultTable,
  fixMarkdownFormat,
  getPullRequestIds,
  getPRTargetFiles,
  getLocalTargetFiles,
  getSessionIds,
  sendMessage,
  sendGroupMessage,
  sessionIdsNotFoundMessage,
  lint_results,
};

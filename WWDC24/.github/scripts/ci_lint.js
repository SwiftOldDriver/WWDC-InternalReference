import { Octokit } from "octokit";
import { getPullRequestIds, getPRTargetFiles, getSessionIds, lint_results, sendMessage, sendGroupMessage, sessionIdsNotFoundMessage } from "./helper.js";
import { error as annotate_error, setFailed } from "@actions/core";

const auth = process.env.GITHUB_TOKEN;
const prUrl = process.env.PULL_REQUEST_URL;

const octokit = new Octokit({ auth });

const prIds = getPullRequestIds(prUrl);
const pr = (await octokit.rest.pulls.get(prIds)).data;
const files = (await octokit.rest.pulls.listFiles(prIds)).data;
const targetFiles = getPRTargetFiles(files);
const author = pr.user.login;

const sessionsIds = getSessionIds(targetFiles);
var message;
if (sessionsIds.length === 0) {
  message = `提交的 markdown 文件无法识别出 session_ids，请按照 GitHub 上的提示正确填写。 ${prUrl}`
  sendMessage(message, [author])
  setFailed(sessionIdsNotFoundMessage());
  process.exit(1);
}

const results = lint_results(targetFiles);
var errorCounter = 0;

for (let result of results) {
  if (result.errors.length == 0) {
    continue;
  }

  for (let error of result.errors) {
    errorCounter += 1;

    let { start, end, text, type, description, ruleInformation } = error;

    if (ruleInformation) {
      message = `规则具体解释请查阅「${ruleInformation} 」`;
    } else {
      message = `规则具体解释请查阅「中文技术文档的写作规范 https://github.com/ruanyf/document-style-guide」`
    }

    var properties = {
      file: result.file,
      title: description,
      startLine: start.line,
    };

    if (start.line === end.line) {
      properties.startColumn = start.column;
      properties.endColumn = end.column;
    } else {
      properties.endLine = end.line;
    }

    annotate_error(message, properties);
  }
}

if (errorCounter > 0) {
  const fromCI = process.env.GITHUB_ACTOR == "github-actions[bot]";
  if (fromCI) {
    message = `CI 已尝试自动修复格式问题，但仍有部分需要手动处理，请尽快根据 GitHub 上的评论完成修改。 ${prUrl}/files`
  } else {
    message = `PR 有新的提交，文章格式存在问题，请尽快根据 GitHub 上的错误标记完成修改。 ${prUrl}/files`
  }
  sendGroupMessage(message, [author])
  setFailed(`发现 ${errorCounter} 处格式错误，请修复后重新提交。`)
  process.exit(1);
}

message =  `PR 有新的提交，已通过格式检查，请尽快查阅审核。 ${prUrl}`
sendGroupMessage(message, [author])

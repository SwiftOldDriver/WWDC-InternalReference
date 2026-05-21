import { Octokit } from "octokit";
import { getPullRequestIds, getPRTargetFiles, getSessionIds, lint_results, sendMessage, sendGroupMessage, sessionIdsNotFoundMessage } from "./helper.js";
import { setFailed } from "@actions/core";

const auth = process.env.GITHUB_TOKEN;
const prUrl = process.env.PULL_REQUEST_URL;

const octokit = new Octokit({ auth });

const prIds = getPullRequestIds(prUrl);
const pr = (await octokit.rest.pulls.get(prIds)).data;
const files = (await octokit.rest.pulls.listFiles(prIds)).data;
const targetFiles = getPRTargetFiles(files);
const author = pr.user.login;

const sessionIds = getSessionIds(targetFiles);
var message;
if (sessionIds.length === 0) {
  message = `提交的 markdown 文件无法识别出 session_ids，请按照 GitHub 上的提示正确填写。 ${prUrl}`
  await sendMessage(message, [author])
  setFailed(sessionIdsNotFoundMessage());
  process.exit(1);
}

const results = lint_results(targetFiles);
var errorCounter = 0;

const annotations = [];
for (let result of results) {
  if (result.errors.length == 0) {
    continue;
  }

  for (let error of result.errors) {
    errorCounter += 1;

    let { start, end, text, type, description, ruleInformation } = error;

    var annotation = {
      path: result.file,
      title: description,
      start_line: start.line,
      start_column: start.column,
      end_line: end.line,
      end_column: end.column,
      annotation_level: "failure"
    };

    if (ruleInformation) {
      annotation.message = `规则具体解释请查阅「${ruleInformation} 」`;
    } else {
      annotation.message = `规则具体解释请查阅「中文技术文档的写作规范 https://github.com/ruanyf/document-style-guide」`
    }

    if (annotations.length < 50) {
      annotations.push(annotation);
    }
  }
}

if (errorCounter > 0) {
  const fromCI = process.env.GITHUB_ACTOR == "github-actions[bot]";
  if (fromCI) {
    message = `CI 已尝试自动修复格式问题，但仍有部分需要手动处理，请尽快根据 GitHub 上的评论完成修改。 ${prUrl}/files`
  } else {
    message = `PR 有新的提交，文章格式存在问题，请尽快根据 GitHub 上的错误标记完成修改。 ${prUrl}/files`
  }
  await sendGroupMessage(message, sessionIds, 1)

  await octokit.rest.checks.create({
    owner: pr.base.repo.owner.login,
    repo: pr.base.repo.name,
    name: "Markdown Lint",
    head_sha: pr.head.sha,
    status: "completed",
    conclusion: "failure",
    output: {
      title: `发现 ${errorCounter} 处格式错误，请修复后重新提交。`,
      summary: "",
      annotations: annotations,
    }
  });

  process.exit(0);
}

message = `PR 有新的提交，已通过格式检查，请尽快查阅审核。 ${prUrl}`
await sendGroupMessage(message, sessionIds, 0)

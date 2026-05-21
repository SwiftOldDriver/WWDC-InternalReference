import { Octokit } from "octokit";
import { getPullRequestIds, getPRTargetFiles, getSessionIds, sendGroupMessage, sendMessage, sessionIdsNotFoundMessage } from "./helper.js";
import { setFailed } from "@actions/core"

const auth = process.env.GITHUB_TOKEN;
const prUrl = process.env.PULL_REQUEST_URL;

const octokit = new Octokit({ auth });

const prIds = getPullRequestIds(prUrl);
const pr = (await octokit.rest.pulls.get(prIds)).data;

const author = pr.user.login;
const files = (await octokit.rest.pulls.listFiles(prIds)).data;
const targetFiles = getPRTargetFiles(files);
const sessionIds = getSessionIds(targetFiles);

if (sessionIds.length === 0) {
  const message = `提交的 markdown 文件无法识别出 session_ids，请按照 GitHub 上的提示正确填写。 ${prUrl}`
  await sendMessage(message, [author])
  setFailed(sessionIdsNotFoundMessage());
  process.exit(1);
}

const commentSender = process.env.COMMENT_SENDER;
const commentFromPRAuthor = author === commentSender;
let message = "";
if (commentFromPRAuthor) {
  message = `PR 作者已回复留言，请尽快查阅。 ${prUrl}`
} else {
  message = `PR 有新的审核留言，请尽快查阅。 ${prUrl}`
}

const type = commentFromPRAuthor ? 0 : 1;
await sendGroupMessage(message, sessionIds, type);

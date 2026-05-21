import { Octokit } from "octokit";
import { getPullRequestIds, getPRTargetFiles, lint_results, fixMarkdownFormat } from "./helper.js";
import { simpleGit } from "simple-git";
import { execSync } from "child_process";

const targetRef = process.env.TARGET_REF;
const auth = process.env.BOT_TOKEN;
const prUrl = process.env.PULL_REQUEST_URL;

const octokit = new Octokit({ auth });

const prIds = getPullRequestIds(prUrl);
const files = (await octokit.rest.pulls.listFiles(prIds)).data;
const targetFiles = getPRTargetFiles(files);
const lintResults = lint_results(targetFiles);
const fixInfo = fixMarkdownFormat(lintResults);

if (fixInfo.fixCount > 0) {
  const res = await simpleGit()
    .addConfig("user.name", "SwiftOldDriverBot", false, "local")
    .addConfig("user.email", "chenkem+swiftolddriver@gmail.com", false, "local")
    .addRemote("origin_", `https://x-access-token:${auth}@github.com/${prIds.owner}/${prIds.repo}`)
    .add(targetFiles)
    .commit("Fix format by CI", {
      "--author": "github-actions[bot] <github-actions[bot]@users.noreply.github.com>"
    })
    .push('origin_', targetRef)
    .removeRemote("origin_");

  console.log(res);
  console.log(await simpleGit().listConfig("local"));

  execSync("git config --local --unset-all user.name")
  execSync("git config --local --unset-all user.email")
}

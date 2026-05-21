import { Octokit } from "octokit";
import { getPullRequestIds } from "./helper.js";
import { setOutput } from "@actions/core";

const auth = process.env.GITHUB_TOKEN;
const prUrl = process.env.PULL_REQUEST_URL;

const octokit = new Octokit({ auth });
const prIds = getPullRequestIds(prUrl);
console.log("prIds", prIds);
const pr = (await octokit.rest.pulls.get(prIds)).data;

setOutput("TARGET_REF", pr.head.ref);

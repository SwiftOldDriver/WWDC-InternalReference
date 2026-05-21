#!/usr/bin/env node
// Build script for the WWDC Internal Reference GitHub Pages site.
// Walks WWDC21..WWDC24, extracts each session's metadata + body markdown,
// pre-renders to static HTML in ./.site, and emits a search index JSON.

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, ".site");
const ASSET_OUT = path.join(OUT, "assets");
const DATA_OUT = path.join(OUT, "data");
const SESSIONS_OUT = path.join(OUT, "sessions");

const RESOURCE_DIR_NAMES = new Set([
  "images", "image", "img", "imgs", "media",
  "pics", "assets", "code", "misc",
]);

const INTRO_FILE_CANDIDATES = [
  "README.md", "Others.md", "OTHER.md", "Other.md",
  "其他.md", "其它.md",
  "作者介绍.md", "作者简介.md", "作者.md",
];

const BANNER_FILE_CANDIDATES = [
  "banner.png", "banner.jpg", "banner.jpeg", "banner.webp",
  "Banner.png", "Banner.jpg",
  "cover.png", "cover.jpg", "cover.jpeg", "cover.PNG", "cover.JPG",
  "header.png", "header.jpg",
  "封面.png", "封面.jpg", "封面.jpeg", "封面.PNG", "封面.JPG",
  "封面图.png", "封面图.jpg", "封面图.jpeg", "封面图.PNG", "封面图.JPG",
  "封面配图.png", "封面配图.jpg",
  "精美的配图.jpg", "精美的配图.png",
];

marked.use({ gfm: true, breaks: false, mangle: false, headerIds: true });

// ---------- helpers ----------

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

async function rmrf(p) {
  await fsp.rm(p, { recursive: true, force: true });
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function copyFile(src, dst) {
  await ensureDir(path.dirname(dst));
  await fsp.copyFile(src, dst);
}

async function copyResourceDir(src, dst) {
  if (!exists(src)) return;
  const stat = await fsp.stat(src);
  if (!stat.isDirectory()) return;
  await ensureDir(dst);
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) {
      await copyResourceDir(s, d);
    } else if (e.isFile()) {
      const lower = e.name.toLowerCase();
      if (lower.endsWith(".pdf") || lower.endsWith(".zip") || lower.endsWith(".mov")) continue;
      await copyFile(s, d);
    }
  }
}

function stripFrontMatter(text) {
  // Strip ``` fenced frontmatter (used in WWDC23 README)
  const fenced = /^```\s*\n([\s\S]*?)\n```\s*\n/;
  if (fenced.test(text)) return text.replace(fenced, "");
  // Strip --- YAML frontmatter, tolerating malformed bodies (e.g. duplicate keys)
  if (/^---\r?\n/.test(text)) {
    try {
      return matter(text).content;
    } catch {
      const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
      if (m) return text.slice(m[0].length);
    }
  }
  return text;
}

function htmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainText(md, maxLen = 240) {
  if (!md) return "";
  let t = md
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^\)]*\)/g, "$1")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[#*_`>]/g, "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length > maxLen) t = t.slice(0, maxLen).trimEnd() + "…";
  return t;
}

function firstImageInMd(md) {
  const m = md.match(/!\[[^\]]*\]\(([^\)]+)\)/);
  return m ? m[1].trim() : null;
}

function firstHeading(md) {
  const m = md.match(/^\s*#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

function stripFirstHeading(md) {
  return md.replace(/^\s*#\s+.+?\s*$\n?/m, "");
}

// Parse "Other"-style markdown into named sections keyed by normalized heading.
function parseSections(md) {
  const text = stripFrontMatter(md);
  const lines = text.split(/\r?\n/);
  const sections = [];
  // Capture leading content (before any ## heading) under "_lead"
  let cur = { name: "_lead", lines: [] };
  sections.push(cur);
  for (const line of lines) {
    const m = line.match(/^##+\s+(.+?)\s*$/);
    if (m) {
      cur = { name: m[1].trim(), lines: [] };
      sections.push(cur);
    } else {
      cur.lines.push(line);
    }
  }
  const out = {};
  for (const s of sections) {
    out[s.name] = s.lines.join("\n").trim();
  }
  return out;
}

function pickSection(sections, names) {
  for (const n of names) {
    for (const k of Object.keys(sections)) {
      if (k === n || k.includes(n)) {
        const v = sections[k];
        if (v) return v;
      }
    }
  }
  return "";
}

const AUTHOR_HEADINGS = ["个人介绍", "自我介绍", "作者介绍", "作者简介"];
const REVIEWER_HEADINGS = ["审核介绍", "审稿介绍", "审核"];
const SUMMARY_HEADINGS = [
  "不超过 120 个字的文章简介",
  "不超过 120 字的文章介绍",
  "不超过 120 个字的文章介绍",
  "文章简介", "文章介绍", "文章摘要", "摘要", "简介",
];
const BANNER_HEADINGS = [
  "公众号/小专栏图文头图", "小专栏图文头图", "公众号图文头图",
  "图文头图", "头图", "配图", "封面图", "封面",
];

function normalizeRelImg(p) {
  if (!p) return p;
  let v = p.trim();
  if (/^https?:\/\//i.test(v)) return v;
  v = v.replace(/^\.\//, "");
  return v;
}

function imgFromMdSection(md) {
  if (!md) return null;
  const m = md.match(/!\[[^\]]*\]\(([^\)]+)\)/);
  return m ? normalizeRelImg(m[1]) : null;
}

// Parse "作者：xxx / 审核：xxx / 摘要：xxx" style intros where the labels are
// just inline paragraphs separated by blank lines.
function parseInlineLabels(md) {
  const labels = {
    author: ["作者", "个人介绍", "自我介绍", "Author"],
    reviewer: ["审核", "审稿", "审核人", "Reviewer"],
    summary: ["摘要", "简介", "文章简介", "文章摘要", "Summary", "Description"],
  };
  const lines = stripFrontMatter(md).split(/\r?\n/);
  const out = { author: "", reviewer: "", summary: "" };
  let curKey = null;
  let buf = [];
  const flush = () => {
    if (curKey) {
      const v = buf.join("\n").trim();
      if (v && !out[curKey]) out[curKey] = v;
    }
    buf = [];
  };
  for (const line of lines) {
    const m = line.match(/^([^\s：:#>!\[\]]{1,12})\s*[：:]\s*(.*)$/);
    if (m) {
      const head = m[1].trim();
      let key = null;
      for (const [k, names] of Object.entries(labels)) {
        if (names.some((n) => head === n)) {
          key = k;
          break;
        }
      }
      if (key) {
        flush();
        curKey = key;
        if (m[2].trim()) buf.push(m[2].trim());
        continue;
      }
    }
    if (curKey) {
      if (/^#{1,6}\s/.test(line)) {
        flush();
        curKey = null;
        continue;
      }
      buf.push(line);
    }
  }
  flush();
  return out;
}

function extractIdsFromDirName(name) {
  const ids = [];
  // \b doesn't work between _ and digits because both are word chars; use lookarounds.
  const re = /(?<![A-Za-z0-9])(\d{4,6})(?![A-Za-z0-9])/g;
  let m;
  while ((m = re.exec(name)) !== null) ids.push(m[1]);
  return ids;
}

// ---------- year extractors ----------

// WWDC 22/23/24 share the (README.md + OTHER/Others.md) layout.
// flavor controls whether to rebuild README head with author quotes
// (true for 23/24, false for 22).
async function extractStructured(sessionDir, year, rebuildHead) {
  const dirName = path.basename(sessionDir);
  const introPath =
    ["OTHER.md", "Others.md", "Other.md"]
      .map((n) => path.join(sessionDir, n))
      .find(exists) || null;
  const readmePath = path.join(sessionDir, "README.md");
  if (!exists(readmePath)) return null;

  const readmeRaw = await fsp.readFile(readmePath, "utf8");
  const readme = stripFrontMatter(readmeRaw);

  let sections = {};
  let introRaw = "";
  if (introPath) {
    introRaw = await fsp.readFile(introPath, "utf8");
    sections = parseSections(introRaw);
  }

  let author = pickSection(sections, AUTHOR_HEADINGS);
  let reviewer = pickSection(sections, REVIEWER_HEADINGS);
  let summary = pickSection(sections, SUMMARY_HEADINGS);
  const bannerSection = pickSection(sections, BANNER_HEADINGS);

  // Inline-label fallback: some intro files use "作者:"/"审核:"/"摘要:" labels
  // separated by blank lines instead of ## headings.
  if ((!author || !reviewer || !summary) && introRaw) {
    const inline = parseInlineLabels(introRaw);
    if (!author && inline.author) author = inline.author;
    if (!reviewer && inline.reviewer) reviewer = inline.reviewer;
    if (!summary && inline.summary) summary = inline.summary;
  }

  // Banner discovery: section image > leading section image > first README image
  let bannerRel =
    imgFromMdSection(bannerSection) ||
    imgFromMdSection(sections["_lead"] || "") ||
    firstImageInMd(readme);

  const title = firstHeading(readme) || dirName;
  const ids = extractIdsFromDirName(dirName);

  let body = readme;
  if (rebuildHead) {
    // Detect what the README already contains in its head (above the first `## `)
    // so we don't duplicate the metadata that's already inline.
    const head = readme.split(/^##\s/m, 1)[0] || "";
    const hasInlineAuthor = /(^|\n)\s*>\s*(?:作者|Author)[：:]/i.test(head);
    const hasInlineReviewer = /(^|\n)\s*>\s*(?:审核|Reviewer)[：:]/i.test(head);
    const hasInlineSummary = /(^|\n)\s*>\s*(?:摘要|简介|Summary)[：:]/i.test(head);
    // A "leading banner" is a standalone image as the very first content of the README
    // (before any H1 / ## heading).
    const stripped = readme.replace(/^---[\s\S]*?---\s*\n?/, "").trimStart();
    const hasLeadingBanner = /^!\[[^\]]*\]\([^\)]+\)/.test(stripped);

    if (hasInlineAuthor || hasInlineReviewer || hasInlineSummary) {
      // README already carries the metadata inline. Just prepend a banner if missing.
      if (bannerRel && !hasLeadingBanner) {
        body = `![banner](${bannerRel})\n\n${readme}`;
      } else {
        body = readme;
      }
    } else {
      // Full rebuild: banner + H1 + author quote + reviewer quote + body without H1
      const noH1 = stripFirstHeading(readme);
      const headerImg =
        bannerRel && !hasLeadingBanner ? `![banner](${bannerRel})\n\n` : "";
      const authorBlock = author
        ? "> " + author.split(/\r?\n/).filter(Boolean).join("\n> ") + "\n\n"
        : "";
      const reviewerBlock = reviewer
        ? "> " + reviewer.split(/\r?\n/).filter(Boolean).join("\n> ") + "\n\n"
        : "";
      body = `${headerImg}# ${title}\n\n${authorBlock}${reviewerBlock}${noH1}`;
    }
  }

  return {
    year,
    sessionIds: ids,
    dir: dirName,
    title,
    intro: plainText(summary),
    author: plainText(author, 200),
    reviewer: plainText(reviewer, 200),
    bannerRel,
    bodyMd: body,
    sourceDir: sessionDir,
  };
}

// WWDC21 heuristic: explore each session_* dir and possible nested sub-sessions.
async function extractWWDC21(sessionDir) {
  // If parent has its own .md files -> single session here.
  // Otherwise walk one level and treat each child dir with .md files as a sub-session.
  const entries = await fsp.readdir(sessionDir, { withFileTypes: true });
  const hasMdHere = entries.some(
    (e) => e.isFile() && e.name.toLowerCase().endsWith(".md"),
  );
  if (hasMdHere) {
    const meta = await extract21Single(sessionDir);
    return meta ? [meta] : [];
  }
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const sub = path.join(sessionDir, e.name);
    const subEntries = await fsp.readdir(sub, { withFileTypes: true });
    const subHasMd = subEntries.some(
      (x) => x.isFile() && x.name.toLowerCase().endsWith(".md"),
    );
    if (!subHasMd) continue;
    const meta = await extract21Single(sub, path.basename(sessionDir));
    if (meta) out.push(meta);
  }
  return out;
}

async function extract21Single(sessionDir, parentName) {
  const dirName = path.basename(sessionDir);
  const entries = await fsp.readdir(sessionDir, { withFileTypes: true });
  const mdFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
    .map((e) => e.name);
  if (mdFiles.length === 0) return null;

  // Pick intro file: highest-priority candidate
  let introFile = null;
  for (const c of INTRO_FILE_CANDIDATES) {
    if (mdFiles.includes(c)) {
      introFile = c;
      break;
    }
  }

  // Pick body file: largest non-intro .md
  const bodyCandidates = mdFiles.filter((n) => n !== introFile);
  let bodyFile = null;
  if (bodyCandidates.length > 0) {
    let bestSize = -1;
    for (const n of bodyCandidates) {
      const st = await fsp.stat(path.join(sessionDir, n));
      if (st.size > bestSize) {
        bestSize = st.size;
        bodyFile = n;
      }
    }
  }
  // If only intro (no body) and intro has substantial content, use intro as body.
  if (!bodyFile && introFile) {
    bodyFile = introFile;
    introFile = null;
  }
  if (!bodyFile) return null;

  const bodyRaw = await fsp.readFile(path.join(sessionDir, bodyFile), "utf8");
  const body = stripFrontMatter(bodyRaw);

  let introRaw = "";
  let sections = {};
  if (introFile) {
    introRaw = await fsp.readFile(path.join(sessionDir, introFile), "utf8");
    sections = parseSections(introRaw);
  }

  let author = pickSection(sections, AUTHOR_HEADINGS);
  let reviewer = pickSection(sections, REVIEWER_HEADINGS);
  let summary = pickSection(sections, SUMMARY_HEADINGS);

  // Some 21 introsuse h3 like "### About Me" / "### 文章简介"; parseSections handled them as ## too
  // Fallback patterns inside intro file (### + plain field)
  if (introRaw && (!author || !summary)) {
    const sec3 = parseSections(introRaw.replace(/^###\s+/gm, "## "));
    author = author || pickSection(sec3, AUTHOR_HEADINGS) || pickSection(sec3, ["About Me"]);
    reviewer = reviewer || pickSection(sec3, REVIEWER_HEADINGS);
    summary = summary || pickSection(sec3, SUMMARY_HEADINGS) || pickSection(sec3, ["简介", "标题"]);
  }

  // Fallback: parse the leading > quote block of body for "作者:"/"审核:"
  if (!author || !reviewer) {
    const top = body.split(/\n##?\s/, 1)[0] || "";
    const quoteLines = top
      .split(/\r?\n/)
      .filter((l) => /^\s*>/.test(l))
      .map((l) => l.replace(/^\s*>\s?/, "").trim())
      .filter(Boolean);
    for (const ql of quoteLines) {
      if (!author) {
        const m = ql.match(/^(?:作者|Author)\s*[:：]\s*(.+)$/i);
        if (m) author = m[1].trim();
      }
      if (!reviewer) {
        const m = ql.match(/^(?:审核|Reviewer)\s*[:：]\s*(.+)$/i);
        if (m) reviewer = m[1].trim();
      }
    }
  }
  // If no summary, use first non-quote, non-image, non-heading paragraph
  if (!summary) {
    const blocks = body.split(/\n\s*\n/);
    for (const b of blocks) {
      const trimmed = b.trim();
      if (!trimmed) continue;
      if (/^#/.test(trimmed)) continue;
      if (/^>/.test(trimmed)) continue;
      if (/^!\[/.test(trimmed)) continue;
      if (/^\[?[A-Za-z]+:/.test(trimmed) && trimmed.length < 60) continue;
      summary = trimmed;
      break;
    }
  }

  // Banner: file in dir or first body image
  let bannerRel = null;
  for (const c of BANNER_FILE_CANDIDATES) {
    if (entries.find((e) => e.isFile() && e.name === c)) {
      bannerRel = c;
      break;
    }
  }
  if (!bannerRel) {
    // Any image file directly in dir
    const img = entries.find(
      (e) =>
        e.isFile() &&
        /\.(png|jpe?g|webp|gif)$/i.test(e.name) &&
        !/\.mov$/i.test(e.name),
    );
    if (img) bannerRel = img.name;
  }
  if (!bannerRel) bannerRel = firstImageInMd(body);

  const ids = extractIdsFromDirName(dirName);
  if (ids.length === 0 && parentName) ids.push(...extractIdsFromDirName(parentName));
  // Title preference: H1 in body > body filename (without .md) > dir name
  let title = firstHeading(body);
  if (!title) {
    const stem = bodyFile.replace(/\.md$/i, "").trim();
    if (stem && !/^\d+$/.test(stem)) title = stem;
  }
  if (!title) title = dirName;

  return {
    year: 2021,
    sessionIds: ids,
    dir: parentName ? `${parentName}__${dirName}` : dirName,
    title,
    intro: plainText(summary),
    author: plainText(author, 200),
    reviewer: plainText(reviewer, 200),
    bannerRel,
    bodyMd: body,
    sourceDir: sessionDir,
  };
}

// ---------- rendering ----------

function injectLazyAttrs(html) {
  // Add loading=lazy / decoding=async to <img> tags that lack them.
  return html.replace(/<img\b([^>]*)>/g, (m, attrs) => {
    let a = attrs;
    if (!/\bloading=/.test(a)) a += ' loading="lazy"';
    if (!/\bdecoding=/.test(a)) a += ' decoding="async"';
    if (!/\breferrerpolicy=/.test(a)) a += ' referrerpolicy="no-referrer"';
    return `<img${a}>`;
  });
}

function renderArticleHtml(meta) {
  const html = injectLazyAttrs(marked.parse(meta.bodyMd));
  const title = htmlEscape(meta.title);
  const yearLabel = `WWDC${String(meta.year).slice(-2)}`;
  const idsLabel = meta.sessionIds.length > 0
    ? meta.sessionIds.join(" / ")
    : "";
  return `<!doctype html>
<html lang="zh-Hans">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title} - WWDC 内参合集</title>
<link rel="preload" href="../../../assets/page.css" as="style">
<link rel="stylesheet" href="../../../assets/page.css">
<link rel="stylesheet" href="../../../assets/article.css">
</head>
<body>
<header class="article-topbar">
  <a class="back" href="../../../index.html" aria-label="返回首页">
    <span aria-hidden="true">←</span>
    <span>返回列表</span>
  </a>
  <span class="badge">${yearLabel}${idsLabel ? " · " + idsLabel : ""}</span>
</header>
<main id="nice" class="article">
${html}
</main>
<footer class="article-footer">
  <a href="../../../index.html">回到首页</a>
</footer>
</body>
</html>
`;
}

// ---------- main pipeline ----------

async function buildSession(meta) {
  const yearKey = `wwdc${String(meta.year).slice(-2)}`;
  const outDir = path.join(SESSIONS_OUT, yearKey, meta.dir);
  await ensureDir(outDir);

  // Copy known resource subdirs from source
  const srcEntries = await fsp.readdir(meta.sourceDir, { withFileTypes: true });
  for (const e of srcEntries) {
    if (e.isDirectory() && RESOURCE_DIR_NAMES.has(e.name.toLowerCase())) {
      await copyResourceDir(
        path.join(meta.sourceDir, e.name),
        path.join(outDir, e.name),
      );
    } else if (e.isFile()) {
      const lower = e.name.toLowerCase();
      // Copy banner-candidate images directly so banner relative paths still work.
      if (/\.(png|jpe?g|webp|gif|svg)$/i.test(e.name)) {
        await copyFile(
          path.join(meta.sourceDir, e.name),
          path.join(outDir, e.name),
        );
      }
    }
  }

  const html = renderArticleHtml(meta);
  await fsp.writeFile(path.join(outDir, "index.html"), html, "utf8");

  // Resolve banner URL relative to site root
  let bannerUrl = null;
  if (meta.bannerRel) {
    if (/^https?:\/\//i.test(meta.bannerRel)) {
      bannerUrl = meta.bannerRel;
    } else {
      const cleanRel = meta.bannerRel.replace(/^\.\//, "");
      bannerUrl = `sessions/${yearKey}/${meta.dir}/${cleanRel}`
        .replace(/\\/g, "/")
        .replace(/\/+/g, "/");
    }
  }

  return {
    year: meta.year,
    sessionIds: meta.sessionIds,
    dir: meta.dir,
    url: `sessions/${yearKey}/${meta.dir}/`,
    title: meta.title,
    intro: meta.intro,
    author: meta.author,
    reviewer: meta.reviewer,
    banner: bannerUrl,
  };
}

async function listSessionDirs(yearDir, prefixRe) {
  if (!exists(yearDir)) return [];
  const entries = await fsp.readdir(yearDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && prefixRe.test(e.name))
    .map((e) => path.join(yearDir, e.name));
}

async function main() {
  console.log("Cleaning output dir:", OUT);
  await rmrf(OUT);
  await ensureDir(OUT);
  await ensureDir(ASSET_OUT);
  await ensureDir(DATA_OUT);
  await ensureDir(SESSIONS_OUT);

  const indexEntries = [];

  // WWDC21 (lowercase session_*) + capital-S Sessions/
  const w21Dir = path.join(ROOT, "WWDC21");
  const w21Lower = await listSessionDirs(w21Dir, /^session[-_]/i);
  const w21SessionsDir = path.join(w21Dir, "Sessions");
  const w21Capital = exists(w21SessionsDir)
    ? (await fsp.readdir(w21SessionsDir, { withFileTypes: true }))
        .filter((e) => e.isDirectory())
        .map((e) => path.join(w21SessionsDir, e.name))
    : [];
  for (const d of [...w21Lower, ...w21Capital]) {
    if (/example/i.test(path.basename(d))) continue;
    try {
      const metas = await extractWWDC21(d);
      for (const meta of metas) {
        if (meta.sessionIds.length === 0) {
          console.warn("[WWDC21] skip (no id)", meta.dir);
          continue;
        }
        const entry = await buildSession(meta);
        indexEntries.push(entry);
      }
    } catch (err) {
      console.warn("[WWDC21] skip", d, err.message);
    }
  }

  // WWDC22
  const w22Dir = path.join(ROOT, "WWDC22", "sessions");
  for (const d of await listSessionDirs(w22Dir, /^session_/)) {
    try {
      const meta = await extractStructured(d, 2022, false);
      if (meta) indexEntries.push(await buildSession(meta));
    } catch (err) {
      console.warn("[WWDC22] skip", d, err.message);
    }
  }

  // WWDC23 (skip session_10000 sample)
  const w23Dir = path.join(ROOT, "WWDC23", "sessions");
  for (const d of await listSessionDirs(w23Dir, /^session_/)) {
    if (path.basename(d) === "session_10000") continue;
    try {
      const meta = await extractStructured(d, 2023, true);
      if (meta) indexEntries.push(await buildSession(meta));
    } catch (err) {
      console.warn("[WWDC23] skip", d, err.message);
    }
  }

  // WWDC24
  const w24Dir = path.join(ROOT, "WWDC24");
  for (const d of await listSessionDirs(w24Dir, /^session_/)) {
    try {
      const meta = await extractStructured(d, 2024, true);
      if (meta) indexEntries.push(await buildSession(meta));
    } catch (err) {
      console.warn("[WWDC24] skip", d, err.message);
    }
  }

  // Sort: newer year first, then session id ascending
  indexEntries.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    const ai = parseInt(a.sessionIds[0] || "0", 10);
    const bi = parseInt(b.sessionIds[0] || "0", 10);
    return ai - bi;
  });

  await fsp.writeFile(
    path.join(DATA_OUT, "index.json"),
    JSON.stringify(indexEntries, null, 2),
    "utf8",
  );

  // Copy page.css from asserts/
  const cssSrc = path.join(ROOT, "asserts", "page.css");
  if (exists(cssSrc)) {
    await copyFile(cssSrc, path.join(ASSET_OUT, "page.css"));
  } else {
    console.warn("Missing asserts/page.css");
  }

  // Write static assets and index.html
  await fsp.writeFile(path.join(ASSET_OUT, "app.css"), APP_CSS, "utf8");
  await fsp.writeFile(path.join(ASSET_OUT, "app.js"), APP_JS, "utf8");
  await fsp.writeFile(path.join(ASSET_OUT, "article.css"), ARTICLE_CSS, "utf8");
  await fsp.writeFile(path.join(OUT, "index.html"), INDEX_HTML, "utf8");

  // Site README
  await fsp.writeFile(path.join(OUT, "README.md"), SITE_README, "utf8");

  console.log(`Built ${indexEntries.length} sessions into ${OUT}`);
}

// ---------- static templates ----------

const INDEX_HTML = `<!doctype html>
<html lang="zh-Hans">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>WWDC 内参合集 · 老司机技术周报</title>
<meta name="description" content="WWDC 内参 系列：由「老司机技术」牵头组织的精品原创内容，支持按标题、简介、作者关键字搜索。">
<link rel="preload" href="assets/app.css" as="style">
<link rel="stylesheet" href="assets/app.css">
</head>
<body>
<header class="hero">
  <div class="hero-inner">
    <h1>WWDC 内参合集</h1>
    <p class="subtitle">WWDC 内参 系列是由「老司机技术」牵头组织的精品原创内容系列。已经做了几年了，口碑一直不错。和往年不同，今年几乎没有脱水稿了，得益于组建的审核团队和不断优化的创作流程，大家创作的内容都已经超越了视频本身的内容，非常有学习和参考意义。</p>
    <p class="note">注：部分 WWDC21 的文章由于某平台已不再维护，图已丢失无法寻回。</p>
    <div class="search-row">
      <input
        id="q"
        type="search"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        autofocus
        placeholder="搜索标题 / 简介 / 作者 / 审核"
        aria-label="搜索"
      >
    </div>
    <div class="filters" role="group" aria-label="按年份过滤">
      <button class="chip" data-year="all" data-active="true">全部</button>
      <button class="chip" data-year="2024">WWDC24</button>
      <button class="chip" data-year="2023">WWDC23</button>
      <button class="chip" data-year="2022">WWDC22</button>
      <button class="chip" data-year="2021">WWDC21</button>
    </div>
    <div class="meta-row">
      <span id="count" class="count">加载中…</span>
    </div>
  </div>
</header>
<main>
  <ul id="grid" class="grid" role="list"></ul>
  <div id="empty" class="empty" hidden>未找到相关内容。试试更换关键字。</div>
</main>
<footer class="site-footer">
  <p>内容来自老司机技术周报《WWDC 内参》系列。本站仅作技术学习索引使用。</p>
</footer>
<script src="assets/app.js" defer></script>
</body>
</html>
`;

const APP_CSS = `:root {
  --bg: #f6f7fb;
  --bg-elev: #ffffff;
  --text: #1f2937;
  --text-soft: #4b5563;
  --text-muted: #6b7280;
  --accent: #ffb11b;
  --accent-soft: #fff4d6;
  --primary: #26324f;
  --primary-soft: #3f5481;
  --border: #e5e7eb;
  --shadow: 0 1px 2px rgba(15, 23, 42, .04), 0 4px 12px rgba(15, 23, 42, .06);
  --shadow-hover: 0 2px 6px rgba(15, 23, 42, .06), 0 12px 28px rgba(15, 23, 42, .12);
  --radius: 12px;
  --radius-sm: 8px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-size-adjust: 100%;
}

a { color: inherit; text-decoration: none; }
button { font: inherit; }

.hero {
  background: linear-gradient(180deg, #fffaee 0%, #f6f7fb 100%);
  border-bottom: 1px solid var(--border);
  padding: 48px 24px 28px;
}
.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.hero h1 {
  margin: 0 0 12px;
  font-size: 32px;
  letter-spacing: 0.5px;
  color: var(--primary);
  border-bottom: none;
}
.hero .subtitle {
  margin: 0 0 8px;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.85;
  max-width: 920px;
}
.hero .note {
  margin: 0 0 20px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.search-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.search-row input[type="search"] {
  flex: 1;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 16px;
  font-size: 16px;
  background: #fff;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
  -webkit-appearance: none;
}
.search-row input[type="search"]:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.chip {
  appearance: none;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-soft);
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
  transition: background .15s, border-color .15s, color .15s;
}
.chip:hover { border-color: var(--primary-soft); }
.chip[data-active="true"] {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 13px;
  min-height: 18px;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 24px 60px;
}

.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.card {
  display: flex;
  flex-direction: column;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: transform .15s ease, box-shadow .2s ease, border-color .15s;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  border-color: #d1d5db;
}
.card a.link {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: inherit;
}

.thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #eef0f5, #dde2eb);
  overflow: hidden;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform .25s ease;
}
.card:hover .thumb img { transform: scale(1.03); }
.thumb .badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(38, 50, 79, .92);
  color: #fff;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  letter-spacing: 0.3px;
  backdrop-filter: blur(6px);
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9aa3b2;
  font-size: 14px;
  letter-spacing: 1px;
}

.body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.intro {
  font-size: 13px;
  color: var(--text-soft);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}
.byline {
  border-top: 1px solid var(--border);
  padding-top: 10px;
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.byline span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.byline .label {
  color: #9aa3b2;
  margin-right: 4px;
}
mark {
  background: var(--accent-soft);
  color: var(--primary);
  padding: 0 2px;
  border-radius: 3px;
}

.empty {
  text-align: center;
  padding: 80px 0;
  color: var(--text-muted);
}

.site-footer {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  padding: 20px 24px 32px;
  border-top: 1px solid var(--border);
  background: var(--bg-elev);
}
.site-footer p { margin: 0; }

@media (max-width: 640px) {
  .hero { padding: 28px 16px 20px; }
  .hero h1 { font-size: 26px; }
  main { padding: 20px 16px 40px; }
  .grid { grid-template-columns: 1fr; gap: 14px; }
}
`;

const ARTICLE_CSS = `body {
  margin: 0;
  background: #fafbfc;
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.article-topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid #e5e7eb;
  padding: 10px 20px;
  font-size: 14px;
}
.article-topbar .back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #26324f;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 8px;
  transition: background .15s;
}
.article-topbar .back:hover { background: #f3f4f6; }
.article-topbar .badge {
  font-size: 12px;
  letter-spacing: .3px;
  color: #fff;
  background: #26324f;
  padding: 4px 10px;
  border-radius: 999px;
}
#nice.article {
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  background: transparent;
}
#nice.article img {
  max-width: 100%;
  height: auto;
}
#nice.article pre {
  background: #1f2937;
  color: #f9fafb;
  padding: 14px 16px;
  border-radius: 10px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}
#nice.article pre code {
  background: transparent;
  color: inherit;
  padding: 0;
  font-size: inherit;
  line-height: inherit;
}
#nice.article table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
  font-size: 14px;
}
#nice.article table th,
#nice.article table td {
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
}
#nice.article table th {
  background: #f3f4f6;
}
#nice.article a {
  word-break: break-word;
}
.article-footer {
  text-align: center;
  padding: 20px 16px 40px;
  font-size: 13px;
  color: #6b7280;
}
.article-footer a {
  color: #3f5481;
  text-decoration: underline;
}
@media (max-width: 640px) {
  #nice.article { padding: 20px 16px 40px; }
}
`;

const APP_JS = `(() => {
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const input = document.getElementById("q");
  const countEl = document.getElementById("count");
  const chips = Array.from(document.querySelectorAll(".chip"));

  const state = {
    q: "",
    years: new Set(["all"]),
    items: [],
    rendered: 0,
  };
  const PAGE = 60;

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    const safe = escapeHtml(text);
    const tokens = q.split(/\\s+/).filter(Boolean).map(escapeHtml);
    if (tokens.length === 0) return safe;
    const pattern = new RegExp("(" + tokens.map(t => t.replace(/[.*+?^\${}()|\\[\\]\\\\]/g, "\\\\$&")).join("|") + ")", "gi");
    return safe.replace(pattern, "<mark>$1</mark>");
  }
  function fmtYear(y) { return "WWDC" + String(y).slice(-2); }

  function matches(item, q) {
    if (!q) return true;
    const haystack = [
      item.title, item.intro, item.author, item.reviewer,
      (item.sessionIds || []).join(" "),
    ].join(" ").toLowerCase();
    const tokens = q.toLowerCase().split(/\\s+/).filter(Boolean);
    return tokens.every(t => haystack.includes(t));
  }

  function filteredItems() {
    const q = state.q.trim();
    const years = state.years;
    return state.items.filter(it => {
      if (!years.has("all") && !years.has(String(it.year))) return false;
      return matches(it, q);
    });
  }

  function cardHtml(it, q) {
    const idLabel = (it.sessionIds && it.sessionIds.length) ? it.sessionIds.join(" / ") : "";
    const badge = fmtYear(it.year) + (idLabel ? " · " + idLabel : "");
    const thumb = it.banner
      ? '<img src="' + escapeHtml(it.banner) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement(\\'div\\'),{className:\\'thumb-placeholder\\',textContent:\\'WWDC\\'}))">'
      : '<div class="thumb-placeholder">WWDC</div>';
    const author = it.author ? '<span><span class="label">作者</span>' + highlight(it.author, q) + '</span>' : "";
    const reviewer = it.reviewer ? '<span><span class="label">审核</span>' + highlight(it.reviewer, q) + '</span>' : "";
    const intro = it.intro ? '<p class="intro">' + highlight(it.intro, q) + '</p>' : '<p class="intro" style="color:#9aa3b2">无简介</p>';
    return ''
      + '<li class="card">'
      +   '<a class="link" href="' + escapeHtml(it.url) + '">'
      +     '<div class="thumb"><span class="badge">' + escapeHtml(badge) + '</span>' + thumb + '</div>'
      +     '<div class="body">'
      +       '<h2 class="title">' + highlight(it.title, q) + '</h2>'
      +       intro
      +       (author || reviewer ? '<div class="byline">' + author + reviewer + '</div>' : '')
      +     '</div>'
      +   '</a>'
      + '</li>';
  }

  // Sentinel for infinite scroll
  const sentinel = document.createElement("li");
  sentinel.style.gridColumn = "1 / -1";
  sentinel.style.height = "1px";
  sentinel.style.listStyle = "none";
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) appendMore();
    }
  }, { rootMargin: "600px 0px" });

  function render() {
    const list = filteredItems();
    state.rendered = Math.min(PAGE, list.length);
    const q = state.q.trim();
    const html = list.slice(0, state.rendered).map(it => cardHtml(it, q)).join("");
    grid.innerHTML = html;
    grid.appendChild(sentinel);
    empty.hidden = list.length !== 0;
    countEl.textContent = list.length === state.items.length
      ? "共 " + list.length + " 篇"
      : "命中 " + list.length + " / " + state.items.length + " 篇";
    io.unobserve(sentinel);
    if (list.length > state.rendered) io.observe(sentinel);
  }

  function appendMore() {
    const list = filteredItems();
    const q = state.q.trim();
    const next = list.slice(state.rendered, state.rendered + PAGE);
    if (next.length === 0) return;
    sentinel.remove();
    grid.insertAdjacentHTML("beforeend", next.map(it => cardHtml(it, q)).join(""));
    grid.appendChild(sentinel);
    state.rendered += next.length;
    if (state.rendered >= list.length) io.unobserve(sentinel);
  }

  let debounceTimer = null;
  function onSearch(v) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.q = v;
      syncHash();
      render();
    }, 180);
  }

  function setYears(y) {
    if (y === "all") {
      state.years = new Set(["all"]);
    } else {
      state.years.delete("all");
      if (state.years.has(y)) state.years.delete(y);
      else state.years.add(y);
      if (state.years.size === 0) state.years = new Set(["all"]);
    }
    chips.forEach(c => {
      const v = c.dataset.year;
      c.dataset.active = state.years.has(v) ? "true" : "false";
    });
    syncHash();
    render();
  }

  function readHash() {
    const h = location.hash.slice(1);
    if (!h) return;
    const params = new URLSearchParams(h);
    const q = params.get("q") || "";
    const years = params.get("y") || "all";
    state.q = q;
    state.years = new Set(years.split(",").filter(Boolean));
    if (state.years.size === 0) state.years = new Set(["all"]);
    if (input) input.value = q;
    chips.forEach(c => {
      const v = c.dataset.year;
      c.dataset.active = state.years.has(v) ? "true" : "false";
    });
  }

  function syncHash() {
    const params = new URLSearchParams();
    if (state.q) params.set("q", state.q);
    const years = Array.from(state.years).join(",");
    if (years && years !== "all") params.set("y", years);
    const newHash = params.toString();
    const target = newHash ? "#" + newHash : "#";
    if (location.hash !== target) {
      history.replaceState(null, "", target);
    }
  }

  // Bind UI
  input.addEventListener("input", (e) => onSearch(e.target.value));
  chips.forEach(c => c.addEventListener("click", () => setYears(c.dataset.year)));
  window.addEventListener("hashchange", () => { readHash(); render(); });

  fetch("data/index.json", { cache: "no-cache" })
    .then(r => r.json())
    .then(items => {
      state.items = items;
      readHash();
      render();
    })
    .catch(err => {
      console.error(err);
      countEl.textContent = "加载失败";
      empty.hidden = false;
      empty.textContent = "数据加载失败：" + err.message;
    });
})();
`;

const SITE_README = `# WWDC 内参合集 静态站点

GitHub Pages 静态站点，索引 WWDC21 / 22 / 23 / 24 的中文图文笔记。

> 本目录由 \`npm run build\` 自动生成，不要手动编辑；也不要把 \`.site/\` 提交到 git（已在 \`.gitignore\` 中）。

## 自动部署

每次推送到 \`main\` 分支会触发 [\`.github/workflows/deploy.yml\`](../.github/workflows/deploy.yml)：在 runner 上执行 \`npm ci && npm run build\`，并把 \`.site/\` 作为 Pages artifact 上传部署。

一次性配置（仓库管理员）：

1. Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**
2. （可选）Settings → Actions → Runners 注册一台 self-hosted runner，工作流默认优先使用它

手动重跑：Actions 页面打开 *Deploy site to GitHub Pages* → *Run workflow*，可下拉选 \`self-hosted\` 或 \`ubuntu-latest\`（self-hosted 排队/掉线时用 ubuntu-latest 兜底）。

## 本地预览

\`\`\`bash
npm install      # 首次
npm run build    # 生成 .site/
npm run preview  # 默认 http://localhost:4173
\`\`\`

或使用任意静态文件服务器：

\`\`\`bash
python3 -m http.server 4173 --directory .site
\`\`\`

## 结构

- \`index.html\` 首页：搜索 + 年份过滤 + 卡片网格
- \`assets/\` 样式与脚本（\`page.css\` 来自仓库根 \`asserts/page.css\`）
- \`data/index.json\` 客户端搜索使用的元数据
- \`sessions/wwdc{21..24}/<dir>/\` 每篇预渲染 HTML 与图片资源
`;

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const BANNED_WORDS = [
  'delve', 'foster', 'leverage', 'utilize', 'facilitate', 'empower', 'streamline',
  'robust', 'cutting-edge', 'paradigm shift', 'game changer', 'this is huge',
  'this changes everything', 'tapestry', 'realm', 'beacon', 'multifaceted',
  'meticulous', 'intricate', 'paramount', 'transformative', 'elevate', 'embark',
  'supercharge', 'harness', 'ever-evolving'
];

const EMPTY_PHRASES = [
  "it's worth noting", "it’s worth noting", 'it is worth noting',
  "it's important to note", "it’s important to note", 'it is important to note',
  'at the end of the day', 'when it comes to', 'at its core', "in today's world",
  'in the age of', 'in the world of', 'the reality is', 'the truth is',
  'in terms of', 'with regard to', 'in order to', 'going forward',
  'in this article', "let's dive in", 'let’s dive in'
];

const SLOP_PATTERNS = [
  {id: 'throat-clearing', label: 'Throat-clearing opener', severity: 'error',
    re: /\b(here'?s the thing|here'?s what i mean|let me be clear|i'?ll be honest|the uncomfortable truth is)\b/gi},
  {id: 'faux-insight', label: 'Faux-insight setup', severity: 'error',
    re: /\b(this is the part most people skip|what most people get wrong|here'?s what nobody tells you|the part everyone misses)\b/gi},
  {id: 'importance-puffery', label: 'Importance puffery', severity: 'error',
    re: /\b(stands as a testament|marks a pivotal moment|plays a vital role|solidifies its position|underscores its significance)\b/gi},
  {id: 'interpretive-metadiscourse', label: 'Interpretive metadiscourse', severity: 'error',
    re: /\b(the key point is|that last part matters|as you can see|this distinction matters|in other words)\b/gi},
  {id: 'weasel-attribution', label: 'Weasel attribution', severity: 'error',
    re: /\b(experts agree|industry reports suggest|many argue|widely regarded as|studies show)\b/gi},
  {id: 'rhetorical-setup', label: 'Rhetorical setup', severity: 'error',
    re: /\b(what if i told you|think about it:|plot twist:)\b/gi},
  {id: 'superficial-analysis', label: 'Superficial analysis', severity: 'error',
    re: /,\s+(highlighting|underscoring|reflecting|showcasing)\b/gi},
  {id: 'binary-contrast', label: 'Binary contrast', severity: 'error',
    re: /\b(?:not|isn't|aren't|wasn't|weren't)\s+(?:just|only|merely)\b[^.!?\n]{0,80}[.!?]\s*(?:it'?s|they'?re|it is|they are)\b/gi},
  {id: 'negative-listing', label: 'Negative listing', severity: 'error',
    re: /\bnot (?:a|an) [^.!?\n]{1,40}\.\s*not (?:a|an) /gi},
  {id: 'summary-recap', label: 'Summary-recap phrase', severity: 'warning',
    re: /\b(in conclusion|ultimately|overall)\b/gi},
  {id: 'generic-opener', label: 'Generic opener', severity: 'error',
    re: /^(?:a|the) (?:good|best|right) [^.!?\n]{1,60} starts with\b/i},
  {id: 'generic-opener', label: 'Generic opener', severity: 'error',
    re: /^(?:when it comes to|in today'?s|in the age of|in the world of|if you'?re looking for|whether you'?re)\b/i}
];

const CONTENT_EXTENSIONS = new Set(['.md', '.mdx', '.ts', '.tsx', '.json', '.html', '.txt']);
const CODE_PREFIX = /^(?:import|export|const|let|var|function|type|interface|class|return|if|for|while|switch|case|break|continue|declare|namespace|module)\b/;
const CODE_MARKERS = /(?:className=|style=|href=|src=|onClick=|data-|aria-|=>|require\(|import\()/;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseArgs(argv) {
  const options = {changed: false, repo: process.cwd(), repoExplicit: false, minWords: 0, requireCta: false, json: false, files: [], quiet: false};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--changed') options.changed = true;
    else if (arg === '--repo') {
      options.repo = argv[++i];
      options.repoExplicit = true;
    }
    else if (arg === '--min-words') options.minWords = Number(argv[++i]);
    else if (arg === '--require-cta') options.requireCta = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--quiet') options.quiet = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
    else options.files.push(arg);
  }
  if (!Number.isFinite(options.minWords) || options.minWords < 0) throw new Error('--min-words must be a non-negative number');
  if (options.changed && !options.repoExplicit && options.files.length === 1) {
    options.repo = options.files.shift();
  }
  if (options.changed && options.files.length > 0) {
    throw new Error('Use --repo <path> with --changed; positional file paths are not allowed in changed mode.');
  }
  return options;
}

function git(repo, args) {
  try {
    return execFileSync('git', ['-C', repo, ...args], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']});
  } catch {
    return '';
  }
}

function parseAddedLines(diff) {
  const lines = new Set();
  for (const line of diff.split(/\r?\n/)) {
    const match = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (!match) continue;
    const start = Number(match[1]);
    const count = match[2] === undefined ? 1 : Number(match[2]);
    for (let i = 0; i < count; i += 1) lines.add(start + i);
  }
  return lines;
}

function listChanged(repo) {
  const files = new Map();
  const add = (file, addedLines) => {
    if (!files.has(file)) files.set(file, addedLines);
    else if (files.get(file) !== null) {
      if (addedLines === null) files.set(file, null);
      else for (const number of addedLines) files.get(file).add(number);
    }
  };
  const names = (args) => git(repo, args).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (const file of names(['diff', '--name-only', '--diff-filter=ACMR'])) {
    add(file, parseAddedLines(git(repo, ['diff', '-U0', '--', file])));
  }
  for (const file of names(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])) {
    add(file, parseAddedLines(git(repo, ['diff', '--cached', '-U0', '--', file])));
  }
  for (const file of names(['ls-files', '--others', '--exclude-standard'])) {
    add(file, null);
  }
  for (const file of names(['diff', '--name-only', '--diff-filter=ACMR', 'origin/main...HEAD'])) {
    add(file, parseAddedLines(git(repo, ['diff', '-U0', 'origin/main...HEAD', '--', file])));
  }
  return [...files.entries()].map(([file, addedLines]) => ({file, addedLines}));
}

function isContentFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (!CONTENT_EXTENSIONS.has(ext)) return false;
  const normalized = file.replace(/\\/g, '/').toLowerCase();
  if (normalized.includes('node_modules/')) return false;
  if (normalized.includes('/.opencode/') || normalized.startsWith('.opencode/')) return false;
  if (normalized.includes('/source-assets/') || normalized.startsWith('source-assets/')) return false;
  if (normalized.endsWith('package-lock.json') || normalized.endsWith('tsconfig.json')) return false;
  if (normalized.endsWith('.test.ts') || normalized.endsWith('.test.tsx') || normalized.endsWith('.spec.ts') || normalized.endsWith('.spec.tsx')) return false;
  return /(^|\/)(src|content|docs|public)\//.test(normalized) || normalized.endsWith('.md') || normalized.endsWith('.mdx');
}

function isArticleFile(file) {
  const base = path.basename(file).toLowerCase();
  const normalized = file.replace(/\\/g, '/').toLowerCase();
  if (['growguidearticle.tsx','growguides.ts'].includes(base)) return false;
  if (/(guide|comparison|article|buying|review)/.test(base)) return true;
  if (normalized.includes('/grow-guides/') && /\.(md|mdx|ts|tsx)$/.test(base)) return true;
  if (/\.(md|mdx)$/.test(base) && /(^|\/)(content|src\/content|src\/pages|src\/data)\//.test(normalized)) return true;
  return false;
}

function isProseLine(line) {
  const text = line.trim();
  if (!text) return false;
  if (/^```/.test(text)) return false;
  if (CODE_PREFIX.test(text)) return false;
  if (CODE_MARKERS.test(text)) return false;
  if (/^[\s{}()[\],;:<>/\\|&+*=-]+$/.test(text)) return false;
  return /[A-Za-z]{2,}/.test(text);
}

function excerpt(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 160 ? `${clean.slice(0, 157)}...` : clean;
}

function scanFile(file, options, addedLines, explicit) {
  const text = fs.readFileSync(file, 'utf8');
  const errors = [];
  const warnings = [];
  const legacy = {emDashes: 0, mdashEntities: 0};
  const lines = text.split(/\r?\n/);
  const isArticle = explicit || isArticleFile(file);
  const isAdded = (lineNumber) => addedLines === null || addedLines.has(lineNumber);
  let inFence = false;
  let words = 0;

  const add = (target, rule, message, lineNumber, sample) => {
    target.push({file, line: lineNumber, rule, message, excerpt: excerpt(sample)});
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }

    if (line.includes('\u2014')) {
      if (isAdded(lineNumber)) add(errors, 'em-dash', 'Em dash found. Use a period, comma, colon, semicolon, or parentheses.', lineNumber, line);
      else legacy.emDashes += 1;
    }
    if (/&mdash;/i.test(line)) {
      if (isAdded(lineNumber)) add(errors, 'mdash-entity', 'HTML em dash entity found. Use plain punctuation.', lineNumber, line);
      else legacy.mdashEntities += 1;
    }

    if (inFence || !isProseLine(line)) return;

    words += (line.match(/[A-Za-z0-9][A-Za-z0-9'’\-–]*/g) || []).length;

    if (!isAdded(lineNumber)) return;

    const prose = line
      .replace(/^\s*(?:"[^"]*"|'[^']*')\s*:\s*/, '')
      .replace(/^\s*["'`]/, '');
    const lower = prose.toLowerCase();
    for (const word of BANNED_WORDS) {
      const re = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
      if (re.test(prose)) add(errors, 'banned-word', `Banned word: ${word}`, lineNumber, line);
    }
    for (const phrase of EMPTY_PHRASES) {
      if (lower.includes(phrase)) add(errors, 'empty-phrase', `Empty phrase: ${phrase}`, lineNumber, line);
    }
    for (const pattern of SLOP_PATTERNS) {
      pattern.re.lastIndex = 0;
      if (pattern.re.test(prose)) {
        add(pattern.severity === 'error' ? errors : warnings, pattern.id, pattern.label, lineNumber, line);
      }
    }
  });

  if (options.minWords > 0 && isArticle && words < options.minWords) {
    add(errors, 'word-count', `Only ${words} words. Minimum for this page is ${options.minWords}.`, 1, `${words} words`);
  }

  if (options.requireCta && isArticle && !/\/grow-tech|\/checkout|apps\.apple\.com|play\.google\.com|\bbuy\b|\border\b|\bshop\b|\bcheckout\b|\bdownload\b/i.test(text)) {
    add(errors, 'missing-cta', 'No product, app-store or checkout call to action found.', 1, 'No CTA');
  }

  return {file, words, isArticle, errors, warnings, legacy};
}

function printHelp() {
  console.log(`Usage: node scripts/check-content-quality.mjs [options] [files...]

Options:
  --changed [repo]     Scan files changed in the current git worktree or branch.
  --repo <path>        Repository for --changed. Default: current directory.
  --min-words <n>      Fail if an article file has fewer than n prose words.
  --require-cta        Fail if an article file has no product or checkout link.
  --json               Print a JSON report.
  --quiet              Print only the summary.
  -h, --help           Show this help.

Hard rules: zero em dashes (U+2014 or &mdash;), no banned words, no empty
phrases, no AI-slop patterns. En dashes are allowed only in numeric ranges.
In --changed mode, only added lines are checked. Pre-existing em dashes on
unchanged locked lines are reported as legacy and do not fail the gate.`);
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return;
  }
  if (options.help) {
    printHelp();
    return;
  }

  const repo = path.resolve(options.repo);
  const entries = options.changed
    ? listChanged(repo).filter((entry) => isContentFile(entry.file))
    : options.files.map((file) => ({file, addedLines: null}));
  if (entries.length === 0) {
    if (options.changed) {
      console.log('Content quality: no changed content files.');
      return;
    }
    console.error('No content files to scan. Pass file paths or use --changed.');
    process.exitCode = 2;
    return;
  }

  const reports = [];
  for (const entry of entries) {
    const file = path.resolve(repo, entry.file);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
    reports.push(scanFile(file, options, entry.addedLines, !options.changed));
    if(path.basename(file)==='growGuides.ts'){
      const source=fs.readFileSync(file,'utf8');
      const starts=[...source.matchAll(/\{\s*"slug"\s*:\s*"([^"]+)"/g)];
      for(let i=0;i<starts.length;i++){
        const start=starts[i].index,end=starts[i+1]?.index??source.length;
        const first=source.slice(0,start).split('\n').length;
        const last=first+source.slice(start,end).split('\n').length;
        if(options.changed&&entry.addedLines&&!Array.from(entry.addedLines).some(n=>n>=first&&n<last))continue;
        const body=source.slice(start,end);const words=(body.match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g)||[]).length;
        const errors=[];
        if(options.minWords>0&&words<options.minWords)errors.push({file:file+'#'+starts[i][1],line:first,rule:'word-count',message:'Individual guide below minimum: '+words,excerpt:starts[i][1]});
        if(options.requireCta&&!/apps\.apple\.com|play\.google\.com|\/checkout|\/grow-tech/.test(body))errors.push({file:file+'#'+starts[i][1],line:first,rule:'missing-cta',message:'Individual guide needs a product CTA',excerpt:starts[i][1]});
        reports.push({file:file+'#'+starts[i][1],words,isArticle:true,errors,warnings:[],legacy:{emDashes:0,mdashEntities:0}});
      }
    }
  }

  const errors = reports.flatMap((report) => report.errors);
  const warnings = reports.flatMap((report) => report.warnings);
  const legacy = reports.reduce((total, report) => ({
    emDashes: total.emDashes + report.legacy.emDashes,
    mdashEntities: total.mdashEntities + report.legacy.mdashEntities
  }), {emDashes: 0, mdashEntities: 0});
  const result = {
    ok: errors.length === 0,
    scanned: reports.length,
    errors,
    warnings,
    legacy,
    files: reports.map((report) => ({
      file: report.file,
      words: report.words,
      isArticle: report.isArticle,
      errors: report.errors.length,
      warnings: report.warnings.length,
      legacy: report.legacy
    }))
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (!options.quiet) {
      for (const report of reports) {
        for (const item of [...report.errors, ...report.warnings]) {
          const label = item.rule === 'summary-recap' ? 'WARN' : 'ERROR';
          console.log(`${label} ${item.file}:${item.line} [${item.rule}] ${item.message}`);
          console.log(`      ${item.excerpt}`);
        }
      }
    }
    console.log(`Content quality: ${result.scanned} file(s), ${errors.length} error(s), ${warnings.length} warning(s).`);
    for (const file of result.files) {
      console.log(`  ${file.words} words  ${file.file}${file.isArticle ? '  [article]' : ''}`);
      if (file.legacy.emDashes || file.legacy.mdashEntities) {
        console.log(`  LEGACY ${file.legacy.emDashes} em dash(es), ${file.legacy.mdashEntities} &mdash; on unchanged locked lines. Not modified.`);
      }
    }
  }

  if (errors.length > 0) process.exitCode = 1;
}

main();

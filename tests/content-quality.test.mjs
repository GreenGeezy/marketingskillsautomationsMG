import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync, spawnSync} from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const checker = path.join(root, 'scripts', 'check-content-quality.mjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mgb-content-quality-'));

after(() => fs.rmSync(temp, {recursive: true, force: true}));

function write(name, text) {
  const file = path.join(temp, name);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, text, 'utf8');
  return file;
}

function run(args) {
  return spawnSync(process.execPath, [checker, ...args], {encoding: 'utf8'});
}

test('clean buyer copy passes the hard rules and the CTA check', () => {
  const file = write('clean.md', [
    '# 100W LED Grow Light Buying Guide',
    '',
    'The AG1000 costs $199 and includes a dimmer and a US plug.',
    'Check the return window, the shipping terms, and the package contents before ordering.',
    '',
    'Buy the AG1000 at /grow-tech#grow-light.'
  ].join('\n'));
  const result = run([file, '--min-words', '10', '--require-cta']);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /0 error\(s\)/);
});

test('em dash fails the gate', () => {
  const file = write('dash.md', 'The light is bright \u2014 and the dimmer is smooth.');
  const result = run([file]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /em-dash/);
});

test('HTML em dash entity fails the gate', () => {
  const file = write('entity.md', 'The light is bright &mdash; and the dimmer is smooth.');
  const result = run([file]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /mdash-entity/);
});

test('banned words fail the gate', () => {
  const file = write('banned.md', 'We leverage a robust process to streamline the order.');
  const result = run([file]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /banned-word/);
  assert.match(result.stdout, /leverage/);
});

test('throat-clearing and generic openers fail the gate', () => {
  const throat = write('throat.md', "Here's the thing: the light is bright.");
  const opener = write('opener.md', 'A good light purchase starts with a clear package.');
  const throatResult = run([throat]);
  const openerResult = run([opener]);
  assert.equal(throatResult.status, 1);
  assert.match(throatResult.stdout, /throat-clearing/);
  assert.equal(openerResult.status, 1);
  assert.match(openerResult.stdout, /generic-opener/);
});

test('generic openers inside TypeScript string fields are caught', () => {
  const file = write('guide.ts', [
    'export const guide = {',
    '  "intro": "A good light purchase starts with a clear package."',
    '};',
    ''
  ].join('\n'));
  const result = run([file]);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /generic-opener/);
});

test('thin pages and missing CTAs fail the gate', () => {
  const file = write('thin.md', 'The light is bright.');
  const words = run([file, '--min-words', '20']);
  const cta = run([file, '--require-cta']);
  assert.equal(words.status, 1);
  assert.match(words.stdout, /word-count/);
  assert.equal(cta.status, 1);
  assert.match(cta.stdout, /missing-cta/);
});

test('app-store CTAs satisfy the CTA check', () => {
  const file = write('app.md', 'Download MasterGrowbot AI from https://apps.apple.com/us/app/mastergrowbot-ai-grow-cannabis/id6752221060 and check the current subscription terms.');
  const result = run([file, '--require-cta']);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('en dashes in numeric ranges are allowed', () => {
  const file = write('range.md', 'Dimming runs from 20\u2013100%, and delivery takes 7\u201312 business days.');
  const result = run([file]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

function initRepo(name, files) {
  const repo = path.join(temp, name);
  for (const [relative, content] of Object.entries(files)) {
    const file = path.join(repo, relative);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, content, 'utf8');
  }
  execFileSync('git', ['init'], {cwd: repo, stdio: 'ignore'});
  execFileSync('git', ['add', '.'], {cwd: repo, stdio: 'ignore'});
  execFileSync('git', ['-c', 'user.email=test@example.com', '-c', 'user.name=Test', 'commit', '-m', 'init'], {cwd: repo, stdio: 'ignore'});
  return repo;
}

test('changed mode scans only modified content files', () => {
  const repo = initRepo('changed-repo', {'src/data/guide.ts': 'export const guide = {title: "A clean guide"};\n'});
  const article = path.join(repo, 'src', 'data', 'guide.ts');
  fs.writeFileSync(article, 'export const guide = {title: "A clean guide \u2014 with a dash"};\n', 'utf8');
  const result = run(['--changed', '--repo', repo]);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /em-dash/);
});

test('legacy em dashes on unchanged locked lines do not fail changed mode', () => {
  const repo = initRepo('legacy-repo', {
    'src/data/guide.ts': [
      'export const guide = {',
      '  "intro": "A legacy line \u2014 with a dash",',
      '  "body": "Clean body"',
      '};',
      ''
    ].join('\n')
  });
  const article = path.join(repo, 'src', 'data', 'guide.ts');
  fs.writeFileSync(article, [
    'export const guide = {',
    '  "intro": "A legacy line \u2014 with a dash",',
    '  "body": "Clean body with a new sentence."',
    '};',
    ''
  ].join('\n'), 'utf8');
  const result = run(['--changed', '--repo', repo]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /LEGACY 1 em dash/);
});

test('a new em dash on a modified line fails changed mode and reports the legacy one', () => {
  const repo = initRepo('mixed-dash-repo', {
    'src/data/guide.ts': [
      'export const guide = {',
      '  "intro": "A legacy line \u2014 with a dash",',
      '  "body": "Clean body"',
      '};',
      ''
    ].join('\n')
  });
  const article = path.join(repo, 'src', 'data', 'guide.ts');
  fs.writeFileSync(article, [
    'export const guide = {',
    '  "intro": "A legacy line \u2014 with a dash",',
    '  "body": "A new line \u2014 with a dash"',
    '};',
    ''
  ].join('\n'), 'utf8');
  const result = run(['--changed', '--repo', repo]);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /em-dash/);
  assert.match(result.stdout, /guide\.ts:3/);
  assert.match(result.stdout, /LEGACY 1 em dash/);
});

test('word count and CTA checks apply to articles, not shared UI components', () => {
  const repo = initRepo('component-repo', {
    'src/components/Header.tsx': 'export function Header() {\n  return <header>MasterGrowbot</header>;\n}\n'
  });
  const component = path.join(repo, 'src', 'components', 'Header.tsx');
  fs.writeFileSync(component, 'export function Header() {\n  return <header>MasterGrowbot Home</header>;\n}\n', 'utf8');
  const result = run(['--changed', '--repo', repo, '--min-words', '1200', '--require-cta']);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('word count applies to article files in changed mode', () => {
  const repo = initRepo('article-words-repo', {
    'src/data/guide.ts': 'export const guide = {\n  "intro": "Short."\n};\n'
  });
  const article = path.join(repo, 'src', 'data', 'guide.ts');
  fs.writeFileSync(article, 'export const guide = {\n  "intro": "Short page."\n};\n', 'utf8');
  const result = run(['--changed', '--repo', repo, '--min-words', '20']);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /word-count/);
});

test('changed mode with no content changes is a no-op', () => {
  const repo = initRepo('clean-repo', {
    'src/components/Header.tsx': 'export function Header() {\n  return <header>MasterGrowbot</header>;\n}\n'
  });
  const result = run(['--changed', '--repo', repo]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /no changed content files/i);
});

test('the binding reference exists and contains the hard rules', () => {
  const reference = fs.readFileSync(path.join(root, '.opencode', 'skills', 'mastergrowbot-acquisition', 'references', 'content-quality.md'), 'utf8');
  assert.match(reference, /zero em dashes/i);
  assert.match(reference, /no-ai-slop/i);
  assert.match(reference, /bottom-of-funnel/i);
  assert.match(reference, /Required blocks/i);
  assert.equal(reference.includes('\u2014'), false, 'the reference must not contain an em dash');
  assert.equal(fs.readFileSync(checker, 'utf8').includes('\u2014'), false, 'the checker must not contain an em dash');
});

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

test('automation instruction files contain no em dashes', () => {
  const files = walk(root).filter((file) => /\.(md|mjs|ps1)$/i.test(file));
  const hits = files.filter((file) => fs.readFileSync(file, 'utf8').includes('\u2014'));
  assert.deepEqual(hits, []);
});


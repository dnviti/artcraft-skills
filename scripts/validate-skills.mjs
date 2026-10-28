#!/usr/bin/env node
// Validates every skills/*/SKILL.md against the agentskills.io spec and this repo's conventions.
// Node >= 20, no dependencies. Exit code 1 on any error.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = join(root, 'skills');
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;
const MAX_LINES = 500;

const errors = [];
const warnings = [];
const err = (skill, msg) => errors.push(`${skill}: ${msg}`);
const warn = (skill, msg) => warnings.push(`${skill}: ${msg}`);

// Parse a YAML scalar: double-quoted (JSON-style), single-quoted, or plain (trailing " # comment" stripped).
function parseScalar(raw) {
  const v = raw.trim();
  if (v.startsWith('"')) {
    let i = 1;
    while (i < v.length && v[i] !== '"') i += v[i] === '\\' ? 2 : 1;
    if (i >= v.length) throw new Error('unterminated double-quoted string');
    const rest = v.slice(i + 1).trim();
    if (rest && !rest.startsWith('#')) throw new Error('unexpected text after quoted string');
    return JSON.parse(v.slice(0, i + 1));
  }
  if (v.startsWith("'")) {
    const m = /^'((?:[^']|'')*)'\s*(#.*)?$/.exec(v);
    if (!m) throw new Error('bad single-quoted string');
    return m[1].replace(/''/g, "'");
  }
  const plain = v.replace(/\s+#.*$/, '');
  if (/:\s/.test(plain) || plain.endsWith(':')) {
    throw new Error('plain scalar contains ": " (invalid YAML; quote the value)');
  }
  return plain;
}

// Minimal frontmatter parser: top-level "key: value" and a one-level nested map (metadata).
function parseFrontmatter(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  if (lines[0] !== '---') throw new Error('file does not start with "---"');
  const end = lines.indexOf('---', 1);
  if (end === -1) throw new Error('frontmatter is not closed with "---"');
  const data = {};
  let current = null;
  for (let n = 1; n < end; n++) {
    const line = lines[n];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const nested = /^( {2,}|\t)([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
    if (nested) {
      if (current === null || typeof data[current] !== 'object') {
        throw new Error(`line ${n + 1}: indented key without a parent map`);
      }
      data[current][nested[2]] = parseScalar(nested[3]);
      continue;
    }
    const top = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
    if (!top) throw new Error(`line ${n + 1}: cannot parse "${line.slice(0, 40)}"`);
    if (top[2].trim() === '' || top[2].trim().startsWith('#')) {
      data[top[1]] = {};
      current = top[1];
    } else {
      data[top[1]] = parseScalar(top[2]);
      current = null;
    }
  }
  return { data, bodyLines: lines.length - end - 1, totalLines: lines.length };
}

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

if (!existsSync(skillsDir)) {
  console.error('skills/ directory not found');
  process.exit(1);
}

const manifest = existsSync(join(root, '.release-please-manifest.json'))
  ? readJson(join(root, '.release-please-manifest.json'))['.']
  : undefined;
if (!manifest) errors.push('.release-please-manifest.json: missing or has no "." version');

const dirs = readdirSync(skillsDir).filter((d) => statSync(join(skillsDir, d)).isDirectory()).sort();
if (dirs.length === 0) errors.push('skills/: no skill directories found');

const versions = new Map();
for (const dir of dirs) {
  const file = join(skillsDir, dir, 'SKILL.md');
  if (!existsSync(file)) { err(dir, 'SKILL.md is missing'); continue; }
  let parsed;
  try {
    parsed = parseFrontmatter(readFileSync(file, 'utf8'));
  } catch (e) {
    err(dir, `frontmatter: ${e.message}`);
    continue;
  }
  const { data, totalLines } = parsed;

  // name
  if (typeof data.name !== 'string' || !data.name) err(dir, '`name` is required');
  else {
    if (data.name.length > 64) err(dir, `name is ${data.name.length} chars (max 64)`);
    if (!NAME_RE.test(data.name)) err(dir, `name "${data.name}" must match [a-z0-9-], no leading/trailing/double hyphen`);
    if (data.name !== dir) err(dir, `name "${data.name}" must equal the folder name "${dir}"`);
  }

  // description
  if (typeof data.description !== 'string' || !data.description.trim()) err(dir, '`description` is required');
  else if (data.description.length > 1024) err(dir, `description is ${data.description.length} chars (max 1024)`);

  // license
  if (data.license !== 'MIT') err(dir, `license must be "MIT" (got ${JSON.stringify(data.license)})`);

  // metadata
  const md = data.metadata;
  if (!md || typeof md !== 'object') err(dir, '`metadata` map is required');
  else {
    for (const [k, v] of Object.entries(md)) {
      if (typeof v !== 'string') err(dir, `metadata.${k} must be a string`);
    }
    if (!md.author) err(dir, 'metadata.author is required');
    if (!md.version) err(dir, 'metadata.version is required');
    else if (!SEMVER_RE.test(md.version)) err(dir, `metadata.version "${md.version}" is not semver`);
    else versions.set(dir, md.version);
  }

  // release-please marker must be on the version line
  const src = readFileSync(file, 'utf8');
  if (!/^\s+version: "[^"]+" # x-release-please-version\s*$/m.test(src)) {
    err(dir, 'metadata.version line must carry the "# x-release-please-version" marker');
  }

  if (totalLines > MAX_LINES) warn(dir, `SKILL.md has ${totalLines} lines (> ${MAX_LINES}); move detail to references/`);
}

// versions: equal across skills and equal to the release-please manifest
const distinct = new Set(versions.values());
if (distinct.size > 1) {
  errors.push(`metadata.version differs across skills: ${[...distinct].join(', ')}`);
}
if (manifest && distinct.size === 1 && !distinct.has(manifest)) {
  errors.push(`skills version ${[...distinct][0]} != .release-please-manifest.json "." version ${manifest}`);
}

// plugin manifests carry the same version
for (const [rel, pick] of [
  ['.claude-plugin/plugin.json', (j) => j.version],
  ['.claude-plugin/marketplace.json', (j) => j.plugins?.[0]?.version],
]) {
  const p = join(root, rel);
  if (!existsSync(p)) { errors.push(`${rel}: missing`); continue; }
  try {
    const v = pick(readJson(p));
    if (v !== manifest) errors.push(`${rel}: version ${JSON.stringify(v)} != manifest ${manifest}`);
  } catch (e) {
    errors.push(`${rel}: ${e.message}`);
  }
}

// release-please config lists every SKILL.md
const cfgPath = join(root, 'release-please-config.json');
if (existsSync(cfgPath)) {
  const extra = (readJson(cfgPath).packages?.['.']?.['extra-files'] ?? []).map((e) => (typeof e === 'string' ? e : e.path));
  for (const dir of dirs) {
    if (!extra.includes(`skills/${dir}/SKILL.md`)) errors.push(`release-please-config.json: extra-files is missing skills/${dir}/SKILL.md`);
  }
} else errors.push('release-please-config.json: missing');

for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
console.log(`Checked ${dirs.length} skills: ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";
import { forbiddenRuntimeBindings, isAllowedRuntimeBinding } from "./portability-bindings.mjs";

const root = resolve(import.meta.dirname, "..");
const skillsRoot = join(root, "skills");

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(path));
    else if (entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

test("skill authoring resolves through the bundled create-skill workflow", async () => {
  const authoring = await readFile(join(skillsRoot, "poteto-mode/playbooks/authoring-a-skill.md"), "utf8");
  const planning = await readFile(join(skillsRoot, "poteto-mode/references/plan.md"), "utf8");
  const createSkill = await readFile(join(skillsRoot, "create-skill/SKILL.md"), "utf8");

  assert.match(authoring, /\[create-skill\]\(\.\.\/\.\.\/create-skill\/SKILL\.md\)/u);
  assert.match(planning, /\[create-skill\]\(\.\.\/\.\.\/create-skill\/SKILL\.md\)/u);
  assert.match(createSkill, /^name: create-skill$/mu);
  assert.match(createSkill, /~\/\.agents\/skills\/skill-name\//u);
  assert.match(createSkill, /\.agents\/skills\/skill-name\//u);
  assert.match(createSkill, /## Core Authoring Principles/u);
  assert.match(createSkill, /## Common Patterns/u);
  assert.match(createSkill, /## Skill Creation Workflow/u);
  assert.equal(createSkill.split("\n").length <= 500, true);
  assert.doesNotMatch(createSkill, /Cursor|AskQuestion|\.cursor\//u);
  assert.doesNotMatch(`${authoring}\n${planning}`, /writing-for-agents/u);
});

test("portable skills contain no package-manager or host-specific resource bindings", async () => {
  for (const path of await markdownFiles(skillsRoot)) {
    const source = await readFile(path, "utf8");
    for (const token of forbiddenRuntimeBindings) {
      const pathKey = path.slice(root.length + 1);
      assert.equal(source.includes(token) && !isAllowedRuntimeBinding(pathKey, token), false, `${path} contains ${token}`);
    }
  }
});

test("the Pi package exposes bundled agents to pi-subagents", async () => {
  const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  assert.deepEqual(manifest.pi?.subagents?.agents, ["./agents"]);
});

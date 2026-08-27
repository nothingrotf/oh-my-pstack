import assert from "node:assert/strict";
import test from "node:test";
import {
  PstackConfigError,
  buildPanelWorkflowScript,
  buildRoutedTask,
  executionAgentFor,
  materializeModelChoices,
  missingModelRoles,
  parsePstackConfig,
  resolveModelRole,
  validateModelInventory,
} from "../extensions/pstack-router/core.ts";

const configuration = `# pstack model configuration
feature, refactoring: openai-codex/gpt-5.6-sol:medium
bug-fix: openai-codex/gpt-5.6-sol:high
perf-issue: openai-codex/gpt-5.6-sol:high
hillclimb: openai-codex/gpt-5.6-sol:high
judgment and prose: anthropic/claude-opus-5:high
hardest tasks: openai-codex/gpt-5.6-sol:xhigh
how explorer: openai-codex/gpt-5.6-luna:xhigh [fast]
how explainer: anthropic/claude-fable-5:low
how critics: openai-codex/gpt-5.6-sol:medium, openai-codex/gpt-5.6-luna:xhigh [fast], anthropic/claude-fable-5:medium, anthropic/claude-opus-5:xhigh
why investigators: openai-codex/gpt-5.6-luna:xhigh
why synthesizer: openai-codex/gpt-5.6-sol:medium
reflect tooling: openai-codex/gpt-5.6-sol:xhigh
reflect judgment, divergent, synthesizer: anthropic/claude-fable-5:medium
arena runners: openai-codex/gpt-5.6-sol:medium, openai-codex/gpt-5.6-luna:xhigh, anthropic/claude-fable-5:medium, anthropic/claude-opus-5:xhigh
arena cross-judge pool: openai-codex/gpt-5.6-sol:medium, openai-codex/gpt-5.6-luna:xhigh, anthropic/claude-fable-5:medium, anthropic/claude-opus-5:xhigh
swarm workers: openai-codex/gpt-5.6-luna:xhigh, anthropic/claude-fable-5:medium
architect runners: openai-codex/gpt-5.6-sol:medium, openai-codex/gpt-5.6-luna:xhigh, anthropic/claude-fable-5:medium, anthropic/claude-opus-5:xhigh
interrogate reviewers: openai-codex/gpt-5.6-sol:medium, openai-codex/gpt-5.6-luna:xhigh, anthropic/claude-fable-5:medium, anthropic/claude-opus-5:xhigh
`;

const inventory = new Set([
  "openai-codex/gpt-5.6-sol",
  "openai-codex/gpt-5.6-luna",
  "anthropic/claude-fable-5",
  "anthropic/claude-opus-5",
]);

test("parses every canonical model role and expands shared labels", () => {
  const parsed = parsePstackConfig(configuration, "/project/.pstack/config.md");
  assert.deepEqual(missingModelRoles(parsed), []);
  assert.equal(resolveModelRole(parsed, "feature")[0]?.model, "openai-codex/gpt-5.6-sol");
  assert.equal(resolveModelRole(parsed, "refactoring")[0]?.thinking, "medium");
  assert.equal(resolveModelRole(parsed, "reflect divergent")[0]?.model, "anthropic/claude-fable-5");
  assert.equal(resolveModelRole(parsed, "reflect synthesizer")[0]?.thinking, "medium");
  assert.equal(resolveModelRole(parsed, "swarm workers").length, 2);
});

test("keeps fast separate from the model and thinking", () => {
  const parsed = parsePstackConfig(configuration, "/project/.pstack/config.md");
  const choice = resolveModelRole(parsed, "how explorer")[0];
  assert.deepEqual(choice, {
    kind: "model",
    model: "openai-codex/gpt-5.6-luna",
    thinking: "xhigh",
    fast: true,
    configured: "openai-codex/gpt-5.6-luna:xhigh [fast]",
  });
});

test("rejects fast for unsupported models", () => {
  assert.throws(
    () => parsePstackConfig("how explorer: anthropic/claude-fable-5:low [fast]", "config.md"),
    (error) => error instanceof PstackConfigError && /fast supports only/u.test(error.message),
  );
});

test("rejects duplicate and unknown model roles", () => {
  assert.throws(
    () => parsePstackConfig("feature: openai-codex/gpt-5.6-sol:low\nfeature, refactoring: openai-codex/gpt-5.6-sol:medium", "config.md"),
    (error) => error instanceof PstackConfigError && /duplicates model role 'feature'/u.test(error.message),
  );
  assert.throws(
    () => parsePstackConfig("reviewer: openai-codex/gpt-5.6-sol:low", "config.md"),
    (error) => error instanceof PstackConfigError && /unknown model role/u.test(error.message),
  );
});

test("rejects models absent from the live inventory", () => {
  const parsed = parsePstackConfig(configuration.replaceAll("openai-codex/gpt-5.6-sol", "oopenai-codex/gpt-5.6-sol"), "config.md");
  assert.throws(
    () => validateModelInventory(parsed, inventory),
    (error) => error instanceof PstackConfigError && /oopenai-codex/u.test(error.message),
  );
});

test("materializes explicit and inherited model choices", () => {
  const explicit = resolveModelRole(parsePstackConfig(configuration, "config.md"), "bug-fix");
  assert.deepEqual(materializeModelChoices(explicit, undefined), [{
    model: "openai-codex/gpt-5.6-sol",
    thinking: "high",
    fast: false,
    configured: "openai-codex/gpt-5.6-sol:high",
  }]);

  const inherited = resolveModelRole(parsePstackConfig("bug-fix: inherit-parent", "config.md"), "bug-fix");
  assert.deepEqual(materializeModelChoices(inherited, {
    model: "anthropic/claude-opus-5",
    thinking: "xhigh",
  }), [{
    model: "anthropic/claude-opus-5",
    thinking: "xhigh",
    fast: false,
    configured: "inherit-parent",
  }]);
  assert.equal(materializeModelChoices(inherited, {
    model: "openai-codex/gpt-5.6-sol",
    thinking: "off",
  })[0]?.thinking, "off");
});

test("maps every execution role without selecting models", () => {
  assert.deepEqual({
    explorer: executionAgentFor("explorer"),
    watcher: executionAgentFor("watcher"),
    planner: executionAgentFor("planner"),
    designer: executionAgentFor("designer"),
    reviewer: executionAgentFor("reviewer"),
    researcher: executionAgentFor("researcher"),
    synthesizer: executionAgentFor("synthesizer"),
    implementer: executionAgentFor("implementer"),
    owner: executionAgentFor("owner"),
    mechanical: executionAgentFor("mechanical"),
  }, {
    explorer: "scout",
    watcher: "scout",
    planner: "oracle",
    designer: "oracle",
    reviewer: "reviewer",
    researcher: "researcher",
    synthesizer: "oracle",
    implementer: "worker",
    owner: "delegate",
    mechanical: "worker",
  });
});

test("adds an auditable route header to every child task", () => {
  const task = buildRoutedTask({
    modelRole: "bug-fix",
    executionRole: "implementer",
    agent: "worker",
    model: "openai-codex/gpt-5.6-sol",
    thinking: "high",
    fast: false,
    task: "Fix the reproduced defect.",
  });
  assert.match(task, /MODEL ROLE\nbug-fix/u);
  assert.match(task, /EXECUTION ROLE\nimplementer/u);
  assert.match(task, /PI AGENT\nworker/u);
  assert.match(task, /RESOLVED MODEL\nopenai-codex\/gpt-5\.6-sol:high/u);
});

test("builds a valid panel script with per-child models and fast flags", () => {
  const parsed = parsePstackConfig(configuration, "config.md");
  const models = materializeModelChoices(resolveModelRole(parsed, "how critics"), undefined);
  const script = buildPanelWorkflowScript({
    modelRole: "how critics",
    executionRole: "reviewer",
    agent: "reviewer",
    models,
    tasks: models.map((_, index) => `Review angle ${index + 1}.`),
  });
  assert.doesNotThrow(() => new Function("runs", script));
  assert.match(script, /openai-codex\/gpt-5\.6-luna:xhigh/u);
  assert.match(script, /"fast":true/u);
  assert.match(script, /anthropic\/claude-opus-5:xhigh/u);
});

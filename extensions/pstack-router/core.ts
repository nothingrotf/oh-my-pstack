function stringTuple<const Values extends [string, ...string[]]>(...values: Values): Values {
  return values;
}

const THINKING_LEVELS = stringTuple("off", "minimal", "low", "medium", "high", "xhigh", "max");

export const EXECUTION_ROLES = stringTuple(
  "explorer",
  "watcher",
  "planner",
  "designer",
  "reviewer",
  "researcher",
  "synthesizer",
  "implementer",
  "owner",
  "mechanical",
);

export const CONTEXT_MODES = stringTuple("fresh", "fork");

export const MODEL_ROLES = stringTuple(
  "feature",
  "refactoring",
  "bug-fix",
  "perf-issue",
  "hillclimb",
  "judgment and prose",
  "hardest tasks",
  "how explorer",
  "how explainer",
  "how critics",
  "why investigators",
  "why synthesizer",
  "reflect tooling",
  "reflect judgment",
  "reflect divergent",
  "reflect synthesizer",
  "arena runners",
  "arena cross-judge pool",
  "swarm workers",
  "architect runners",
  "interrogate reviewers",
);

const PANEL_MODEL_ROLES = stringTuple(
  "how critics",
  "arena runners",
  "arena cross-judge pool",
  "architect runners",
  "interrogate reviewers",
);

export type ThinkingLevel = (typeof THINKING_LEVELS)[number];
export type ExecutionRole = (typeof EXECUTION_ROLES)[number];
export type PstackModelRole = (typeof MODEL_ROLES)[number];

export interface ExplicitModelChoice {
  kind: "model";
  model: string;
  thinking?: ThinkingLevel;
  fast: boolean;
  configured: string;
}

export interface InheritedModelChoice {
  kind: "inherit";
  source: "inherit-parent" | "auto";
  fast: false;
  configured: string;
}

export type ModelChoice = ExplicitModelChoice | InheritedModelChoice;

export interface PstackConfig {
  path: string;
  choices: ReadonlyMap<PstackModelRole, readonly ModelChoice[]>;
}

export interface ParentModelChoice {
  model: string;
  thinking?: ThinkingLevel;
}

export interface MaterializedModelChoice {
  model: string;
  thinking?: ThinkingLevel;
  fast: boolean;
  configured: string;
}

export interface RoutedTaskInput extends MaterializedModelChoice {
  modelRole: PstackModelRole;
  executionRole: ExecutionRole;
  agent: string;
  task: string;
}

export interface PanelWorkflowInput {
  modelRole: PstackModelRole;
  executionRole: ExecutionRole;
  agent: string;
  models: readonly MaterializedModelChoice[];
  tasks: readonly string[];
}

const THINKING_LEVEL_SET: ReadonlySet<string> = new Set(THINKING_LEVELS);
const EXECUTION_ROLE_SET: ReadonlySet<string> = new Set(EXECUTION_ROLES);
const MODEL_ROLE_SET: ReadonlySet<string> = new Set(MODEL_ROLES);
const PANEL_MODEL_ROLE_SET: ReadonlySet<string> = new Set(PANEL_MODEL_ROLES);
const FAST_MODE_MODELS: ReadonlySet<string> = new Set([
  "openai-codex/gpt-5.6-luna",
  "openai-codex/gpt-5.6-sol",
]);

export class PstackConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PstackConfigError";
  }
}

export function isThinkingLevel(value: string): value is ThinkingLevel {
  return THINKING_LEVEL_SET.has(value);
}

export function isExecutionRole(value: string): value is ExecutionRole {
  return EXECUTION_ROLE_SET.has(value);
}

export function isPstackModelRole(value: string): value is PstackModelRole {
  return MODEL_ROLE_SET.has(value);
}

export function isPanelModelRole(role: PstackModelRole): boolean {
  return PANEL_MODEL_ROLE_SET.has(role);
}

function rolesForLabel(label: string): readonly PstackModelRole[] | undefined {
  if (label === "feature, refactoring") return ["feature", "refactoring"];
  if (label === "reflect judgment, divergent, synthesizer") {
    return ["reflect judgment", "reflect divergent", "reflect synthesizer"];
  }
  return isPstackModelRole(label) ? [label] : undefined;
}

function lineError(path: string, line: number, message: string): PstackConfigError {
  return new PstackConfigError(`${path}:${line}: ${message}`);
}

function parseExplicitChoice(value: string, path: string, line: number): ExplicitModelChoice {
  const fastSuffix = " [fast]";
  const fast = value.endsWith(fastSuffix);
  const modelWithThinking = fast ? value.slice(0, -fastSuffix.length).trim() : value;
  if (!modelWithThinking || modelWithThinking.includes("[fast]")) {
    throw lineError(path, line, `invalid model choice '${value}'`);
  }

  const colon = modelWithThinking.lastIndexOf(":");
  const suffix = colon >= 0 ? modelWithThinking.slice(colon + 1) : "";
  const thinking = isThinkingLevel(suffix) ? suffix : undefined;
  const model = thinking ? modelWithThinking.slice(0, colon) : modelWithThinking;
  const slash = model.indexOf("/");
  if (slash <= 0 || slash === model.length - 1 || /\s/u.test(model)) {
    throw lineError(path, line, `invalid Pi model '${model}'`);
  }
  if (fast && !FAST_MODE_MODELS.has(model)) {
    throw lineError(path, line, `fast supports only ${[...FAST_MODE_MODELS].join(", ")}; received '${model}'`);
  }

  return {
    kind: "model",
    model,
    ...(thinking ? { thinking } : {}),
    fast,
    configured: value,
  };
}

function parseChoice(value: string, path: string, line: number): ModelChoice {
  if (value === "inherit-parent" || value === "auto") {
    return {
      kind: "inherit",
      source: value,
      fast: false,
      configured: value,
    };
  }
  if (value === "inherit-parent [fast]" || value === "auto [fast]") {
    throw lineError(path, line, "fast requires an explicit supported model");
  }
  return parseExplicitChoice(value, path, line);
}

export function parsePstackConfig(source: string, path = ".pstack/config.md"): PstackConfig {
  const choices = new Map<PstackModelRole, readonly ModelChoice[]>();
  const lines = source.split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index]?.trim() ?? "";
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator <= 0) throw lineError(path, lineNumber, "expected '<model role>: <model choice>'");
    const label = line.slice(0, separator).trim();
    const values = line.slice(separator + 1).split(",").map((value) => value.trim());
    const roles = rolesForLabel(label);
    if (!roles) throw lineError(path, lineNumber, `unknown model role '${label}'`);
    if (values.length === 0 || values.some((value) => !value)) {
      throw lineError(path, lineNumber, `model role '${label}' has an empty choice`);
    }
    if (roles.some((role) => !isPanelModelRole(role)) && values.length !== 1) {
      throw lineError(path, lineNumber, `model role '${label}' requires exactly one choice`);
    }
    const parsed = values.map((value) => parseChoice(value, path, lineNumber));
    for (const role of roles) {
      if (choices.has(role)) throw lineError(path, lineNumber, `configuration duplicates model role '${role}'`);
      choices.set(role, parsed);
    }
  }

  return { path, choices };
}

export function resolveModelRole(config: PstackConfig, role: PstackModelRole): readonly ModelChoice[] {
  const choices = config.choices.get(role);
  if (!choices) throw new PstackConfigError(`${config.path}: missing model role '${role}'`);
  return choices;
}

export function missingModelRoles(config: PstackConfig): PstackModelRole[] {
  return MODEL_ROLES.filter((role) => !config.choices.has(role));
}

export function validateModelInventory(config: PstackConfig, inventory: ReadonlySet<string>): void {
  for (const [role, choices] of config.choices) {
    for (const choice of choices) {
      if (choice.kind === "model" && !inventory.has(choice.model)) {
        throw new PstackConfigError(`${config.path}: model role '${role}' uses unavailable model '${choice.model}'`);
      }
    }
  }
}

export function materializeModelChoices(
  choices: readonly ModelChoice[],
  parent: ParentModelChoice | undefined,
): MaterializedModelChoice[] {
  return choices.map((choice) => {
    if (choice.kind === "model") {
      return {
        model: choice.model,
        ...(choice.thinking ? { thinking: choice.thinking } : {}),
        fast: choice.fast,
        configured: choice.configured,
      };
    }
    if (!parent) throw new PstackConfigError(`model choice '${choice.source}' requires an active parent model`);
    return {
      model: parent.model,
      ...(parent.thinking ? { thinking: parent.thinking } : {}),
      fast: false,
      configured: choice.configured,
    };
  });
}

export function executionAgentFor(role: ExecutionRole): string {
  switch (role) {
    case "explorer":
    case "watcher":
      return "scout";
    case "planner":
    case "designer":
    case "synthesizer":
      return "oracle";
    case "reviewer":
      return "reviewer";
    case "researcher":
      return "researcher";
    case "implementer":
    case "mechanical":
      return "worker";
    case "owner":
      return "delegate";
  }
}

export function defaultContextFor(role: ExecutionRole): "fresh" | "fork" {
  switch (role) {
    case "implementer":
    case "owner":
    case "mechanical":
      return "fork";
    default:
      return "fresh";
  }
}

export function formatMaterializedModel(choice: MaterializedModelChoice): string {
  return choice.thinking ? `${choice.model}:${choice.thinking}` : choice.model;
}

export function buildRoutedTask(input: RoutedTaskInput): string {
  return [
    "PSTACK ROUTE",
    "",
    "MODEL ROLE",
    input.modelRole,
    "",
    "EXECUTION ROLE",
    input.executionRole,
    "",
    "PI AGENT",
    input.agent,
    "",
    "RESOLVED MODEL",
    formatMaterializedModel(input),
    "",
    "FAST",
    input.fast ? "true" : "false",
    "",
    "TASK",
    input.task.trim(),
    "",
    "REPORT",
    "Report the model role, execution role, resolved model, thinking level, commands, result, deviations, and residual risks.",
  ].join("\n");
}

export function buildPanelWorkflowScript(input: PanelWorkflowInput): string {
  if (input.models.length === 0) throw new PstackConfigError(`model role '${input.modelRole}' has no choices`);
  if (input.tasks.length !== input.models.length) {
    throw new PstackConfigError(`model role '${input.modelRole}' requires ${input.models.length} panel tasks; received ${input.tasks.length}`);
  }
  const children = input.models.map((model, index) => ({
    key: `pstack-${index + 1}`,
    agent: input.agent,
    model: formatMaterializedModel(model),
    ...(model.fast ? { fast: true } : {}),
    task: buildRoutedTask({
      modelRole: input.modelRole,
      executionRole: input.executionRole,
      agent: input.agent,
      ...model,
      task: input.tasks[index] ?? "",
    }),
  }));
  return `return runs.all(${JSON.stringify(children)});`;
}

# Portable pstack runtime contract

This file defines the host-neutral binding for imported pstack skills. Read it before any child launch, model choice, transcript lookup, question, or long-running loop.

## Host selection

Use capabilities that the current host exposes. Do not assume Cursor, Pi, OMP, OpenCode, Claude Code, Codex, or one model provider.

If a capability is absent, preserve the workflow gate and report the limitation. Do not claim that a child, review, transcript, or live check occurred without host evidence.

## Two independent role systems

Model roles and execution roles are independent.

A pstack model role is one original configuration line, such as `bug-fix`, `how explorer`, or `interrogate reviewers`. It selects the model for one workflow step. A panel model role selects one model per child.

An execution role selects child behavior. It defines the prompt, tools, permissions, context policy, write authority, and lifecycle protocol.

Never convert pstack model roles into a small set of host agent model defaults. Several model roles can use the same execution role with different models. One panel can use the same execution role several times with one model per entry.

## Execution roles

| Execution role | Required behavior |
| --- | --- |
| `explorer` | Read-only repository reconnaissance and trace reduction. |
| `watcher` | Observe one exact state transition, then terminate. |
| `planner` | Technical architecture, decomposition, and sequence design. |
| `designer` | Product, interaction, or alternative design work. |
| `reviewer` | Independent code, protocol, behavior, or security review. |
| `researcher` | Source-verified external documentation and API research. |
| `synthesizer` | Adjudicate frozen reports without changing their evidence. |
| `implementer` | Bounded implementation or test changes with explicit ownership. |
| `owner` | One coupled implementation session retained through its lifecycle. |
| `mechanical` | Fully specified low-judgment edits. |

Map execution roles to live host agents. Agent selection does not select a model.

For Pi with `pi-subagents`, use this default behavior map when those agents exist:

| Execution role | Pi agent |
| --- | --- |
| `explorer`, `watcher` | `scout` |
| `planner`, `designer`, `synthesizer` | `oracle` |
| `reviewer` | `reviewer` |
| `researcher` | `researcher` |
| `implementer`, `mechanical` | `worker` |
| `owner` | `delegate` |

Other hosts use their live agent names. The live inventory wins.

Every child brief must stand alone. It must name the goal, execution role, writable scope, acceptance criteria, verification command, forbidden scope, and report format.

## Model role configuration

Read `$PSTACK_CONFIG` when the variable is set. Otherwise read `.pstack/config.md` from the current project.

The left side of each line is a pstack model role. The right side is a concrete child model choice or a panel list.

Expand the two shared upstream labels exactly:

- `feature, refactoring` configures `feature` and `refactoring`.
- `reflect judgment, divergent, synthesizer` configures `reflect judgment`, `reflect divergent`, and `reflect synthesizer`.

For Pi, concrete choices use `provider/model-id` with an optional effort suffix:

```text
openai-codex/gpt-5.6-sol:max
anthropic/claude-fable-5:medium
```

For another host, use the exact model value accepted by its child facility.

Resolve the exact model role named by the active workflow. Do not substitute an execution role name as the configuration key.

When a concrete choice exists, pass it through the per-run `model` field for that child. This launch value must take precedence over persistent host agent model defaults.

For Pi with `pi-subagents`, pass the complete `provider/model-id:thinking` value. Do not split the effort into persistent agent settings.

Map `inherit-parent` and `auto` to the host's explicit parent-model inheritance mechanism. For `pi-subagents`, pass `model: "inherit"`. Do not omit the field when omission can activate an agent default.

When a model role is absent, use the workflow's portable fallback. If no fallback exists, use the execution agent default and report that no pstack model role was active.

For a panel, launch one child per configured entry. Select the execution role independently. Pass each entry through that child's per-run `model` field.

Record the resolved model and effort from each child result. If a concrete configured choice resolves to another model or effort, reject that result as a routing failure. Do not count an implicit fallback as the configured model role.

The pstack setup does not modify host agent settings. User-owned host overrides can still control tools, skills, permissions, context, and fallback policy. A concrete per-run `model` remains the pstack model contract.

## Model delegation capability

Model inventory is not model delegation. A host can list models without a child facility that accepts a model choice.

Native Pi does not include subagents. Install `pi-subagents` when pstack needs parallel children or per-run models:

```bash
pi install npm:pi-subagents
```

Restart Pi and run `/subagents-doctor`. Continue only when the `subagent` tool and required execution agents are visible.

If the host cannot select a model for each child, report the capability gap. Do not write or claim an active pstack model configuration.

## Questions and interaction

Use the host's structured interaction tool when it exists. Otherwise ask one focused question in conversation.

Put observable facts in probes and verification runs. Do not ask the user for facts that the host can inspect.

## Skills and paths

Invoke skills through the host-supported skill mechanism. Resolve sibling files under `skills/<name>/` within this package.

OpenCode loads Agent Skills from `.opencode/skills/` in a project or `~/.config/opencode/skills/` globally. Copy this package's `skills/` contents into one of those locations.

OpenCode uses its native child facility. Pass pstack model choices per child through that facility. Do not apply Pi settings to OpenCode.

## Transcripts and history

Use the active host history resource or an explicit transcript directory. Use `$PSTACK_TRANSCRIPTS_DIR` when the host lacks a history resource.

Never scan unrelated workspaces or a global private transcript tree. If no transcript source exists, report the gap and continue only with evidence that does not require it.

## Long-running work and verification

Use the host's durable goal, watcher, or loop facility when available. Otherwise keep the predicate and checkpoint in a project-local decision trail.

Re-arm a watcher after every state change. Reject stale generations.

The root coordinator owns user interaction, approvals, integration, and final verification. A child report is evidence, not proof.

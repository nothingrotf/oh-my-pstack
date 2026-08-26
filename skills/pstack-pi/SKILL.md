---
name: pstack-pi
description: "Pi runtime adapter for pstack. Keeps original pstack model roles separate from execution agents and maps lifecycle protocols to Pi-compatible child runs."
---

# pstack on Pi

`poteto-mode` is the sole workflow router. It selects the playbook, pstack model role, execution role, step order, and lifecycle protocol.

This adapter translates those choices to the active child runtime. It does not collapse pstack model roles into agent defaults.

## Independent role systems

Model roles and execution roles are independent.

A pstack model role selects the child model for one workflow step. Examples include `feature`, `bug-fix`, `how explorer`, and `interrogate reviewers`.

An execution role selects the child behavior, tools, permissions, context policy, and lifecycle protocol.

The same execution agent can serve several pstack model roles. Each launch still receives the exact configured model for its model role.

## Execution role map

Use the live host inventory. For Pi with `pi-subagents`, use this default map:

| Execution role | Pi agent | Contract |
| --- | --- | --- |
| `explorer` | `scout` | Read-only repository reconnaissance and trace reduction. |
| `watcher` | `scout` | Observe one exact transition and terminate. |
| `planner` | `oracle` | Technical planning, architecture, decomposition, and sequence design. |
| `designer` | `oracle` | Product, interaction, and alternative design work. |
| `reviewer` | `reviewer` | Independent code, protocol, behavior, or security review. |
| `researcher` | `researcher` | Source-verified external research. |
| `synthesizer` | `oracle` | Adjudication over frozen reports. |
| `implementer` | `worker` | Bounded implementation or test changes. |
| `owner` | `delegate` | One coupled implementation session. |
| `mechanical` | `worker` | Fully specified low-judgment edits. |

OMP can map the same execution roles to `scout`, `designer`, `reviewer`, `security-reviewer`, `librarian`, `task`, and `sonic`.

Agent selection never selects the pstack model role.

## Model role routing

Read `$PSTACK_CONFIG` when set. Otherwise read `.pstack/config.md` from the current project.

Expand `feature, refactoring` into the `feature` and `refactoring` model roles. Expand `reflect judgment, divergent, synthesizer` into `reflect judgment`, `reflect divergent`, and `reflect synthesizer`.

Resolve the exact model role named by the active workflow. Do not replace it with an execution role or host agent name.

For every concrete configured choice:

1. Verify the base model against the live inventory.
2. Preserve its effort suffix.
3. Pass the complete choice through the per-run `model` field.
4. Select the execution agent independently.
5. Record the model and effort reported by the child.
6. Reject the result when the reported choice differs from the configured choice.

For Pi with `pi-subagents`, use `provider/model-id:thinking` as the per-run value.

Map `inherit-parent` and `auto` to `model: "inherit"` on `pi-subagents`. This explicit value bypasses persistent agent model defaults.

If a model role is absent, use the workflow fallback. If no fallback exists, use the execution agent default and report the missing pstack model role.

A panel value contains one entry per child. Launch the same execution agent several times when the workflow needs one behavior with several model perspectives.

Do not write model or effort values to host agent settings. The pstack configuration remains the model policy.

## Child contract

The root coordinator starts every child. A child never starts another child or asks the user directly.

Every child receives a standalone brief. It includes the selected pstack model role and execution role.

For one Pi child:

```js
return runs.run("parser-overflow-worker", {
  agent: "worker",
  model: "openai-codex/gpt-5.6-sol:max",
  task: "GOAL\n...\n\nMODEL ROLE\nbug-fix\n\nEXECUTION ROLE\nimplementer\n\nSCOPE\n...\n\nACCEPTANCE\n...\n\nVERIFY\n...\n\nFORBIDDEN\n...\n\nREPORT\n...",
  worktree: true
})
```

For a Pi panel:

```js
return runs.all([
  {
    key: "critic-fable",
    agent: "reviewer",
    model: "anthropic/claude-fable-5:max",
    task: "Review the frozen architecture against the supplied rubric."
  },
  {
    key: "critic-sol",
    agent: "reviewer",
    model: "openai-codex/gpt-5.6-sol:max",
    task: "Review the frozen architecture against the supplied rubric."
  }
])
```

Use one top-level workflow for independent concurrent children. Start all panel participants before consuming a verdict.

Use a managed worktree for a writer that needs isolated files. Use a fresh context for independent review and cross-provider children. Use retained context only for one coupled owner.

## Brief shape

A dispatch is forbidden until its brief contains these sections.

**Goal.** State one outcome that a stranger can execute.

**Model role.** Name the exact pstack configuration key and selected choice.

**Execution role.** Name the behavior role, mapped host agent, authority, and expected stance.

**Scope.** Name writable paths, read-only paths, branch, worktree, and output path. Assign one writer.

**Context.** Name the repository root, source paths, base SHA, frozen artifacts, settled assumptions, and known risks.

**Acceptance.** List observable outcomes.

**Verify.** Give exact commands, fixtures, probes, baselines, and environment requirements.

**Timebox.** Set a rough cap. Require a partial evidence report at the cap.

**Forbidden.** Forbid child delegation, out-of-scope fixes, unrequested migrations, shared-path edits, merges, direct user questions, and unverified completion claims.

**Report.** Require `PASS`, `ISSUES`, or `BLOCKED`. Require the model role, resolved model, effort, branch, SHA, changed files, commands, results, deviations, and residual risks.

**Standing policy.** Copy the active playbook policy when it supplies one.

## Lifecycle protocols

### Bounded session

1. Resolve the model role.
2. Select the execution role.
3. Author one standalone brief.
4. Start one child with the configured per-run `model`.
5. Record the run ID, role pair, scope, base SHA, and expected artifact.
6. Read the complete result and transcript when required.
7. Verify the reported model and effort.
8. Inspect the artifact and run parent verification.
9. Accept the unit only after the parent verifies it.

A model role, execution role, or unit change starts a fresh child.

### Panel

1. Resolve the panel model role.
2. Create one child per configured entry.
3. Select each execution role independently.
4. Start every participant concurrently.
5. Track participants by stable key, model, and run ID.
6. Wait for every required result or cancel it explicitly.
7. Reject a result with a mismatched model or stale generation.
8. Freeze candidate artifacts before starting judges.
9. Freeze judge reports before synthesis.
10. Treat synthesis as advice. The root selects and verifies.

Do not mix writers, reviewers, or synthesizers in one child session. Do not let a reviewer inspect a moving head.

### Long-lived owner

1. Resolve the model role once.
2. Start one non-isolated owner with the complete brief.
3. Record its run ID and reuse it for coupled follow-ups.
4. Keep the owner inside its assigned branch and paths.
5. Require a terminal report at each verification boundary.
6. Verify each boundary before the next follow-up.
7. Stop on ownership violation, stale generation, or model drift.

### One-shot watcher

1. Resolve the watcher model role when the workflow defines one.
2. Start one background `explorer` execution role.
3. Put the exact branch, SHA, generation, predicate, and timebox in the brief.
4. Require one meaningful event and a terminal report.
5. Reject a stale generation or model mismatch.
6. Start a fresh watcher for each new generation.

A watcher observes. It does not fix, merge, or authorize.

## Interactions and decisions

Children resolve uncertainty from source, standing policy, frozen evidence, or the brief.

If evidence cannot resolve an ambiguity, use the safest reversible interpretation and report it. Return `BLOCKED` when the missing decision prevents safe work.

The root answers child questions through the host control channel. Ask the user only for product preference, unavailable authority, or an uncovered irreversible action.

## Ownership and verification

- Assign one writer per branch, worktree, mutable state, and output path.
- Separate implementation, review, judgment, and synthesis sessions.
- Isolate concurrent writers unless outputs are structurally disjoint.
- Treat a child report as evidence, not proof.
- Record the branch, base SHA, head SHA, and artifact generation.
- Prefer behavior proof over type checks.
- Treat a new commit, restack, or applied patch as a new generation.
- Reject a configured model role result when runtime fallback changes the model.
- Keep user interaction, external writes, merges, deletion, and final truth at the root.

## Writing

Apply `unslop` to every brief, report, review, task dispatch, commit message, and agent-facing edit.

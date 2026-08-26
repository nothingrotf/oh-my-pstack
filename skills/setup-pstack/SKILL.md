---
name: setup-pstack
description: Configure which host-supported roles or models pstack uses per workflow role. Detects the live host inventory and writes portable project-local configuration. Use for /setup-pstack, "configure pstack models", or changing pstack's role choices.
---

# Setup pstack

Follow the [portable runtime contract](../pstack-omp/references/runtime.md) throughout this setup.

Write the optional pstack configuration at `$PSTACK_CONFIG` when that variable is set; otherwise use `.pstack/config.md` in the current project. This is an override layer, not a requirement. Never write to a vendor-specific home directory.

## Steps

### 1. Detect available choices

Enumerate the child roles and model choices the current host actually exposes. The live host inventory is authoritative. Never copy a vendor slug from prose or guess that a model is available. Canonical role aliases from the runtime contract and `inherit-parent` remain valid portable choices even when the host does not expose raw model slugs.

If the host cannot enumerate models, configure canonical roles rather than asking the user to invent slugs. Ask for a raw model name only when the user wants an explicit model override and can confirm it is accepted by this host.

### 2. Load current state

Read the selected configuration path when it exists and treat its values as current choices. Otherwise start from the defaults in step 5.

### 3. Map and confirm

Show every workflow role with its current role or model choice. Mark an explicit model that is absent from the live inventory as needing a replacement. Use the host's structured interaction tool when available; otherwise ask one focused question in normal conversation.

For panel roles (`how critics`, `arena runners`, `arena cross-judge pool`, `architect runners`, and `interrogate reviewers`), one child runs per entry, so list length controls fan-out. Prefer diversity for judgment-sensitive panels. `swarm workers` is the default choice for every worker unless a race assigns a different choice per arm.

### 4. Validate

Every explicit model written must be present in the detected host inventory. Canonical role aliases and `inherit-parent` pass without a vendor slug. If a selected explicit model is unavailable, stop and ask for a replacement. Never write a configuration that requires another host.

### 5. Write the configuration

Create the parent directory when needed and overwrite the selected file so re-runs remain idempotent. Use this shape, replacing aliases only when the user chose confirmed host-specific models:

```md
# pstack role and model configuration
# A missing line uses the host default. `inherit-parent` uses the current conversation model.
feature, refactoring: implementer
bug-fix: reviewer
perf-issue: reviewer
hillclimb: implementer
judgment and prose: reviewer
hardest tasks: inherit-parent
how explorer: explorer
how explainer: synthesizer
how critics: reviewer, planner, designer, inherit-parent
why investigators: researcher
why synthesizer: synthesizer
reflect tooling: researcher
reflect judgment: reviewer
reflect divergent: designer
reflect synthesizer: synthesizer
arena runners: designer, planner, implementer, inherit-parent
arena cross-judge pool: reviewer, planner, designer, inherit-parent
swarm workers: implementer
architect runners: designer, planner, reviewer, inherit-parent
interrogate reviewers: reviewer, planner, designer, inherit-parent
```

### 6. Confirm

Tell the user the exact path written and note that pstack reads it only when the current host or invocation exposes the file. Configuration does not create models, child agents, or permissions that the host lacks.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof, such as a `verify-*` skill or an existing harness. If not, offer once to invoke the sibling **create-verification-skill** skill. On no, move on without pushing.

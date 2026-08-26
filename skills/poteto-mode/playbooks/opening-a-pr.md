### Opening a PR

Invoked at the end of every other playbook.

**Worktree.** Work from a git worktree off main. Bind or isolate delegated sessions through the active adapter. Concurrent writers each get a distinct branch and worktree. Work on one branch is serialized; refresh a clean worktree from the exact remote branch only between sequential sessions. Dirty branch with unrelated work: patch out, fresh worktree, apply. Snarled worktree: reset from main, redo minimally.

**Commits.** Commit liberally; rebase into small, ordered commits before opening PRs. Each commit is a future PR: landable, ordered to tell the story. Amend when the fix belongs in a just-made commit; new commit when separable.

**PRs.** Apply the **unslop** skill to the diff before commit, the **no-comments** skill before review, and **unslop** to the PR description and commit bodies. Small PRs, 5 narrow over 1 fat; stack follow-ups, branch off main only for genuinely independent work. For stacked PRs, use whatever stacking tool your team uses; the principle is small, ordered slices with the stack visible to reviewers. `gh pr view <number>` before referencing PR status. Rebase on `main` before substantial stack work. No `## Summary` / `## Test plan` boilerplate on small PRs; commit bodies don't restate the subject. After opening, return the PR and stop. Route to **Babysit** only when the user asks for PR-status work such as "get it green", "check the PR", or "merge-ready"; push back when feedback drifts from intent.

Before authorizing delegated PR opening, the root runs **interrogate**, **unslop**, and **no-comments** and supplies the accepted frozen diff. The root starts one canonical `mechanical` participant through the active adapter's **Bounded session** protocol. The opener performs only the authorized commit, push, and PR creation, returns the URL, and does not babysit.

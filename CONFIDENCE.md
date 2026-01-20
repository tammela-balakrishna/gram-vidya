Git rebase / conflict helper

1) Inspect state

```bash
git status
git remote -v
git branch -vv
```

2) Fetch remote

```bash
git fetch origin
```

3) Rebase your local `main` onto `origin/main` (keeps history linear)

```bash
git checkout main
git rebase origin/main
```

If `git rebase` reports conflicts, Git will pause and list the conflicting paths.

What to use instead of `<conflicted-file>`
- Replace `<conflicted-file>` with the path(s) Git lists when the rebase stops. You can also run:

```bash
git diff --name-only --diff-filter=U
```

which prints all files with unresolved conflicts (these are exactly what to `git add`).

4) Resolve conflicts

- Open the conflicted files in your editor (e.g. `code .`) and fix conflict markers `<<<<<<<`, `=======`, `>>>>>>>`.
- Or use a mergetool:

```bash
git mergetool
```

- After fixing each file:

```bash
git add path/to/conflicted-file
git rebase --continue
```

Repeat `git diff --name-only --diff-filter=U`, edit, `git add`, and `git rebase --continue` until the rebase completes.

5) Push the rebased branch

First try a normal push:

```bash
git push origin main
```

If the remote rejects the push because history diverged (expected after a rebase), use a safe force push:

```bash
git push --force-with-lease origin main
```

`--force-with-lease` avoids overwriting remote changes you don't have locally.

Notes
- Always inspect changes after a rebase with `git log --oneline --graph --decorate --all` and `git status`.
- If you're unsure, make a local backup branch before rebasing: `git branch backup-main`.

Troubleshooting
- If a conflict is large and confusing, abort the rebase and fall back to merging:

```bash
git rebase --abort
git pull --no-rebase origin main
# resolve merge conflicts, then git push
```

Contact me with the exact `git status` / `git rebase` output if you hit a specific conflict and want step-by-step resolution.

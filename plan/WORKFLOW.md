# Working Workflow for Codex Threads

Use this workflow for every implementation task in this repository.

## Progress Tracking

- Track overall progress in `plan/PROGRESS.md`.
- Before starting a task, update `plan/PROGRESS.md` with:
  - task number/name
  - current status
  - branch/thread notes if useful
  - any blockers or assumptions
- After finishing a task, update `plan/PROGRESS.md` with:
  - completed work summary
  - build result
  - docs updated
  - commit hash if available
  - anything the user should manually test

## Thread Model

- Use a new Codex thread for each task file.
- The thread should read:
  - `plan/README.md`
  - `plan/WORKFLOW.md`
  - `plan/PROGRESS.md`
  - the specific task file, for example `plan/01-foundation-and-tooling.md`
  - `muse-commerce-mvp-plan.html` when product context is needed
- Do not start unrelated future tasks in the same thread.
- If a task reveals missing requirements, update the relevant plan/task document before finishing.

## Per-Task Execution

1. Read the relevant plan files.
2. Check current git status.
3. Do the task end to end.
4. Run the project build before finishing.
5. No automated tests are required for now unless the task explicitly adds them.
6. The user will do manual testing.
7. Update docs and the task/progress files after implementation.
8. Commit the finished task.
9. Push the commit to `main`.

## Build Requirement

- A task is not considered finished until the build passes.
- If the build cannot run because the project has not been scaffolded yet, document that clearly in `plan/PROGRESS.md`.
- If the build fails for a reason outside the task scope, fix it when reasonable; otherwise document the blocker and do not mark the task complete.

## Documentation Requirement

Every completed task should update documentation when relevant:

- Update the specific task file with status notes or checked-off completion notes.
- Update `plan/PROGRESS.md`.
- Update `.env.example` when new environment variables are introduced.
- Update user-facing or developer docs if behavior, setup, routes, scripts, or operational steps change.

## Git Requirement

- Commit after each completed task.
- Push to `main` after the commit.
- Do not commit `.env` or other secrets.
- Keep commits focused on the task.
- If there are unrelated local changes, preserve them and avoid mixing them into the task commit unless the user explicitly asks.


# Issue Tracker

ClickUp is the authoritative request and backlog system for this repository.

## Route work

- Use `$work-on-ticket` when asked to implement or complete a ClickUp task. It owns the task, branch, pull request, validation, CI, and review-status workflow.
- Use `$hope-platform-planning` when shaping Hope Platform backlog work. Apply `$hope-platform-architecture-ownership` so each implementation ticket belongs to exactly one repository.
- Let repository-local instructions choose the available ClickUp client. Preserve any local preference such as the `cup` CLI.
- Treat GitHub issues as authoritative only when the request explicitly originates there. Pull requests are delivery evidence, not the default request surface.

## Create or update

Before creating a task, search ClickUp for existing work and prefer updating or splitting it over creating a duplicate. Preserve the active task's parent, list, custom fields, links, and repository ownership. If the target ClickUp location cannot be resolved from the request or an existing parent, stop before writing.

Matt's `to-spec`, `to-tickets`, and `triage` workflows must follow this routing. They must not create GitHub issues as a fallback.

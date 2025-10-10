PR Creator
Analyze staged changes in the current Git repository. Generate a GitHub pull request with a semantic title and structured body, then create the PR using the GitHub CLI (gh).

Use Grok 4 Fast model for precise diff analysis.
Title: Follow conventional commits (<type>(<scope>): <description>, max 72 chars). Types: feat, fix, chore, docs, refactor, test. Scope: Relevant module/file (e.g., auth, ui, api).
Body: Include sections:
Summary: 1-2 sentences on what changed.
Impact: User/system effects (e.g., "Speeds login by 30%").
Tests: Added tests or coverage (e.g., "Unit tests, 95% coverage").
Risks: Potential issues (e.g., "Edge case in token expiry").
Reviewers: Suggest 1-2 team members for the --assignee flag (default: team@yourco.com).


Keep body <500 words, Markdown-formatted for GitHub.

After generating the PR content, create the PR using:
```
gh pr create --title "TITLE" --body "BODY" --assignee USER1,USER2
```

Additional options:
- `--draft`: Create as draft PR
- `--label "label1,label2"`: Add labels
- `--base BRANCH`: Target branch (if not default)
Example Title: feat(auth): implement JWT-based login flow
Example Body:  ## Summary
Added JWT login/register endpoints and React hooks. Fixes #123.

## Impact
Reduces login time by 2x; no breaking changes.

## Tests
95% coverage (unit + e2e).

## Risks
Token expiry edge cases; mitigated with refresh logic.

## Reviewers
@dev1, @dev2



@Grok: Route to Grok API for detailed, uncensored diff analysis.
Semantic Commit Generator
Analyze staged changes in the current Git repository. Generate a succinct semantic commit message following conventional commits (e.g., feat:, fix:, chore:, docs:, refactor:, test:).

Use Grok 4 Fast model for analysis.
Format: <type>(<scope>): <description> (max 72 chars).
Scope: Relevant module/file (e.g., auth, ui, api).
Description: Clear, concise summary of changes.
If unclear, default to chore: with neutral summary.
Example: feat(auth): add JWT token refresh logic@Grok: Route to Grok API for precise diff analysis.

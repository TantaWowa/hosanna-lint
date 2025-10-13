PR Preparation Command
Run comprehensive checks before creating a pull request: tests, linting, and build. Automatically fix linting issues if found. Clearly report status and next steps.

Steps:
1. Run tests (`npm test`)
2. Run linting (`npm run lint`)
3. If linting fails, automatically fix issues (`npm run lint-fix`)
4. Run build (`npm run build`)
5. Report results clearly

If all checks pass: "✅ All checks passed! Ready to create PR."
If issues found: "❌ Issues found and fixed. Please review changes before committing."
If unfixable issues remain: "❌ Unfixable issues remain. Manual fixes required."

DO NOT commit changes automatically - let the user review and commit fixes.

@Grok: Execute comprehensive pre-PR validation with automatic lint fixes.

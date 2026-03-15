# Contributing

## Workflow

1. Create a branch from `main`.
2. Make focused changes.
3. Run `npm run lint`.
4. Run `npm run build`.
5. Open a pull request with a clear summary and validation notes.

## Expectations

- Keep changes scoped.
- Do not commit secrets, environment files, or generated local state.
- Preserve the existing project structure unless there is a strong reason to change it.
- Document new setup or deployment requirements in `README.md`.

## Commit Guidance

- Use clear commit messages.
- Separate app logic changes from documentation or repo-health updates.
- Prefer one concern per commit.

## Review Guidance

- Include screenshots for UI changes.
- Mention any Supabase migration or Edge Function dependency in the PR.

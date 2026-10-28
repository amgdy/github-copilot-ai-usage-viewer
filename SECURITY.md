# Security policy

## Report a problem in private

Please do not open a public issue for a security problem.

1. Open the [Security tab](https://github.com/amgdy/github-copilot-ai-usage-analysis/security) of this repository.
2. Choose **Report a vulnerability**.
3. Say what you found, where, and how to repeat it.

The maintainer replies in the report and shares a plan for the fix.

## What is in scope

GitHub Copilot Usage Lens runs only in your browser. It has no server, no login and no database, and it does not upload your files. The parts that matter most are:

- the code that reads CSV and JSON files,
- the code that shows text from those files,
- the GitHub Actions workflows in `.github/workflows/`.

## Please do not send real data

Do not attach real usage reports, license lists or screenshots with real names to a report. Use invented data. The start page has a **View a sample report** button, and `npm run gen:demo` writes a made-up sample file.

## Supported versions

Only the latest code on the `main` branch and the published site get fixes.

# GitHub Repository Setup for Tech Atlas Governance

The repository files configure forms and workflows, but several protections must be enabled in GitHub settings by a repository administrator.

## Required repository features

- Enable Issues so the structured contribution forms are available.
- Enable GitHub Actions for the repository.
- Enable the dependency graph and Dependabot alerts.
- Enable private vulnerability reporting if the repository should accept confidential security reports through GitHub.

## Recommended main-branch ruleset

Create a ruleset targeting `main` and consider requiring:

- pull requests before merge;
- at least one approval;
- review from Code Owners;
- resolution of review conversations;
- the `Tech Atlas quality / validate` status check when Atlas content changes;
- branch deletion and force-push protection.

Do not require the scheduled external-link workflow as a merge check. Third-party websites may block automation or experience temporary outages.

## Optional labels

The supplied issue forms do not depend on pre-existing labels. Maintainers may later add labels such as:

- `atlas:resource`
- `atlas:path`
- `atlas:content`
- `atlas:broken-link`
- `needs-evidence`
- `good-first-contribution`

Add labels to form metadata only after those labels exist in the repository.

## First verification after merge

1. Open the New Issue page and confirm all four forms render.
2. Manually run `Tech Atlas quality`.
3. Manually run `Tech Atlas link health` with a small limit.
4. Confirm the workflow artifact contains Markdown and JSON reports.
5. Open `/contribute` on the deployed preview and test each route.

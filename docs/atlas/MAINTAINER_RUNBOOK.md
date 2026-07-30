# Tech Atlas Maintainer Runbook

## On every Atlas pull request

1. Confirm the issue or PR describes a user need.
2. Review evidence for factual claims.
3. Run `npm run atlas:quality`.
4. Check visible changes with keyboard and responsive layouts when UI changed.
5. Confirm no affiliate, referral, tracking, or copied marketing content was added.
6. Review the generated audit summaries instead of dismissing warning totals without context.

## Weekly

- Review the `Tech Atlas link health` workflow artifact.
- Manually recheck any `broken` result before changing the catalog.
- Sample `blocked` and `unavailable` results; these often indicate bot protection or temporary network problems.
- Merge safe dependency updates after the project checks pass.

## Monthly

- Review new contribution issues and close duplicates with a link to the existing entry.
- Improve a small batch of `review-needed` resources rather than changing their status in bulk.
- Recheck featured and learning-path-critical sources first.
- Review stale open pull requests and explain the next required action.

## Quarterly

- Review whether categories, paths, roles, and terminology still reflect the project's scope.
- Archive abandoned sources only after human confirmation.
- Review whether new content created thin pages, confusing navigation, or duplicated definitions.
- Revisit the Content Governance policy when a recurring review problem appears.

## Before a release

```bash
npm ci
npm run atlas:quality
npm run typecheck
npm run lint
npm run build
```

Run a complete external link check separately. A third-party outage should not block an otherwise safe application release without human judgment.

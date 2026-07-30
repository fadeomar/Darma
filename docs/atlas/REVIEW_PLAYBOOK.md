# Tech Atlas Review Playbook

## Resource submission

1. Search by name, domain, and canonical URL.
2. Open the resource and confirm the intended landing page.
3. Identify the publisher from an official page.
4. Check whether pricing or access claims can be verified.
5. Write an original summary focused on user value.
6. Choose the narrowest accurate type, levels, categories, and tags.
7. Connect the source only to paths or Atlas entries it genuinely supports.
8. Run deterministic audits.
9. Check the URL manually or run the network checker.
10. Mark the review state honestly.

## Learning path change

Ask:

- Does the change improve an observable learning outcome?
- Is the sequence based on prerequisites rather than fashion?
- Can the checkpoint be reviewed by another person?
- Does the project produce a concrete artifact?
- Are official references available?
- Is an alternative being presented as an option rather than a mandatory tool?

## Career or workflow correction

Ask:

- Is the claim broadly true or specific to one organization?
- Does the entry distinguish role, seniority, and temporary responsibility?
- Does it explain trade-offs and misuse?
- Is the practical example consistent with the definition?
- Do the supporting sources actually support the proposed change?

## Automated link result interpretation

- `ok`: HTTP success or redirect.
- `blocked`: the site rejected or rate-limited automation; review manually.
- `broken`: confirmed not-found or gone response.
- `unavailable`: timeout, DNS, TLS, or temporary network failure; retry before changing content.

Never archive a source solely because one scheduled request timed out.

## Merge checklist

- Data schema passes.
- Cross-references resolve.
- No duplicate ID, slug, or canonical URL was introduced.
- Content uses original wording.
- Primary sources are recorded.
- UI is keyboard accessible and responsive when changed.
- The PR explains assumptions and remaining uncertainty.

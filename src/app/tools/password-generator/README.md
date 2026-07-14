# Password Generator Studio

A browser-local password and passphrase generator with policy profiles, production checks, safe configuration import/export, and developer-ready policy packs.

## Security model

- Random generation uses `globalThis.crypto.getRandomValues` with rejection sampling.
- Generation fails closed when Web Crypto is unavailable.
- Generated secrets are held only in component state.
- No breach API or remote password check is used.
- Every export deliberately excludes the generated password or passphrase.
- Custom seed text is treated as predictable and contributes zero estimated entropy.

## Structure

```text
password-generator/
  page.tsx                       route shell, registry metadata, JSON-LD
  PasswordGeneratorClient.tsx   generator UI, presets, audit, import/export, ZIP
  generator.ts                  secure generation and strength estimation
  generator.test.ts             generator and entropy regression tests
  studio.ts                     policy profiles, normalization, audit, safe exports
  studio.test.ts                policy/import/export edge-case tests
  types.ts                      shared generator types
  Article.tsx                   production and security guidance
```

## Practical presets

- Everyday account
- Important account
- Admin or finance
- Service secret
- Memorable passphrase

## Safe exports

- Darma policy JSON
- Markdown audit report
- JavaScript policy starter
- TypeScript policy starter
- Empty `.env.example`
- ZIP production pack

None of these formats contains the generated secret.

## Tests

```bash
npm exec vitest run \
  src/app/tools/password-generator/generator.test.ts \
  src/app/tools/password-generator/studio.test.ts
```

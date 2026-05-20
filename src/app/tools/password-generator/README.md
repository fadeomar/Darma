# Password Generator

Cryptographically random passwords and passphrases with a real-time strength meter. Nothing leaves the browser.

## Structure

```
password-generator/
  page.tsx                  — thin route shell, metadata from registry
  PasswordGeneratorClient.tsx — UI: mode tabs, sliders, toggles, colour-coded output
  generator.ts              — pure logic: generatePassword, generatePassphrase, calculateStrength, annotatePassword
  generator.test.ts         — vitest unit tests for generator
  types.ts                  — PasswordConfig, StrengthResult, CharType
  Article.tsx               — SEO article content (entropy guide, FAQ)
```

## Features

- Password mode: length, character sets, exclude-similar, exclude-ambiguous, seed text
- Passphrase mode: word count, separator, capitalise, include number/symbol
- Real-time entropy (bits) and crack-time estimate
- Colour-coded character types (lower / upper / digit / symbol)
- One-click copy

## Privacy

`local-only` — uses `window.crypto.getRandomValues` exclusively. Nothing is sent anywhere.

## Security note

The standard fallback (`Math.random`) is only reached if the browser lacks `window.crypto`, which is not the case for any modern browser. The tool fails closed — always prefer the cryptographic API.

## Running tests

```bash
npx vitest run src/app/tools/password-generator/generator.test.ts
```

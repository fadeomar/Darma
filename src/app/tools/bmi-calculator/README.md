# BMI Screening Studio

A browser-only adult BMI and waist-to-height screening workspace with context checks, local history, validated project import, and portable reports.

## Scope and safety

- BMI is calculated as `weightKg / (heightMetres ** 2)`.
- Adult category keys remain `underweight`, `normal`, `overweight`, and `obese` for backward compatibility.
- The UI presents the `normal` key as **Healthy weight**.
- BMI categories are screening bands, not diagnoses.
- Under-18 and pregnancy contexts block reliance on the standard adult interpretation.
- Ages 18–19 receive a caution because some public-health tools continue BMI-for-age guidance through age 19.
- Athlete/high-muscle context produces a warning because BMI does not directly measure body fat.

## Phase 30 architecture

- `bmi.ts` — pure formulas, conversions, category helpers, history CSV, and broad measurement validation.
- `studio.ts` — typed canonical configuration, snapshot calculation, applicability audit, import/export schema, summaries, Markdown, CSV, and methodology output.
- `BmiCalculatorClient.tsx` — responsive UI, unit-preserving conversion, local history, import flow, and downloads.
- `bmi.test.ts` — formula, boundary, conversion, validation, and history tests.
- `studio.test.ts` — project schema, normalization, applicability, summary, and export tests.

## Project format

```json
{
  "schema": "darma.bmi-screening",
  "version": 1,
  "exportedAt": "ISO-8601 timestamp",
  "config": {
    "system": "metric",
    "weightKg": 70,
    "heightCm": 175,
    "waistCm": 84,
    "targetWeightKg": 76,
    "age": 28,
    "pregnant": false,
    "athlete": false
  },
  "snapshot": {},
  "disclaimer": "..."
}
```

Imported data is normalized into broad technical bounds. The project format intentionally excludes browser history.

## Exports

- JSON project and calculated snapshot
- Markdown screening report
- One-row CSV snapshot
- Print view
- ZIP pack containing JSON, Markdown, CSV, methodology, and privacy README
- Separate local-history CSV

## Privacy

All calculations and imports run locally. Downloaded files may contain personal measurements and should be handled accordingly.

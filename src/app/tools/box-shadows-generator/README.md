# Box Shadows Generator

Build and preview CSS `box-shadow` declarations visually, with a directional light-source system and per-shadow controls.

## Privacy

`local-only` — all CSS is generated in the browser. No data is sent anywhere.

## Logic

### `generateShadowStyle(state: BoxShadowState): string`

Generates a CSS rule block for `.box-shadow-preview` from the current state.

**Input (`BoxShadowState`)**

| Field | Type | Description |
|---|---|---|
| `shadows` | `Shadow[]` | Array of shadow layer configurations |
| `boxSize` | `number` | Preview element width and height in px |
| `borderRadius` | `number` | Preview element border-radius in px |
| `backgroundColor` | `string` | Preview element background color |
| `activeLightSource` | `1 \| 2 \| 3 \| 4` | Controls offset direction (1=top-left, 2=top-right, 3=bottom-right, 4=bottom-left) |

**Per shadow (`Shadow`)**

| Field | Description |
|---|---|
| `offsetX / offsetY` | Base offset added to the light-source-derived position |
| `distance` | Light-source multiplier — `positionX = offsetX + distance × xMultiplier` |
| `blur / spread` | Standard CSS shadow parameters |
| `color` | Hex color (`#rrggbb`) — converted to `rgba()` using the shadow's `opacity` |
| `opacity` | 0–1 — combined with `color` into `rgba()` |
| `inset` | Prepends `inset ` to the shadow token |

**Output**

A CSS string of the form:
```css
.box-shadow-preview {
  box-shadow: <shadows>;
  width: <px>;
  height: <px>;
  border-radius: <px>;
  background-color: <value>;
}
```

Multiple shadows are joined with a comma. Falls back to light source 1 for unknown `activeLightSource` values.

> **Note:** `generateShadowStyle` currently contains a `console.log` call that should be removed before a production release.

## Tests

`generateShadowStyle.test.ts` — 13 tests covering CSS structure, all four light source directions, hex-to-rgba color conversion, inset flag, multiple shadows, unknown light source fallback, and zero distance.

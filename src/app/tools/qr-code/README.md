# QR Code Generator

Generate a scannable QR code from any URL or text and download it as a PNG image.

## Privacy

`server-assisted` — the text is sent to the Darma `/api/generate-qr` route, which uses the `qrcode` library to render the QR image server-side and returns a data URL. Nothing is stored.

## Validation

- **Client-side**: `MAX_QR_LENGTH = 2000` — a live character counter is shown below the input (amber at 90%, red at limit). The form blocks submission when the limit is exceeded.
- **Server-side**: the API route enforces the same 2 000-character limit before calling the QR library, so the guard cannot be bypassed by skipping the UI.

## Flow

1. User enters text or a URL in `QRCodeClient.tsx`
2. On submit, `POST /api/generate-qr` with `{ text }` body
3. Server returns `{ qrCodeUrl: string }` (a base64 data URL)
4. Client displays the QR image and enables the Download PNG button

## Files

| File | Role |
|---|---|
| `page.tsx` | Server component — `generateMetadata`, dynamic import of client |
| `QRCodeClient.tsx` | `"use client"` — form, state, fetch, download handler, character counter |
| `route.ts` (in `/api/generate-qr/`) | API handler — validates length, calls `qrcode.toDataURL` |

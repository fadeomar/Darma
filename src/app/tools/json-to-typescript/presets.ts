import type { InferOptions, JsonExample } from "./types";

export const DEFAULT_OPTIONS: InferOptions = {
  rootName: "Root",
  outputStyle: "interface",
  exportTypes: true,
  optionalProperties: false,
  readonlyProperties: false,
  useSemicolons: true,
  nullHandling: "include-null",
  arrayHandling: "all-items",
};

export const SAMPLE_JSON = `{
  "id": 42,
  "name": "Darma Tools",
  "isActive": true,
  "owner": {
    "id": "user_123",
    "email": "developer@example.com"
  },
  "tags": ["developer", "utility", "json"],
  "stats": {
    "views": 1200,
    "rating": null
  },
  "releases": [
    {
      "version": "1.0.0",
      "publishedAt": "2026-05-22T10:00:00Z"
    },
    {
      "version": "1.1.0",
      "publishedAt": null,
      "notes": "Draft release"
    }
  ]
}`;

export const JSON_EXAMPLES: JsonExample[] = [
  {
    id: "api-response",
    label: "API response",
    description: "Nested response with arrays, nullable values, and optional fields.",
    rootName: "ApiResponse",
    value: SAMPLE_JSON,
  },
  {
    id: "users",
    label: "Users array",
    description: "Top-level array with missing fields across rows.",
    rootName: "User",
    value: `[
  {
    "id": 1,
    "name": "Mira",
    "role": "admin"
  },
  {
    "id": 2,
    "name": "Omar",
    "lastLoginAt": "2026-05-20T09:30:00Z"
  }
]`,
  },
  {
    id: "invalid-keys",
    label: "Quoted keys",
    description: "Shows how invalid TypeScript property names are safely quoted.",
    rootName: "WebhookEvent",
    value: `{
  "event-id": "evt_123",
  "2fa-enabled": true,
  "type": "payment.created",
  "payload": {
    "amount-cents": 4900,
    "currency": "ILS"
  }
}`,
  },
];

export const OPTION_HELP = [
  {
    title: "Optional properties",
    description: "Make every generated property optional, or keep required fields required while marking missing array fields as optional.",
  },
  {
    title: "Null handling",
    description: "Include null in unions for exact API data, or treat null fields as optional when you prefer cleaner form types.",
  },
  {
    title: "Array inference",
    description: "Infer from all items for safer unions, or from the first item for quick samples that represent a known shape.",
  },
];

import type { InferOptions, JsonExample } from "./types";

export const DEFAULT_OPTIONS: InferOptions = {
  rootName: "ApiResponse",
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
    label: "Nested API response",
    description: "Objects, arrays, nullable values, ISO dates, and optional fields.",
    rootName: "ApiResponse",
    value: SAMPLE_JSON,
  },
  {
    id: "paginated-users",
    label: "Paginated users",
    description: "A common REST collection with pagination metadata and inconsistent rows.",
    rootName: "UsersPage",
    value: `{
  "data": [
    { "id": 1, "name": "Mira", "role": "admin", "lastLoginAt": "2026-07-10T09:30:00Z" },
    { "id": 2, "name": "Omar", "role": "editor" }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 57 },
  "nextCursor": null
}`,
  },
  {
    id: "webhook-event",
    label: "Webhook event",
    description: "Quoted keys, nested payloads, nullable metadata, and event timestamps.",
    rootName: "WebhookEvent",
    value: `{
  "event-id": "evt_123",
  "type": "payment.created",
  "createdAt": "2026-07-12T18:42:10Z",
  "payload": {
    "amount-cents": 4900,
    "currency": "ILS",
    "customer": { "id": "cus_8d2", "email": "customer@example.com" }
  },
  "metadata": null
}`,
  },
  {
    id: "app-config",
    label: "Application config",
    description: "Nested settings, feature flags, arrays, and environment-specific values.",
    rootName: "AppConfig",
    value: `{
  "environment": "production",
  "features": { "newDashboard": true, "betaSearch": false },
  "api": { "baseUrl": "https://api.example.com", "timeoutMs": 8000 },
  "locales": ["en", "ar"],
  "limits": { "uploadMb": 25, "retryCount": 3 }
}`,
    options: { readonlyProperties: true },
  },
  {
    id: "mixed-feed",
    label: "Mixed activity feed",
    description: "Demonstrates heterogeneous array unions that require manual review.",
    rootName: "ActivityFeed",
    value: `{
  "items": [
    { "type": "comment", "id": "c_1", "body": "Looks good" },
    { "type": "upload", "id": "u_1", "size": 2048 },
    "legacy-event"
  ]
}`,
  },
  {
    id: "sensitive-payload",
    label: "Sensitive payload audit",
    description: "Shows production warnings for secret-looking fields and unsafe identifiers.",
    rootName: "SessionPayload",
    value: `{
  "userId": 9007199254740992,
  "email": "person@example.com",
  "accessToken": "replace-me",
  "api_key": "replace-me",
  "permissions": []
}`,
  },
];

export const OPTION_HELP = [
  {
    title: "Optional properties",
    description: "Make every generated property optional, or infer optional fields only when sample objects omit them.",
  },
  {
    title: "Null handling",
    description: "Preserve null in unions for exact transport types, or translate nullable fields into optional application fields.",
  },
  {
    title: "Array inference",
    description: "Inspect all items for safer unions and optional fields, or use the first item when the sample is intentionally representative.",
  },
  {
    title: "Runtime validation",
    description: "TypeScript disappears at runtime. Use the generated Zod or JSON Schema starter when external payloads must be validated.",
  },
];

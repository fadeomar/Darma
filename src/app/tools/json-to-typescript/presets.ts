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
  {
    id: "graphql-response",
    label: "GraphQL response",
    description: "Nested data wrapper with nullable nodes and page information.",
    rootName: "ProductsQuery",
    value: `{
  "data": {
    "products": {
      "nodes": [
        { "id": "p_1", "name": "Desk lamp", "price": 49.9 },
        { "id": "p_2", "name": "Monitor arm", "price": null }
      ],
      "pageInfo": { "hasNextPage": true, "endCursor": "cursor_2" }
    }
  }
}`,
  },
  {
    id: "search-results",
    label: "Search results",
    description: "Result list with facets, highlights, paging, and optional metadata.",
    rootName: "SearchResponse",
    value: `{
  "query": "browser tools",
  "results": [
    { "id": "r1", "title": "Tool one", "score": 0.94, "highlights": ["browser", "tools"] },
    { "id": "r2", "title": "Tool two", "score": 0.81, "highlights": [] }
  ],
  "facets": { "category": { "developer": 12, "design": 7 } },
  "nextCursor": null
}`,
  },
  {
    id: "cms-article",
    label: "CMS article",
    description: "Editorial content with author, taxonomy, rich blocks, and publication timestamps.",
    rootName: "Article",
    value: `{
  "id": "post_42",
  "slug": "designing-for-content-density",
  "title": "Designing for content density",
  "author": { "id": "u_7", "name": "Maya" },
  "tags": ["design", "content"],
  "publishedAt": "2026-08-20T12:00:00Z",
  "blocks": [
    { "type": "paragraph", "text": "Start with the user task." },
    { "type": "image", "url": "https://cdn.example.com/image.jpg", "alt": "Dashboard example" }
  ]
}`,
  },
  {
    id: "analytics-event",
    label: "Analytics event",
    description: "Event envelope with actor, properties, context, and optional experiment data.",
    rootName: "AnalyticsEvent",
    value: `{
  "event": "checkout_started",
  "timestamp": "2026-08-20T12:03:10Z",
  "anonymousId": "anon_123",
  "properties": { "cartValue": 89.5, "currency": "USD", "itemCount": 3 },
  "context": { "locale": "en", "device": "mobile" },
  "experiment": null
}`,
  },
  {
    id: "error-response",
    label: "API error response",
    description: "Structured error code, message, field errors, and request identifier.",
    rootName: "ApiError",
    value: `{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Some fields are invalid",
    "fields": [
      { "field": "email", "message": "Enter a valid email address" },
      { "field": "name", "message": "Name is required" }
    ]
  },
  "requestId": "req_8ad2"
}`,
  },
  {
    id: "localization-map",
    label: "Localization map",
    description: "Nested locale dictionaries with placeholders and plural-like keys.",
    rootName: "Translations",
    value: `{
  "en": { "nav.home": "Home", "nav.tools": "Tools", "items.one": "1 item", "items.other": "{count} items" },
  "ar": { "nav.home": "الرئيسية", "nav.tools": "الأدوات", "items.one": "عنصر واحد", "items.other": "{count} عناصر" }
}`,
    options: { readonlyProperties: true },
  },
  {
    id: "feature-flags",
    label: "Feature flags",
    description: "Environment and user-facing feature configuration with rollout percentages.",
    rootName: "FeatureConfig",
    value: `{
  "environment": "production",
  "flags": {
    "savedViews": { "enabled": true, "rollout": 100 },
    "newSearch": { "enabled": true, "rollout": 25 },
    "betaExport": { "enabled": false, "rollout": 0 }
  }
}`,
    options: { readonlyProperties: true },
  },
  {
    id: "geo-response",
    label: "Location response",
    description: "Coordinates, address components, bounding box, and optional place metadata.",
    rootName: "PlaceResult",
    value: `{
  "id": "place_123",
  "name": "Central Library",
  "coordinates": { "lat": 31.5, "lng": 34.46 },
  "address": { "city": "Example City", "region": null, "countryCode": "PS" },
  "bbox": [34.45, 31.49, 34.47, 31.51],
  "categories": ["library", "public-service"]
}`,
  },
  {
    id: "payment-record",
    label: "Payment record",
    description: "Payment-like object with money fields, customer reference, status, and nullable failure data.",
    rootName: "Payment",
    value: `{
  "id": "pay_123",
  "amount": 4900,
  "currency": "usd",
  "status": "succeeded",
  "customer": { "id": "cus_123", "email": "customer@example.com" },
  "failure": null,
  "createdAt": "2026-08-20T14:00:00Z"
}`,
  },
  {
    id: "dashboard-widgets",
    label: "Dashboard widgets",
    description: "Heterogeneous dashboard sections with metrics, trends, and optional comparison values.",
    rootName: "DashboardResponse",
    value: `{
  "period": { "from": "2026-08-01", "to": "2026-08-31" },
  "widgets": [
    { "id": "revenue", "label": "Revenue", "value": 12450, "change": 8.2 },
    { "id": "activeUsers", "label": "Active users", "value": 824, "change": null }
  ],
  "alerts": []
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

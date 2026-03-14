/**
 * Demo presets with realistic AI-generated JSON outputs.
 * Each includes common LLM repair challenges and correction annotations.
 */

export interface DemoCorrection {
  description: string
  before?: string
  after?: string
}

export interface DemoPreset {
  label: string
  desc: string
  input: string
  schema: string
  corrections?: DemoCorrection[]
}

export const demoPresets: Record<string, DemoPreset> = {
  semanticClamp: {
    label: 'Semantic Clamp (Age < 100)',
    desc: 'Valid JSON, invalid business rule; clamp mode repairs locally',
    input: `{
  "name": "Casey",
  "age": 154
}`,
    schema: `z.object({
  name: z.string(),
  age: z.number().positive().max(100),
})`,
    corrections: [
      { description: 'Caught semantic constraint violation: age must be <= 100' },
      { description: 'Applied local clamp protocol: 154 -> 100' },
      { description: 'Telemetry flagged: status = coerced_locally with coerced path' },
    ],
  },

  markdown: {
    label: 'Markdown Code Fence',
    desc: 'JSON wrapped in ```json fences',
    input: '```json\n{"name": "Alice", "age": 30, "email": "alice@example.com"}\n```',
    schema: `z.object({\n  name: z.string(),\n  age: z.number(),\n  email: z.string(),\n})`,
    corrections: [
      {
        description: 'Extracted JSON from markdown code fence wrapper',
        before: '```json\\n{...}\\n```',
        after: '{...}',
      },
    ],
  },

  trailingCommas: {
    label: 'Trailing Commas',
    desc: 'Object and array with trailing commas',
    input: `{\n  "colors": ["red", "green", "blue",],\n  "count": 3,\n  "primary": "red",\n}`,
    schema: `z.object({\n  colors: z.array(z.string()),\n  count: z.number(),\n  primary: z.string(),\n})`,
    corrections: [
      { description: 'Removed trailing comma in array' },
      { description: 'Removed trailing comma after last property' },
    ],
  },

  unquotedKeys: {
    label: 'Unquoted Keys',
    desc: 'Bare object keys without quotes',
    input: `{name: "John", age: 30, city: "New York"}`,
    schema: `z.object({\n  name: z.string(),\n  age: z.number(),\n  city: z.string(),\n})`,
    corrections: [
      { description: 'Quoted 3 bare keys: name, age, city' },
    ],
  },

  singleQuotes: {
    label: 'Single Quotes',
    desc: "Keys and values in single quotes",
    input: `{'language': 'TypeScript', 'version': '5.0', 'strict': true}`,
    schema: `z.object({\n  language: z.string(),\n  version: z.string(),\n  strict: z.boolean(),\n})`,
    corrections: [
      { description: 'Converted single quotes to double quotes' },
    ],
  },

  escapedQuotes: {
    label: 'Escaped Quote Anomalies',
    desc: 'Improperly escaped quote wrappers',
    input: `{\\"title\\": \\"Hello World\\", \\"published\\": true}`,
    schema: `z.object({\n  title: z.string(),\n  published: z.boolean(),\n})`,
    corrections: [
      { description: 'Removed escaped quote wrappers' },
    ],
  },

  truncated: {
    label: 'Truncated Output',
    desc: 'Hit max_tokens mid-response',
    input: '{"users": [{"name": "Alice", "age": 30}, {"name": "Bob", age: "25',
    schema: `z.object({\n  users: z.array(z.object({\n    name: z.string(),\n    age: z.number(),\n  })),\n})`,
    corrections: [
      { description: 'Quoted bare key: age' },
      { description: 'Closed 3 unclosed brackets: "}, ] }' },
      { description: 'Coerced string "25" to number 25' },
    ],
  },

  typeCoercion: {
    label: 'Type Coercion',
    desc: 'Strings where booleans and numbers expected',
    input: `{\n  "name": "Widget Pro",\n  "price": "49.99",\n  "quantity": "100",\n  "inStock": "true",\n  "discontinued": "false",\n  "weight": "null"\n}`,
    schema: `z.object({\n  name: z.string(),\n  price: z.number(),\n  quantity: z.number(),\n  inStock: z.boolean(),\n  discontinued: z.boolean(),\n  weight: z.number().nullable(),\n})`,
    corrections: [
      { description: 'Coerced "49.99" → 49.99, "100" → 100' },
      { description: 'Coerced "true" → true, "false" → false' },
      { description: 'Coerced "null" → null' },
    ],
  },

  conversational: {
    label: 'Conversational Wrapper',
    desc: 'JSON buried in conversational text',
    input: `Here's the data you requested:\n\n{"task": "summarize", "status": "complete", "confidence": 0.95, "tokens": 142}\n\nLet me know if you need anything else!`,
    schema: `z.object({\n  task: z.string(),\n  status: z.string(),\n  confidence: z.number(),\n  tokens: z.number(),\n})`,
    corrections: [
      { description: 'Extracted JSON from conversational wrapper text' },
    ],
  },

  combined: {
    label: 'Combined Issues',
    desc: 'Multiple problems in one output',
    input: "```json\n{\n  name: \"Sarah Johnson\",\n  age: \"28\",\n  \"role\": 'engineer',\n  \"skills\": [\"TypeScript\", \"React\", \"Node.js\",],\n  \"active\": \"true\",\n}\n```",
    schema: `z.object({\n  name: z.string(),\n  age: z.number(),\n  role: z.string(),\n  skills: z.array(z.string()),\n  active: z.boolean(),\n})`,
    corrections: [
      { description: 'Extracted JSON from markdown code fence' },
      { description: 'Quoted 2 bare keys: name, age' },
      { description: "Converted single quotes on 'engineer' to double quotes" },
      { description: 'Removed 2 trailing commas' },
      { description: 'Coerced "28" → 28, "true" → true' },
    ],
  },

  validationFailure: {
    label: 'Validation Failure',
    desc: 'Valid JSON that fails schema validation',
    input: `{\n  "title": "Meeting Notes",\n  "date": "2026-03-11",\n  "attendees": "Alice, Bob, Carol"\n}`,
    schema: `z.object({\n  title: z.string(),\n  date: z.string(),\n  attendees: z.array(z.string()),\n  summary: z.string(),\n})`,
    corrections: [
      { description: 'Shows the retry prompt that would be sent to the LLM' },
    ],
  },

  lineAwareFailure: {
    label: 'Line-Aware Retry Context',
    desc: 'Multi-line mismatch with targeted retry lines',
    input: `{
  "order": {
    "id": "ord_1001",
    "total": "149.99",
    "items": "headphones, charger"
  }
}`,
    schema: `z.object({
  order: z.object({
    id: z.string(),
    total: z.number(),
    items: z.array(z.string()),
  }),
})`,
    corrections: [
      { description: 'Line-aware retry prompt highlights only failing lines' },
      { description: 'Shows exact local context instead of full raw payload' },
    ],
  },

  enterpriseDashboard: {
    label: 'Enterprise CRM Export (Massive)',
    desc: 'Large 150+ line payload with deep nesting, syntax damage, and semantic clamp targets',
    input: `{
  exportId: "crm_export_2026_03_14",
  "generatedAt": "2026-03-14T10:30:00Z",
  source: "revops-agent-v9",
  org: {
    "name": "Northstar Holdings",
    region: "global",
    seatCount: "4200",
    activeContracts: "188",
    status: active,
  },
  summary: {
    pipelineCoverage: 133,
    winRate: "0.31",
    churnRate: 182,
    nps: "91",
    weeklyMeetings: "240",
    avgCycleDays: "47",
  },
  dashboards: {
    executive: {
      forecast: {
        q1: { target: "5000000", committed: "4200000", gap: "800000", confidence: 122 },
        q2: { target: "6200000", committed: "5900000", gap: "300000", confidence: 96 },
      },
      health: {
        expansionReadiness: "high",
        retentionRisk: "critical",
        customerHealthScore: 154,
      },
    },
    sales: {
      pipelineByStage: [
        { stage: "lead", value: "1800000", deals: "88" },
        { stage: "discovery", value: "1450000", deals: "66" },
        { stage: "proposal", value: "980000", deals: "34" },
        { stage: "negotiation", value: "760000", deals: "19" },
        { stage: "closing", value: "550000", deals: "12" },
      ],
      reps: [
        { name: "Alyssa", quotaAttainment: 141, meetings: "35", closeRate: "0.41", },
        { name: "Marco", quotaAttainment: 98, meetings: "29", closeRate: "0.36", },
        { name: "Inez", quotaAttainment: -6, meetings: "22", closeRate: "0.19", },
        { name: "Tariq", quotaAttainment: 117, meetings: "30", closeRate: "0.34", },
      ],
    },
    support: {
      sla: {
        p1ResponseMinutes: "9",
        p2ResponseMinutes: "42",
        p3ResponseMinutes: "280",
      },
      ticketMix: {
        billing: "122",
        integration: "88",
        reliability: "44",
        access: "67",
      },
      escalations: [
        { id: "esc_1001", severity: "critical", ageHours: "8" },
        { id: "esc_1002", severity: "high", ageHours: "19" },
        { id: "esc_1003", severity: "medium", ageHours: "31" },
      ],
    },
  },
  accounts: [
    {
      id: "acc_001",
      name: "Acme Biotech",
      tier: "platinum-plus",
      owner: { id: "usr_11", name: "Juno Li", region: "na" },
      finance: {
        arr: "420000",
        renewalMonth: 13,
        invoices: [
          { id: "inv_101", amount: "82000", status: "paid", daysLate: -3 },
          { id: "inv_102", amount: "79000", status: "open", daysLate: 41 },
        ],
      },
      usage: {
        seatsPurchased: "500",
        seatsActive: "610",
        apiCalls30d: "2200000",
        featureFlags: ["insights", "alerts", "assistant",],
      },
      risks: {
        score: -14,
        signals: ["budget-freeze", "low-adoption", "exec-turnover"],
        mitigation: {
          status: "in-progress",
          owner: "csm_1",
          etaDays: "18",
        },
      },
    },
    {
      id: "acc_002",
      name: "Blue Harbor Retail",
      tier: "enterprise",
      owner: { id: "usr_21", name: "Mina Roe", region: "emea" },
      finance: {
        arr: "690000",
        renewalMonth: 6,
        invoices: [
          { id: "inv_201", amount: "118000", status: "paid", daysLate: 0 },
          { id: "inv_202", amount: "121000", status: "paid", daysLate: 2 },
          { id: "inv_203", amount: "129000", status: "open", daysLate: 57 },
        ],
      },
      usage: {
        seatsPurchased: "900",
        seatsActive: "872",
        apiCalls30d: "4120000",
        featureFlags: ["insights", "assistant"],
      },
      risks: {
        score: 33,
        signals: ["seasonal-volume"],
        mitigation: {
          status: "stable",
          owner: "csm_2",
          etaDays: "9",
        },
      },
    },
    {
      id: "acc_003",
      name: "Cobalt Transit Group",
      tier: enterprise,
      owner: { id: "usr_31", name: "Dario Chen", region: "apac" },
      finance: {
        arr: "510000",
        renewalMonth: 2,
        invoices: [
          { id: "inv_301", amount: "93000", status: "paid", daysLate: 0 },
          { id: "inv_302", amount: "94000", status: "open", daysLate: 74 },
        ],
      },
      usage: {
        seatsPurchased: "650",
        seatsActive: "603",
        apiCalls30d: "3010000",
        featureFlags: ["insights", "alerts"],
      },
      risks: {
        score: 124,
        signals: ["security-review", "legal-delay"],
        mitigation: {
          status: "watch",
          owner: "csm_3",
          etaDays: "22",
        },
      },
    },
  ],
  alerts: [
    { id: "al_1", type: "churn", severity: "high", accountId: "acc_001", openHours: "44" },
    { id: "al_2", type: "payment", severity: "critical", accountId: "acc_003", openHours: "89" },
    { id: "al_3", type: "adoption", severity: "medium", accountId: "acc_002", openHours: "12" },
  ],
  integrations: {
    salesforce: { connected: "true", lastSyncMinutesAgo: "11", recordsSynced: "99120" },
    hubspot: { connected: "false", lastSyncMinutesAgo: "null", recordsSynced: "0" },
    stripe: { connected: "true", lastSyncMinutesAgo: "7", recordsSynced: "42001" },
  },
  automation: {
    workflows: [
      {
        id: "wf_1",
        name: "Risk Escalation",
        enabled: "true",
        trigger: { type: "risk_score", threshold: 101 },
        actions: [
          { kind: "email", channel: "csm", template: "risk_alert_v2" },
          { kind: "task", channel: "sales", template: "renewal_recovery" },
        ],
      },
      {
        id: "wf_2",
        name: "Expansion Nudge",
        enabled: "true",
        trigger: { type: "usage_ratio", threshold: "0.82" },
        actions: [
          { kind: "email", channel: "owner", template: "expansion_1" },
          { kind: "slack", channel: "#revops", template: "expansion_signal" },
        ],
      },
    ],
  },
  metadata: {
    producedBy: "crm-agent",
    model: "gpt-4o-mini",
    tokenUsage: "18743",
    latencyMs: "2145",
  },
}`,
    schema: `z.object({
  exportId: z.string(),
  generatedAt: z.string(),
  source: z.string(),
  org: z.object({
    name: z.string(),
    region: z.string(),
    seatCount: z.number().min(1).max(10000),
    activeContracts: z.number().min(0).max(5000),
    status: z.enum(['active', 'paused', 'trial']),
  }),
  summary: z.object({
    pipelineCoverage: z.number().min(0).max(100),
    winRate: z.number().min(0).max(1),
    churnRate: z.number().min(0).max(100),
    nps: z.number().min(-100).max(100),
    weeklyMeetings: z.number().min(0).max(5000),
    avgCycleDays: z.number().min(1).max(365),
  }),
  dashboards: z.object({
    executive: z.object({
      forecast: z.object({
        q1: z.object({ target: z.number(), committed: z.number(), gap: z.number(), confidence: z.number().min(0).max(100) }),
        q2: z.object({ target: z.number(), committed: z.number(), gap: z.number(), confidence: z.number().min(0).max(100) }),
      }),
      health: z.object({
        expansionReadiness: z.enum(['low', 'medium', 'high']),
        retentionRisk: z.enum(['low', 'medium', 'high', 'critical']),
        customerHealthScore: z.number().min(0).max(100),
      }),
    }),
    sales: z.object({
      pipelineByStage: z.array(z.object({
        stage: z.enum(['lead', 'discovery', 'proposal', 'negotiation', 'closing']),
        value: z.number(),
        deals: z.number().min(0),
      })),
      reps: z.array(z.object({
        name: z.string(),
        quotaAttainment: z.number().min(0).max(200),
        meetings: z.number().min(0).max(500),
        closeRate: z.number().min(0).max(1),
      })),
    }),
    support: z.object({
      sla: z.object({
        p1ResponseMinutes: z.number().min(1).max(120),
        p2ResponseMinutes: z.number().min(1).max(240),
        p3ResponseMinutes: z.number().min(1).max(720),
      }),
      ticketMix: z.object({
        billing: z.number(),
        integration: z.number(),
        reliability: z.number(),
        access: z.number(),
      }),
      escalations: z.array(z.object({
        id: z.string(),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        ageHours: z.number().min(0).max(5000),
      })),
    }),
  }),
  accounts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    tier: z.enum(['startup', 'growth', 'enterprise']),
    owner: z.object({ id: z.string(), name: z.string(), region: z.string() }),
    finance: z.object({
      arr: z.number().min(0),
      renewalMonth: z.number().min(1).max(12),
      invoices: z.array(z.object({
        id: z.string(),
        amount: z.number().min(0),
        status: z.enum(['paid', 'open', 'void']),
        daysLate: z.number().min(0).max(365),
      })),
    }),
    usage: z.object({
      seatsPurchased: z.number().min(1),
      seatsActive: z.number().min(0).max(50000),
      apiCalls30d: z.number().min(0),
      featureFlags: z.array(z.string()),
    }),
    risks: z.object({
      score: z.number().min(0).max(100),
      signals: z.array(z.string()),
      mitigation: z.object({
        status: z.enum(['stable', 'watch', 'in-progress']),
        owner: z.string(),
        etaDays: z.number().min(0).max(365),
      }),
    }),
  })).min(1),
  alerts: z.array(z.object({
    id: z.string(),
    type: z.enum(['churn', 'payment', 'adoption']),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    accountId: z.string(),
    openHours: z.number().min(0).max(5000),
  })),
  integrations: z.object({
    salesforce: z.object({ connected: z.boolean(), lastSyncMinutesAgo: z.number().nullable(), recordsSynced: z.number() }),
    hubspot: z.object({ connected: z.boolean(), lastSyncMinutesAgo: z.number().nullable(), recordsSynced: z.number() }),
    stripe: z.object({ connected: z.boolean(), lastSyncMinutesAgo: z.number().nullable(), recordsSynced: z.number() }),
  }),
  automation: z.object({
    workflows: z.array(z.object({
      id: z.string(),
      name: z.string(),
      enabled: z.boolean(),
      trigger: z.object({ type: z.string(), threshold: z.number().min(0).max(100) }),
      actions: z.array(z.object({ kind: z.string(), channel: z.string(), template: z.string() })),
    })),
  }),
  metadata: z.object({
    producedBy: z.string(),
    model: z.string(),
    tokenUsage: z.number().min(0),
    latencyMs: z.number().min(0).max(30000),
  }),
})`,
    corrections: [
      { description: 'Large payload repair: quoted bare keys, removed trailing commas, and normalized invalid literals' },
      { description: 'Semantic clamps hit too_big and too_small issues (e.g., pipelineCoverage 133 -> 100, risk score -14 -> 0)' },
      { description: 'Enum mismatch clamped to first allowed option (e.g., tier: "platinum-plus" -> "startup")' },
      { description: 'Type coercion converts numeric/bool strings throughout nested arrays and objects' },
    ],
  },

  product: {
    label: 'Product Extraction',
    desc: 'E-commerce AI analysis with enrichment',
    input: `{\n  "productId": "SKU-47291",\n  "title": "Premium Wireless Headphones",\n  "price": "299.99",\n  "rating": 4.7,\n  "reviewCount": "1240",\n  "inStock": "true",\n  "specs": {\n    "batteryLife": "30 hours",\n    connectivity: ["Bluetooth 5.2", "3.5mm Jack"],\n  },\n  "features": [\n    "Active Noise Cancellation",\n    "Comfort Fit",\n  ],\n  "competitors": "4",\n  "commonComplaint": null\n}`,
    schema: `z.object({\n  productId: z.string(),\n  title: z.string(),\n  price: z.number(),\n  rating: z.number(),\n  reviewCount: z.number(),\n  inStock: z.boolean(),\n  specs: z.object({\n    batteryLife: z.string(),\n    connectivity: z.array(z.string()),\n  }),\n  features: z.array(z.string()),\n  competitors: z.number(),\n  commonComplaint: z.string().nullable(),\n})`,
    corrections: [
      { description: 'Quoted bare key: connectivity' },
      { description: 'Removed 2 trailing commas' },
      { description: 'Coerced "299.99" → 299.99, "1240" → 1240, "true" → true, "4" → 4' },
    ],
  },
}

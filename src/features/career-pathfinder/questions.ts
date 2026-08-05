import type { PathfinderQuestion } from "./types";

export const PATHFINDER_QUESTIONS: PathfinderQuestion[] = [
  {
    id: "outcome",
    eyebrow: "The outcome",
    title: "Which result would make you proudest?",
    helper: "Choose the kind of value you would enjoy seeing at the end of the work.",
    options: [
      { id: "product", label: "A useful product people can interact with", description: "Interfaces, applications, and working features.", focusWeights: { build: 4, design: 2 }, categoryWeights: { engineering: 3, "design-research": 1 }, keywords: ["frontend", "mobile", "full-stack"] },
      { id: "reliable", label: "A reliable system that keeps working", description: "Quality, infrastructure, security, and operational confidence.", focusWeights: { quality: 4, build: 1 }, categoryWeights: { "quality-security": 4, engineering: 1 }, keywords: ["devops", "sre", "testing", "security"] },
      { id: "understanding", label: "A better understanding of users and problems", description: "Research, product discovery, and clearer decisions.", focusWeights: { discovery: 4, design: 2 }, categoryWeights: { "design-research": 3, "product-delivery": 2 }, keywords: ["research", "product"] },
      { id: "team", label: "A team that can move with clarity", description: "Planning, facilitation, leadership, and healthy collaboration.", focusWeights: { delivery: 4, people: 3 }, categoryWeights: { "product-delivery": 3, leadership: 3 }, keywords: ["manager", "lead", "scrum"] },
      { id: "growth", label: "A service that reaches and supports more people", description: "Operations, growth, customer success, and business systems.", focusWeights: { business: 4, people: 2 }, categoryWeights: { "operations-growth": 4 }, keywords: ["marketing", "operations", "customer"] },
    ],
  },
  {
    id: "attention",
    eyebrow: "Your attention",
    title: "What do you naturally notice first?",
    helper: "Think about the details your brain starts evaluating without being asked.",
    options: [
      { id: "visual", label: "Visual hierarchy and interaction details", description: "Spacing, clarity, behavior, and how an experience feels.", focusWeights: { design: 4, build: 1 }, categoryWeights: { "design-research": 4 }, keywords: ["ui", "ux", "frontend"] },
      { id: "logic", label: "Logic, architecture, and edge cases", description: "How pieces connect and what happens when conditions change.", focusWeights: { build: 4, quality: 1 }, categoryWeights: { engineering: 4 }, keywords: ["backend", "architecture", "full-stack"] },
      { id: "risk", label: "Risk, defects, and weak assumptions", description: "What could fail, become unsafe, or create an unreliable outcome.", focusWeights: { quality: 4 }, categoryWeights: { "quality-security": 4 }, keywords: ["qa", "security", "reliability"] },
      { id: "people", label: "People, alignment, and missing context", description: "Who needs to decide, collaborate, learn, or be supported.", focusWeights: { people: 4, delivery: 2 }, categoryWeights: { leadership: 3, "product-delivery": 2, "operations-growth": 1 }, keywords: ["manager", "people", "operations"] },
      { id: "evidence", label: "Evidence, behavior, and unmet needs", description: "What users actually do and what the team still does not know.", focusWeights: { discovery: 4 }, categoryWeights: { "design-research": 3, "product-delivery": 2 }, keywords: ["research", "analyst", "product"] },
    ],
  },
  {
    id: "craft",
    eyebrow: "The craft",
    title: "Which activity sounds most satisfying?",
    helper: "You do not need existing experience. Choose what you would enjoy practicing repeatedly.",
    options: [
      { id: "code", label: "Writing and improving code", description: "Building behavior, systems, integrations, and reusable components.", focusWeights: { build: 5 }, categoryWeights: { engineering: 4 }, keywords: ["developer", "engineer"] },
      { id: "design", label: "Sketching, prototyping, and shaping experiences", description: "Turning needs into flows, interfaces, and testable ideas.", focusWeights: { design: 5, discovery: 1 }, categoryWeights: { "design-research": 4 }, keywords: ["designer"] },
      { id: "test", label: "Testing, investigating, and strengthening quality", description: "Creating evidence that a system is ready and dependable.", focusWeights: { quality: 5 }, categoryWeights: { "quality-security": 4 }, keywords: ["qa", "security", "sre"] },
      { id: "coordinate", label: "Coordinating decisions and delivery", description: "Making goals, risks, ownership, and next actions visible.", focusWeights: { delivery: 5 }, categoryWeights: { "product-delivery": 4 }, keywords: ["project", "product", "scrum"] },
      { id: "coach", label: "Coaching people and improving the system", description: "Helping others grow while raising team capability and direction.", focusWeights: { people: 5 }, categoryWeights: { leadership: 4, "operations-growth": 1 }, keywords: ["manager", "lead", "people"] },
    ],
  },
  {
    id: "ambiguity",
    eyebrow: "Uncertainty",
    title: "How do you prefer to handle unclear problems?",
    helper: "All technology roles face ambiguity, but they engage with it in different ways.",
    options: [
      { id: "experiment", label: "Run a small experiment and observe", description: "Learn through prototypes, research, or measurable product changes.", focusWeights: { discovery: 4, design: 2 }, categoryWeights: { "design-research": 3, "product-delivery": 2 }, keywords: ["research", "product"] },
      { id: "decompose", label: "Break the problem into technical parts", description: "Define boundaries, contracts, constraints, and implementation steps.", focusWeights: { build: 4 }, categoryWeights: { engineering: 4 }, keywords: ["engineer", "architect"] },
      { id: "control", label: "Reduce risk with checks and safeguards", description: "Use tests, monitoring, controls, and failure analysis.", focusWeights: { quality: 4 }, categoryWeights: { "quality-security": 4 }, keywords: ["qa", "security", "sre"] },
      { id: "facilitate", label: "Bring people together to clarify it", description: "Surface assumptions, resolve ownership, and build a shared plan.", focusWeights: { delivery: 3, people: 3 }, categoryWeights: { leadership: 3, "product-delivery": 3 }, keywords: ["manager", "scrum", "project"] },
      { id: "business", label: "Connect it to customer and business impact", description: "Prioritize the opportunity, outcome, and operating model.", focusWeights: { business: 4, delivery: 1 }, categoryWeights: { "operations-growth": 3, "product-delivery": 2 }, keywords: ["marketing", "operations", "product"] },
    ],
  },
  {
    id: "collaboration",
    eyebrow: "Collaboration",
    title: "Which collaboration pattern fits you best?",
    helper: "Choose the interaction you would be comfortable doing often, not only occasionally.",
    options: [
      { id: "deep", label: "Long focus with a small technical group", description: "Deep craft, reviews, and solving complex implementation problems.", focusWeights: { build: 4, quality: 1 }, categoryWeights: { engineering: 3, "quality-security": 1 }, keywords: ["developer", "engineer"] },
      { id: "cross", label: "Frequent work across design, product, and engineering", description: "Translate between disciplines and keep a user outcome coherent.", focusWeights: { design: 2, delivery: 2, discovery: 2 }, categoryWeights: { "design-research": 2, "product-delivery": 2, engineering: 1 }, keywords: ["frontend", "product", "designer"] },
      { id: "facilitation", label: "Facilitating groups and difficult decisions", description: "Create clarity, safety, accountability, and forward movement.", focusWeights: { people: 4, delivery: 3 }, categoryWeights: { leadership: 4, "product-delivery": 2 }, keywords: ["manager", "lead", "scrum"] },
      { id: "stakeholder", label: "Working with customers and stakeholders", description: "Understand needs, manage expectations, and connect work to value.", focusWeights: { business: 3, discovery: 2 }, categoryWeights: { "operations-growth": 3, "product-delivery": 2 }, keywords: ["customer", "marketing", "product"] },
    ],
  },
  {
    id: "environment",
    eyebrow: "The environment",
    title: "Which environment sounds most energizing?",
    helper: "This helps distinguish the context around the role, not only the skill itself.",
    options: [
      { id: "product", label: "A product team improving one experience over time", description: "Continuous discovery, delivery, metrics, and iteration.", focusWeights: { build: 2, design: 2, discovery: 2 }, categoryWeights: { engineering: 2, "design-research": 2, "product-delivery": 2 }, keywords: ["product", "frontend", "designer"] },
      { id: "platform", label: "A platform or infrastructure team", description: "Reliability, developer experience, automation, and technical systems.", focusWeights: { build: 3, quality: 3 }, categoryWeights: { engineering: 3, "quality-security": 3 }, keywords: ["devops", "sre", "platform", "backend"] },
      { id: "client", label: "A client or project delivery team", description: "Different domains, deadlines, requirements, and stakeholder contexts.", focusWeights: { delivery: 3, build: 1, design: 1 }, categoryWeights: { "product-delivery": 3, engineering: 1, "design-research": 1 }, keywords: ["project", "full-stack"] },
      { id: "organization", label: "Improving how a whole organization works", description: "People systems, leadership, operations, growth, and capability.", focusWeights: { people: 4, business: 3 }, categoryWeights: { leadership: 4, "operations-growth": 3 }, keywords: ["manager", "operations", "people"] },
    ],
  },
];

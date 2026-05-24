export const SITE_NAME = "Krista Mashore — AI for Business";
export const SITE_TAGLINE =
  "AI workflows, autonomous agents, and systems that scale your business without scaling your team.";
export const SITE_URL = "https://kristamashore.ai";
export const SITE_AUTHOR = "Krista Mashore";

export const DEFAULT_CTA_URL = "https://kristamashore.com/LevelUp";
export const DEFAULT_CTA_LABEL = "Learn the AI System";

export const PERSON = {
  name: "Krista Mashore",
  jobTitle: "AI Business Coach & Authority",
  url: SITE_URL,
  image: `${SITE_URL}/images/krista-headshot.jpg`,
  description:
    "Krista Mashore is a top 1% real estate agent for 19 consecutive years, built a $72M coaching company in 7.5 years, and now teaches entrepreneurs, real estate agents, and lenders how to use AI to scale without hiring. Creator of The Authority Agent Operating System™ and the Community Market Leader® methodology, now adapted for the AI era.",
  sameAs: [
    "https://kristamashore.com",
    "https://www.linkedin.com/in/krista-mashore",
    "https://www.youtube.com/@KristaMashore",
    "https://www.instagram.com/kristamashore",
    "https://www.facebook.com/kristamashore",
  ],
  knowsAbout: [
    "AI for Business",
    "Authority Agent Operating System",
    "AI Content to Client System",
    "AI Workflows and Autonomous Agents",
    "Community Market Leader",
    "Claude Code",
    "AI for Real Estate",
    "AI for Lenders",
    "AI for Entrepreneurs",
  ],
};

export const ORG = {
  name: "Krista Mashore Coaching",
  legalName: "Krista Mashore Coaching",
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo.png`,
  founder: PERSON.name,
  foundingDate: "2017",
  description:
    "Coaching company helping entrepreneurs, real estate agents, and lenders use AI to automate their business, build autonomous workflows, and scale without hiring more people.",
  sameAs: PERSON.sameAs,
  awards: [
    "11x ClickFunnels Two Comma Club Award ($1M+ funnel)",
    "2x ClickFunnels $10M+ funnel award",
    "2x ClickFunnels $25M+ funnel award",
    "Inc. 5000 (2023)",
    "Success Magazine Top 125 Most Impactful Leaders (2022)",
    "Success Women of Influence (2024)",
  ],
};

export const COURSES = [
  {
    name: "Level Up AI Training",
    description:
      "The training that shows you how to use AI to run your business with fewer people, more output, and real systems.",
    provider: ORG.name,
    url: "https://kristamashore.com/LevelUp",
  },
];

export const PILLARS = {
  "authority-agent-operating-system": {
    label: "The Authority Agent Operating System™",
    slug: "authority-agent-operating-system",
    role: "anchor" as const,
    description:
      "How to build the AI operating system that makes you the obvious choice in your space. The trademarked framework that ties it all together.",
  },
  "ai-content-to-client-system": {
    label: "AI Content to Client System",
    slug: "ai-content-to-client-system",
    role: "supporting" as const,
    description:
      "Using AI to turn content into clients. Marketing, lead gen, nurture, conversion. All connected.",
  },
  "ai-run-business": {
    label: "The AI-Run Business",
    slug: "ai-run-business",
    role: "supporting" as const,
    description:
      "Workflows, agents, fulfillment, delivery, retention, resell. The AI side of running the actual operation.",
  },
  "community-market-leaders-ai": {
    label: "Community Market Leaders®: AI for Real Estate & Lenders",
    slug: "community-market-leaders-ai",
    role: "supporting" as const,
    description:
      "Deep dive: A-Z listing process with AI. Pricing, virtual staging, tours, listing copy, lead follow-up, lender workflows.",
  },
  "claude-for-dummies": {
    label: "Claude for Dummies: The AI Tools That Actually Matter",
    slug: "claude-for-dummies",
    role: "supporting" as const,
    description:
      "Practical Claude-only training. Skip the ChatGPT confusion. Skills, projects, Claude Code, Claude Desktop. What works and how to use it.",
  },
};

export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Articles", to: "/articles" },
  { label: "Authority OS", to: "/authority-agent-operating-system" },
  { label: "Content to Client", to: "/ai-content-to-client-system" },
  { label: "AI-Run Business", to: "/ai-run-business" },
  { label: "CML AI", to: "/community-market-leaders-ai" },
  { label: "Claude", to: "/claude-for-dummies" },
  { label: "About", to: "/about" },
];

export const ROBOT_AGENTS_ALLOWED = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Googlebot",
  "Bingbot",
  "DuckDuckBot",
];

export const GA4_MEASUREMENT_ID = "";

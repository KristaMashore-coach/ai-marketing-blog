export const SITE_NAME = "Krista Mashore — AI for Business";
export const SITE_TAGLINE =
  "AI workflows, autonomous agents, and systems that scale your business without scaling your team.";
export const SITE_URL = "https://aiBlog.kristamashore.com";
export const SITE_AUTHOR = "Krista Mashore";

export const DEFAULT_CTA_URL = "https://kristamashore.com/LevelUp";
export const DEFAULT_CTA_LABEL = "Learn the AI System";

export const PERSON = {
  name: "Krista Mashore",
  jobTitle: "AI Business Coach & Authority",
  url: SITE_URL,
  image: `${SITE_URL}/images/krista-headshot.jpg`,
  description:
    "Krista Mashore is a top 1% real estate agent for 19 consecutive years, built a $72M coaching company in 7.5 years, and now teaches entrepreneurs, real estate agents, and lenders how to use AI to scale without hiring. She shows business owners how to build autonomous agents, automate repetitive work, and position themselves as the AI authority in their market.",
  sameAs: [
    "https://kristamashore.com",
    "https://www.linkedin.com/in/krista-mashore",
    "https://www.youtube.com/@KristaMashore",
    "https://www.instagram.com/kristamashore",
    "https://www.facebook.com/kristamashore",
  ],
  knowsAbout: [
    "AI for Business",
    "AI Automation",
    "Autonomous AI Agents",
    "Claude Code",
    "AI for Entrepreneurs",
    "AI for Real Estate Agents",
    "AI for Lenders",
    "AI Authority Positioning",
    "Business Systems",
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
  "ai-business-automation": {
    label: "AI Business Automation",
    slug: "ai-business-automation",
    role: "anchor" as const,
    description:
      "Real workflows. Autonomous agents. How to take the work off your plate so you can focus on what only you can do.",
  },
  "ai-tools-systems": {
    label: "AI Tools & Systems",
    slug: "ai-tools-systems",
    role: "supporting" as const,
    description:
      "Claude Code, ChatGPT, Make, n8n, and the rest. What to use, how to set it up, and what kind of return to expect.",
  },
  "ai-authority-positioning": {
    label: "Authority & Positioning",
    slug: "ai-authority-positioning",
    role: "supporting" as const,
    description:
      "How to become the AI expert your audience trusts. Content, visibility, and positioning that makes you the obvious choice.",
  },
};

export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Articles", to: "/articles" },
  { label: "AI Automation", to: "/ai-business-automation" },
  { label: "AI Tools", to: "/ai-tools-systems" },
  { label: "Authority", to: "/ai-authority-positioning" },
  { label: "About Krista", to: "/about" },
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

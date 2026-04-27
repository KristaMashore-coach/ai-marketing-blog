export const SITE_NAME = "Krista Mashore Coaching";
export const SITE_TAGLINE =
  "Real estate marketing for agents who want to be chosen, not chase.";
export const SITE_URL = "https://blog.kristamashore.com";
export const SITE_AUTHOR = "Krista Mashore";

export const DEFAULT_CTA_URL = "https://kristamashore.com/LevelUp";
export const DEFAULT_CTA_LABEL = "Get the Level Up Training";

export const PERSON = {
  name: "Krista Mashore",
  jobTitle: "Real Estate Marketing Coach",
  url: SITE_URL,
  image: `${SITE_URL}/images/krista-headshot.jpg`,
  description:
    "Krista Mashore is a top 1% real estate agent for 19 consecutive years. She personally sold 2,300+ homes and built her coaching company from zero to over $72 million in online sales in 7.5 years. She coaches real estate agents and mortgage loan officers on attraction-based marketing using video, social media, AI, and digital sales funnels. Her trademarked Community Market Leader® methodology teaches agents to be known before they're needed.",
  sameAs: [
    "https://kristamashore.com",
    "https://www.linkedin.com/in/krista-mashore",
    "https://www.youtube.com/@KristaMashore",
    "https://www.instagram.com/kristamashore",
    "https://www.facebook.com/kristamashore",
  ],
  knowsAbout: [
    "Real Estate Marketing",
    "Real Estate Lead Generation",
    "Real Estate Personal Branding",
    "Community Market Leader",
    "Digital Marketing",
    "Sales Funnels",
    "Video Marketing",
    "Real Estate Coaching",
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
    "Coaching company for real estate agents and mortgage loan officers. Teaches a complete marketing system covering branding, lead generation, nurture, conversion, and repeat referral business.",
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
    name: "30-Day Success Plan",
    description:
      "Entry-point coaching program. Real estate agents and lenders implement attraction-based marketing in 30 days.",
    provider: ORG.name,
    url: "https://kristamashore.com/30-day-success-plan",
  },
  {
    name: "Signature Authority System",
    description:
      "Flagship coaching program. Complete marketing system: branding, content, lead generation, nurture, conversion, automation, repeat referral.",
    provider: ORG.name,
    url: "https://kristamashore.com/signature-authority-system",
  },
  {
    name: "Community Market Leader® Mastermind",
    description:
      "Advanced mastermind for established agents who want to dominate their local market.",
    provider: ORG.name,
    url: "https://kristamashore.com/community-market-leader-mastermind",
  },
];

export const PILLARS = {
  "real-estate-marketing": {
    label: "Real Estate Marketing",
    slug: "real-estate-marketing",
    role: "anchor" as const,
    description:
      "How to market like a digital pro: short and long form video, social, paid ads, attraction-based positioning. The umbrella for everything.",
  },
  "real-estate-lead-generation": {
    label: "Real Estate Lead Generation",
    slug: "real-estate-lead-generation",
    role: "supporting" as const,
    description:
      "How to generate leads without cold calling, door knocking, or buying low-quality lists. Funnels, content, and inbound systems.",
  },
  "personal-branding-authority": {
    label: "Personal Branding & Authority",
    slug: "personal-branding-authority",
    role: "supporting" as const,
    description:
      "How to become a Community Market Leader® in your town. Win before you arrive. Be known before you're needed.",
  },
};

export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Articles", to: "/articles" },
  { label: "Real Estate Marketing", to: "/real-estate-marketing" },
  { label: "Lead Generation", to: "/real-estate-lead-generation" },
  { label: "Personal Branding", to: "/personal-branding-authority" },
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

// BRAND-ASSET-PENDING — replace placeholder GA4 ID once Krista delivers her measurement ID
export const GA4_MEASUREMENT_ID = "G-PLACEHOLDER";

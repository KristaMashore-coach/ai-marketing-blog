export type TopicalPillar =
  | "authority-agent-operating-system"
  | "ai-content-to-client-system"
  | "ai-run-business"
  | "community-market-leaders-ai"
  | "claude-for-dummies";

export type ContentTypePillar =
  | "local-market-authority"
  | "problem-solving"
  | "educational-authority"
  | "proof-and-validation"
  | "personal-brand-relatability"
  | "process-and-differentiation";

export type FunnelStage =
  | "attention"
  | "resonance"
  | "authority"
  | "capture"
  | "nurture"
  | "conversion"
  | "ascension";

export interface FAQEntry {
  question: string;
  answer: string;
}

export interface Post {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  publishedDate: string;
  modifiedDate: string;
  author: "Krista Mashore";
  topicalPillar: TopicalPillar;
  contentTypePillar: ContentTypePillar;
  funnelStage: FunnelStage;
  keywords: string[];
  wordCount: number;
  readingMinutes: number;
  featuredImage: { src: string; alt: string };
  faq: FAQEntry[];
  internalLinks: string[];
  ctaUrl: string;
  ctaLabel: string;
  body: string;
  draft?: boolean;
}

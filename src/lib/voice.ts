// Voice rule check helpers used by the queue-article CLI and tests.
// Source of truth: BUILD-DECISIONS.md and Krista's 07-Voice-Rules.md.

export const BANNED_PHRASES = [
  "leverage",
  "utilize",
  "optimize",
  "transformative",
  "cutting-edge",
  "seamless",
  "robust",
  "unlock",
  "unleash",
  "empower",
  "journey",
  "elevate",
  "delve",
  "embark",
  "disrupt",
  "blueprint",
  "innovative",
  "synergy",
  "stakeholders",
  "ecosystem",
  "alignment",
  "groundbreaking",
  "in conclusion",
  "let's explore",
  "let's be honest",
  "it's important to note",
  "it is worth noting",
  "the reality is",
  "here's the truth",
  "in today's fast-paced world",
  "in today's landscape",
  "at the end of the day",
  "moving forward",
  "circle back",
  "dive in",
  "dive deep",
  "navigate",
];

export interface VoiceCheck {
  passed: boolean;
  hits: { phrase: string; index: number }[];
  emDashCount: number;
}

export function checkVoice(text: string): VoiceCheck {
  const lower = text.toLowerCase();
  const hits: { phrase: string; index: number }[] = [];
  for (const phrase of BANNED_PHRASES) {
    const i = lower.indexOf(phrase);
    if (i >= 0) hits.push({ phrase, index: i });
  }
  const emDashCount = (text.match(/—/g) || []).length;
  return { passed: hits.length === 0 && emDashCount === 0, hits, emDashCount };
}

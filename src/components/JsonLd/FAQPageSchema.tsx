import JsonLd from "./JsonLd";
import type { FAQEntry } from "../../types/post";

export default function FAQPageSchema({ faq }: { faq: FAQEntry[] }) {
  if (!faq || faq.length === 0) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return <JsonLd data={data} />;
}

import JsonLd from "./JsonLd";
import { PERSON, ORG, SITE_URL } from "../../lib/constants";
import type { Post } from "../../types/post";

export default function BlogPostingSchema({ post }: { post: Post }) {
  const url = `${SITE_URL}/articles/${post.slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.title,
    name: post.title,
    description: post.excerpt,
    image: post.featuredImage.src.startsWith("http")
      ? post.featuredImage.src
      : `${SITE_URL}${post.featuredImage.src}`,
    url,
    datePublished: post.publishedDate,
    dateModified: post.modifiedDate,
    author: {
      "@type": "Person",
      "@id": `${PERSON.url}#person`,
      name: PERSON.name,
      url: PERSON.url,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${ORG.url}#organization`,
      name: ORG.name,
      logo: { "@type": "ImageObject", url: ORG.logo },
    },
    keywords: post.keywords.join(", "),
    wordCount: post.wordCount,
    articleSection: post.topicalPillar,
    inLanguage: "en-US",
  };
  return <JsonLd data={data} />;
}

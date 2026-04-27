import { Helmet } from "react-helmet-async";
import { SITE_NAME, SITE_URL } from "../lib/constants";

interface Props {
  title: string;
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalPath: string;
  ogImage?: string;
  ogType?: "website" | "article";
  publishedDate?: string;
  modifiedDate?: string;
  author?: string;
  keywords?: string[];
  noIndex?: boolean;
}

export default function SEO({
  title,
  description,
  metaTitle,
  metaDescription,
  canonicalPath,
  ogImage = `${SITE_URL}/og-default.png`,
  ogType = "website",
  publishedDate,
  modifiedDate,
  author,
  keywords,
  noIndex = false,
}: Props) {
  const finalTitle = metaTitle ?? title;
  const finalDescription = metaDescription ?? description;
  const url = `${SITE_URL}${canonicalPath}`;
  const fullTitle =
    finalTitle.length > 0 && finalTitle !== SITE_NAME
      ? `${finalTitle} | ${SITE_NAME}`
      : SITE_NAME;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}
      {author && <meta name="author" content={author} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={url} />

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage} />
      {publishedDate && (
        <meta property="article:published_time" content={publishedDate} />
      )}
      {modifiedDate && (
        <meta property="article:modified_time" content={modifiedDate} />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}

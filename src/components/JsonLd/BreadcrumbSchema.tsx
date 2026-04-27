import JsonLd from "./JsonLd";
import { SITE_URL } from "../../lib/constants";

export interface Crumb {
  name: string;
  path: string;
}

export default function BreadcrumbSchema({ crumbs }: { crumbs: Crumb[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
  return <JsonLd data={data} />;
}

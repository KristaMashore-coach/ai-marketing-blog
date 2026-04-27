import { useLocation, Navigate } from "react-router-dom";
import SEO from "../components/SEO";
import CTA from "../components/CTA";
import ArticleCard from "../components/ArticleCard";
import BreadcrumbSchema from "../components/JsonLd/BreadcrumbSchema";
import { getPostsByPillar } from "../lib/posts";
import { PILLARS } from "../lib/constants";
import type { TopicalPillar } from "../types/post";

export default function PillarPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, "").replace(/\/$/, "");
  const known = slug in PILLARS ? (slug as TopicalPillar) : undefined;
  if (!known) return <Navigate to="/404" replace />;

  const meta = PILLARS[known];
  const posts = getPostsByPillar(known);

  return (
    <>
      <SEO
        title={meta.label}
        description={meta.description}
        metaTitle={`${meta.label} Articles | Krista Mashore`}
        metaDescription={meta.description}
        canonicalPath={`/${meta.slug}`}
      />
      <BreadcrumbSchema
        crumbs={[
          { name: "Home", path: "/" },
          { name: meta.label, path: `/${meta.slug}` },
        ]}
      />

      <header className="bg-gradient-to-br from-primary-50 to-bg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-700">
            {meta.role === "anchor" ? "Anchor pillar" : "Supporting pillar"}
          </p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl text-ink leading-tight">
            {meta.label}
          </h1>
          <p className="mt-4 text-lg text-ink/80 max-w-2xl">{meta.description}</p>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="font-display text-2xl text-ink mb-6">
          {posts.length} {posts.length === 1 ? "article" : "articles"}
        </h2>
        {posts.length === 0 ? (
          <p className="text-muted py-12 text-center">
            No articles published yet in this pillar. New articles publish daily.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <ArticleCard key={p.slug} post={p} />
            ))}
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <CTA />
      </section>
    </>
  );
}

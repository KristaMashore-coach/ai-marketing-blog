import { useState, useMemo } from "react";
import SEO from "../components/SEO";
import ArticleCard from "../components/ArticleCard";
import BreadcrumbSchema from "../components/JsonLd/BreadcrumbSchema";
import { getAllPosts } from "../lib/posts";
import { PILLARS } from "../lib/constants";
import type { TopicalPillar } from "../types/post";

export default function BlogIndex() {
  const allPosts = getAllPosts();
  const [filter, setFilter] = useState<TopicalPillar | "all">("all");

  const filtered = useMemo(
    () => (filter === "all" ? allPosts : allPosts.filter((p) => p.topicalPillar === filter)),
    [allPosts, filter]
  );

  return (
    <>
      <SEO
        title="All Articles"
        description="Articles on real estate marketing, lead generation, and personal branding for agents and lenders."
        metaTitle="All Articles | Krista Mashore"
        metaDescription="Real estate marketing, lead gen, and branding articles for agents who want predictable pipelines."
        canonicalPath="/articles"
      />
      <BreadcrumbSchema
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Articles", path: "/articles" },
        ]}
      />

      <header className="bg-gradient-to-br from-primary-50 to-bg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="font-display text-4xl sm:text-5xl text-ink">All articles</h1>
          <p className="mt-3 text-lg text-ink/80 max-w-2xl">
            {allPosts.length} {allPosts.length === 1 ? "article" : "articles"} across three pillars.
          </p>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setFilter("all")}
            className={`text-sm px-4 py-2 rounded-full border transition-colors ${
              filter === "all"
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-ink border-slate-200 hover:border-primary-300"
            }`}
          >
            All ({allPosts.length})
          </button>
          {Object.values(PILLARS).map((p) => {
            const count = allPosts.filter((a) => a.topicalPillar === p.slug).length;
            return (
              <button
                key={p.slug}
                onClick={() => setFilter(p.slug as TopicalPillar)}
                className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                  filter === p.slug
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-ink border-slate-200 hover:border-primary-300"
                }`}
              >
                {p.label} ({count})
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted py-12 text-center">No articles published yet in this pillar. Check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <ArticleCard key={p.slug} post={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

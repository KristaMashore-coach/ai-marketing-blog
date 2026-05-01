import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import CTA from "../components/CTA";
import ArticleCard from "../components/ArticleCard";
import { getAllPosts } from "../lib/posts";
import { PILLARS, SITE_NAME } from "../lib/constants";

export default function Home() {
  const recent = getAllPosts().slice(0, 6);
  return (
    <>
      <SEO
        title={SITE_NAME}
        description="Dominate your market. Real estate marketing, lead generation, and personal branding from Krista Mashore. Top 1% agent for 19 years. 2,300+ homes sold. Coaching agents to be Community Market Leaders®."
        metaTitle="Real Estate Marketing Coach — Dominate Your Market | Krista Mashore"
        metaDescription="Dominate your market through real estate marketing, lead generation, and personal branding. For agents who want to be chosen, not chase. From top 1% agent and coach Krista Mashore."
        canonicalPath="/"
      />

      <section className="bg-gradient-to-br from-primary-50 to-bg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary-700">
            For real estate agents and lenders
          </p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-tight max-w-3xl">
            Dominate your market.
            <br />
            Be known before you're needed.
            <br />
            Win before you arrive.
          </h1>
          <p className="mt-6 text-lg text-ink/80 max-w-2xl">
            The marketing system that makes you the agent buyers and sellers
            actually choose. Real estate marketing, lead generation, and
            personal branding from Krista Mashore — top 1% agent for 19 years,
            2,300+ homes sold, $72M+ coaching company built in 7.5 years.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <CTA variant="inline" />
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 border border-slate-300 hover:border-primary-700 hover:text-primary-700 text-ink font-semibold rounded-md px-5 py-3 transition-colors"
            >
              Read the articles
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl sm:text-4xl text-ink">
          What we cover
        </h2>
        <p className="mt-3 text-muted max-w-2xl">
          Three lanes. No fluff. Pick one and go deep.
        </p>
        <div className="mt-10 grid sm:grid-cols-3 gap-6">
          {Object.values(PILLARS).map((p) => (
            <Link
              key={p.slug}
              to={`/${p.slug}`}
              className="group rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all p-6 bg-white block"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                {p.role === "anchor" ? "Anchor" : "Supporting pillar"}
              </p>
              <h3 className="mt-2 font-display text-xl text-ink group-hover:text-primary-700">
                {p.label}
              </h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {p.description}
              </p>
              <p className="mt-5 text-sm font-semibold text-primary-700 group-hover:underline">
                Read articles →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-end justify-between gap-4 mb-8">
            <h2 className="font-display text-3xl sm:text-4xl text-ink">
              Recent articles
            </h2>
            <Link to="/articles" className="text-sm font-semibold text-primary-700 hover:underline">
              All articles →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recent.map((p) => (
              <ArticleCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <CTA
          headline="Ready to dominate your market?"
          body="The Level Up training shows you the exact system Krista uses to help agents be chosen — not chase. Built from 19 years as a top 1% agent and 7+ years coaching."
        />
      </section>
    </>
  );
}

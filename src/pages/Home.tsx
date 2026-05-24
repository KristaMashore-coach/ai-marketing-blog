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
        description="AI for entrepreneurs, real estate agents, and lenders. Build autonomous agents, automate the work, and scale your business without scaling your team. From Krista Mashore."
        metaTitle="AI for Business — Krista Mashore | AI Workflows for Entrepreneurs, Agents, and Lenders"
        metaDescription="Learn how to use AI to automate your business, build autonomous agents, and become the AI authority in your market. For entrepreneurs, real estate agents, and lenders who want to scale without hiring."
        canonicalPath="/"
      />

      <section className="bg-gradient-to-br from-primary-50 to-bg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary-700">
            For entrepreneurs, agents, and lenders
          </p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-tight max-w-3xl">
            Use AI to run your business.
            <br />
            Build autonomous agents.
            <br />
            Scale without hiring.
          </h1>
          <p className="mt-6 text-lg text-ink/80 max-w-2xl">
            The AI workflows, tools, and systems that take the work off your plate.
            Real automations from Krista Mashore. Top 1% agent for 19 years, built
            a $72M coaching company in 7.5 years, now teaching business owners
            how to make AI do the heavy lifting.
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
          headline="Want to build AI systems like this?"
          body="The Level Up training shows you how Krista uses AI to run her business with fewer people, more output, and real systems you can copy. For entrepreneurs, agents, and lenders who are done doing everything manually."
        />
      </section>
    </>
  );
}

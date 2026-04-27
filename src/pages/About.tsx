import SEO from "../components/SEO";
import CTA from "../components/CTA";
import BreadcrumbSchema from "../components/JsonLd/BreadcrumbSchema";
import CourseSchema from "../components/JsonLd/CourseSchema";
import { PERSON } from "../lib/constants";

export default function About() {
  return (
    <>
      <SEO
        title="About Krista Mashore"
        description={PERSON.description}
        metaTitle="About Krista Mashore | Top 1% Agent. Top 1% Coach."
        metaDescription="Top 1% real estate agent for 19 years. 2,300+ homes sold. Built her coaching company to $72M in 7.5 years. The story behind Community Market Leader®."
        canonicalPath="/about"
      />
      <BreadcrumbSchema
        crumbs={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]}
      />
      <CourseSchema />

      <header className="bg-gradient-to-br from-primary-50 to-bg border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="font-display text-4xl sm:text-5xl text-ink">About Krista Mashore</h1>
          <p className="mt-4 text-lg text-ink/80">
            Top 1% real estate agent for 19 consecutive years. Top 1% coach. Two industries, same obsession with results.
          </p>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose-slate">
        <p className="text-lg leading-relaxed text-ink/90">
          Krista Mashore personally sold over 2,300 homes. She averaged 133 a year. She built her real estate business from zero to over $70M in production.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-ink/90">
          Then she did it again in coaching. From $0 to over $72M in online sales in 7.5 years. Twenty-six months of $1M+ in single-month revenue, all through digital marketing. Eleven Two Comma Club Awards from ClickFunnels. Two $10M+ funnel awards. Two $25M+ funnel awards.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-ink/90">
          She's been featured in Forbes, the Wall Street Journal, Yahoo Finance, Inc. 5000, Inman News, NBC, and FOX. She's shared stages with Tony Robbins, Dean Graziosi, and Russell Brunson, not as a guest, as a peer. She's a 7x best-selling author. She has a Master's in Curriculum & Instruction and a Bachelor's in Industrial Psychology.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-ink/90">
          But the credentials are not the point. The point is that she lived this. She knows what it feels like to be invisible in a crowded market. She built her way out using video, social media, AI, and digital sales funnels. Now she teaches real estate agents and mortgage loan officers to do the same.
        </p>
        <h2 className="mt-12 font-display text-2xl text-ink">What she teaches</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink/90">
          A complete marketing system. Branding, content, lead generation, lead nurture, conversion, automation, repeat referral. Not random tactics. A full ecosystem.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-ink/90">
          Her trademarked methodology is called Community Market Leader®. The idea: be known before you're needed. Win before you arrive. Stop chasing. Get chosen.
        </p>
        <h2 className="mt-12 font-display text-2xl text-ink">The mission</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink/90">
          Help real estate agents and lenders stop sacrificing their time, family, and sanity to outdated marketing. Help the good people win.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <CTA
          headline="Want to work with Krista's team?"
          body="The Level Up training is the entry point. From there, agents plug into the full Signature Authority System."
        />
      </section>
    </>
  );
}

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
        metaTitle="About Krista Mashore | AI Authority for Entrepreneurs, Agents, and Lenders"
        metaDescription="Top 1% real estate agent for 19 years. $72M coaching company in 7.5 years. Now teaching entrepreneurs, agents, and lenders how to use AI to scale without hiring."
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
            Top 1% real estate agent for 19 consecutive years. Top 1% coach. Now using AI to run an entire business so other people can do the same.
          </p>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose-slate">
        <p className="text-lg leading-relaxed text-ink/90">
          Krista Mashore personally sold over 2,300 homes. She averaged 133 a year. Then she built a coaching company from zero to $72M in online sales in 7.5 years. Eleven Two Comma Club Awards from ClickFunnels. Two $10M+ funnel awards. Two $25M+ funnel awards.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-ink/90">
          But this site isn't about real estate. This site is about what came next. AI changed everything for her business. The content her team used to take a week to produce now ships in an afternoon. Workflows that needed three people now run on their own. She's been on a tear figuring out which AI tools actually move the needle and which ones are noise.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-ink/90">
          She's been featured in Forbes, the Wall Street Journal, Yahoo Finance, Inc. 5000, Inman News, NBC, and FOX. She's shared stages with Tony Robbins, Dean Graziosi, and Russell Brunson. She's a 7x best-selling author with a Master's in Curriculum & Instruction.
        </p>

        <h2 className="mt-12 font-display text-2xl text-ink">Who this is for</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink/90">
          Three groups. Same problem. Too much manual work, too little time, too few people to hire.
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2 text-lg text-ink/90">
          <li><strong>Entrepreneurs</strong> who want to scale without adding payroll.</li>
          <li><strong>Real estate agents</strong> who want AI to handle the busywork so they can stay in front of clients.</li>
          <li><strong>Lenders and loan officers</strong> who want to work more deals without burning out.</li>
        </ul>

        <h2 className="mt-12 font-display text-2xl text-ink">What you'll find here</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink/90">
          Five pillars. All anchored to frameworks Krista built and uses every day.
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2 text-lg text-ink/90">
          <li><strong>The Authority Agent Operating System™</strong> — the AI OS that makes you the obvious choice in your space.</li>
          <li><strong>AI Content to Client System</strong> — turning content into clients across marketing, lead gen, nurture, and conversion.</li>
          <li><strong>The AI-Run Business</strong> — workflows, agents, fulfillment, delivery, retention, and resell on autopilot.</li>
          <li><strong>Community Market Leaders®: AI for Real Estate & Lenders</strong> — A-Z AI for the listing process and lender workflows.</li>
          <li><strong>Claude for Dummies</strong> — practical Claude-only training. Skills, projects, Claude Code, Claude Desktop. No ChatGPT confusion.</li>
        </ul>

        <h2 className="mt-12 font-display text-2xl text-ink">The mission</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink/90">
          Help business owners stop trading hours for dollars. Show them how AI hands them their time back. And teach them how to position themselves as the AI authority their market trusts.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <CTA
          headline="Want to learn the AI system?"
          body="The Level Up training shows you how to use AI to run your business with fewer people, more output, and real systems you can copy."
        />
      </section>
    </>
  );
}

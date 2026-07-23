import SEO from "../components/SEO";
import BreadcrumbSchema from "../components/JsonLd/BreadcrumbSchema";

const CONTACT_EMAIL = "doit@kristamashore.com";

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Use"
        description="Terms governing your use of kristamashore.ai and its educational content."
        metaTitle="Terms of Use"
        metaDescription="Terms governing your use of kristamashore.ai and its educational content."
        canonicalPath="/terms"
      />
      <BreadcrumbSchema
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Terms of Use", path: "/terms" },
        ]}
      />

      <header className="bg-gradient-to-br from-primary-50 to-bg border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="font-display text-4xl sm:text-5xl text-ink">Terms of Use</h1>
          <p className="mt-4 text-sm text-muted">Last updated: July 23, 2026</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose-slate">
        <p className="text-lg leading-relaxed text-ink/90">
          These terms govern your use of kristamashore.ai, operated by Krista Mashore
          Coaching. By using the site, you agree to these terms. If you do not agree,
          please do not use the site.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">Educational information</h2>
        <p className="mt-4 text-ink/90">
          The articles, examples, tools, and resources on this site are provided for
          general educational and informational purposes. They are not legal, financial,
          tax, medical, real estate, lending, or other individualized professional advice.
          Consult an appropriate licensed professional before acting on information that
          affects your circumstances.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">AI-assisted content</h2>
        <p className="mt-4 text-ink/90">
          Some content is created with assistance from artificial intelligence and
          reviewed before publication. AI-assisted content can still contain errors or
          become outdated. We do not guarantee that every statement is complete, current,
          or suitable for a particular purpose.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">No guaranteed results</h2>
        <p className="mt-4 text-ink/90">
          Business, marketing, sales, technology, and AI results vary. Examples and case
          studies are illustrations, not promises that you will achieve the same outcome.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">Intellectual property</h2>
        <p className="mt-4 text-ink/90">
          Unless otherwise stated, the site&apos;s text, frameworks, branding, graphics,
          and original materials belong to Krista Mashore Coaching or its licensors. You
          may share links to public pages, but you may not reproduce, sell, republish, or
          create derivative commercial materials from the content without written
          permission.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">Third-party services and links</h2>
        <p className="mt-4 text-ink/90">
          The site may link to third-party websites, products, or services. We do not
          control their availability, content, security, or terms, and a link does not
          guarantee endorsement.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">Acceptable use</h2>
        <p className="mt-4 text-ink/90">
          Do not attempt to disrupt the site, gain unauthorized access, introduce harmful
          code, scrape the site in violation of applicable law, or use the content to
          mislead others.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">Disclaimer and limitation</h2>
        <p className="mt-4 text-ink/90">
          The site is provided on an &quot;as is&quot; and &quot;as available&quot; basis.
          To the maximum extent permitted by law, Krista Mashore Coaching disclaims
          implied warranties and is not responsible for indirect, incidental,
          consequential, or special damages arising from use of the site.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">Governing law</h2>
        <p className="mt-4 text-ink/90">
          These terms are governed by the laws of the State of California, without regard
          to conflict-of-law principles.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">Changes and contact</h2>
        <p className="mt-4 text-ink/90">
          We may update these terms. Continued use after an update means you accept the
          revised terms. Questions may be sent to{" "}
          <a className="text-primary-700 underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </main>
    </>
  );
}

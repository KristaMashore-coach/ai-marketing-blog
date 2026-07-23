import SEO from "../components/SEO";
import BreadcrumbSchema from "../components/JsonLd/BreadcrumbSchema";

const CONTACT_EMAIL = "doit@kristamashore.com";

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="How Krista Mashore Coaching collects, uses, and protects information associated with kristamashore.ai."
        metaTitle="Privacy Policy"
        metaDescription="How Krista Mashore Coaching collects, uses, and protects information associated with kristamashore.ai."
        canonicalPath="/privacy"
      />
      <BreadcrumbSchema
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ]}
      />

      <header className="bg-gradient-to-br from-primary-50 to-bg border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="font-display text-4xl sm:text-5xl text-ink">Privacy Policy</h1>
          <p className="mt-4 text-sm text-muted">Last updated: July 23, 2026</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose-slate">
        <p className="text-lg leading-relaxed text-ink/90">
          Krista Mashore Coaching operates kristamashore.ai. This policy explains what
          information may be collected when you use the site, how it is used, and the
          choices available to you.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">Information we collect</h2>
        <p className="mt-4 text-ink/90">
          The site does not require an account. Our hosting and analytics providers may
          process standard technical information such as your IP address, browser type,
          device type, referring page, pages viewed, and approximate location. If you
          email us or follow a link to request training or services, we receive the
          information you choose to provide.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">How information is used</h2>
        <ul className="mt-4 list-disc pl-6 space-y-2 text-ink/90">
          <li>To operate, secure, and improve the website.</li>
          <li>To understand which articles and resources are useful.</li>
          <li>To respond when you contact us or request information.</li>
          <li>To comply with legal obligations and prevent misuse.</li>
        </ul>

        <h2 className="mt-10 font-display text-2xl text-ink">Analytics and service providers</h2>
        <p className="mt-4 text-ink/90">
          This site uses Vercel for hosting, analytics, and performance measurement.
          Those services may use cookies or similar technologies as described in
          Vercel&apos;s own privacy documentation. We may also use providers that support
          email, training registration, or requested services. We do not sell personal
          information.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">External links</h2>
        <p className="mt-4 text-ink/90">
          Articles may link to other websites, including kristamashore.com and third-party
          resources. Their privacy practices apply after you leave this site.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">Data choices and security</h2>
        <p className="mt-4 text-ink/90">
          You can limit cookies through your browser settings. You may ask to access,
          correct, or delete personal information you have provided to us. We use
          reasonable safeguards, but no internet service can guarantee absolute security.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">Children</h2>
        <p className="mt-4 text-ink/90">
          This site is not directed to children under 16, and we do not knowingly collect
          personal information from children.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">Policy updates</h2>
        <p className="mt-4 text-ink/90">
          We may update this policy as the site or its services change. The date above
          shows the latest revision.
        </p>

        <h2 className="mt-10 font-display text-2xl text-ink">Contact</h2>
        <p className="mt-4 text-ink/90">
          For privacy questions or requests, email{" "}
          <a className="text-primary-700 underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </main>
    </>
  );
}

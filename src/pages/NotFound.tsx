import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function NotFound() {
  return (
    <>
      <SEO
        title="Page not found"
        description="That page doesn't exist on this site."
        canonicalPath="/404"
        noIndex
      />
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase text-primary-700">404</p>
        <h1 className="mt-3 font-display text-4xl text-ink">That page is not here.</h1>
        <p className="mt-4 text-muted">
          It was either removed, never existed, or you typed the URL wrong. Try one of these.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link to="/" className="border border-slate-300 hover:border-primary-700 hover:text-primary-700 px-5 py-3 rounded-md font-semibold">
            Home
          </Link>
          <Link to="/articles" className="border border-slate-300 hover:border-primary-700 hover:text-primary-700 px-5 py-3 rounded-md font-semibold">
            All articles
          </Link>
          <Link to="/about" className="border border-slate-300 hover:border-primary-700 hover:text-primary-700 px-5 py-3 rounded-md font-semibold">
            About Krista
          </Link>
        </div>
      </section>
    </>
  );
}

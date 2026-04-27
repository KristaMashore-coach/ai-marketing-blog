import { Link } from "react-router-dom";
import { PERSON, SITE_NAME } from "../lib/constants";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-slate-50 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-8">
        <div>
          <p className="font-display text-lg font-bold text-ink">{SITE_NAME}</p>
          <p className="text-sm text-muted mt-2">
            Real estate marketing for agents who want to be chosen, not chase.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink mb-3">Topics</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/real-estate-marketing" className="text-muted hover:text-primary-700">Real Estate Marketing</Link></li>
            <li><Link to="/real-estate-lead-generation" className="text-muted hover:text-primary-700">Real Estate Lead Generation</Link></li>
            <li><Link to="/personal-branding-authority" className="text-muted hover:text-primary-700">Personal Branding</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink mb-3">Connect</p>
          <ul className="space-y-2 text-sm">
            {PERSON.sameAs.slice(1).map((url) => {
              const host = new URL(url).hostname.replace("www.", "");
              return (
                <li key={url}>
                  <a href={url} className="text-muted hover:text-primary-700" rel="noopener" target="_blank">
                    {host.split(".")[0]}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-muted flex flex-wrap gap-4 justify-between">
          <p>© {year} {SITE_NAME}. Community Market Leader® is a registered trademark.</p>
          <p>
            <a href="https://kristamashore.com" className="hover:text-primary-700">kristamashore.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

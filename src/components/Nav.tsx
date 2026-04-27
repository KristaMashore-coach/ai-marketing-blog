import { NavLink } from "react-router-dom";
import { NAV_LINKS, SITE_NAME } from "../lib/constants";
import { useState } from "react";

export default function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          {/* BRAND-ASSET-PENDING: swap to <img src="/images/logo.svg" /> when delivered */}
          <span className="font-display text-xl font-bold text-ink">
            {SITE_NAME}
          </span>
        </NavLink>
        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
        <ul className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `text-sm hover:text-primary-700 transition-colors ${
                    isActive ? "text-primary-700 font-semibold" : "text-ink"
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      {open && (
        <ul className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          {NAV_LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `block py-2 text-base ${isActive ? "text-primary-700 font-semibold" : "text-ink"}`
                }
                onClick={() => setOpen(false)}
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

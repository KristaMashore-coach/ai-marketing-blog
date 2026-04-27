import { DEFAULT_CTA_LABEL, DEFAULT_CTA_URL } from "../lib/constants";

interface Props {
  url?: string;
  label?: string;
  variant?: "primary" | "inline";
  headline?: string;
  body?: string;
}

export default function CTA({
  url = DEFAULT_CTA_URL,
  label = DEFAULT_CTA_LABEL,
  variant = "primary",
  headline,
  body,
}: Props) {
  if (variant === "inline") {
    return (
      <a
        href={url}
        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-md px-5 py-3 transition-colors"
        rel="noopener"
      >
        {label}
        <span aria-hidden>→</span>
      </a>
    );
  }
  return (
    <aside className="my-12 rounded-2xl bg-primary-50 border border-primary-100 p-6 sm:p-8">
      {headline && <h3 className="font-display text-xl sm:text-2xl text-ink">{headline}</h3>}
      {body && <p className="mt-2 text-ink/80">{body}</p>}
      <div className="mt-5">
        <a
          href={url}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-md px-5 py-3 transition-colors"
          rel="noopener"
        >
          {label}
          <span aria-hidden>→</span>
        </a>
      </div>
    </aside>
  );
}

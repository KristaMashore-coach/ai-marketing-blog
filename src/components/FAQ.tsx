import type { FAQEntry } from "../types/post";

export default function FAQ({ entries }: { entries: FAQEntry[] }) {
  if (!entries || entries.length === 0) return null;
  return (
    <section className="my-12">
      <h2 className="font-display text-2xl sm:text-3xl text-ink mb-6">
        Common questions
      </h2>
      <div className="space-y-4">
        {entries.map((f) => (
          <details
            key={f.question}
            className="group rounded-xl border border-slate-200 bg-white p-5 open:bg-slate-50"
          >
            <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
              <h3 className="font-semibold text-ink text-base sm:text-lg">
                {f.question}
              </h3>
              <span aria-hidden className="text-primary-600 font-bold transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-ink/80 leading-relaxed">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

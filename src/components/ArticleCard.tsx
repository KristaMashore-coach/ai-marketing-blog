import { Link } from "react-router-dom";
import { PILLARS } from "../lib/constants";
import type { Post } from "../types/post";

export default function ArticleCard({ post }: { post: Post }) {
  const pillar = PILLARS[post.topicalPillar];
  return (
    <article className="group rounded-2xl border border-slate-200 hover:border-primary-100 hover:shadow-md transition-all bg-white overflow-hidden flex flex-col">
      <Link to={`/articles/${post.slug}`} className="block flex-1">
        <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
          <img
            src={post.featuredImage.src}
            alt={post.featuredImage.alt}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
            {pillar.label}
          </p>
          <h3 className="mt-2 font-display text-xl text-ink group-hover:text-primary-700 transition-colors">
            {post.title}
          </h3>
          <p className="mt-2 text-sm text-muted line-clamp-3">{post.excerpt}</p>
          <p className="mt-4 text-xs text-muted">
            {new Date(post.publishedDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · {post.readingMinutes} min read
          </p>
        </div>
      </Link>
    </article>
  );
}

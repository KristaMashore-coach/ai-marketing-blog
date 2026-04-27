import { useParams, Link, Navigate } from "react-router-dom";
import SEO from "../components/SEO";
import CTA from "../components/CTA";
import FAQ from "../components/FAQ";
import ArticleCard from "../components/ArticleCard";
import BlogPostingSchema from "../components/JsonLd/BlogPostingSchema";
import BreadcrumbSchema from "../components/JsonLd/BreadcrumbSchema";
import FAQPageSchema from "../components/JsonLd/FAQPageSchema";
import { getPostBySlug, getRelatedPosts } from "../lib/posts";
import { PILLARS } from "../lib/constants";

export default function BlogPost() {
  const { slug } = useParams();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) return <Navigate to="/404" replace />;

  const pillar = PILLARS[post.topicalPillar];
  const related = getRelatedPosts(post.slug, 3);

  return (
    <>
      <SEO
        title={post.title}
        description={post.excerpt}
        metaTitle={post.metaTitle}
        metaDescription={post.metaDescription}
        canonicalPath={`/articles/${post.slug}`}
        ogImage={post.featuredImage.src.startsWith("http") ? post.featuredImage.src : undefined}
        ogType="article"
        publishedDate={post.publishedDate}
        modifiedDate={post.modifiedDate}
        author={post.author}
        keywords={post.keywords}
        noIndex={!!post.draft}
      />
      {post.draft && (
        <div className="bg-yellow-50 border-b-2 border-yellow-400">
          <div className="max-w-article mx-auto px-4 sm:px-6 py-3 text-sm text-yellow-900 flex items-center gap-2">
            <span className="font-bold uppercase tracking-wide">Draft</span>
            <span>Needs Krista review. Not indexed by search engines, not in the public listings, not in the sitemap. Approve via <code className="bg-yellow-100 px-1 rounded">npm run approve:drafts</code>.</span>
          </div>
        </div>
      )}
      <BlogPostingSchema post={post} />
      <BreadcrumbSchema
        crumbs={[
          { name: "Home", path: "/" },
          { name: pillar.label, path: `/${pillar.slug}` },
          { name: post.title, path: `/articles/${post.slug}` },
        ]}
      />
      <FAQPageSchema faq={post.faq} />

      <article className="max-w-article mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary-700">Home</Link>
          {" / "}
          <Link to={`/${pillar.slug}`} className="hover:text-primary-700">{pillar.label}</Link>
        </nav>

        <p className="text-xs font-semibold uppercase tracking-widest text-primary-700">
          {pillar.label}
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl text-ink leading-tight">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-muted leading-relaxed">{post.excerpt}</p>
        <div className="mt-6 flex items-center gap-3 text-sm text-muted">
          <span>By {post.author}</span>
          <span>·</span>
          <time dateTime={post.publishedDate}>
            {new Date(post.publishedDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <span>·</span>
          <span>{post.readingMinutes} min read</span>
        </div>

        <div className="mt-8 aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100">
          <img
            src={post.featuredImage.src}
            alt={post.featuredImage.alt}
            className="w-full h-full object-cover"
          />
        </div>

        <div
          className="article-body mt-10 text-ink/90 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        <CTA
          url={post.ctaUrl}
          label={post.ctaLabel}
          headline="Ready to put this in motion?"
          body="The Level Up training is the fastest way to plug into Krista's full marketing system. Real agents, real results, real support."
        />

        <FAQ entries={post.faq} />

        {related.length > 0 && (
          <section className="mt-14 border-t border-slate-200 pt-10">
            <h2 className="font-display text-2xl text-ink mb-6">More on {pillar.label}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {related.map((p) => (
                <ArticleCard key={p.slug} post={p} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}

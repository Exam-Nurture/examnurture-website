import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Eye, Calendar, Tag, User } from "lucide-react";
import { apiGetBlogBySlug, apiGetBlogs, type PublicBlogPost } from "@/lib/api";

const CAT_GRADIENTS: Record<string, string> = {
  "General":         "linear-gradient(135deg,#3B82F6,#6366F1)",
  "Current Affairs": "linear-gradient(135deg,#10B981,#059669)",
  "Strategy":        "linear-gradient(135deg,#8B5CF6,#6D28D9)",
  "Concept":         "linear-gradient(135deg,#0891B2,#1E40AF)",
  "Formula":         "linear-gradient(135deg,#EC4899,#8B5CF6)",
  "Revision":        "linear-gradient(135deg,#F59E0B,#F97316)",
  "News":            "linear-gradient(135deg,#F97316,#EF4444)",
  "Announcement":    "linear-gradient(135deg,#EF4444,#BE185D)",
};

const CAT_COLORS: Record<string, string> = {
  "General": "#3B82F6", "Current Affairs": "#10B981", "Strategy": "#8B5CF6",
  "Concept": "#0891B2", "Formula": "#EC4899", "Revision": "#F59E0B",
  "News": "#F97316", "Announcement": "#EF4444",
};

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function RelatedCard({ post }: { post: PublicBlogPost }) {
  const gradient = CAT_GRADIENTS[post.category] ?? CAT_GRADIENTS["General"];
  const color = CAT_COLORS[post.category] ?? "#3B82F6";
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="flex items-start gap-3 p-3 rounded-xl border hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden">
        {post.coverUrl ? (
          <img src={post.coverUrl} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: gradient }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold" style={{ color }}>{post.category}</span>
        <p className="text-sm font-semibold line-clamp-2 leading-snug mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" style={{ color: "var(--ink-1)" }}>
          {post.title}
        </p>
        <span className="text-[11px] flex items-center gap-1 mt-1" style={{ color: "var(--ink-3)" }}>
          <Clock size={10} />{post.readTimeMin} min
        </span>
      </div>
    </Link>
  );
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let post;
  try {
    post = await apiGetBlogBySlug(slug);
  } catch {
    notFound();
  }

  /* Fetch related posts (same category, exclude current) */
  let related: PublicBlogPost[] = [];
  try {
    const res = await apiGetBlogs({ limit: 6, category: post.category });
    related = res.items.filter((p) => p.slug !== slug).slice(0, 3);
    if (related.length < 2) {
      const all = await apiGetBlogs({ limit: 6 });
      related = all.items.filter((p) => p.slug !== slug).slice(0, 3);
    }
  } catch { /* non-fatal */ }

  const gradient = CAT_GRADIENTS[post.category] ?? CAT_GRADIENTS["General"];
  const catColor = CAT_COLORS[post.category] ?? "#3B82F6";
  const tags = parseTags(post.tags);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Cover hero */}
      <div className="relative w-full h-72 md:h-96 overflow-hidden">
        {post.coverUrl ? (
          <img src={post.coverUrl} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
            <span className="text-white/10 font-black text-9xl select-none tracking-tighter">EN</span>
          </div>
        )}
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.1) 60%,transparent 100%)" }} />

        {/* Back button */}
        <div className="absolute top-5 left-5">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
          >
            <ArrowLeft size={14} /> Blog
          </Link>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <span
            className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full text-white mb-3"
            style={{ background: `${catColor}cc` }}
          >
            {post.category}
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight max-w-3xl">
            {post.title}
          </h1>
        </div>
      </div>

      {/* Content layout */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main content */}
          <article className="flex-1 min-w-0">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: gradient }}
                >
                  {post.author[0]?.toUpperCase() ?? "E"}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--ink-1)" }}>{post.author}</p>
                  <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>Author</p>
                </div>
              </div>

              {post.publishedAt && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--ink-3)" }}>
                  <Calendar size={14} />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--ink-3)" }}>
                <Clock size={14} />
                <span>{post.readTimeMin} min read</span>
              </div>

              <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--ink-3)" }}>
                <Eye size={14} />
                <span>{post.viewCount.toLocaleString()} views</span>
              </div>
            </div>

            {/* Excerpt */}
            {post.excerpt && (
              <p
                className="text-lg leading-relaxed font-medium mb-8 p-5 rounded-xl border-l-4"
                style={{
                  color: "var(--ink-2)",
                  background: "rgba(59,130,246,0.04)",
                  borderColor: "var(--blue)",
                }}
              >
                {post.excerpt}
              </p>
            )}

            {/* HTML content */}
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t" style={{ borderColor: "var(--line)" }}>
                <Tag size={14} style={{ color: "var(--ink-3)" }} />
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full border"
                    style={{ background: "var(--card)", color: "var(--ink-2)", borderColor: "var(--line)" }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author card */}
            <div
              className="flex items-center gap-4 mt-10 p-5 rounded-2xl border"
              style={{ background: "var(--card)", borderColor: "var(--line)" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
                style={{ background: gradient }}
              >
                {post.author[0]?.toUpperCase() ?? "E"}
              </div>
              <div>
                <p className="font-bold text-base" style={{ color: "var(--ink-1)" }}>{post.author}</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--ink-3)" }}>ExamNurture Content Team</p>
                <p className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>
                  Expert articles on exam strategies, current affairs, and study resources.
                </p>
              </div>
            </div>

            {/* Back link */}
            <div className="mt-8">
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:gap-3"
                style={{ border: "1.5px solid var(--line)", color: "var(--ink-2)" }}
              >
                <ArrowLeft size={15} /> Back to all articles
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0 space-y-6">
            {/* Article info card */}
            <div className="p-5 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--line)" }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: "var(--ink-1)" }}>Article Info</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2" style={{ color: "var(--ink-3)" }}><User size={13} /> Author</dt>
                  <dd className="font-medium" style={{ color: "var(--ink-2)" }}>{post.author}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2" style={{ color: "var(--ink-3)" }}><Tag size={13} /> Category</dt>
                  <dd>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: catColor }}>
                      {post.category}
                    </span>
                  </dd>
                </div>
                {post.publishedAt && (
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2" style={{ color: "var(--ink-3)" }}><Calendar size={13} /> Published</dt>
                    <dd className="font-medium text-right" style={{ color: "var(--ink-2)" }}>{formatDate(post.publishedAt)}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2" style={{ color: "var(--ink-3)" }}><Clock size={13} /> Read time</dt>
                  <dd className="font-medium" style={{ color: "var(--ink-2)" }}>{post.readTimeMin} min</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2" style={{ color: "var(--ink-3)" }}><Eye size={13} /> Views</dt>
                  <dd className="font-medium" style={{ color: "var(--ink-2)" }}>{post.viewCount.toLocaleString()}</dd>
                </div>
              </dl>
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-3" style={{ color: "var(--ink-1)" }}>Related Articles</h3>
                <div className="space-y-2">
                  {related.map((r) => <RelatedCard key={r.id} post={r} />)}
                </div>
              </div>
            )}

            {/* CTA */}
            <div
              className="p-5 rounded-2xl text-center"
              style={{ background: gradient }}
            >
              <p className="text-white font-bold text-base mb-1">Start Your Prep</p>
              <p className="text-white/80 text-xs mb-4">Practice tests, study materials and more.</p>
              <Link
                href="/exams"
                className="inline-block px-5 py-2 rounded-xl text-sm font-bold bg-white hover:bg-opacity-90 transition-all"
                style={{ color: catColor }}
              >
                Explore Courses →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

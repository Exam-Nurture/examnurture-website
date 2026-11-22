import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { apiGetBlogBySlug, apiGetBlogs, type PublicBlogPost } from "@/lib/api";

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}

/* Reading typography layered over the shared .blog-content styles (important
   modifiers needed because globals.css rules are unlayered). */
const PROSE = [
  "blog-content",
  "!text-[17px] !leading-[1.75] text-[var(--ink-2)]",
  "[&_p]:!my-5",
  "[&_h1]:![font-family:var(--font-sora)] [&_h2]:![font-family:var(--font-sora)] [&_h3]:![font-family:var(--font-sora)] [&_h4]:![font-family:var(--font-sora)]",
  "[&_h2]:!border-b-0 [&_h2]:!pb-0 [&_h2]:!mt-12",
  "[&_a]:!text-[var(--brand)] [&_a]:underline [&_a]:underline-offset-2",
  "[&_img]:!rounded-2xl [&_img]:!shadow-none [&_img]:h-auto",
  "[&_blockquote]:!border-l-0 [&_blockquote]:!bg-[var(--brand-soft)] [&_blockquote]:!rounded-2xl [&_blockquote]:!px-6 [&_blockquote]:!py-4",
  "[&_table]:block [&_table]:overflow-x-auto",
].join(" ");

function RelatedCard({ post, index }: { post: PublicBlogPost; index: number }) {
  return (
    <li className="reveal" style={{ transitionDelay: `${(index % 3) * 70}ms` }}>
      <Link
        href={`/blogs/${post.slug}`}
        className="en-card en-card-link flex h-full flex-col overflow-hidden rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
      >
        <div className="aspect-[16/9] w-full overflow-hidden rounded-t-[20px] bg-[var(--brand-soft)]">
          {post.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen size={32} strokeWidth={1.5} className="text-[var(--brand)]" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <span className="text-xs font-semibold text-[var(--brand)]">{post.category}</span>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>
            {post.title}
          </h3>
          <p className="mt-auto pt-1 text-xs text-[var(--ink-3)]">{post.readTimeMin} min read</p>
        </div>
      </Link>
    </li>
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

  const tags = parseTags(post.tags);
  const meta = [post.author, formatDate(post.publishedAt), `${post.readTimeMin} min read`].filter(Boolean);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <section className="en-band-hero">
        <div className="mx-auto max-w-[720px] px-4 pb-10 pt-28 sm:px-6 sm:pt-32">
          <nav aria-label="Breadcrumb" className="en-rise text-sm text-[var(--ink-3)]">
            <ol className="flex flex-wrap items-center gap-x-2">
              <li>
                <Link href="/blogs" className="inline-flex min-h-11 items-center text-[var(--brand)] hover:underline">Blog</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/blogs?category=${encodeURIComponent(post.category)}`}
                  className="inline-flex min-h-11 items-center text-[var(--brand)] hover:underline"
                >
                  {post.category}
                </Link>
              </li>
            </ol>
          </nav>
          <h1
            className="en-rise mt-1 text-3xl font-bold leading-[1.15] tracking-[-0.02em] text-[var(--ink-1)] sm:text-4xl"
            style={{ fontFamily: "var(--font-sora)", animationDelay: "60ms" }}
          >
            {post.title}
          </h1>
          <p className="en-rise mt-4 text-sm text-[var(--ink-3)]" style={{ animationDelay: "120ms" }}>
            {meta.join(" · ")}
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-[720px] px-4 pb-16 sm:px-6">
        {post.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverUrl} alt="" className="mb-10 aspect-[16/9] w-full rounded-2xl object-cover" />
        )}

        {post.excerpt && (
          <p className="mb-8 rounded-2xl bg-[var(--brand-soft)] px-6 py-5 text-lg leading-relaxed text-[var(--ink-1)]">
            {post.excerpt}
          </p>
        )}

        <div className={PROSE} dangerouslySetInnerHTML={{ __html: post.content }} />

        {tags.length > 0 && (
          <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
            {tags.map((tag) => (
              <li key={tag} className="rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-medium text-[var(--ink-2)]">
                #{tag}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          <Link
            href="/blogs"
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--bg-secondary)] px-5 text-sm font-semibold text-[var(--ink-2)] transition-colors hover:bg-[var(--brand-soft)]"
          >
            Back to all articles
          </Link>
        </div>
      </article>

      {related.length > 0 && (
        <section className="en-band-soft py-14">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <h2 className="mb-6 text-2xl font-bold tracking-[-0.01em] text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>
              Keep reading
            </h2>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r, i) => <RelatedCard key={r.id} post={r} index={i} />)}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

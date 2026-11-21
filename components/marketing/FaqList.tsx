"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { API_BASE } from "@/lib/config";

interface FAQItem {
  question: string;
  answer: string;
}

/**
 * FAQ accordion fed by the admin-managed FAQ table (backend /faqs).
 * Uses native <details>, so it works with keyboard and screen readers and
 * needs no open/close state. Renders nothing if there are no FAQs.
 */
export default function FaqList({ category = "landing-page", title = "Questions" }: { category?: string; title?: string }) {
  const [items, setItems] = useState<FAQItem[]>([]);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/faqs?category=${encodeURIComponent(category)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: FAQItem[]) => {
        if (alive && Array.isArray(data)) setItems(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [category]);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="faq-title" className="flex flex-col gap-5">
      <h2 id="faq-title" className="text-2xl font-bold text-[var(--ink-1)]" style={{ fontFamily: "var(--font-sora)" }}>
        {title}
      </h2>
      <div className="flex flex-col divide-y divide-[var(--line-soft)] rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--card)]">
        {items.map((item) => (
          <details key={item.question} className="group px-5">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-[var(--ink-1)] [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDown className="h-5 w-5 flex-none text-[var(--ink-3)] transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="pb-5 text-[15px] leading-relaxed text-[var(--ink-2)]">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

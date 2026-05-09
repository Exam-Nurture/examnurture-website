"use client";

import { ChevronRight } from "lucide-react";

export default function ExamHubLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 animate-pulse">
      
      {/* ── HERO SECTION SKELETON ── */}
      <section className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 pt-10 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <ChevronRight size={14} className="text-gray-300 dark:text-gray-700" />
            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <ChevronRight size={14} className="text-gray-300 dark:text-gray-700" />
            <div className="w-12 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <ChevronRight size={14} className="text-gray-300 dark:text-gray-700" />
            <div className="w-24 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>

          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="flex-1 w-full">
              {/* Board Badge */}
              <div className="w-32 h-8 bg-gray-200 dark:bg-gray-800 rounded-xl mb-5"></div>
              {/* Title */}
              <div className="w-3/4 h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-5"></div>
              {/* Description */}
              <div className="w-full h-20 bg-gray-200 dark:bg-gray-800 rounded-xl mb-8"></div>
              {/* Buttons */}
              <div className="flex flex-wrap gap-4">
                <div className="w-48 h-14 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                <div className="w-40 h-14 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
              </div>
            </div>

            {/* Right side stat grid */}
            <div className="w-full lg:w-[400px] shrink-0 grid grid-cols-2 gap-3">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 h-32 rounded-2xl p-4 flex flex-col items-center">
                   <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full mb-3"></div>
                   <div className="w-16 h-6 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                   <div className="w-24 h-3 bg-gray-200 dark:bg-gray-800 rounded"></div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STICKY NAV SKELETON ── */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="w-24 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg shrink-0"></div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 flex flex-col lg:flex-row gap-12 items-start">
        
        {/* ── MAIN CONTENT SKELETON ── */}
        <div className="flex-1 w-full space-y-16">
          
          {/* Section Skeleton */}
          {[1, 2, 3].map(section => (
            <div key={section}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                <div className="w-48 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-3xl h-64 border border-gray-200 dark:border-gray-800"></div>
            </div>
          ))}

        </div>

        {/* ── SIDEBAR SKELETON ── */}
        <aside className="w-full lg:w-80 shrink-0 space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-3xl h-80 border border-gray-200 dark:border-gray-800"></div>
          <div className="bg-white dark:bg-gray-900 rounded-3xl h-64 border border-gray-200 dark:border-gray-800"></div>
        </aside>

      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Search, GraduationCap, ArrowLeft, BookOpen } from "lucide-react";

export default function ExamHubNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
      
      <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-8 relative">
        <Search size={40} />
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-gray-950 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-700">
          <BookOpen size={20} />
        </div>
      </div>
      
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Exam Not Found</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md mb-10 leading-relaxed">
        We couldn't find the exam you're looking for. It might have been renamed or removed, or the URL might be incorrect.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/exams" className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
          <GraduationCap size={20} /> Browse All Exams
        </Link>
        <Link href="/" className="px-8 py-4 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
          <ArrowLeft size={20} /> Back to Home
        </Link>
      </div>

    </div>
  );
}

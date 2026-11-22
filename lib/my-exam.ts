"use client";

/**
 * The exam a student is preparing for. Drives the dashboard (next step,
 * countdown, "My course").
 *
 * Stored in this browser only (localStorage) because the backend User model
 * has no target-exam field yet. When it gets one, swap the read/write here for
 * an API call and every consumer keeps working.
 */

import { useCallback, useEffect, useState } from "react";

export interface MyExam {
  id: string;
  name: string;
  shortName?: string;
}

const KEY = "en_my_exam";
const EVENT = "en-my-exam-change";

function read(): MyExam | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MyExam) : null;
  } catch {
    return null;
  }
}

export function useMyExam(): { exam: MyExam | null; ready: boolean; setExam: (e: MyExam | null) => void } {
  const [exam, setExamState] = useState<MyExam | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setExamState(read());
      setReady(true);
    };
    const id = requestAnimationFrame(sync);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setExam = useCallback((e: MyExam | null) => {
    try {
      if (e) window.localStorage.setItem(KEY, JSON.stringify(e));
      else window.localStorage.removeItem(KEY);
    } catch {
      /* storage blocked: keep for this page view */
    }
    setExamState(e);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { exam, ready, setExam };
}

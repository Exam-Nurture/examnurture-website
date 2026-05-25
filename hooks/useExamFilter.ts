"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  apiGetStates,
  apiGetBoards,
  apiGetExams,
  apiGetExamCategories,
  type ApiState,
  type ApiBoard,
  type ApiBoardExam,
  type ApiExamCategory,
} from "@/lib/api";

export interface ExamFilterValue {
  categoryIds: number[];
  stateIds: number[];
  boardIds: string[];
  examIds: string[];
}

/** Parse comma-separated URL param into typed array */
export function parseIds<T extends string | number>(
  raw: string | null,
  cast: (v: string) => T,
): T[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(cast);
}

/** Serialise to comma-separated string for URL params */
export function serializeIds(ids: (string | number)[]): string {
  return ids.join(",");
}

export interface UseExamFilterReturn {
  allCategories: ApiExamCategory[];
  allStates: ApiState[];
  allBoards: ApiBoard[];
  availableBoards: ApiBoard[];
  availableExams: ApiBoardExam[];
  isLoading: boolean;
  examsLoading: boolean;

  selectedCategoryIds: number[];
  selectedStateIds: number[];
  selectedBoardIds: string[];
  selectedExamIds: string[];

  toggleCategory: (id: number) => void;
  toggleState: (id: number) => void;
  toggleBoard: (id: string) => void;
  toggleExam: (id: string) => void;
  resetExamFilter: () => void;

  examFilterCount: number;
}

export function useExamFilter(initial?: Partial<ExamFilterValue>): UseExamFilterReturn {
  const [allCategories, setAllCategories] = useState<ApiExamCategory[]>([]);
  const [allStates, setAllStates] = useState<ApiState[]>([]);
  const [allBoards, setAllBoards] = useState<ApiBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(initial?.categoryIds ?? []);
  const [selectedStateIds, setSelectedStateIds] = useState<number[]>(initial?.stateIds ?? []);
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>(initial?.boardIds ?? []);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>(initial?.examIds ?? []);

  // Per-board exam cache so we only fetch each board once
  const [boardExamsMap, setBoardExamsMap] = useState<Map<string, ApiBoardExam[]>>(new Map());
  const [examsLoading, setExamsLoading] = useState(false);

  // Fetch all states + boards + categories once on mount
  useEffect(() => {
    Promise.all([apiGetStates(), apiGetBoards(), apiGetExamCategories()])
      .then(([states, boards, categories]) => {
        setAllStates(states ?? []);
        setAllBoards(boards ?? []);
        setAllCategories(categories ?? []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Available boards cascade: union of boards from selected states; all boards if no state is selected
  const availableBoards = useMemo(() => {
    if (selectedStateIds.length === 0) return allBoards;
    return allBoards.filter(
      (b) => b.state != null && selectedStateIds.includes(b.state.id),
    );
  }, [allBoards, selectedStateIds]);

  // Fetch exams for newly-selected boards (cached by board id)
  useEffect(() => {
    if (selectedBoardIds.length === 0) return;
    const toFetch = selectedBoardIds.filter((id) => !boardExamsMap.has(id));
    if (toFetch.length === 0) return;

    setExamsLoading(true);
    Promise.all(
      toFetch.map((id) =>
        apiGetExams({ board: id })
          .then((exams) => ({ id, exams: (exams as ApiBoardExam[]) ?? [] }))
          .catch(() => ({ id, exams: [] as ApiBoardExam[] })),
      ),
    )
      .then((results) => {
        setBoardExamsMap((prev) => {
          const next = new Map(prev);
          results.forEach(({ id, exams }) => next.set(id, exams));
          return next;
        });
      })
      .finally(() => setExamsLoading(false));
    // boardExamsMap intentionally excluded to avoid refetch loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoardIds]);

  // Available exams cascade: union of exams from selected boards, further filtered by selected categories
  const availableExams = useMemo(() => {
    if (selectedBoardIds.length === 0) return [];
    const seen = new Set<string>();
    const result: ApiBoardExam[] = [];
    selectedBoardIds.forEach((boardId) => {
      (boardExamsMap.get(boardId) ?? []).forEach((exam) => {
        if (!seen.has(exam.id)) {
          if (selectedCategoryIds.length === 0 || (exam as any).examCategoryId == null || selectedCategoryIds.includes((exam as any).examCategoryId)) {
            seen.add(exam.id);
            result.push(exam);
          }
        }
      });
    });
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedBoardIds, boardExamsMap, selectedCategoryIds]);

  /** Toggle a category */
  const toggleCategory = useCallback((id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  /** Toggle a state. Removing a state also removes its boards + their exams. */
  const toggleState = useCallback(
    (id: number) => {
      const isRemoving = selectedStateIds.includes(id);
      setSelectedStateIds((prev) =>
        isRemoving ? prev.filter((x) => x !== id) : [...prev, id],
      );

      if (isRemoving) {
        const boardIdsOfState = allBoards
          .filter((b) => b.state?.id === id)
          .map((b) => b.id);

        setSelectedBoardIds((prev) => {
          const next = prev.filter((bid) => !boardIdsOfState.includes(bid));
          // Clean up exams that belonged to the removed boards
          if (next.length < prev.length) {
            const removedExamIds = new Set<string>();
            boardIdsOfState.forEach((bid) => {
              (boardExamsMap.get(bid) ?? []).forEach((e) => removedExamIds.add(e.id));
            });
            setSelectedExamIds((prevExams) =>
              prevExams.filter((eid) => !removedExamIds.has(eid)),
            );
          }
          return next;
        });
      }
    },
    [selectedStateIds, allBoards, boardExamsMap],
  );

  /** Toggle a board. Removing a board also removes its exams. */
  const toggleBoard = useCallback(
    (id: string) => {
      const isRemoving = selectedBoardIds.includes(id);
      setSelectedBoardIds((prev) =>
        isRemoving ? prev.filter((x) => x !== id) : [...prev, id],
      );

      if (isRemoving) {
        const removedExamIds = new Set(
          (boardExamsMap.get(id) ?? []).map((e) => e.id),
        );
        setSelectedExamIds((prev) =>
          prev.filter((eid) => !removedExamIds.has(eid)),
        );
      }
    },
    [selectedBoardIds, boardExamsMap],
  );

  const toggleExam = useCallback((id: string) => {
    setSelectedExamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const resetExamFilter = useCallback(() => {
    setSelectedCategoryIds([]);
    setSelectedStateIds([]);
    setSelectedBoardIds([]);
    setSelectedExamIds([]);
  }, []);

  const examFilterCount =
    selectedCategoryIds.length + selectedStateIds.length + selectedBoardIds.length + selectedExamIds.length;

  return {
    allCategories,
    allStates,
    allBoards,
    availableBoards,
    availableExams,
    isLoading,
    examsLoading,

    selectedCategoryIds,
    selectedStateIds,
    selectedBoardIds,
    selectedExamIds,

    toggleCategory,
    toggleState,
    toggleBoard,
    toggleExam,
    resetExamFilter,
    examFilterCount,
  };
}

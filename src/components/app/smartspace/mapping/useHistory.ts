import { useCallback, useState } from "react";

const LIMIT = 100;

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
  /** The value last saved; `dirty` compares against it by reference. */
  saved: T;
  /** Present value before the current uncommitted edit (e.g. a drag in progress). */
  pending: T | null;
}

export interface History<T> {
  present: T;
  /** The last committed value — `present` minus any uncommitted (live drag) edit. */
  committed: T;
  /**
   * Replace the present value. `commit: false` updates it without an undo step
   * (live drags); the next committed set — or `commit()` — records one step
   * from the state before the uncommitted run.
   */
  set: (next: T | ((prev: T) => T), options?: { commit?: boolean }) => void;
  commit: () => void;
  undo: () => void;
  redo: () => void;
  reset: (value: T) => void;
  /** Record `value` (the layout that was sent to the server) as saved. */
  markSaved: (value: T) => void;
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
}

export function useHistory<T>(initial: T): History<T> {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initial,
    future: [],
    saved: initial,
    pending: null,
  });

  const set = useCallback<History<T>["set"]>((next, options) => {
    const commit = options?.commit ?? true;
    setState((s) => {
      const value = typeof next === "function" ? (next as (prev: T) => T)(s.present) : next;
      if (value === s.present) return s;
      if (!commit) return { ...s, present: value, pending: s.pending ?? s.present };
      const base = s.pending ?? s.present;
      return { ...s, past: [...s.past, base].slice(-LIMIT), present: value, future: [], pending: null };
    });
  }, []);

  const commit = useCallback(() => {
    setState((s) => {
      if (s.pending === null) return s;
      if (s.pending === s.present) return { ...s, pending: null };
      return { ...s, past: [...s.past, s.pending].slice(-LIMIT), future: [], pending: null };
    });
  }, []);

  const undo = useCallback(() => {
    setState((s) => {
      if (s.pending !== null || s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      return { ...s, past: s.past.slice(0, -1), present: previous, future: [s.present, ...s.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setState((s) => {
      if (s.pending !== null || s.future.length === 0) return s;
      const [next, ...rest] = s.future;
      return { ...s, past: [...s.past, s.present], present: next, future: rest };
    });
  }, []);

  const reset = useCallback((value: T) => {
    setState({ past: [], present: value, future: [], saved: value, pending: null });
  }, []);

  const markSaved = useCallback((value: T) => {
    setState((s) => ({ ...s, saved: value }));
  }, []);

  return {
    present: state.present,
    committed: state.pending ?? state.present,
    set,
    commit,
    undo,
    redo,
    reset,
    markSaved,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    dirty: state.present !== state.saved,
  };
}

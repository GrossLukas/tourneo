import { useState, useCallback, useRef } from 'react';

// ============================================
// TOURNEO - Optimistic UI Hook
// Instantly shows expected result, reverts on failure
// ============================================

interface UseOptimisticOptions<T> {
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
}

export function useOptimistic<T>(
  asyncAction: () => Promise<T>,
  options?: UseOptimisticOptions<T>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await asyncAction();
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [asyncAction, options]);

  return { execute, isLoading, error, clearError: () => setError(null) };
}

// Optimistic state with rollback.
//
// Uses a ref to capture the rollback target at call-time, avoiding the
// stale-closure bug where two updates fired in quick succession would
// roll back to the previously-optimistic value instead of the actual
// committed one.
export function useOptimisticState<T>(initialState: T) {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const committedRef = useRef<T>(initialState);

  const optimisticUpdate = useCallback(
    async (newState: T, asyncAction: () => Promise<void>) => {
      const rollbackTo = committedRef.current;
      setState(newState);
      setIsPending(true);

      try {
        await asyncAction();
        committedRef.current = newState;
      } catch {
        setState(rollbackTo);
        throw new Error('Action failed, state rolled back');
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  // Keep committedRef in sync with manual setState calls so a subsequent
  // optimisticUpdate rolls back to the latest external value instead of
  // the stale initialState.
  const setStateAndCommit = useCallback((next: T | ((prev: T) => T)) => {
    setState((prev) => {
      const resolved =
        typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      committedRef.current = resolved;
      return resolved;
    });
  }, []);

  return { state, setState: setStateAndCommit, optimisticUpdate, isPending };
}
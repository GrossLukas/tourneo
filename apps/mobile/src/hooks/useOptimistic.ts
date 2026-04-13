import { useState, useCallback } from 'react';

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

// Optimistic state with rollback
export function useOptimisticState<T>(initialState: T) {
  const [state, setState] = useState(initialState);
  const [previousState, setPreviousState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);

  const optimisticUpdate = useCallback(
    async (newState: T, asyncAction: () => Promise<void>) => {
      setPreviousState(state);
      setState(newState);
      setIsPending(true);

      try {
        await asyncAction();
        setIsPending(false);
      } catch {
        // Rollback on failure
        setState(previousState);
        setIsPending(false);
        throw new Error('Action failed, state rolled back');
      }
    },
    [state, previousState]
  );

  return { state, setState, optimisticUpdate, isPending };
}
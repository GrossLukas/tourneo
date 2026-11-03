/**
 * hallPickStore — hands a hall chosen in the hall finder back to the
 * "create tournament" screen (finder opened with ?pick=1, or "Turnier hier
 * planen" on a hall).
 */
import { create } from 'zustand';
import type { FoundHall } from '../api/v2';

interface HallPickState {
  picked: FoundHall | null;
  pick: (hall: FoundHall) => void;
  clear: () => void;
}

export const useHallPickStore = create<HallPickState>((set) => ({
  picked: null,
  pick: (hall) => set({ picked: hall }),
  clear: () => set({ picked: null }),
}));

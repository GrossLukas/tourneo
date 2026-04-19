import { useEventStore } from '../store/eventStore';
import apiClient from '../api/client';

jest.mock('../api/client', () => ({
  get: jest.fn(),
}));

describe('eventStore', () => {
  beforeEach(() => {
    useEventStore.setState({
      events: [],
      currentEvent: null,
      loading: false,
      error: null,
      filters: {},
      meta: { page: 1, total: 0, total_pages: 0 },
    });
    jest.clearAllMocks();
  });

  describe('fetchEvents', () => {
    it('sets loading state and fetches events', async () => {
      const mockEvents = [
        { id: 1, title: 'Padel Open', sport_category: 'padel' },
        { id: 2, title: 'FIFA Cup', sport_category: 'fifa' },
      ];
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: mockEvents, meta: { page: 1, total: 2, total_pages: 1 } },
      });

      const promise = useEventStore.getState().fetchEvents();
      expect(useEventStore.getState().loading).toBe(true);

      await promise;
      expect(useEventStore.getState().loading).toBe(false);
      expect(useEventStore.getState().events).toEqual(mockEvents);
      expect(useEventStore.getState().meta.total).toBe(2);
    });

    it('sets error on failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));
      await useEventStore.getState().fetchEvents();
      expect(useEventStore.getState().error).toBe('Turniere konnten nicht geladen werden.');
      expect(useEventStore.getState().loading).toBe(false);
    });

    it('passes filters as params', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: [], meta: { page: 1, total: 0, total_pages: 0 } },
      });
      useEventStore.getState().setFilters({ sport: 'padel' });
      await useEventStore.getState().fetchEvents({ level: 'beginner' });
      expect(apiClient.get).toHaveBeenCalledWith('/events', {
        params: { sport: 'padel', level: 'beginner' },
      });
    });
  });

  describe('fetchEventById', () => {
    it('fetches single event and sets currentEvent', async () => {
      const mockEvent = { id: 42, title: 'Grand Slam' };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: mockEvent } });

      await useEventStore.getState().fetchEventById(42);
      expect(useEventStore.getState().currentEvent).toEqual(mockEvent);
      expect(apiClient.get).toHaveBeenCalledWith('/events/42');
    });

    it('sets error on failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Not found'));
      await useEventStore.getState().fetchEventById(999);
      expect(useEventStore.getState().error).toBe('Event konnte nicht geladen werden.');
    });
  });

  describe('filters', () => {
    it('setFilters merges with existing filters', () => {
      useEventStore.getState().setFilters({ sport: 'padel' });
      useEventStore.getState().setFilters({ level: 'advanced' });
      expect(useEventStore.getState().filters).toEqual({ sport: 'padel', level: 'advanced' });
    });

    it('clearFilters resets filters', () => {
      useEventStore.getState().setFilters({ sport: 'padel' });
      useEventStore.getState().clearFilters();
      expect(useEventStore.getState().filters).toEqual({});
    });
  });
});

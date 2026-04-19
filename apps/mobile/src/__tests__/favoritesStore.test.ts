import { useFavoritesStore } from '../store/favoritesStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('favoritesStore', () => {
  beforeEach(() => {
    useFavoritesStore.setState({ favorites: [] });
    jest.clearAllMocks();
  });

  describe('hydrate', () => {
    it('loads favorites from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([1, 2, 3]));
      await useFavoritesStore.getState().hydrate();
      expect(useFavoritesStore.getState().favorites).toEqual([1, 2, 3]);
    });

    it('handles empty storage gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await useFavoritesStore.getState().hydrate();
      expect(useFavoritesStore.getState().favorites).toEqual([]);
    });

    it('handles invalid JSON gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json');
      await useFavoritesStore.getState().hydrate();
      expect(useFavoritesStore.getState().favorites).toEqual([]);
    });

    it('handles non-array JSON gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ not: 'array' }));
      await useFavoritesStore.getState().hydrate();
      expect(useFavoritesStore.getState().favorites).toEqual([]);
    });
  });

  describe('toggleFavorite', () => {
    it('adds an event to favorites', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      await useFavoritesStore.getState().toggleFavorite(42);
      expect(useFavoritesStore.getState().favorites).toContain(42);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@tourneo_favorites',
        JSON.stringify([42])
      );
    });

    it('removes an event from favorites', async () => {
      useFavoritesStore.setState({ favorites: [1, 42, 3] });
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      await useFavoritesStore.getState().toggleFavorite(42);
      expect(useFavoritesStore.getState().favorites).toEqual([1, 3]);
    });

    it('reverts on storage failure', async () => {
      useFavoritesStore.setState({ favorites: [1, 2] });
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));
      await useFavoritesStore.getState().toggleFavorite(3);
      expect(useFavoritesStore.getState().favorites).toEqual([1, 2]);
    });
  });

  describe('isFavorite', () => {
    it('returns true for favorited events', () => {
      useFavoritesStore.setState({ favorites: [10, 20, 30] });
      expect(useFavoritesStore.getState().isFavorite(20)).toBe(true);
    });

    it('returns false for non-favorited events', () => {
      useFavoritesStore.setState({ favorites: [10, 20, 30] });
      expect(useFavoritesStore.getState().isFavorite(99)).toBe(false);
    });
  });
});

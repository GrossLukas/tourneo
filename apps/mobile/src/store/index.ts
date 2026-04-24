import { useCheckoutStore } from './checkoutStore';
import { useCommunityStore } from './communityStore';
import { useEventStore } from './eventStore';
import { useFavoritesStore } from './favoritesStore';
import { useMembershipStore } from './membershipStore';
import { useNotificationStore } from './notificationStore';
import { useRatingStore } from './ratingStore';
import { useRegistrationStore } from './registrationStore';
import { useVenueStore } from './venueStore';

export { useAuthStore } from './authStore';
export { useEventStore } from './eventStore';
export { useRegistrationStore } from './registrationStore';
export { useCommunityStore } from './communityStore';
export { useMembershipStore } from './membershipStore';
export { useNotificationStore } from './notificationStore';
export { useVenueStore } from './venueStore';

/**
 * Clears all user-specific data from every store after logout so a
 * subsequent login as a different user does not leak cached data
 * (events, favorites, notifications, checkout session, registrations,
 * etc). Must be called from authStore.logout(). Do not call elsewhere.
 */
export async function resetAllUserStores(): Promise<void> {
  useCheckoutStore.getState().reset();
  useCommunityStore.getState().reset();
  useEventStore.getState().reset();
  useMembershipStore.getState().reset();
  useNotificationStore.getState().reset();
  useRatingStore.getState().reset();
  useRegistrationStore.getState().reset();
  useVenueStore.getState().reset();
  // Favorites are persisted in AsyncStorage; reset() clears both.
  await useFavoritesStore.getState().reset();
}
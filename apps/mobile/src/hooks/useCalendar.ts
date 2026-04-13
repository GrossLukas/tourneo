import { useState, useCallback } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import * as Calendar from 'expo-calendar';

interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
}

export function useCalendar() {
  const [isAdding, setIsAdding] = useState(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Kalender-Zugriff',
        'Turneo benötigt Zugriff auf deinen Kalender, um Termine hinzuzufügen. Du kannst dies in den Einstellungen aktivieren.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Einstellungen', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  }, []);

  const getDefaultCalendarId = useCallback(async (): Promise<string | null> => {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    // Try to find default calendar
    const defaultCal = calendars.find(
      (cal) => cal.allowsModifications && cal.isPrimary
    );
    if (defaultCal) return defaultCal.id;

    // Fallback: any modifiable calendar
    const modifiable = calendars.find((cal) => cal.allowsModifications);
    if (modifiable) return modifiable.id;

    // Create a new calendar on Android if none exist
    if (Platform.OS === 'android') {
      const newCalId = await Calendar.createCalendarAsync({
        title: 'Turneo Events',
        color: '#0A7E8C',
        entityType: Calendar.EntityTypes.EVENT,
        source: {
          isLocalAccount: true,
          name: 'Turneo',
          type: Calendar.CalendarType.LOCAL,
        },
        name: 'turneo-events',
        ownerAccount: 'turneo',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });
      return newCalId;
    }

    return null;
  }, []);

  const addToCalendar = useCallback(
    async (event: CalendarEvent): Promise<boolean> => {
      setIsAdding(true);
      try {
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          setIsAdding(false);
          return false;
        }

        const calendarId = await getDefaultCalendarId();
        if (!calendarId) {
          Alert.alert('Fehler', 'Kein Kalender verfügbar. Bitte erstelle zuerst einen Kalender auf deinem Gerät.');
          setIsAdding(false);
          return false;
        }

        await Calendar.createEventAsync(calendarId, {
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          notes: event.notes,
          timeZone: 'Europe/Berlin',
          alarms: [{ relativeOffset: -60 }], // Reminder 1 hour before
        });

        Alert.alert(
          'Zum Kalender hinzugefügt ✓',
          `"${event.title}" wurde erfolgreich in deinen Kalender eingetragen.`,
          [{ text: 'OK' }]
        );

        setIsAdding(false);
        return true;
      } catch (error) {
        console.error('Calendar error:', error);
        Alert.alert('Fehler', 'Der Termin konnte nicht hinzugefügt werden. Bitte versuche es erneut.');
        setIsAdding(false);
        return false;
      }
    },
    [requestPermission, getDefaultCalendarId]
  );

  return { addToCalendar, isAdding };
}
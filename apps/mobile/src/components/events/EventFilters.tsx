import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TChip } from '../common/TChip';
import { spacing } from '../../theme/spacing';

interface EventFiltersProps {
  selectedSkill?: string;
  selectedFormat?: string;
  selectedCity?: string;
  onSkillChange: (skill: string | undefined) => void;
  onFormatChange: (format: string | undefined) => void;
  onCityChange: (city: string | undefined) => void;
}

const SKILLS = [
  { value: 'beginner', label: 'Anfänger' },
  { value: 'intermediate', label: 'Mittel' },
  { value: 'advanced', label: 'Fortgeschritten' },
  { value: 'pro', label: 'Profi' },
  { value: 'mixed', label: 'Alle Level' },
];

const FORMATS = [
  { value: 'single_elimination', label: 'K.O.-System' },
  { value: 'round_robin', label: 'Gruppenphase' },
  { value: 'double_elimination', label: 'Doppel-K.O.' },
];

const CITIES = [
  { value: 'München', label: 'München' },
  { value: 'Berlin', label: 'Berlin' },
  { value: 'Hamburg', label: 'Hamburg' },
  { value: 'Köln', label: 'Köln' },
  { value: 'Frankfurt', label: 'Frankfurt' },
];

export const EventFilters: React.FC<EventFiltersProps> = ({
  selectedSkill,
  selectedFormat,
  selectedCity,
  onSkillChange,
  onFormatChange,
  onCityChange,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {SKILLS.map((s) => (
          <TChip
            key={s.value}
            label={s.label}
            selected={selectedSkill === s.value}
            onPress={() => onSkillChange(selectedSkill === s.value ? undefined : s.value)}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {FORMATS.map((f) => (
          <TChip
            key={f.value}
            label={f.label}
            selected={selectedFormat === f.value}
            onPress={() => onFormatChange(selectedFormat === f.value ? undefined : f.value)}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {CITIES.map((c) => (
          <TChip
            key={c.value}
            label={c.label}
            selected={selectedCity === c.value}
            onPress={() => onCityChange(selectedCity === c.value ? undefined : c.value)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  row: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xxs,
  },
});
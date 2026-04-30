import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyRegisterRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/event/${id}`} />;
}

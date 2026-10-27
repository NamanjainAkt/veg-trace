import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Direct entry to main tab flow
  return <Redirect href="/(tabs)/home" />;
}

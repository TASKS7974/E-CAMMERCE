import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import AuthForm from '../../components/AuthForm';

export default function RegisterScreen() {
  const { returnTo } = useLocalSearchParams();
  return <AuthForm mode="register" returnTo={returnTo} />;
}

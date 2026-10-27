import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import AuthForm from '../../components/AuthForm';

export default function LoginScreen() {
  const { returnTo } = useLocalSearchParams();
  return <AuthForm mode="login" returnTo={returnTo} />;
}

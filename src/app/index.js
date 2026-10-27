import React from 'react';
import AuthForm from '../components/AuthForm';

export default function HomeScreen() {
  return <AuthForm mode="login" showBack={false} showProductImages />;
}

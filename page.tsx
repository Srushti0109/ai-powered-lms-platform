import type { Metadata } from 'next';
import { LoginPageContent } from '@/components/layout/auth/login-page-content';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your LMS Platform account',
};

interface LoginPageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // `from` is set by middleware when redirecting unauthenticated users
  const { from } = await searchParams;

  return <LoginPageContent redirectTo={from} />;
}

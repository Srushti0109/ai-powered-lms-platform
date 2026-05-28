import type { Metadata } from 'next';
import { RegisterPageContent } from '@/components/layout/auth/register-page-content';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create a new LMS Platform account',
};

export default function RegisterPage() {
  return <RegisterPageContent />;
}

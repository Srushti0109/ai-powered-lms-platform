// =============================================================================
//  Auth Validation Schemas
//  apps/server/src/modules/auth/auth.schemas.ts
//
//  Zod schemas for all auth request bodies.
//  The validate() middleware runs these before the request reaches controllers.
//  On failure the middleware short-circuits with a 422 and field-level errors.
// =============================================================================

import { z } from 'zod';
import { Role } from '@lms/types';

// ─── Field rules (reused across schemas) ─────────────────────────────────────

const emailField = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Must be a valid email address')
  .max(254, 'Email must be 254 characters or fewer');

const passwordField = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be 128 characters or fewer')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

const nameField = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} cannot be empty`)
    .max(50, `${label} must be 50 characters or fewer`)
    // Strip any HTML/script tags for safety
    .transform((v) => v.replace(/<[^>]*>/g, ''));

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  body: z.object({
    email: emailField,
    password: passwordField,
    firstName: nameField('First name'),
    lastName: nameField('Last name'),
    role: z
      .enum([Role.STUDENT, Role.INSTRUCTOR], {
        errorMap: () => ({
          message: `Role must be either "${Role.STUDENT}" or "${Role.INSTRUCTOR}"`,
        }),
      })
      .optional()
      .default(Role.STUDENT),
  }),
});

export type RegisterBody = z.infer<typeof registerSchema>['body'];

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  body: z.object({
    email: emailField,
    // Login password: same as above but NO strength requirements —
    // the user might have an account from before stricter rules were enforced.
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty')
      .max(128, 'Password must be 128 characters or fewer'),
  }),
});

export type LoginBody = z.infer<typeof loginSchema>['body'];

// ─── Change password (future-proof — defined now) ────────────────────────────

export const changePasswordSchema = z
  .object({
    body: z.object({
      currentPassword: z
        .string({ required_error: 'Current password is required' })
        .min(1, 'Current password cannot be empty'),
      newPassword: passwordField,
      confirmPassword: z.string({ required_error: 'Please confirm your password' }),
    }),
  })
  .superRefine(({ body }, ctx) => {
    if (body.newPassword !== body.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['body', 'confirmPassword'],
      });
    }
    if (body.currentPassword === body.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'New password must differ from current password',
        path: ['body', 'newPassword'],
      });
    }
  });

export type ChangePasswordBody = z.infer<typeof changePasswordSchema>['body'];

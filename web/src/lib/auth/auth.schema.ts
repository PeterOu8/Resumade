import { z } from 'zod';

const email = z.string().trim().max(254).pipe(z.email('Enter a valid email address.'));
const password = z.string().min(8, 'Use at least 8 characters.').max(128, 'Use at most 128 characters.');
const confirmation = { password, confirmPassword: z.string() };
const passwordsMatch = (data: { password: string; confirmPassword: string }) =>
  data.password === data.confirmPassword;
const mismatch = { message: 'Passwords do not match.', path: ['confirmPassword'] };

export const signinSchema = z.object({ email, password });

export const signinResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: z.object({
    userId: z.uuid(),
    displayName: z.string(),
    email: z.email(),
  }),
});

export const signupSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter your name.').max(100),
  email,
  ...confirmation,
}).refine(passwordsMatch, mismatch).transform(({ displayName, email, password }) => ({
  displayName, email, password,
}));

export const accountEmailSchema = z.object({ email });
const token = z.string().regex(/^[0-9A-F]{64}$/, 'This link is invalid.');
export const tokenSchema = z.object({ token });
export const resetPasswordSchema = z.object({ token, ...confirmation })
  .refine(passwordsMatch, mismatch)
  .transform(({ token, password }) => ({ token, password }));

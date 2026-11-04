import { z } from 'zod';

export const signinSchema = z.object({
  email: z
    .email('Invalid email')
    .min(1, { message: 'Email is required' })
    .max(50, { message: 'Maximum 50 characters' }),
  password: z.string().min(8).max(128),
});

export const signinResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: z.object({
    userId: z.uuid(),
    displayName: z.string(),
    email: z.email(),
  }),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is too short'),
    email: z.email(),
    password: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;

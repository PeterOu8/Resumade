import { z } from 'zod';

const fileSizeLimit = 10 * 1024 * 1024; // 10MB
export const RESUME_SCHEMA = z //Only takes pdf and docx files
  .instanceof(File)
  .refine(
    (file) =>
      [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(file.type),
    { message: 'Only pdf and docx documents are accpeted' }
  )
  .refine((file) => file.size <= fileSizeLimit, {
    message: 'File size should not exceed 10MB',
  });

export const TailorResumeRequestSchema = z.object({
  resumePlainText: z
    .string()
    .min(50, 'Resume text looks too short or could not be extracted'),
  jobDescription: z.string().min(20, 'Please paste the job description'),
  prompt: z.string().optional(),
});

export const ResumeFormSchema = z.object({
  resume: RESUME_SCHEMA,
  jobDescription: z.string().min(20, 'Please paste the job description'),
  prompt: z.string().optional(),
});

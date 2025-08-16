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
    { message: 'Only pdf and docx documents woudld be accpeted' }
  )
  .refine((file) => file.size <= fileSizeLimit, {
    message: 'File size should not exceed 10MB',
  });

export const ResumeFormSchema = z.object({
  resumePlainText: z.string().min(10),
  jobDescription: z.string().min(10),
  prompt: z.string(),
});

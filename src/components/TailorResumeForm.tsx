'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { ResumeFormSchema, TailorResumeRequestSchema } from '@/lib/schemas';
import ResumeDropZone from './ResumeDropZone';

type ResumeFormInput = z.infer<typeof TailorResumeRequestSchema>;

interface TailorResumeFormProps {
  file: File[] | undefined;
  setResume: (files: File[]) => void;
}

export default function TailorResumeForm({
  file,
  setResume,
}: TailorResumeFormProps) {
  const form = useForm<ResumeFormInput>({
    resolver: zodResolver(TailorResumeRequestSchema),
    defaultValues: {
      resumePlainText: '',
      jobDescription: '',
      prompt: '',
    },
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = form;

  const processForm: SubmitHandler<ResumeFormInput> = async (data) => {
    const { resumePlainText, jobDescription, prompt } = data;

    toast.promise(
      fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumePlainText,
          jobDescription,
          prompt,
        }),
      }),
      {
        loading: 'Generating tailored resume…',
        success: 'Tailored resume ready for download!',
        error: 'An unexpected error occurred.',
        finally: () => {
          reset();
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(processForm)} className="w-2/3 space-y-6">
        <FormField
          control={control}
          name="resumePlainText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resume</FormLabel>
              <FormControl>
                <ResumeDropZone
                  file={file}
                  setResume={setResume}
                  onChange={(text) => field.onChange(text)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="jobDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about the job description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Past your job description here.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt for AI</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about prompt"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can add in additional prompt to make your tailored result
                precise and on point!
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Submitting...
            </>
          ) : (
            <>Share Resource</>
          )}
        </Button>
      </form>
    </Form>
  );
}

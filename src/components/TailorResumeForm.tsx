// 'use client';

// import { useForm, SubmitHandler } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { ResumeFormSchema } from '@/lib/schemas';

// import { toast } from 'sonner';

// import { useWatch } from 'react-hook-form';
// import { TailorResume } from '@/app/api/tailorResume';

// type ShareFormInput = z.infer<typeof ResumeFormSchema>;

// export const TailorResumeForm = () => {

//   const form = useForm<ShareFormInput>({
//     resolver: zodResolver(ResumeFormSchema),
//     defaultValues: {
//         resume: File[],
//       jobDescription: '',
//       prompt: '',
//     },
//   });

//   const {
//     handleSubmit,
//     control,
//     reset,
//     formState: { isSubmitting },
//   } = form;

//   const processForm: SubmitHandler<ShareFormInput> = async (data) => {
//     const result = ResumeFormSchema.safeParse(data);
//     if (!result.success) return;

//     const { resume, jobDescription, prompt } = result.data;

//     toast.promise(
//       TailorResume()),
//       {
//         loading: 'Processing resource...please check status later',
//         success: 'Resource processing completed!',
//         error: (err) => {
//           if (err.message === 'failed') return 'Resource processing failed.';
//           if (err.message === 'timeout')
//             return 'Resource processing timed out.';
//           if (err.name === 'AbortError')
//             return 'Request timed out after 5 seconds.';
//           return 'An unexpected error occurred.';
//         },
//         finally: () => {
//           reset();
//         },
//       }
//     );
//   };

//   return (
//     <Form {...form}>
//       <div className="container px-4 py-8 mx-auto max-w-2xl">
//         <Card className="animate-in fade-in-50 slide-in-from-bottom-8 duration-300 rounded-2xl shadow-lg bg-background">
//           <CardHeader>
//             <CardTitle className="text-2xl text-foreground">
//               Share a Resource
//             </CardTitle>
//             <CardDescription>
//               Share a valuable developer resource. Our AI will analyze it and
//               add relevant details.
//             </CardDescription>
//             <hr className="my-4 border-muted" />
//           </CardHeader>
//           <form onSubmit={handleSubmit(processForm)}>
//             <CardContent className="space-y-6">
//               {/* URL Field */}
//               <FormField
//                 control={control}
//                 name="url"
//                 render={({ field }) => (
//                   <FormItem className="space-y-2">
//                     <Label htmlFor="url" className="text-foreground">
//                       Resource URL <span className="text-destructive">*</span>
//                     </Label>
//                     <div className="relative">
//                       <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                       <FormControl>
//                         <Input
//                           id="url"
//                           type="text"
//                           placeholder="https://example.com/resource"
//                           {...field}
//                           className="pl-10 focus:ring-2 focus:ring-primary/30 hover:border-primary transition-all duration-200"
//                         />
//                       </FormControl>
//                     </div>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* Comment Field */}
//               <FormField
//                 control={control}
//                 name="comment"
//                 render={({ field }) => (
//                   <FormItem className="space-y-2">
//                     <Label
//                       htmlFor="comment"
//                       className="flex items-center gap-2 text-foreground"
//                     >
//                       <MessageSquare className="h-4 w-4 text-muted-foreground" />
//                       Your Comment
//                     </Label>
//                     <FormControl>
//                       <Textarea
//                         id="comment"
//                         placeholder="Share your thoughts, experience, or recommendation about this resource (e.g. I read this docs and I learn a lot... very recommend for beginner to React!)"
//                         rows={3}
//                         {...field}
//                         className="focus:ring-2 focus:ring-primary/30 hover:border-primary transition-all duration-200"
//                       />
//                     </FormControl>
//                     <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
//                       <span>
//                         Let others know why you recommend this resource.
//                       </span>
//                       <span>{commentValue?.length || 0}/200</span>
//                     </div>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </CardContent>

//             <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => router.push('/')}
//                 className="w-full sm:w-auto"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="w-full sm:w-auto border bg-background text-foreground font-semibold px-6 py-2 rounded-lg flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-all duration-200"
//               >
//                 {isSubmitting ? (
//                   <>
//                     <div className="h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
//                     Submitting...
//                   </>
//                 ) : (
//                   <>Share Resource</>
//                 )}
//               </Button>
//             </CardFooter>
//           </form>
//         </Card>
//       </div>
//     </Form>
//   );
// };

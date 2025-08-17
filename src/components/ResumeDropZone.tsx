'use client';
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '@/components/ui/shadcn-io/dropzone';
import { UploadIcon } from 'lucide-react';

interface DropZoneProps {
  file: File[] | undefined;
  setResumeText: (files: File[]) => void;
}

export default function ResumeDropZone({ file, setResumeText }: DropZoneProps) {
  const handleDrop = async (file: File[]) => {
    try {
      const resume = file[0];
      const formData = new FormData();
      formData.append('file', resume);

      const res = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      console.log(data);
    } catch (e: any) {
      console.log(e.message);
    }
    setResumeText(file);
  };
  return (
    <Dropzone
      accept={{
        'application/pdf': ['.pdf'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          ['.docx'],
      }}
      maxFiles={1}
      multiple={false}
      maxSize={1024 * 1024 * 10}
      minSize={1024}
      onDrop={handleDrop}
      onError={console.error}
      src={file}
    >
      <DropzoneEmptyState>
        <div className="flex flex-col w-full items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <UploadIcon size={12} />
          </div>
          <div>
            <p className="font-medium text-sm">Upload a file</p>
            <p className="text-muted-foreground text-xs">
              Drag and drop or click to upload
            </p>
            <p className="text-muted-foreground text-xs">
              Accepts pdf and docx files
            </p>
          </div>
        </div>
      </DropzoneEmptyState>
      <DropzoneContent />
    </Dropzone>
  );
}

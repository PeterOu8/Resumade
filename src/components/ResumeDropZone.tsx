'use client';
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '@/components/ui/shadcn-io/dropzone';

interface DropZoneProps {
  file: File[];
  onDrop: (files: File[]) => void;
}

export default function ResumeDropZone({ file, onDrop }: DropZoneProps) {
  return (
    <Dropzone
      accept={{
        'application/pdf': ['.pdf'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          ['.docx'],
      }}
      maxFiles={1}
      maxSize={1024 * 1024 * 10}
      minSize={1024}
      onDrop={onDrop}
      onError={console.error}
      src={file}
    >
      <DropzoneEmptyState />
      <DropzoneContent />
    </Dropzone>
  );
}

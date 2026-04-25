import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: string[];
}

export default function ImageUpload({ 
  onUpload, 
  maxFiles = 10, 
  maxSize = 5 * 1024 * 1024,
  accept = ['image/jpeg', 'image/png', 'image/jpg']
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => {
        if (file.errors[0].code === 'file-too-large') {
          return `${file.file.name} is too large (max ${maxSize / 1024 / 1024}MB)`;
        }
        if (file.errors[0].code === 'file-invalid-type') {
          return `${file.file.name} is not a valid image file`;
        }
        return file.errors[0].message;
      });
      setError(errors.join(', '));
    }
    
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles);
    }
  }, [maxSize, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: {
      'image/*': accept
    }
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition
          ${isDragActive 
            ? 'border-[#3F51B5] bg-blue-50' 
            : 'border-gray-300 hover:border-[#3F51B5]'
          }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">
          {isDragActive
            ? 'Drop the images here...'
            : 'Drag & drop images here, or click to select'
          }
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Max {maxFiles} files, up to {maxSize / 1024 / 1024}MB each
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
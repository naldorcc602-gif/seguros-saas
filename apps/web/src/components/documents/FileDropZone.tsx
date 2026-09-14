'use client';

import { UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.webp,.tiff,.tif,.heic,.bmp,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar,.mp4,.mov';

export function FileDropZone({ onFilesSelected, disabled }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) onFilesSelected(Array.from(e.dataTransfer.files));
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
      } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      <UploadCloud size={28} className="text-muted" />
      <p className="text-sm text-ink">Arraste arquivos aqui ou clique para selecionar</p>
      <p className="text-xs text-muted">PDF, imagens (incl. TIFF/HEIC), DOC/DOCX, XLS/XLSX, CSV, TXT, ZIP/RAR, MP4/MOV — até 200MB</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}

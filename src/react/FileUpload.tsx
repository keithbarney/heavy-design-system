import { useRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  children: ReactNode;
  onFiles?: (files: FileList) => void;
}

function FileUpload({ children, onFiles, className, onChange, ...props }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cls = ['hds-form-file', className].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.length) onFiles?.(e.target.files);
          onChange?.(e);
        }}
        {...props}
      />
      <button type="button" className="hds-btn" onClick={() => inputRef.current?.click()}>
        {children}
      </button>
    </div>
  );
}

export { FileUpload };
export type { FileUploadProps };

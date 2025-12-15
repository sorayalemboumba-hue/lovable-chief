import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface RichTextPasteProps {
  value: string;
  onChange: (htmlContent: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextPaste({ value, onChange, placeholder, className }: RichTextPasteProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Try to get HTML content first, fallback to text
    const htmlContent = e.clipboardData.getData('text/html');
    const textContent = e.clipboardData.getData('text/plain');
    
    if (htmlContent) {
      // Insert HTML content
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlContent;
        onChange(htmlContent);
      }
    } else if (textContent) {
      // Insert plain text
      if (editorRef.current) {
        editorRef.current.innerText = textContent;
        onChange(textContent);
      }
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        onPaste={handlePaste}
        onInput={handleInput}
        className={cn(
          "min-h-[250px] max-h-[400px] overflow-y-auto",
          "w-full rounded-md border border-input bg-background px-3 py-2",
          "text-sm ring-offset-background focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "prose prose-sm max-w-none",
          "[&_a]:text-primary [&_a]:underline [&_a]:font-medium",
          !value && "before:content-[attr(data-placeholder)] before:text-muted-foreground before:pointer-events-none",
          className
        )}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={value ? { __html: value } : undefined}
      />
      {value && (
        <div className="absolute top-2 right-2">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            HTML ✓
          </span>
        </div>
      )}
    </div>
  );
}

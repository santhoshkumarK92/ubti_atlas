import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

/** Safe markdown (raw HTML is not rendered). */
export function Markdown({ children, className }: { children?: string; className?: string }) {
  if (!children?.trim()) return null;
  return (
    <div className={cn('prose-atlas', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

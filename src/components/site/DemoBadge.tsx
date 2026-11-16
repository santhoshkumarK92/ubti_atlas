import { CircleAlert, CircleCheck, PlayCircle, Clock } from 'lucide-react';
import type { DemoStatus } from '@/lib/types';
import { timeAgo } from '@/lib/utils';

export function DemoBadge({ url, status, hasVideo }: { url?: string; status?: DemoStatus; hasVideo: boolean }) {
  if (url && status && !status.ok)
    return <span className="chip border-bad/30 text-bad"><CircleAlert className="h-3.5 w-3.5" /> Demo offline · checked {timeAgo(status.checkedAt)}</span>;
  if (url && status?.ok)
    return <span className="chip border-good/30 text-good"><CircleCheck className="h-3.5 w-3.5" /> Live demo · verified {timeAgo(status.checkedAt)}</span>;
  if (url) return <span className="chip"><Clock className="h-3.5 w-3.5" /> Live demo · not yet checked</span>;
  if (hasVideo) return <span className="chip"><PlayCircle className="h-3.5 w-3.5" /> Recorded demo</span>;
  return <span className="chip text-muted">Demo on request</span>;
}

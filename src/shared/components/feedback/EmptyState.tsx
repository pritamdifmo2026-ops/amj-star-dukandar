import React from 'react';
import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nothing here yet',
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
      <InboxIcon size={40} color="var(--color-text-muted)" />
      <h3 className="text-lg font-semibold text-slate-500">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-[360px]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;

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
      <InboxIcon size={40} color="var(--color-muted)" />
      <h3 className="text-lg font-semibold text-body m-0">{title}</h3>
      {description && <p className="text-sm text-muted max-w-[360px] m-0">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;

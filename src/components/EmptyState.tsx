import { Users } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Users size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

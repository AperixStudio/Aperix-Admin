import Link from "next/link";
import type { ActionQueueItem } from "@/lib/admin-types";

const SOURCE_ICON: Record<ActionQueueItem["source"], string> = {
  task: "✓",
  incident: "⚠",
  check: "◎",
  renewal: "↻",
};

interface Props {
  items: ActionQueueItem[];
  emptyCopy: string;
  limit?: number;
}

export function ActionQueueList({ items, emptyCopy, limit }: Props) {
  if (!items.length) return <div className="empty-state">{emptyCopy}</div>;

  const visible = limit ? items.slice(0, limit) : items;

  return (
    <div className="action-queue">
      {visible.map((item) => (
        <Link key={item.id} href={item.href} className={`action-row priority-${item.priority}`}>
          <span className={`action-icon source-${item.source}`}>{SOURCE_ICON[item.source]}</span>
          <div className="action-body">
            <div className="action-title">{item.title}</div>
            {item.detail && <div className="action-detail">{item.detail}</div>}
            <div className="action-meta">
              <span className="action-project">{item.projectName}</span>
              <span>·</span>
              <span>{item.owner}</span>
              <span>·</span>
              <span className={`priority-pill priority-${item.priority}`}>{item.priority}</span>
            </div>
          </div>
        </Link>
      ))}
      {limit && items.length > limit && (
        <div className="action-more">+{items.length - limit} more in the queue</div>
      )}
    </div>
  );
}

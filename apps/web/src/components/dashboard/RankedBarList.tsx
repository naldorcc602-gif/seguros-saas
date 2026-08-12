interface RankedListProps {
  title: string;
  items: Array<{ id: string | null; name: string; count: number }>;
  emptyLabel?: string;
}

export function RankedBarList({ title, items, emptyLabel }: RankedListProps) {
  const sorted = [...items].sort((a, b) => b.count - a.count).slice(0, 6);
  const max = Math.max(...sorted.map((i) => i.count), 1);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      {sorted.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{emptyLabel ?? 'Sem dados ainda.'}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {sorted.map((item) => (
            <li key={item.id ?? item.name}>
              <div className="flex items-center justify-between text-xs">
                <span className="truncate text-ink">{item.name}</span>
                <span className="ml-2 shrink-0 font-mono text-muted">{item.count}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

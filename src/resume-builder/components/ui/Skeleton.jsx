export function Skeleton({ className = '', lines = 1 }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded-lg bg-white/5 animate-pulse" style={{ width: i === lines - 1 && lines > 1 ? '65%' : '100%' }} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rb-card space-y-4">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton lines={3} />
      <div className="flex gap-2 pt-2">
        <div className="h-8 w-20 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-8 w-20 rounded-lg bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} />
  )
}

export function ProductSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="aspect-square" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

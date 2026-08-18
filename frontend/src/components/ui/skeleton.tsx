import { cn } from "@/lib/utils";
export function Skeleton({ className }: { className?: string }) { return <div className={cn("animate-pulse rounded-lg bg-slate-200/70", className)} />; }
export function PageSkeleton() { return <div className="space-y-5"><Skeleton className="h-16 w-full" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map(i=><Skeleton key={i} className="h-32" />)}</div><Skeleton className="h-80" /></div>; }

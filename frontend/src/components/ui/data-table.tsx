import { cn } from "@/lib/utils";
export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) { return <div className={cn("overflow-x-auto rounded-xl border border-border", className)}><table className="w-full min-w-[720px] text-left text-sm">{children}</table></div>; }
export const THead = ({ children }: { children: React.ReactNode }) => <thead className="border-b bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{children}</thead>;
export const TH = ({ children, className }: { children?: React.ReactNode; className?: string }) => <th className={cn("px-4 py-3", className)}>{children}</th>;
export const TD = ({ children, className }: { children?: React.ReactNode; className?: string }) => <td className={cn("px-4 py-3.5", className)}>{children}</td>;

import { cn } from "@/lib/utils";

/** Wraps public marketing/auth pages with Gungle.ai brand tokens. */
export function BrandSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("marketing-surface min-h-dvh", className)}>{children}</div>;
}

export function ShimmerBlock({ className }: { className: string }) {
  return <div aria-hidden="true" className={`shimmer rounded-md ${className}`} />;
}

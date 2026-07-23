function initialsFallback(seed: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
}

export function AvatarImage({
  alt = "",
  className,
  name,
  src,
  testId,
}: {
  alt?: string;
  className?: string;
  name: string;
  src: string;
  testId?: string;
}) {
  return (
    <img
      alt={alt}
      className={className}
      data-testid={testId}
      onError={(event) => {
        const img = event.currentTarget;
        const fallback = initialsFallback(name);
        if (img.src !== fallback) img.src = fallback;
      }}
      referrerPolicy="no-referrer"
      src={src || initialsFallback(name)}
    />
  );
}

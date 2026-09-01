const FALLBACK = "/illustrations/empty-wallet.webp";

export function AppImg({
  src,
  alt,
  className,
  width,
  height,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const value = (src || "").trim() || FALLBACK;
  return (
    // User photos and remote URLs must not go through next/image. A bad src throws and takes the whole page down.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={value} alt={alt} width={width} height={height} className={className} />
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MediaSplit } from "@/components/marketing/media-split";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  alt: string;
  points: string[];
  cta: { href: string; label: string };
  secondary?: { href: string; label: string };
};

export function ProductPage({
  title,
  eyebrow,
  description,
  image,
  alt,
  points,
  cta,
  secondary,
}: Props) {
  return (
    <MediaSplit image={image} alt={alt} reverse>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
      <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted">{description}</p>
      <ul className="mt-6 space-y-2 text-sm text-ink">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={cta.href}>
          <Button size="lg">
            {cta.label} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        {secondary ? (
          <Link href={secondary.href}>
            <Button size="lg" variant="secondary">
              {secondary.label}
            </Button>
          </Link>
        ) : null}
      </div>
    </MediaSplit>
  );
}

export function productMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
  };
}

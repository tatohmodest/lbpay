import Image from "next/image";
import { Container } from "@/components/marketing/container";
import { cn } from "@/lib/cn";

export function MediaSplit({
  image,
  alt,
  children,
  reverse = false,
  tone = "white",
}: {
  image: string;
  alt: string;
  children: React.ReactNode;
  reverse?: boolean;
  tone?: "white" | "paper" | "navy";
}) {
  return (
    <section
      className={cn(
        tone === "white" && "bg-white",
        tone === "paper" && "bg-paper",
        tone === "navy" && "bg-navy text-white",
      )}
    >
      <Container className="grid items-center gap-8 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div
          className={cn(
            "order-1 overflow-hidden rounded-[1.75rem] border border-white/10 shadow-[0_24px_80px_rgba(10,37,64,0.12)]",
            reverse ? "lg:order-2" : "lg:order-1",
            tone !== "navy" && "border-line",
          )}
        >
          <Image src={image} alt={alt} width={1536} height={1024} className="h-auto w-full" />
        </div>
        <div className={cn("order-2", reverse ? "lg:order-1" : "lg:order-2")}>{children}</div>
      </Container>
    </section>
  );
}

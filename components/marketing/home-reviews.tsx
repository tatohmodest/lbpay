import { connection } from "next/server";
import Image from "next/image";
import { Star } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { listPublicReviews } from "@/lib/server/db";

export async function HomeReviews() {
  await connection();
  const reviews = await listPublicReviews();
  if (!reviews.length) return null;

  return (
    <section className="bg-paper py-20 lg:py-24">
      <Container>
        <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-[2.4rem]">
          Customer success is our success.
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {reviews.map((item, index) => (
            <article
              key={item.id}
              className={
                index === 0
                  ? "rounded-[1.5rem] bg-brand p-6 text-white"
                  : "rounded-[1.5rem] bg-white p-6 shadow-[0_8px_30px_rgba(6,38,28,0.06)]"
              }
            >
              <div className="flex items-center gap-3">
                <Image
                  src={item.avatar}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-bold">{item.name}</p>
                  <p className="mt-1 flex gap-0.5" aria-label={`${item.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star < item.rating
                            ? index === 0
                              ? "fill-white text-white"
                              : "fill-brand text-brand"
                            : index === 0
                              ? "text-white/40"
                              : "text-line"
                        }`}
                      />
                    ))}
                  </p>
                </div>
              </div>
              <p className={`mt-5 text-sm leading-6 ${index === 0 ? "text-white" : "text-ink"}`}>
                “{item.body}”
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

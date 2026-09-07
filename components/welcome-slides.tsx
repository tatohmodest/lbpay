"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ONBOARD_ART } from "@/lib/assets";
import { markOnboarded } from "@/lib/native";

const slides = [
  {
    art: ONBOARD_ART.wallet,
    kicker: "Cameroon XAF",
    title: "Your money. One wallet.",
    copy: "Send, receive, and cash out without hopping between apps. This is LBPay.",
  },
  {
    art: ONBOARD_ART.transfer,
    kicker: "MTN · Orange",
    title: "Transfers that actually land.",
    copy: "Move XAF between networks in seconds. Wallet to wallet is instant and free.",
  },
  {
    art: ONBOARD_ART.save,
    kicker: "Pots",
    title: "Save with a little bite.",
    copy: "Daily, weekly, or monthly pots. Miss a day and the penalty you chose keeps you honest.",
  },
  {
    art: ONBOARD_ART.business,
    kicker: "Merchants",
    title: "Get paid from your shop.",
    copy: "Create product links, share the whole catalogue, and collect MTN, Orange, or wallet.",
  },
];

export function WelcomeSlides() {
  const router = useRouter();
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = index === slides.length - 1;

  function go(next: number) {
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    setIndex(clamped);
    const node = scroller.current;
    if (!node) return;
    node.scrollTo({ left: clamped * node.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const node = scroller.current;
    if (!node) return;
    const next = Math.round(node.scrollLeft / Math.max(node.clientWidth, 1));
    if (next !== index) setIndex(next);
  }

  function finish(path: string) {
    markOnboarded();
    router.replace(path);
  }

  return (
    <div className="flex min-h-svh flex-col bg-paper pt-[env(safe-area-inset-top)]">
      <header className="flex items-center justify-between px-5 py-3">
        <span className="text-[13px] font-black tracking-tight text-ink">LBPay</span>
        {!last ? (
          <button type="button" className="text-[13px] font-bold text-muted" onClick={() => go(slides.length - 1)}>
            Skip
          </button>
        ) : (
          <span className="w-10" />
        )}
      </header>

      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide) => (
          <section key={slide.title} className="flex w-full shrink-0 snap-center flex-col px-6 pb-4">
            <div className="grid flex-1 place-items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slide.art} alt="" className="max-h-[46svh] w-full max-w-sm object-contain" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-deep">{slide.kicker}</p>
            <h1 className="mt-2 text-[2rem] font-black leading-[1.1] tracking-tight text-ink">{slide.title}</h1>
            <p className="mt-3 max-w-sm text-[15px] leading-7 text-muted">{slide.copy}</p>
          </section>
        ))}
      </div>

      <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mb-5 flex items-center justify-center gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-brand" : "w-1.5 bg-line"}`}
            />
          ))}
        </div>
        {last ? (
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => finish("/signup")}
              className="grid h-12 place-items-center rounded-2xl bg-brand text-sm font-bold text-white"
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => finish("/login")}
              className="grid h-12 place-items-center rounded-2xl bg-white text-sm font-bold text-ink ring-1 ring-line"
            >
              I already have an account
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="grid h-12 w-full place-items-center rounded-2xl bg-brand text-sm font-bold text-white"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

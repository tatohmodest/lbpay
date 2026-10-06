"use client";

import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Car,
  Gem,
  GraduationCap,
  HeartPulse,
  Home,
  PiggyBank,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";

export const PLAN_ICON_OPTIONS: Array<{
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}> = [
  { id: "target", label: "Goal", icon: Target, color: "text-emerald-700", bg: "bg-emerald-50" },
  { id: "home", label: "Home", icon: Home, color: "text-blue-700", bg: "bg-blue-50" },
  { id: "car", label: "Vehicle", icon: Car, color: "text-amber-700", bg: "bg-amber-50" },
  { id: "graduation", label: "School", icon: GraduationCap, color: "text-indigo-700", bg: "bg-indigo-50" },
  { id: "plane", label: "Travel", icon: Plane, color: "text-cyan-700", bg: "bg-cyan-50" },
  { id: "shield", label: "Emergency", icon: ShieldCheck, color: "text-rose-700", bg: "bg-rose-50" },
  { id: "smartphone", label: "Tech", icon: Smartphone, color: "text-violet-700", bg: "bg-violet-50" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "text-pink-700", bg: "bg-pink-50" },
  { id: "briefcase", label: "Business", icon: Briefcase, color: "text-stone-700", bg: "bg-stone-100" },
  { id: "heart", label: "Health", icon: HeartPulse, color: "text-red-700", bg: "bg-red-50" },
  { id: "gem", label: "Luxury", icon: Gem, color: "text-teal-700", bg: "bg-teal-50" },
  { id: "sparkles", label: "Dream", icon: Sparkles, color: "text-yellow-700", bg: "bg-yellow-50" },
];

const EMOJI_TO_ID: Record<string, string> = {
  "🎯": "target",
  "🏠": "home",
  "🚗": "car",
  "📚": "graduation",
  "🎓": "graduation",
  "✈️": "plane",
  "🛡️": "shield",
  "📱": "smartphone",
  "🛍️": "shopping",
  "💼": "briefcase",
  "🏥": "heart",
  "💍": "gem",
  "✨": "sparkles",
  "🐷": "wallet",
};

export function resolvePlanIcon(idOrEmoji?: string) {
  if (!idOrEmoji) return PLAN_ICON_OPTIONS[0];
  const mappedId = EMOJI_TO_ID[idOrEmoji] || idOrEmoji;
  const match = PLAN_ICON_OPTIONS.find((item) => item.id === mappedId);
  if (match) return match;
  if (mappedId === "wallet") {
    return { id: "wallet", label: "Wallet", icon: Wallet, color: "text-emerald-700", bg: "bg-emerald-50" };
  }
  return PLAN_ICON_OPTIONS[0];
}

export function PlanIcon({
  icon,
  className,
  size = "md",
}: {
  icon?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const resolved = resolvePlanIcon(icon);
  const IconComponent = resolved.icon || PiggyBank;

  const sizeClasses =
    size === "sm"
      ? "h-8 w-8 rounded-xl text-xs"
      : size === "lg"
        ? "h-14 w-14 rounded-2xl text-base"
        : size === "xl"
          ? "h-16 w-16 rounded-[1.25rem] text-lg"
          : "h-10 w-10 rounded-xl text-sm";

  const iconSizes =
    size === "sm"
      ? "h-4 w-4"
      : size === "lg"
        ? "h-7 w-7"
        : size === "xl"
          ? "h-8 w-8"
          : "h-5 w-5";

  return (
    <div
      className={cn(
        "grid place-items-center shrink-0 transition-transform",
        resolved.bg,
        resolved.color,
        sizeClasses,
        className,
      )}
      aria-label={resolved.label}
    >
      <IconComponent className={iconSizes} strokeWidth={2.2} />
    </div>
  );
}

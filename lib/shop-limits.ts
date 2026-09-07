export const SHOP_LIMITS = {
  baseSlots: 20,
  packSize: 10,
  packPrice: 2000,
} as const;

export function shopSlotLimit(extraPacks = 0) {
  return SHOP_LIMITS.baseSlots + Math.max(0, Math.round(extraPacks)) * SHOP_LIMITS.packSize;
}

export function shopSlotState(used: number, extraPacks = 0) {
  const packs = Math.max(0, Math.round(extraPacks));
  const limit = shopSlotLimit(packs);
  const remaining = Math.max(0, limit - used);
  return {
    used,
    limit,
    remaining,
    atLimit: used >= limit,
    extraPacks: packs,
    packPrice: SHOP_LIMITS.packPrice,
    packSize: SHOP_LIMITS.packSize,
    baseSlots: SHOP_LIMITS.baseSlots,
  };
}

export function shopSlotLimitMessage(limit: number) {
  return `You have used all ${limit} product slots. Add ${SHOP_LIMITS.packSize} more for ${SHOP_LIMITS.packPrice.toLocaleString("fr-FR")} XAF.`;
}

export function isShopSlotLimitError(error: unknown): error is Error & { code: "SHOP_SLOT_LIMIT" } {
  return Boolean(error && typeof error === "object" && (error as { code?: string }).code === "SHOP_SLOT_LIMIT");
}

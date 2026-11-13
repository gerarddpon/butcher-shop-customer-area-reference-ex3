export const businessConfig = {
  name: process.env.NEXT_PUBLIC_SHOP_NAME ?? "Maison Annoix",
  shop: process.env.SHOP_NAME ?? "Boutique de Sannois",
  phone: process.env.SHOP_PHONE ?? "01 39 47 12 22",
  phoneHref: `tel:${(process.env.SHOP_PHONE ?? "01 39 47 12 22").replace(/\s/g, "")}`,
  email: process.env.SHOP_EMAIL ?? "bonjour@maison-annoix.fr",
  address: process.env.SHOP_ADDRESS ?? "24 rue du Général Leclerc, 95110 Sannois",
  businessDate: process.env.BUSINESS_DATE ?? "2026-10-29",
  paymentMode: process.env.PAYMENT_MODE ?? "mock",
  claimResponseHours: Number(process.env.CLAIM_RESPONSE_HOURS ?? 24),
  reviewPoints: Number(process.env.REVIEW_POINTS ?? 15),
  maxClaimPhotos: Number(process.env.MAX_CLAIM_PHOTOS ?? 3),
  maxClaimPhotoBytes: Number(process.env.MAX_CLAIM_PHOTO_BYTES ?? 5 * 1024 * 1024),
};

export const customer = {
  firstName: "Marie",
  name: "Marie Dupont",
  shortName: "Marie D.",
  email: "marie.dupont@email.fr",
  memberSince: "Novembre 2024",
  tier: "Client fidèle",
};

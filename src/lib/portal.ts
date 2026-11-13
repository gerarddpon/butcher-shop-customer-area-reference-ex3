import { cache } from "react";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import {
  cartItems,
  claimMessages,
  claims,
  loyaltyEntries,
  orderItems,
  orderMessages,
  orders,
  products,
  professionalQuotes,
  reviews,
  settings,
  subscriptions,
  vouchers,
} from "@/db/schema";

export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type ClaimMessage = typeof claimMessages.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type LoyaltyEntry = typeof loyaltyEntries.$inferSelect;
export type Voucher = typeof vouchers.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type OrderMessage = typeof orderMessages.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type ProfessionalQuote = typeof professionalQuotes.$inferSelect;
export type PortalSettings = typeof settings.$inferSelect;

export type DetailedItem = OrderItem & { product: Product };
export type DetailedOrder = Order & {
  items: DetailedItem[];
  messages: OrderMessage[];
};
export type DetailedClaim = Claim & {
  order: Order;
  item: DetailedItem;
  messages: ClaimMessage[];
};
export type DetailedReview = Review & {
  item: DetailedItem;
  order: Order;
};
export type DetailedCartItem = CartItem & { product: Product };

export type PortalData = {
  products: Product[];
  orders: DetailedOrder[];
  claims: DetailedClaim[];
  reviews: DetailedReview[];
  loyalty: LoyaltyEntry[];
  vouchers: Voucher[];
  cart: DetailedCartItem[];
  subscriptions: Subscription[];
  professionalQuotes: ProfessionalQuote[];
  settings: PortalSettings;
};

export const getPortalData = cache(async (): Promise<PortalData> => {
  await ensureSeed();
  const [
    productRows,
    orderRows,
    itemRows,
    claimRows,
    messageRows,
    reviewRows,
    loyaltyRows,
    voucherRows,
    cartRows,
    orderMessageRows,
    subscriptionRows,
    professionalQuoteRows,
    settingRows,
  ] = await Promise.all([
    db.select().from(products),
    db.select().from(orders).orderBy(desc(orders.placedAt)),
    db.select().from(orderItems),
    db.select().from(claims).orderBy(desc(claims.createdAt)),
    db.select().from(claimMessages).orderBy(claimMessages.createdAt),
    db.select().from(reviews).orderBy(desc(reviews.publishedAt)),
    db.select().from(loyaltyEntries).orderBy(desc(loyaltyEntries.occurredAt)),
    db.select().from(vouchers),
    db.select().from(cartItems),
    db.select().from(orderMessages).orderBy(orderMessages.createdAt),
    db.select().from(subscriptions),
    db.select().from(professionalQuotes).orderBy(desc(professionalQuotes.createdAt)),
    db.select().from(settings),
  ]);

  const productMap = new Map(productRows.map((product) => [product.id, product]));
  const detailedItems = new Map<string, DetailedItem>();
  for (const item of itemRows) {
    const product = productMap.get(item.productId);
    if (product) detailedItems.set(item.key, { ...item, product });
  }
  const orderMap = new Map(orderRows.map((order) => [order.id, order]));

  const detailedOrders: DetailedOrder[] = orderRows.map((order) => ({
    ...order,
    items: itemRows
      .filter((item) => item.orderId === order.id)
      .map((item) => detailedItems.get(item.key))
      .filter((item): item is DetailedItem => Boolean(item)),
    messages: orderMessageRows.filter((message) => message.orderId === order.id),
  }));

  const detailedClaims: DetailedClaim[] = claimRows.flatMap((claim) => {
    const order = orderMap.get(claim.orderId);
    const item = detailedItems.get(claim.orderItemKey);
    if (!order || !item) return [];
    return [{
      ...claim,
      order,
      item,
      messages: messageRows.filter((message) => message.claimId === claim.id),
    }];
  });

  const detailedReviews: DetailedReview[] = reviewRows.flatMap((review) => {
    const item = detailedItems.get(review.orderItemKey);
    if (!item) return [];
    const order = orderMap.get(item.orderId);
    if (!order) return [];
    return [{ ...review, item, order }];
  });

  return {
    products: productRows,
    orders: detailedOrders,
    claims: detailedClaims,
    reviews: detailedReviews,
    loyalty: loyaltyRows,
    vouchers: voucherRows,
    cart: cartRows.flatMap((item) => {
      const product = productMap.get(item.productId);
      return product ? [{ ...item, product }] : [];
    }),
    subscriptions: subscriptionRows,
    professionalQuotes: professionalQuoteRows,
    settings: settingRows[0],
  };
});

export function loyaltyBalance(data: Pick<PortalData, "loyalty">) {
  return data.loyalty.reduce((sum, entry) => sum + entry.points, 0);
}

export function activeVoucherTotal(data: Pick<PortalData, "vouchers">) {
  return data.vouchers
    .filter((voucher) => voucher.status === "Actif")
    .reduce((sum, voucher) => sum + voucher.valueCents, 0);
}

export function pendingReviewItems(data: PortalData) {
  return data.orders.flatMap((order) =>
    order.items
      .filter((item) => !data.reviews.some((review) => review.orderItemKey === item.key))
      .map((item) => ({ item, order })),
  );
}

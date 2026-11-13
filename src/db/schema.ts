import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
} from "drizzle-orm/pg-core";

export type ClaimPhoto = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

export type Address = {
  id: string;
  label: string;
  recipient: string;
  line1: string;
  postalCode: string;
  city: string;
  isDefault: boolean;
};

export type NotificationChannels = {
  phone: string;
  email: string;
};

export type PrivacySettings = {
  orderUpdates: boolean;
  novelties: boolean;
  loyalty: boolean;
  events: boolean;
  analytics: boolean;
  personalization: boolean;
  updatedAt: string | null;
  policyVersion: string;
};

export type AtelierConfig = {
  enabled: boolean;
  categories: string[];
  packaging: {
    individualVacuum: boolean;
    kraft: boolean;
    coolerCount: number;
  };
  detailedLabel: boolean;
  allergens: string[];
  allergyNotes: string;
  savedAt: string | null;
};

export type SecuritySession = {
  id: string;
  label: string;
  location: string;
  current: boolean;
  lastActive: string;
};

export type SecuritySettings = {
  twoFactor: boolean;
  method: "sms" | "email" | "app";
  passwordUpdatedAt: string;
  sessions: SecuritySession[];
  recoveryGeneratedAt: string | null;
};

export type AccountState = {
  paused: boolean;
  pausedAt: string | null;
  deletionRequestedAt: string | null;
};

export type OrderAttachment = ClaimPhoto & {
  kind: "image" | "document";
};

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  priceCents: integer("price_cents").notNull(),
  unit: text("unit").notNull().default("kg"),
  origin: text("origin").notNull(),
  conservation: text("conservation").notNull(),
  allergens: text("allergens").notNull().default("Aucun"),
  preparation: text("preparation").notNull(),
  available: boolean("available").notNull().default(true),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  placedAt: text("placed_at").notNull(),
  fulfillment: text("fulfillment").notNull(),
  shop: text("shop").notNull(),
  slotDate: text("slot_date").notNull(),
  slotLabel: text("slot_label").notNull(),
  totalCents: integer("total_cents").notNull(),
  depositCents: integer("deposit_cents").notNull().default(0),
  tvaCents: integer("tva_cents").notNull().default(0),
  balanceCents: integer("balance_cents").notNull().default(0),
  pickupCode: text("pickup_code").notNull(),
  paymentStatus: text("payment_status").notNull().default("À régler"),
  note: text("note").notNull().default(""),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  quantityLabel: text("quantity_label").notNull(),
  grams: integer("grams").notNull().default(0),
  unitPriceCents: integer("unit_price_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  lot: text("lot").notNull(),
  dlc: text("dlc").notNull(),
  notes: text("notes").notNull().default(""),
});

export const claims = pgTable("claims", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  orderItemKey: text("order_item_key")
    .notNull()
    .references(() => orderItems.key),
  motif: text("motif").notNull(),
  description: text("description").notNull(),
  quantity: text("quantity").notNull(),
  status: text("status").notNull(),
  resolution: text("resolution").notNull().default("En attente"),
  creditCents: integer("credit_cents").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  photos: jsonb("photos").$type<ClaimPhoto[]>().notNull().default([]),
});

export const claimMessages = pgTable("claim_messages", {
  id: serial("id").primaryKey(),
  claimId: text("claim_id")
    .notNull()
    .references(() => claims.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  body: text("body").notNull(),
  attachment: text("attachment"),
  createdAt: text("created_at").notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  orderItemKey: text("order_item_key")
    .notNull()
    .unique()
    .references(() => orderItems.key),
  rating: integer("rating").notNull(),
  criteria: jsonb("criteria").$type<string[]>().notNull().default([]),
  comment: text("comment").notNull().default(""),
  anonymous: boolean("anonymous").notNull().default(false),
  publishedAt: text("published_at").notNull(),
  atelierReply: text("atelier_reply"),
  replyDate: text("reply_date"),
});

export const loyaltyEntries = pgTable("loyalty_entries", {
  id: serial("id").primaryKey(),
  entryKey: text("entry_key").notNull().unique(),
  label: text("label").notNull(),
  kind: text("kind").notNull(),
  points: integer("points").notNull(),
  occurredAt: text("occurred_at").notNull(),
  orderId: text("order_id"),
  reviewId: integer("review_id"),
});

export const vouchers = pgTable("vouchers", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  kind: text("kind").notNull(),
  valueCents: integer("value_cents").notNull(),
  expiresAt: text("expires_at").notNull(),
  status: text("status").notNull().default("Actif"),
});

export const cartItems = pgTable("cart_items", {
  productId: text("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  cutNote: text("cut_note").notNull().default(""),
});

export const orderMessages = pgTable("order_messages", {
  id: serial("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  author: text("author").notNull().default("client"),
  subject: text("subject").notNull().default(""),
  body: text("body").notNull(),
  attachment: jsonb("attachment").$type<OrderAttachment | null>(),
  createdAt: text("created_at").notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cadence: text("cadence").notNull(),
  nextDate: text("next_date").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull(),
  description: text("description").notNull(),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  comfort: boolean("comfort").notNull().default(false),
  applyPoints: boolean("apply_points").notNull().default(false),
  atelierPreferences: jsonb("atelier_preferences")
    .$type<string[]>()
    .notNull()
    .default([]),
  notificationPrefs: jsonb("notification_preferences")
    .$type<Record<string, boolean>>()
    .notNull()
    .default({}),
  channels: jsonb("channels").$type<NotificationChannels>(),
  privacy: jsonb("privacy").$type<PrivacySettings>(),
  atelierConfig: jsonb("atelier_config").$type<AtelierConfig>(),
  security: jsonb("security").$type<SecuritySettings>(),
  accountState: jsonb("account_state").$type<AccountState>(),
  favoriteProductIds: jsonb("favorite_product_ids")
    .$type<string[]>()
    .notNull()
    .default([]),
  addresses: jsonb("addresses").$type<Address[]>().notNull().default([]),
  professional: jsonb("professional")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  securityRevokedAt: text("security_revoked_at"),
  privacyRequestAt: text("privacy_request_at"),
});

export const professionalQuotes = pgTable("professional_quotes", {
  id: text("id").primaryKey(),
  subject: text("subject").notNull(),
  details: text("details").notNull(),
  headcount: integer("headcount").notNull().default(0),
  eventDate: text("event_date").notNull(),
  status: text("status").notNull(),
  totalCents: integer("total_cents").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

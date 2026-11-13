import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import {
  settings,
  type AccountState,
  type Address,
  type AtelierConfig,
  type NotificationChannels,
  type PrivacySettings,
  type SecuritySettings,
} from "@/db/schema";

export const dynamic = "force-dynamic";

const allergens = ["Gluten", "Lactose", "Sulfites", "Porc", "Poissons & crustacés", "Céleri", "Sans épices fortes"];
const categories = ["Steaks", "Rôtis", "Volaille", "Agneau / Veau", "Hachés"];

function safeString(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function PATCH(request: Request) {
  await ensureSeed();
  try {
    const body = await request.json() as Record<string, unknown>;
    const current = (await db.select().from(settings).where(eq(settings.id, 1)).limit(1))[0];
    if (!current) return NextResponse.json({ error: "Compte client introuvable." }, { status: 404 });
    const updates: Partial<typeof settings.$inferInsert> = {};

    if (typeof body.comfort === "boolean") updates.comfort = body.comfort;
    if (typeof body.applyPoints === "boolean") updates.applyPoints = body.applyPoints;
    if (Array.isArray(body.favoriteProductIds)) updates.favoriteProductIds = body.favoriteProductIds.filter((id): id is string => typeof id === "string").slice(0, 50);
    if (Array.isArray(body.atelierPreferences)) updates.atelierPreferences = body.atelierPreferences.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 240)).filter(Boolean).slice(0, 20);

    if (body.notificationPrefs && typeof body.notificationPrefs === "object") {
      const entries = Object.entries(body.notificationPrefs).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean");
      updates.notificationPrefs = Object.fromEntries(entries);
    }

    if (body.channels && typeof body.channels === "object") {
      const channels = body.channels as Partial<NotificationChannels>;
      const phone = safeString(channels.phone, 24);
      const email = safeString(channels.email, 120);
      if (phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Le numéro de mobile doit contenir au moins 10 chiffres." }, { status: 400 });
      if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "L’adresse e-mail de réception est invalide." }, { status: 400 });
      updates.channels = { phone, email };
    }

    if (body.privacy && typeof body.privacy === "object") {
      const privacy = body.privacy as Partial<PrivacySettings>;
      const booleanKeys: Array<keyof PrivacySettings> = ["novelties", "loyalty", "events", "analytics", "personalization"];
      const next: PrivacySettings = {
        orderUpdates: true,
        novelties: current.privacy?.novelties ?? true,
        loyalty: current.privacy?.loyalty ?? true,
        events: current.privacy?.events ?? false,
        analytics: current.privacy?.analytics ?? false,
        personalization: current.privacy?.personalization ?? false,
        updatedAt: new Date().toISOString(),
        policyVersion: "2026-11",
      };
      for (const key of booleanKeys) {
        if (typeof privacy[key] === "boolean") (next[key] as boolean) = privacy[key] as boolean;
      }
      updates.privacy = next;
    }

    if (body.atelierConfig && typeof body.atelierConfig === "object") {
      const config = body.atelierConfig as Partial<AtelierConfig>;
      const packaging: Partial<AtelierConfig["packaging"]> = config.packaging ?? {};
      const next: AtelierConfig = {
        enabled: typeof config.enabled === "boolean" ? config.enabled : (current.atelierConfig?.enabled ?? true),
        categories: Array.isArray(config.categories) ? config.categories.filter((item): item is string => categories.includes(String(item))).slice(0, 5) : (current.atelierConfig?.categories ?? []),
        packaging: {
          individualVacuum: typeof packaging.individualVacuum === "boolean" ? packaging.individualVacuum : Boolean(current.atelierConfig?.packaging?.individualVacuum),
          kraft: typeof packaging.kraft === "boolean" ? packaging.kraft : Boolean(current.atelierConfig?.packaging?.kraft),
          coolerCount: Math.max(0, Math.min(5, Math.floor(Number(packaging.coolerCount ?? current.atelierConfig?.packaging?.coolerCount ?? 0)))),
        },
        detailedLabel: typeof config.detailedLabel === "boolean" ? config.detailedLabel : Boolean(current.atelierConfig?.detailedLabel),
        allergens: Array.isArray(config.allergens) ? config.allergens.filter((item): item is string => allergens.includes(String(item))).slice(0, 7) : (current.atelierConfig?.allergens ?? []),
        allergyNotes: safeString(config.allergyNotes ?? current.atelierConfig?.allergyNotes, 500),
        savedAt: new Date().toISOString(),
      };
      updates.atelierConfig = next;
    }

    if (body.security && typeof body.security === "object") {
      const security = body.security as Partial<SecuritySettings>;
      const currentSecurity = current.security;
      const methods = ["sms", "email", "app"] as const;
      const next: SecuritySettings = {
        twoFactor: typeof security.twoFactor === "boolean" ? security.twoFactor : (currentSecurity?.twoFactor ?? false),
        method: methods.includes(security.method as "sms") ? security.method as SecuritySettings["method"] : (currentSecurity?.method ?? "sms"),
        passwordUpdatedAt: safeString(security.passwordUpdatedAt ?? currentSecurity?.passwordUpdatedAt, 40) || new Date().toISOString(),
        sessions: Array.isArray(security.sessions)
          ? security.sessions.slice(0, 10).map((session, index) => ({
            id: safeString(session.id, 60) || `session-${index}`,
            label: safeString(session.label, 100),
            location: safeString(session.location, 100),
            current: Boolean(session.current),
            lastActive: safeString(session.lastActive, 40),
          }))
          : (currentSecurity?.sessions ?? []),
        recoveryGeneratedAt: security.recoveryGeneratedAt === null ? null : safeString(security.recoveryGeneratedAt ?? currentSecurity?.recoveryGeneratedAt, 40) || null,
      };
      updates.security = next;
      if (!next.twoFactor) updates.securityRevokedAt = current.securityRevokedAt;
    }

    if (body.accountState && typeof body.accountState === "object") {
      const state = body.accountState as Partial<AccountState>;
      const next: AccountState = {
        paused: typeof state.paused === "boolean" ? state.paused : Boolean(current.accountState?.paused),
        pausedAt: state.pausedAt === null ? null : safeString(state.pausedAt ?? current.accountState?.pausedAt, 40) || null,
        deletionRequestedAt: state.deletionRequestedAt === null ? null : safeString(state.deletionRequestedAt ?? current.accountState?.deletionRequestedAt, 40) || null,
      };
      updates.accountState = next;
    }

    if (Array.isArray(body.addresses)) {
      updates.addresses = (body.addresses as Address[]).slice(0, 6).map((address, index) => ({
        id: String(address.id || `address-${index + 1}`).slice(0, 40),
        label: String(address.label || "Adresse").slice(0, 60),
        recipient: String(address.recipient || "").slice(0, 100),
        line1: String(address.line1 || "").slice(0, 160),
        postalCode: String(address.postalCode || "").slice(0, 10),
        city: String(address.city || "").slice(0, 100),
        isDefault: Boolean(address.isDefault),
      }));
    }
    if (body.professional && typeof body.professional === "object") {
      const professional = Object.fromEntries(Object.entries(body.professional).map(([key, value]) => [key.slice(0, 40), String(value).slice(0, 180)]));
      if (professional.siret && !/^\d{14}$/.test(professional.siret)) return NextResponse.json({ error: "Le SIRET doit comporter exactement 14 chiffres." }, { status: 400 });
      if (professional.billingEmail && !/^\S+@\S+\.\S+$/.test(professional.billingEmail)) return NextResponse.json({ error: "L’e-mail de facturation est invalide." }, { status: 400 });
      updates.professional = professional;
    }
    if (typeof body.securityRevokedAt === "string") updates.securityRevokedAt = body.securityRevokedAt;
    if (typeof body.privacyRequestAt === "string") updates.privacyRequestAt = body.privacyRequestAt;
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Aucune préférence valide à enregistrer." }, { status: 400 });
    await db.update(settings).set(updates).where(eq(settings.id, 1));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Les préférences n’ont pas pu être enregistrées." }, { status: 500 });
  }
}

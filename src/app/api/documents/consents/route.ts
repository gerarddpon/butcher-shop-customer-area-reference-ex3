import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getPortalData } from "@/lib/portal";
import { businessConfig, customer } from "@/lib/config";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const line = (value: string) => value.replace(/[\u202f\u00a0]/g, " ").replace(/[’]/g, "'");

export async function GET() {
  const data = await getPortalData();
  const privacy = data.settings.privacy;
  const channels = data.settings.channels;
  const pdf = await PDFDocument.create();
  pdf.setTitle("Attestation de consentements · Maison Annoix");
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const burgundy = rgb(.17, .03, .07);
  const muted = rgb(.4, .36, .31);
  page.drawRectangle({ x: 0, y: 742, width: 595.28, height: 100, color: rgb(.96, .94, .88) });
  page.drawText("MAISON ANNOIX", { x: 44, y: 795, size: 25, font: bold, color: burgundy });
  page.drawText("ATTESTATION DE CONSENTEMENTS", { x: 44, y: 700, size: 18, font: bold, color: burgundy });
  page.drawText(line(`Titulaire : ${customer.name} · ${channels?.email ?? customer.email}`), { x: 44, y: 673, size: 10, font: regular });
  page.drawText(line(`Editee le ${formatDate(businessConfig.businessDate)} · Politique ${privacy?.policyVersion ?? "2026-11"}`), { x: 44, y: 656, size: 9, font: regular, color: muted });
  page.drawLine({ start: { x: 44, y: 640 }, end: { x: 551, y: 640 }, thickness: .7, color: rgb(.75, .7, .62) });
  const rows = [
    ["Suivi des commandes et retraits", "Indispensable - execution du contrat", true],
    ["Nouveautes de l'atelier et arrivages", "Consentement", Boolean(privacy?.novelties)],
    ["Offres fidelite et avantages membres", "Consentement", Boolean(privacy?.loyalty)],
    ["Invitations aux evenements", "Consentement", Boolean(privacy?.events)],
    ["Mesure d'audience anonymisee", "Consentement", Boolean(privacy?.analytics)],
    ["Personnalisation des suggestions", "Consentement", Boolean(privacy?.personalization)],
  ] as const;
  let y = 608;
  page.drawText("TRAITEMENT / COOKIE", { x: 44, y, size: 9, font: bold, color: muted });
  page.drawText("BASE LEGALE", { x: 300, y, size: 9, font: bold, color: muted });
  page.drawText("CHOIX", { x: 500, y, size: 9, font: bold, color: muted });
  y -= 12;
  page.drawLine({ start: { x: 44, y }, end: { x: 551, y }, thickness: .6, color: rgb(.8, .75, .67) });
  for (const [label, basis, accepted] of rows) {
    y -= 28;
    page.drawText(line(label), { x: 44, y, size: 9, font: regular });
    page.drawText(line(basis), { x: 300, y, size: 8, font: regular, color: muted });
    page.drawText(accepted ? "Accepte" : "Refuse", { x: 500, y, size: 9, font: bold, color: accepted ? rgb(.21, .37, .24) : rgb(.45, .18, .16) });
    page.drawLine({ start: { x: 44, y: y - 9 }, end: { x: 551, y: y - 9 }, thickness: .4, color: rgb(.87, .83, .76) });
  }
  y -= 40;
  page.drawText("REGISTRE", { x: 44, y, size: 9, font: bold, color: muted });
  y -= 20;
  page.drawText(line(`Derniere mise a jour des choix : ${privacy?.updatedAt ? formatDate(privacy.updatedAt) : "non renseignee"}`), { x: 44, y, size: 9, font: regular });
  y -= 17;
  page.drawText(line("Conservation : 3 ans apres la derniere commande pour la relation client; durees legales pour les pieces comptables et la tracabilite."), { x: 44, y, size: 8, font: regular, color: muted });
  y -= 34;
  page.drawText("Le retrait du consentement est possible a tout moment depuis votre espace client.", { x: 44, y, size: 9, font: regular });
  page.drawText(line(`${businessConfig.name} · ${businessConfig.phone} · ${businessConfig.email}`), { x: 44, y: 70, size: 8, font: regular, color: muted });
  page.drawText("Document de demonstration - aucune signature electronique qualifiee.", { x: 44, y: 52, size: 7, font: bold, color: burgundy });
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="Maison-Annoix-attestation-consentements.pdf"', "Cache-Control": "private, no-store" } });
}

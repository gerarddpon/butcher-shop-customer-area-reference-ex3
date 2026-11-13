import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getPortalData } from "@/lib/portal";
import { businessConfig, customer } from "@/lib/config";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

function safe(value: string) {
  return value.replace(/[\u202f\u00a0]/g, " ").replace(/[’]/g, "'");
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPortalData();
  const quote = data.professionalQuotes.find((entry) => entry.id === decodeURIComponent(id));
  if (!quote) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Devis ${quote.id} · Maison Annoix`);
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const burgundy = rgb(.17, .03, .07);
  const muted = rgb(.4, .36, .31);
  page.drawRectangle({ x: 0, y: 742, width: 595.28, height: 100, color: rgb(.96, .94, .88) });
  page.drawText("MAISON ANNOIX", { x: 44, y: 795, size: 25, font: bold, color: burgundy });
  page.drawText("BOUCHERIE - CHARCUTERIE - TRAITEUR", { x: 44, y: 776, size: 8, font: regular, color: muted });
  page.drawText("DEVIS PROFESSIONNEL", { x: 44, y: 706, size: 19, font: bold, color: burgundy });
  page.drawText(safe(`${quote.id} · ${quote.status}`), { x: 44, y: 685, size: 11, font: bold });
  page.drawText(safe(`${businessConfig.shop} · ${businessConfig.address}`), { x: 44, y: 663, size: 9, font: regular, color: muted });
  page.drawText(safe(`Client : ${data.settings.professional?.company || customer.name}`), { x: 44, y: 644, size: 10, font: regular });
  page.drawText(safe(`SIRET : ${data.settings.professional?.siret || "a completer"}`), { x: 44, y: 629, size: 9, font: regular });
  page.drawText(safe(`Edite le ${formatDate(businessConfig.businessDate)}`), { x: 430, y: 629, size: 9, font: regular, color: muted });
  page.drawLine({ start: { x: 44, y: 608 }, end: { x: 551, y: 608 }, thickness: .7, color: rgb(.75, .7, .62) });
  page.drawText("OBJET", { x: 44, y: 582, size: 9, font: bold, color: muted });
  page.drawText(safe(quote.subject), { x: 44, y: 558, size: 15, font: bold });
  page.drawText(safe(`${quote.headcount} convives · Evenement du ${formatDate(quote.eventDate)}`), { x: 44, y: 538, size: 10, font: regular });
  page.drawText("VOTRE BESOIN", { x: 44, y: 502, size: 9, font: bold, color: muted });
  const words = safe(quote.details).split(" ");
  let line = "";
  let y = 480;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (bold.widthOfTextAtSize(candidate, 10) > 500 && line) { page.drawText(line, { x: 44, y, size: 10, font: regular }); y -= 17; line = word; }
    else line = candidate;
  }
  if (line) { page.drawText(line, { x: 44, y, size: 10, font: regular }); y -= 17; }
  page.drawRectangle({ x: 44, y: y - 78, width: 507, height: 74, color: rgb(.9, .85, .72) });
  page.drawText("MONTANT ESTIME", { x: 60, y: y - 22, size: 9, font: bold, color: burgundy });
  page.drawText(safe(quote.totalCents > 0 ? formatMoney(quote.totalCents) : "A confirmer par l'Atelier"), { x: 60, y: y - 52, size: 21, font: bold, color: burgundy });
  page.drawText("Validite : 30 jours. Acompte de 30 % a la validation.", { x: 300, y: y - 46, size: 8, font: regular });
  page.drawText(safe(`Contact atelier : ${businessConfig.phone} · ${businessConfig.email}`), { x: 44, y: 120, size: 9, font: regular });
  page.drawText("Ce devis est emis pour la Maison Annoix. Les prix seront confirmes apres validation des quantites, du service et du transport.", { x: 44, y: 102, size: 8, font: regular, color: muted });
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="Maison-Annoix-devis-${quote.id}.pdf"`, "Cache-Control": "private, no-store" } });
}

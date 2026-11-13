import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { getPortalData } from "@/lib/portal";
import { businessConfig, customer } from "@/lib/config";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ orderId: string; type: string }> };

function safe(value: string) {
  return value.replace(/[\u202f\u00a0]/g, " ").replace(/[’]/g, "'");
}

function wrapped(page: PDFPage, text: string, options: { x: number; y: number; maxWidth: number; size: number; font: PDFFont; color?: ReturnType<typeof rgb>; lineHeight?: number }) {
  const words = safe(text).split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (options.font.widthOfTextAtSize(candidate, options.size) > options.maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  lines.forEach((content, index) => page.drawText(content, { x: options.x, y: options.y - index * (options.lineHeight ?? options.size * 1.3), size: options.size, font: options.font, color: options.color ?? rgb(.14, .1, .08) }));
  return options.y - lines.length * (options.lineHeight ?? options.size * 1.3);
}

export async function GET(_request: Request, context: Context) {
  const { orderId, type } = await context.params;
  if (!["commande", "facture"].includes(type) && !type.startsWith("avoir-")) return NextResponse.json({ error: "Document inconnu." }, { status: 404 });
  const data = await getPortalData();
  const order = data.orders.find((item) => item.id === orderId);
  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  const claim = type.startsWith("avoir-") ? data.claims.find((item) => item.id === type.replace("avoir-", "")) : undefined;
  if (type.startsWith("avoir-") && !claim) return NextResponse.json({ error: "Avoir introuvable." }, { status: 404 });

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${type} ${order.id} · Maison Annoix`);
  pdf.setAuthor("Maison Annoix");
  pdf.setSubject("Document client généré par l’espace Maison Annoix");
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const burgundy = rgb(.17, .03, .07);
  const muted = rgb(.4, .36, .31);
  page.drawRectangle({ x: 0, y: 750, width: 595.28, height: 92, color: rgb(.96, .94, .88) });
  page.drawText("MAISON ANNOIX", { x: 44, y: 795, size: 24, font: bold, color: burgundy });
  page.drawText("BOUCHERIE DE CARACTERE · SANNOIS", { x: 44, y: 776, size: 8, font: regular, color: muted });
  const title = claim ? `AVOIR ${claim.id}` : type === "facture" ? `FACTURE D'ACOMPTE ${order.id}` : `BON DE COMMANDE ${order.id}`;
  page.drawText(safe(title), { x: 44, y: 716, size: 19, font: bold, color: burgundy });
  page.drawText(safe(`${businessConfig.shop} · ${businessConfig.address}`), { x: 44, y: 692, size: 9, font: regular, color: muted });
  page.drawText(safe(`${customer.name} · ${customer.email}`), { x: 44, y: 675, size: 10, font: regular });
  page.drawText(safe(`Document edite le ${formatDate(businessConfig.businessDate)}`), { x: 390, y: 675, size: 9, font: regular, color: muted });

  let y = 638;
  if (claim) {
    page.drawText("DETAIL DE LA RESOLUTION", { x: 44, y, size: 10, font: bold, color: burgundy }); y -= 26;
    y = wrapped(page, `Commande : ${order.id} · Produit : ${claim.item.product.name} (${claim.item.quantityLabel})`, { x: 44, y, maxWidth: 505, size: 10, font: regular }); y -= 8;
    y = wrapped(page, `Lot : ${claim.item.lot} · Motif : ${claim.motif}`, { x: 44, y, maxWidth: 505, size: 10, font: regular }); y -= 8;
    y = wrapped(page, `Resolution : ${claim.resolution}`, { x: 44, y, maxWidth: 505, size: 10, font: regular }); y -= 18;
    page.drawRectangle({ x: 44, y: y - 62, width: 507, height: 76, color: rgb(.9, .85, .72) });
    page.drawText("MONTANT DE L'AVOIR", { x: 60, y: y - 9, size: 9, font: bold, color: burgundy });
    page.drawText(safe(formatMoney(claim.creditCents)), { x: 60, y: y - 42, size: 27, font: bold, color: burgundy });
    const expiry = new Date(`${claim.updatedAt.slice(0, 10)}T12:00:00Z`); expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);
    page.drawText(safe(`Valable jusqu'au ${formatDate(expiry.toISOString())}`), { x: 340, y: y - 38, size: 10, font: regular });
    y -= 102;
    y = wrapped(page, "Cet avoir est utilisable en boutique ou lors d'une prochaine commande, dans la limite du solde disponible. Il n'est ni echangeable ni remboursable en especes.", { x: 44, y, maxWidth: 505, size: 9, font: regular, color: muted });
  } else {
    page.drawText("ARTICLE", { x: 44, y, size: 9, font: bold, color: burgundy });
    page.drawText("LOT / DLC", { x: 315, y, size: 9, font: bold, color: burgundy });
    page.drawText("TOTAL TTC", { x: 485, y, size: 9, font: bold, color: burgundy }); y -= 12;
    page.drawLine({ start: { x: 44, y }, end: { x: 551, y }, thickness: .7, color: rgb(.75, .7, .62) }); y -= 20;
    for (const item of order.items) {
      page.drawText(safe(`${item.product.name} · ${item.quantityLabel}`), { x: 44, y, size: 10, font: bold });
      page.drawText(safe(formatMoney(item.totalCents)), { x: 485, y, size: 10, font: regular }); y -= 16;
      page.drawText(safe(item.product.origin), { x: 44, y, size: 8, font: regular, color: muted });
      page.drawText(safe(`${item.lot} · ${formatDate(item.dlc)}`), { x: 315, y, size: 8, font: regular, color: muted }); y -= 25;
    }
    y -= 4;
    page.drawLine({ start: { x: 310, y }, end: { x: 551, y }, thickness: .7, color: rgb(.75, .7, .62) }); y -= 24;
    const totals = [["Total TTC", order.totalCents], ["Dont TVA (5,5 %)", order.tvaCents], ["Acompte", -order.depositCents], ["Solde", order.balanceCents]] as const;
    for (const [label, amount] of totals) { page.drawText(safe(label), { x: 340, y, size: 10, font: label === "Solde" ? bold : regular }); page.drawText(safe(formatMoney(amount)), { x: 485, y, size: 10, font: label === "Solde" ? bold : regular }); y -= 20; }
    y -= 20;
    y = wrapped(page, `${order.fulfillment} : ${formatDate(order.slotDate)} · ${order.slotLabel}. Code retrait : ${order.pickupCode}.`, { x: 44, y, maxWidth: 505, size: 10, font: bold }); y -= 8;
    y = wrapped(page, `Conservation : 0 °C a +4 °C. Vos preferences : ${order.note || "aucune indication complementaire"}.`, { x: 44, y, maxWidth: 505, size: 9, font: regular, color: muted });
  }

  page.drawLine({ start: { x: 44, y: 95 }, end: { x: 551, y: 95 }, thickness: .6, color: rgb(.75, .7, .62) });
  wrapped(page, `${businessConfig.name} · ${businessConfig.phone} · ${businessConfig.email}. Les donnees de lot et de poids reproduites sont celles enregistrees par l'Atelier.`, { x: 44, y: 78, maxWidth: 505, size: 8, font: regular, color: muted });
  if (businessConfig.paymentMode === "mock") page.drawText("ENVIRONNEMENT DE DEMONSTRATION · AUCUNE TRANSACTION BANCAIRE REELLE", { x: 44, y: 38, size: 7, font: bold, color: burgundy });
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Maison-Annoix-${type}-${orderId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

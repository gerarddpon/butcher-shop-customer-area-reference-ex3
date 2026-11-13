import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  professionalQuotes,
  cartItems,
  claimMessages,
  claims,
  loyaltyEntries,
  orderItems,
  orderMessages,
  orders,
  products,
  reviews,
  settings,
  subscriptions,
  vouchers,
} from "@/db/schema";

const giftCardProduct = {
  id: "carte-cadeau",
  name: "Carte-cadeau Maison Annoix",
  category: "Cadeaux",
  description: "Une carte de 50 € à offrir, présentée dans une pochette kraft et valable un an sur tout le comptoir.",
  image: "/images/carte-cadeau.jpg",
  priceCents: 5000,
  unit: "pièce",
  origin: "Maison Annoix · Sannois",
  conservation: "Sans conservation alimentaire",
  allergens: "Aucun",
  preparation: "Activez la carte au comptoir ou dans la cagnotte avec son code unique.",
};

const productSeed = [
  giftCardProduct,
  {
    id: "cote-boeuf",
    name: "Côte de bœuf maturée",
    category: "Bœuf",
    description: "Race limousine, maturation 28 jours sur carcasse, découpe sur os au couteau.",
    image: "/images/cote-boeuf.jpg",
    priceCents: 5786,
    unit: "kg",
    origin: "France · Val-d’Oise",
    conservation: "0 °C à +4 °C",
    allergens: "Aucun",
    preparation: "Sortez la viande de son emballage sous vide 30 min avant cuisson. Saisissez 3 min par face puis laissez reposer.",
  },
  {
    id: "merguez",
    name: "Merguez maison",
    category: "Grillades",
    description: "Bœuf et agneau hachés au couteau, paprika doux, harissa maison et boyau naturel.",
    image: "/images/merguez.jpg",
    priceCents: 2796,
    unit: "kg",
    origin: "France · Val-d’Oise",
    conservation: "0 °C à +4 °C",
    allergens: "Aucun",
    preparation: "Grillez à feu moyen 8 à 10 minutes sans piquer les boyaux, sur braise ou à la plancha.",
  },
  {
    id: "roti-veau",
    name: "Rôti de veau fermier ficelé",
    category: "Veau",
    description: "Noix de veau fermier parée et ficelée au lin, prête à rôtir.",
    image: "/images/roti-veau.jpg",
    priceCents: 3776,
    unit: "kg",
    origin: "France · Corrèze",
    conservation: "0 °C à +4 °C",
    allergens: "Aucun",
    preparation: "Colorez sur toutes les faces puis cuisez à 160 °C, 25 minutes pour 500 g. Cœur à 58 °C.",
  },
  {
    id: "magret-canard",
    name: "Magret de canard du Sud-Ouest",
    category: "Volaille",
    description: "Magret fermier IGP Sud-Ouest, peau quadrillée à la demande.",
    image: "/images/magret-canard.jpg",
    priceCents: 2490,
    unit: "pièce",
    origin: "France · Gers",
    conservation: "0 °C à +4 °C",
    allergens: "Aucun",
    preparation: "Démarrez côté peau à froid 7 minutes, retournez 3 minutes et laissez reposer 5 minutes.",
  },
  {
    id: "poulet-fermier",
    name: "Poulet fermier Label Rouge",
    category: "Volaille",
    description: "Poulet jaune élevé en plein air 81 jours minimum, découpé selon vos indications.",
    image: "/images/roti-veau.jpg",
    priceCents: 1890,
    unit: "kg",
    origin: "France · Landes",
    conservation: "0 °C à +4 °C",
    allergens: "Aucun",
    preparation: "Cuisez à 180 °C environ 20 minutes pour 500 g, jusqu’à 72 °C à cœur.",
  },
  {
    id: "cote-agneau",
    name: "Côtelettes d’agneau de lait",
    category: "Agneau",
    description: "Côtelettes premières parées, persillade maison proposée en option.",
    image: "/images/cote-boeuf.jpg",
    priceCents: 4200,
    unit: "kg",
    origin: "France · Aveyron",
    conservation: "0 °C à +4 °C",
    allergens: "Sulfites si persillade",
    preparation: "Saisissez 2 minutes par face à la poêle bien chaude. Servez rosé.",
  },
  {
    id: "boeuf-hache",
    name: "Steak haché au couteau 5 %",
    category: "Bœuf",
    description: "Rumsteck haché au couteau à la commande, jamais pré-haché.",
    image: "/images/cote-boeuf.jpg",
    priceCents: 1980,
    unit: "kg",
    origin: "France · Normandie",
    conservation: "0 °C à +4 °C · 24 h",
    allergens: "Aucun",
    preparation: "Assaisonnez au moment de cuire. Saisissez 1 minute 30 par face pour une cuisson saignante.",
  },
  {
    id: "saucisson",
    name: "Saucisson sec de l’Atelier",
    category: "Charcuterie",
    description: "Porc fermier, boyau naturel et affinage lent de six semaines.",
    image: "/images/merguez.jpg",
    priceCents: 1250,
    unit: "pièce",
    origin: "France · Auvergne",
    conservation: "À température ambiante, au sec",
    allergens: "Aucun",
    preparation: "Retirez la peau et coupez en tranches fines à température ambiante.",
  },
];

const orderSeed = [
  { id: "CMD-2483", status: "En préparation", placedAt: "2026-10-11", fulfillment: "Retrait", shop: "Boutique de Sannois", slotDate: "2026-10-31", slotLabel: "10h00 – 10h30", totalCents: 9180, depositCents: 4000, tvaCents: 479, balanceCents: 5180, pickupCode: "MA-2483-SVU", paymentStatus: "Acompte versé", note: "Ficelage traditionnel, sans gras superflu." },
  { id: "CMD-2452", status: "Confirmée", placedAt: "2026-10-26", fulfillment: "Retrait", shop: "Boutique de Sannois", slotDate: "2026-11-19", slotLabel: "10h00 – 10h30", totalCents: 7626, depositCents: 2301, tvaCents: 398, balanceCents: 5325, pickupCode: "MA-2452-56M", paymentStatus: "Acompte versé", note: "Côte épaisse de 25 mm, merguez en barquettes séparées." },
  { id: "CMD-2449", status: "Pesée", placedAt: "2026-10-25", fulfillment: "Retrait", shop: "Boutique de Sannois", slotDate: "2026-11-21", slotLabel: "17h00 – 17h30", totalCents: 7659, depositCents: 2300, tvaCents: 400, balanceCents: 5359, pickupCode: "MA-2449-2KL", paymentStatus: "Acompte versé", note: "Appeler si le poids de la côte dépasse 1,1 kg." },
  { id: "CMD-9003", status: "Livrée", placedAt: "2026-11-01", fulfillment: "Livraison", shop: "Boutique de Sannois", slotDate: "2026-11-01", slotLabel: "14h00 – 18h00", totalCents: 6339, depositCents: 6339, tvaCents: 331, balanceCents: 0, pickupCode: "MA-9003-LIV", paymentStatus: "Réglée", note: "Livraison en bac isotherme consigné." },
  { id: "CMD-9001", status: "Retirée", placedAt: "2026-10-28", fulfillment: "Retrait", shop: "Boutique de Sannois", slotDate: "2026-10-31", slotLabel: "09h30 – 10h00", totalCents: 9836, depositCents: 9836, tvaCents: 514, balanceCents: 0, pickupCode: "MA-9001-RT", paymentStatus: "Réglée", note: "Carte-cadeau dans une pochette kraft." },
  { id: "CMD-2446", status: "Retirée", placedAt: "2026-10-24", fulfillment: "Retrait", shop: "Boutique de Sannois", slotDate: "2026-10-26", slotLabel: "10h00 – 10h30", totalCents: 3776, depositCents: 0, tvaCents: 197, balanceCents: 3776, pickupCode: "MA-2446-VF", paymentStatus: "À régler au comptoir", note: "Rôti ficelé, cuisson rosée." },
  { id: "CMD-8492", status: "Retirée", placedAt: "2026-09-12", fulfillment: "Retrait", shop: "Boutique de Sannois", slotDate: "2026-09-12", slotLabel: "11h00 – 11h30", totalCents: 9200, depositCents: 9200, tvaCents: 481, balanceCents: 0, pickupCode: "MA-8492-QS", paymentStatus: "Réglée", note: "" },
  { id: "CMD-8445", status: "Retirée", placedAt: "2026-09-05", fulfillment: "Retrait", shop: "Boutique de Sannois", slotDate: "2026-09-05", slotLabel: "16h00 – 16h30", totalCents: 4800, depositCents: 4800, tvaCents: 251, balanceCents: 0, pickupCode: "MA-8445-PM", paymentStatus: "Réglée", note: "" },
];

const itemSeed = [
  { key: "2483-cote", orderId: "CMD-2483", productId: "cote-boeuf", quantityLabel: "1,2 kg", grams: 1200, unitPriceCents: 5786, totalCents: 6943, lot: "900050007", dlc: "2026-10-31", notes: "25 mm, parée et ficelée" },
  { key: "2483-merguez", orderId: "CMD-2483", productId: "merguez", quantityLabel: "800 g", grams: 800, unitPriceCents: 2796, totalCents: 2237, lot: "800125078", dlc: "2026-11-02", notes: "12 pièces environ" },
  { key: "2452-cote", orderId: "CMD-2452", productId: "cote-boeuf", quantityLabel: "1 kg", grams: 1000, unitPriceCents: 5786, totalCents: 5786, lot: "900051102", dlc: "2026-11-21", notes: "Épaisseur 25 mm" },
  { key: "2452-merguez", orderId: "CMD-2452", productId: "merguez", quantityLabel: "658 g", grams: 658, unitPriceCents: 2796, totalCents: 1840, lot: "800126011", dlc: "2026-11-22", notes: "Barquette séparée" },
  { key: "2449-cote", orderId: "CMD-2449", productId: "cote-boeuf", quantityLabel: "1 kg", grams: 1000, unitPriceCents: 5786, totalCents: 5786, lot: "900051118", dlc: "2026-11-23", notes: "Poids confirmé à la pesée" },
  { key: "2449-merguez", orderId: "CMD-2449", productId: "merguez", quantityLabel: "670 g", grams: 670, unitPriceCents: 2796, totalCents: 1873, lot: "800126023", dlc: "2026-11-24", notes: "Nature" },
  { key: "9003-roti", orderId: "CMD-9003", productId: "roti-veau", quantityLabel: "450 g", grams: 450, unitPriceCents: 3776, totalCents: 1699, lot: "600040122", dlc: "2026-11-04", notes: "Ficelé au lin" },
  { key: "9003-merguez", orderId: "CMD-9003", productId: "merguez", quantityLabel: "600 g", grams: 600, unitPriceCents: 2796, totalCents: 1678, lot: "800125041", dlc: "2026-11-04", notes: "9 pièces" },
  { key: "9003-magret", orderId: "CMD-9003", productId: "magret-canard", quantityLabel: "1 pièce · 410 g", grams: 410, unitPriceCents: 2962, totalCents: 2962, lot: "300081116", dlc: "2026-11-06", notes: "Peau quadrillée" },
  { key: "9001-carte", orderId: "CMD-9001", productId: "carte-cadeau", quantityLabel: "Carte-cadeau Maison Annoix · 50 €", grams: 0, unitPriceCents: 5000, totalCents: 5000, lot: "CC-2026-4418", dlc: "2027-12-12", notes: "Pochette cadeau kraft" },
  { key: "9001-cote", orderId: "CMD-9001", productId: "cote-boeuf", quantityLabel: "836 g", grams: 836, unitPriceCents: 5786, totalCents: 4836, lot: "900049882", dlc: "2026-11-02", notes: "Maturation 28 jours" },
  { key: "2446-roti", orderId: "CMD-2446", productId: "roti-veau", quantityLabel: "1 kg", grams: 1000, unitPriceCents: 3776, totalCents: 3776, lot: "600039918", dlc: "2026-10-29", notes: "Sans gras, ficelé" },
  { key: "8492-cote", orderId: "CMD-8492", productId: "cote-boeuf", quantityLabel: "950 g", grams: 950, unitPriceCents: 5786, totalCents: 5500, lot: "900047120", dlc: "2026-09-15", notes: "Cuisson bleue" },
  { key: "8492-magret", orderId: "CMD-8492", productId: "magret-canard", quantityLabel: "1 pièce", grams: 400, unitPriceCents: 2490, totalCents: 2490, lot: "300079910", dlc: "2026-09-17", notes: "Entier" },
  { key: "8492-saucisson", orderId: "CMD-8492", productId: "saucisson", quantityLabel: "1 pièce", grams: 250, unitPriceCents: 1210, totalCents: 1210, lot: "200061183", dlc: "2026-12-12", notes: "Tranché sur place" },
  { key: "8445-merguez", orderId: "CMD-8445", productId: "merguez", quantityLabel: "823 g", grams: 823, unitPriceCents: 2796, totalCents: 2300, lot: "800121090", dlc: "2026-09-08", notes: "12 pièces" },
  { key: "8445-poulet", orderId: "CMD-8445", productId: "poulet-fermier", quantityLabel: "1,323 kg", grams: 1323, unitPriceCents: 1890, totalCents: 2500, lot: "300070012", dlc: "2026-09-09", notes: "Découpé en 8 morceaux" },
];

const claimSeed = [
  { id: "SAV-2026-042", orderId: "CMD-2483", orderItemKey: "2483-merguez", motif: "Problème fraîcheur", description: "Bonjour, les merguez reçues présentaient une odeur anormale à l’ouverture malgré une chaîne du froid respectée. Je joins une photo et conserve l’étiquette du lot.", quantity: "800 g", status: "En cours d’analyse", resolution: "Avoir de 15,00 € proposé", creditCents: 1500, createdAt: "2026-11-02T09:14:00.000Z", updatedAt: "2026-11-02T16:42:00.000Z", photos: [{ name: "photo_merguez.jpg", type: "image/jpeg", size: 248032, dataUrl: "/images/merguez.jpg" }] },
  { id: "SAV-2026-043", orderId: "CMD-2449", orderItemKey: "2449-merguez", motif: "Article manquant", description: "La seconde barquette de merguez indiquée sur le bon de préparation ne figurait pas dans le sac au retour à la maison.", quantity: "1 barquette", status: "Dossier reçu", resolution: "Vérification du bon de pesée", creditCents: 0, createdAt: "2026-11-04T11:20:00.000Z", updatedAt: "2026-11-04T11:20:00.000Z", photos: [] },
  { id: "SAV-2026-041", orderId: "CMD-9003", orderItemKey: "9003-merguez", motif: "Poids incorrect", description: "Le poids net mesuré était inférieur à celui reporté sur l’étiquette de la barquette.", quantity: "600 g", status: "Résolu · Avoir émis", resolution: "Avoir crédité dans la cagnotte", creditCents: 1500, createdAt: "2026-10-28T10:00:00.000Z", updatedAt: "2026-10-29T15:30:00.000Z", photos: [] },
  { id: "SAV-2026-040", orderId: "CMD-9001", orderItemKey: "9001-cote", motif: "Erreur de découpe", description: "La côte était plus fine que l’épaisseur de 25 mm demandée dans les préférences d’atelier.", quantity: "836 g", status: "Résolu · Geste commercial", resolution: "Bon d’achat de 8,50 €", creditCents: 850, createdAt: "2026-10-24T12:00:00.000Z", updatedAt: "2026-10-25T09:00:00.000Z", photos: [] },
  { id: "SAV-2026-039", orderId: "CMD-9003", orderItemKey: "9003-magret", motif: "Problème conditionnement", description: "L’emballage sous vide était percé à la livraison. Le produit a été consommé immédiatement après accord de la boutique.", quantity: "1 pièce", status: "Résolu · Avoir émis", resolution: "Avoir de 12,00 € utilisé", creditCents: 1200, createdAt: "2026-10-18T14:00:00.000Z", updatedAt: "2026-10-20T10:00:00.000Z", photos: [] },
  { id: "SAV-2026-038", orderId: "CMD-2446", orderItemKey: "2446-roti", motif: "Autre", description: "Question sur le temps de cuisson et la température à cœur du rôti ficelé.", quantity: "1 kg", status: "Résolu · Conseil atelier", resolution: "Conseils de cuisson transmis", creditCents: 0, createdAt: "2026-10-12T09:00:00.000Z", updatedAt: "2026-10-12T11:30:00.000Z", photos: [] },
  { id: "SAV-2026-037", orderId: "CMD-8445", orderItemKey: "8445-poulet", motif: "Article manquant", description: "Deux morceaux de la découpe en huit ne figuraient pas dans la barquette.", quantity: "2 morceaux", status: "Résolu · Avoir émis", resolution: "Avoir de 6,50 € utilisé", creditCents: 650, createdAt: "2026-09-08T16:00:00.000Z", updatedAt: "2026-09-09T10:00:00.000Z", photos: [] },
];

const messageSeed = [
  { claimId: "SAV-2026-042", author: "client", body: "Bonjour, je vous signale un problème de fraîcheur sur les merguez de cette commande. L’odeur était anormale dès l’ouverture de la barquette.", attachment: "photo_merguez.jpg", createdAt: "2026-11-02T09:14:00.000Z" },
  { claimId: "SAV-2026-042", author: "atelier", body: "Bonjour Marie, notre équipe qualité a bien reçu votre demande. Nous contrôlons le lot 800125078, les températures de préparation et le registre de fraîcheur. Merci d’avoir conservé l’étiquette.", attachment: null, createdAt: "2026-11-02T10:06:00.000Z" },
  { claimId: "SAV-2026-042", author: "client", body: "Merci pour votre retour. J’ai gardé la barquette et son étiquette au frais, ainsi qu’une seconde photo de la DLC si nécessaire.", attachment: null, createdAt: "2026-11-02T12:28:00.000Z" },
  { claimId: "SAV-2026-042", author: "atelier", body: "Bonjour Marie, l’analyse du lot confirme un défaut de conditionnement isolé sur cette barquette. Un avoir de 15,00 € vous est proposé, valable douze mois. La réclamation reste ouverte jusqu’à votre validation.", attachment: null, createdAt: "2026-11-02T16:42:00.000Z" },
  { claimId: "SAV-2026-043", author: "client", body: "Bonjour, il manque une barquette dans ma commande. Pouvez-vous vérifier le bon de pesée ?", attachment: null, createdAt: "2026-11-04T11:20:00.000Z" },
  { claimId: "SAV-2026-041", author: "atelier", body: "Après vérification de la balance connectée, nous confirmons l’écart. L’avoir de 15,00 € est disponible dans votre cagnotte.", attachment: null, createdAt: "2026-10-29T15:30:00.000Z" },
];

const reviewSeed = [
  { orderItemKey: "9001-cote", rating: 5, criteria: ["Découpe parfaite", "Tendreté exceptionnelle"], comment: "La pièce était parfaite, la maturation idéale pour la cuisson. Un régal !", anonymous: false, publishedAt: "2026-11-01", atelierReply: "Merci Marie, ravi que la découpe vous ait plu !", replyDate: "2026-11-01" },
  { orderItemKey: "2446-roti", rating: 4, criteria: ["Préférences respectées"], comment: "Respect des préférences, cuisson parfaite. Le ficelage était impeccable.", anonymous: false, publishedAt: "2026-10-28", atelierReply: null, replyDate: null },
  { orderItemKey: "9003-merguez", rating: 5, criteria: ["Fraîcheur & conservation", "Conseils de cuisson"], comment: "Fraîcheur et conservation impeccable. Super pour le barbecue !", anonymous: false, publishedAt: "2026-11-03", atelierReply: null, replyDate: null },
  { orderItemKey: "8492-magret", rating: 5, criteria: ["Qualité de la découpe", "Tendreté / Maturation"], comment: "Un magret généreux, très tendre après quelques minutes de repos. Le quadrillage était très régulier.", anonymous: false, publishedAt: "2026-09-14", atelierReply: "Merci pour ce retour précis, à très vite au comptoir.", replyDate: "2026-09-15" },
  { orderItemKey: "8445-poulet", rating: 5, criteria: ["Préférences respectées", "Conditionnement"], comment: "La découpe en huit était exactement comme demandée et chaque morceau bien présenté.", anonymous: true, publishedAt: "2026-09-07", atelierReply: null, replyDate: null },
  { orderItemKey: "8492-saucisson", rating: 5, criteria: ["Conseils de cuisson", "Conditionnement"], comment: "Affinage parfait, ni trop sec ni trop gras. Les tranches fines se sont très bien conservées.", anonymous: false, publishedAt: "2026-09-20", atelierReply: null, replyDate: null },
];

let seedPromise: Promise<void> | null = null;

async function runSeed() {
  const existing = await db.select({ id: products.id }).from(products).limit(1);
  if (existing.length > 0) {
    await db.insert(products).values(giftCardProduct).onConflictDoNothing();
    await db.update(orderItems).set({ productId: "carte-cadeau" }).where(eq(orderItems.key, "9001-carte"));
    return;
  }

  await db.transaction(async (tx) => {
    await tx.insert(products).values(productSeed).onConflictDoNothing();
    await tx.insert(orders).values(orderSeed).onConflictDoNothing();
    await tx.insert(orderItems).values(itemSeed).onConflictDoNothing();
    await tx.insert(claims).values(claimSeed).onConflictDoNothing();
    await tx.insert(claimMessages).values(messageSeed).onConflictDoNothing();
    await tx.insert(reviews).values(reviewSeed).onConflictDoNothing();
    await tx.insert(loyaltyEntries).values([
      { entryKey: "order-8492", label: "Gagnés · Commande CMD-8492", kind: "order", points: 92, occurredAt: "2026-09-12", orderId: "CMD-8492" },
      { entryKey: "order-8445", label: "Gagnés · Commande CMD-8445", kind: "order", points: 48, occurredAt: "2026-09-05", orderId: "CMD-8445" },
      { entryKey: "order-9003", label: "Gagnés · Commande CMD-9003", kind: "order", points: 110, occurredAt: "2026-11-01", orderId: "CMD-9003" },
      { entryKey: "convert-2449", label: "Convertis · Bon d’achat 10 €", kind: "conversion", points: -100, occurredAt: "2026-11-15", orderId: null },
      { entryKey: "gift-4418", label: "Gagnés · Carte-cadeau activée", kind: "gift", points: 80, occurredAt: "2026-11-16", orderId: null },
      { entryKey: "reviews-autumn", label: "Gagnés · 6 avis vérifiés publiés", kind: "review", points: 90, occurredAt: "2026-11-03", orderId: null },
    ]).onConflictDoNothing();
    await tx.insert(vouchers).values([
      { id: "CC-2026-4418", label: "Carte-cadeau 50 €", kind: "Carte-cadeau", valueCents: 5000, expiresAt: "2027-12-12", status: "Actif" },
      { id: "BD-10-2449", label: "Bon d’achat 10 €", kind: "Bon d’achat", valueCents: 1000, expiresAt: "2027-01-01", status: "Actif" },
      { id: "AV-2026-041", label: "Avoir fraîcheur · SAV-2026-041", kind: "Avoir", valueCents: 1500, expiresAt: "2027-10-29", status: "Actif" },
      { id: "AV-2026-039", label: "Avoir conditionnement · SAV-2026-039", kind: "Avoir", valueCents: 1200, expiresAt: "2027-10-20", status: "Utilisé" },
      { id: "CONSIGNE-BAC-01", label: "Consigne bac isotherme", kind: "Consigne", valueCents: 500, expiresAt: "2027-11-01", status: "À restituer" },
    ]).onConflictDoNothing();
    await tx.insert(subscriptions).values([
      { id: "ABO-JEUDI", name: "Le panier du jeudi", cadence: "Toutes les 2 semaines", nextDate: "2026-11-19", amountCents: 2490, status: "Actif", description: "1 rôti de saison, 500 g de haché au couteau, 6 merguez et la recette de l’Atelier. Composition confirmée 48 h avant chaque retrait." },
      { id: "ABO-GRILLADES", name: "Grillades du dimanche", cadence: "Mensuel · été uniquement", nextDate: "2027-05-09", amountCents: 3290, status: "En pause", description: "Une sélection de grillades pour quatre personnes, marinades et condiments de saison compris." },
    ]).onConflictDoNothing();
    await tx.insert(settings).values({
      id: 1,
      comfort: false,
      applyPoints: false,
      atelierPreferences: ["Haché menu au couteau · jamais pré-haché", "Éviter les préparations avec crème", "Côte de bœuf · tranches de 25 mm pour le gril", "Rôti · paré, ficelé, salé au point à fond", "Volaille · sans gras, désossée sur demande, sous-vide"],
      notificationPrefs: { readySms: true, readyEmail: true, reminderSms: true, reminderEmail: true, creditsEmail: true, newsletter: false, claimReply: true, loyalty: true },
      channels: { phone: "06 12 34 56 78", email: "marie.dupont@email.fr" },
      privacy: { orderUpdates: true, novelties: true, loyalty: true, events: false, analytics: false, personalization: false, updatedAt: "2026-11-13T10:00:00.000Z", policyVersion: "2026-11" },
      atelierConfig: {
        enabled: true,
        categories: ["Steaks", "Rôtis", "Ficelé", "Hachés"],
        packaging: { individualVacuum: true, kraft: true, coolerCount: 1 },
        detailedLabel: true,
        allergens: ["Gluten", "Sulfites", "Porc", "Sans épices fortes"],
        allergyNotes: "Éviter les préparations avec crème et les traces de fruits à coque.",
        savedAt: "2026-11-13T10:00:00.000Z",
      },
      security: {
        twoFactor: false,
        method: "sms",
        passwordUpdatedAt: "2026-07-29T09:00:00.000Z",
        sessions: [
          { id: "current", label: "Chrome sur Windows", location: "Sannois, France", current: true, lastActive: "2026-10-29T08:35:00.000Z" },
          { id: "iphone", label: "iPhone de Marie", location: "Paris, France", current: false, lastActive: "2026-10-28T19:20:00.000Z" },
          { id: "mac", label: "Safari sur macOS", location: "Bordeaux, France", current: false, lastActive: "2026-10-20T16:05:00.000Z" },
        ],
        recoveryGeneratedAt: null,
      },
      accountState: { paused: false, pausedAt: null, deletionRequestedAt: null },
      favoriteProductIds: ["cote-boeuf", "merguez"],
      addresses: [
        { id: "home", label: "Maison", recipient: "Marie Dupont", line1: "18 rue des Lilas", postalCode: "95110", city: "Sannois", isDefault: true },
        { id: "office", label: "Bureau", recipient: "Marie Dupont", line1: "42 avenue de la République", postalCode: "75011", city: "Paris", isDefault: false },
      ],
      professional: { enabled: "false", company: "", siret: "", vat: "", billingEmail: "marie.dupont@email.fr" },
    }).onConflictDoNothing();
    await tx.insert(professionalQuotes).values([
      { id: "DEV-2026-08", subject: "Buffet entreprise · 45 personnes", details: "Planches de charcuterie, deux rôtis froids, merguez et accompagnements de saison. Livraison sur site et vaisselle compostable.", headcount: 45, eventDate: "2026-12-12", status: "En attente de validation", totalCents: 67500, createdAt: "2026-10-22" },
    ]).onConflictDoNothing();
    await tx.insert(orderMessages).values([
      { orderId: "CMD-2452", author: "atelier", body: "Votre côte est réservée dans notre cave de maturation. Nous la découperons à 25 mm le matin du retrait.", createdAt: "2026-11-15T09:30:00.000Z" },
    ]).onConflictDoNothing();
  });
}

async function backfillAccountSettings() {
  await db.update(settings).set({
    notificationPrefs: { readySms: true, readyEmail: true, reminderSms: true, reminderEmail: true, creditsEmail: true, newsletter: false, claimReply: true, loyalty: true },
  }).where(and(eq(settings.id, 1), isNull(settings.notificationPrefs)));
  await db.update(settings).set({ channels: { phone: "06 12 34 56 78", email: "marie.dupont@email.fr" } })
    .where(and(eq(settings.id, 1), isNull(settings.channels)));
  await db.update(settings).set({
    privacy: { orderUpdates: true, novelties: true, loyalty: true, events: false, analytics: false, personalization: false, updatedAt: "2026-11-13T10:00:00.000Z", policyVersion: "2026-11" },
  }).where(and(eq(settings.id, 1), isNull(settings.privacy)));
  await db.update(settings).set({
    atelierConfig: {
      enabled: true,
      categories: ["Steaks", "Rôtis", "Ficelé", "Hachés"],
      packaging: { individualVacuum: true, kraft: true, coolerCount: 1 },
      detailedLabel: true,
      allergens: ["Gluten", "Sulfites", "Porc", "Sans épices fortes"],
      allergyNotes: "Éviter les préparations avec crème et les traces de fruits à coque.",
      savedAt: "2026-11-13T10:00:00.000Z",
    },
  }).where(and(eq(settings.id, 1), isNull(settings.atelierConfig)));
  await db.update(settings).set({
    security: {
      twoFactor: false,
      method: "sms",
      passwordUpdatedAt: "2026-07-29T09:00:00.000Z",
      sessions: [
        { id: "current", label: "Chrome sur Windows", location: "Sannois, France", current: true, lastActive: "2026-10-29T08:35:00.000Z" },
        { id: "iphone", label: "iPhone de Marie", location: "Paris, France", current: false, lastActive: "2026-10-28T19:20:00.000Z" },
        { id: "mac", label: "Safari sur macOS", location: "Bordeaux, France", current: false, lastActive: "2026-10-20T16:05:00.000Z" },
      ],
      recoveryGeneratedAt: null,
    },
  }).where(and(eq(settings.id, 1), isNull(settings.security)));
  await db.update(settings).set({ accountState: { paused: false, pausedAt: null, deletionRequestedAt: null } })
    .where(and(eq(settings.id, 1), isNull(settings.accountState)));
  await db.insert(professionalQuotes).values([
    { id: "DEV-2026-08", subject: "Buffet entreprise · 45 personnes", details: "Planches de charcuterie, deux rôtis froids, merguez et accompagnements de saison. Livraison sur site et vaisselle compostable.", headcount: 45, eventDate: "2026-12-12", status: "En attente de validation", totalCents: 67500, createdAt: "2026-10-22" },
  ]).onConflictDoNothing();
}

export async function ensureSeed() {
  if (!seedPromise) {
    seedPromise = runSeed()
      .then(backfillAccountSettings)
      .catch((error) => {
        seedPromise = null;
        throw error;
      });
  }
  return seedPromise;
}

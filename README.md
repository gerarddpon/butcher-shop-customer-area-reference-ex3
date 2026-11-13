# Maison Annoix · Espace client

Portail fullstack Next.js / PostgreSQL pour une boucherie française : commandes au poids, retraits QR, traçabilité des lots, SAV avec photos, avoirs PDF, avis vérifiés et fidélité.

## Centre de compte

- **Notifications** : SMS et e-mail distincts pour commande prête, rappel de créneau, avoirs et actualités ; coordonnées de réception validées et persistées.
- **Atelier** : consignes de découpe structurées par morceau, épaisseur et finition ; conditionnement, bac isotherme, étiquetage et restrictions alimentaires.
- **Sécurité** : identifiants, double authentification, codes de récupération, sessions, export JSON, pause et demande de clôture protégée.
- **Vie privée** : consentements horodatés, cookies facultatifs, refus global et attestation PDF.
- **Professionnel** : identité juridique B2B, avantages traiteur et demandes de devis enregistrées avec PDF.
- **Commandes** : message atelier avec sujets et pièce jointe ; créneau de retrait avec jours d’ouverture, capacité, créneaux réservés et échéance.

## Démarrage

1. Copier `.env.example` vers `.env` et renseigner `DATABASE_URL`.
2. Installer les dépendances avec `npm install`.
3. Appliquer le schéma avec `npx drizzle-kit push`.
4. Lancer `npm run dev`. Les données de démonstration sont insérées au premier accès si la base est vide.

## Services de démonstration

- `PAYMENT_MODE=mock` : les acomptes et soldes sont enregistrés comme simulations dans le suivi ; aucune banque n’est contactée.
- `GIFT_CARD_MODE=mock` : les codes locaux `MAISON-25-2026` et `MAISON-50-2026` activent des cartes de démonstration. Avec une autre valeur, l’activation est refusée tant qu’un adaptateur réel n’est pas configuré.
- Les préférences de notifications sont persistées, mais aucun e-mail ou SMS externe n’est envoyé.
- Les PDF (commandes, factures, avoirs) et l’export JSON sont générés à la demande à partir de PostgreSQL ; ce ne sont pas des fichiers statiques.

## Architecture

- `src/db/schema.ts` : tables Drizzle normalisées, montants en centimes, préférences et photos typées.
- `src/db/seed.ts` : catalogue, historique et dossiers individuellement renseignés, insertion idempotente.
- `src/lib/portal.ts` : snapshot de données mutualisé et memoïsé par requête.
- `src/app/api` : mutations validées et services de documents/export.
- `src/components` : shell partagé, panier, recherche, assistant SAV, commandes, avis, fidélité et compte.

Le confort de lecture, les favoris, le panier et toutes les opérations métier sont conservés en base. L’interface respecte `prefers-reduced-motion` et propose des vues mobiles dédiées.

import type { Product } from "@/lib/portal";

export function cartLineTotal(product: Pick<Product, "priceCents" | "unit">, quantity: number) {
  return product.unit === "kg"
    ? Math.round(product.priceCents * quantity / 2)
    : product.priceCents * quantity;
}

export function cartQuantityLabel(product: Pick<Product, "unit">, quantity: number) {
  return product.unit === "kg" ? `${quantity * 500} g` : `${quantity} pièce${quantity > 1 ? "s" : ""}`;
}

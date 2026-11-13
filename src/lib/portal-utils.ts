import type { PortalData } from "@/lib/portal";

export function loyaltyBalance(data: Pick<PortalData, "loyalty">) {
  return data.loyalty.reduce((sum, entry) => sum + entry.points, 0);
}

export function activeVoucherTotal(data: Pick<PortalData, "vouchers">) {
  return data.vouchers
    .filter((voucher) => voucher.status === "Actif")
    .reduce((sum, voucher) => sum + voucher.valueCents, 0);
}

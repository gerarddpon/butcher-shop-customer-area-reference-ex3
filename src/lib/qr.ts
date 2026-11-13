import QRCode from "qrcode";

export async function qrCodeDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#17120f", light: "#fffdf7" },
  });
}

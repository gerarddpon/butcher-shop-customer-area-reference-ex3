export async function sendJson<T extends Record<string, unknown>>(url: string, method: "PATCH" | "POST" | "DELETE", body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "L’opération n’a pas pu être enregistrée.");
  return payload;
}

export function saveSettings(payload: Record<string, unknown>) {
  return sendJson<{ ok: boolean }>("/api/preferences", "PATCH", payload);
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Ce fichier n’a pas pu être lu."));
    reader.readAsDataURL(file);
  });
}

export function formatPhoneInput(value: string) {
  return value.replace(/[^\d+ ]/g, "").slice(0, 24);
}

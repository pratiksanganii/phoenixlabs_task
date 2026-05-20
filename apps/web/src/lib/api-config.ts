export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:3001";
    }
    throw new Error(
      "NEXT_PUBLIC_API_URL is required. Set it in apps/web/.env.local"
    );
  }
  return raw.replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

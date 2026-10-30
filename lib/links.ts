import { client, site } from "./config";

// A value still in square brackets has not been filled in yet
export const isPlaceholder = (v: string) => /^\[.*\]$/.test(v.trim());

// Only a real address becomes a mailto link
export function emailHref(email = site.email): string | null {
  return !isPlaceholder(email) && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? `mailto:${email}` : null;
}

// Only a wa.me link with a full number becomes a link: a bare https://wa.me/ would open the wrong thing
export function whatsappHref(link = site.whatsappLink): string | null {
  return /^https:\/\/wa\.me\/\d{8,15}$/.test(link) ? link : null;
}

// Any other outside link: https only, never a bare domain root left over from a template
export function externalHref(link: string): string | null {
  try {
    const u = new URL(link);
    if (u.protocol !== "https:") return null;
    if (u.pathname === "/" && !u.search) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export const instagramHref = () => externalHref(site.instagramLink);
export const clientInstagramHref = () => externalHref(client.instagramLink);

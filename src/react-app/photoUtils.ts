import type { BoatPhoto } from "@/mockApi";

const COVER_PHOTO_CLASS = "h-full w-full object-cover object-center";

export function coverPhotoClassName(extra?: string) {
  return extra ? `${COVER_PHOTO_CLASS} ${extra}` : COVER_PHOTO_CLASS;
}

export function coverPhotoStyle(photo?: Pick<BoatPhoto, "focus">) {
  return photo?.focus ? { objectPosition: photo.focus } : undefined;
}

export function optimizePhotoUrl(url: string, width = 1400) {
  if (url.startsWith("data:")) return url;

  try {
    const parsed = new URL(url);
    if (parsed.hostname === "images.unsplash.com") {
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("crop", "entropy");
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", "85");
      return parsed.toString();
    }
    if (parsed.hostname === "images.pexels.com") {
      parsed.searchParams.set("auto", "compress");
      parsed.searchParams.set("cs", "tinysrgb");
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    }
  } catch {
    return url;
  }

  return url;
}

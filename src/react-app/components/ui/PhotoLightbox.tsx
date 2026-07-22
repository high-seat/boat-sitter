import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type { BoatPhoto } from "@/mockApi";
import { coverPhotoClassName, coverPhotoStyle, optimizePhotoUrl } from "@/photoUtils";

export function PhotoLightbox({
  boatName,
  photos,
  index,
  onClose,
  onIndexChange,
}: {
  boatName: string;
  photos: BoatPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const { t } = useTranslation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const indexRef = useRef(index);
  const onCloseRef = useRef(onClose);
  const onIndexChangeRef = useRef(onIndexChange);
  indexRef.current = index;
  onCloseRef.current = onClose;
  onIndexChangeRef.current = onIndexChange;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key === "ArrowLeft") {
        onIndexChangeRef.current((indexRef.current - 1 + photos.length) % photos.length);
      }
      if (event.key === "ArrowRight") {
        onIndexChangeRef.current((indexRef.current + 1) % photos.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [photos.length]);

  const previous = () => onIndexChange((index - 1 + photos.length) % photos.length);
  const next = () => onIndexChange((index + 1) % photos.length);
  const current = photos[index];
  const caption = current?.caption?.trim();

  return createPortal(
    <div
      aria-label={t("lightbox.dialogLabel", { boat: boatName })}
      aria-modal="true"
      className="fixed inset-0 z-3000 flex flex-col bg-navy/95 text-white backdrop-blur-xl"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      role="dialog"
    >
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 sm:px-6">
        <p className="text-sm font-bold">
          {t("lightbox.counter", { current: index + 1, total: photos.length })}
        </p>
        <button
          aria-label={t("common.close")}
          className="grid size-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <X size={22} />
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 pb-3 sm:px-20">
        <img
          alt={caption || t("lightbox.photoAlt", { boat: boatName, number: index + 1 })}
          className="max-h-[min(100%,calc(100%-3rem))] max-w-full rounded-xl object-contain shadow-2xl"
          src={current?.url}
        />
        {caption && (
          <p className="max-w-3xl text-center text-sm font-medium text-white/90 sm:text-base">
            {caption}
          </p>
        )}
        {photos.length > 1 && (
          <>
            <button
              aria-label={t("lightbox.previous")}
              className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy shadow-lg transition hover:bg-white sm:left-6"
              onClick={previous}
              type="button"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              aria-label={t("lightbox.next")}
              className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy shadow-lg transition hover:bg-white sm:right-6"
              onClick={next}
              type="button"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      <div className="shrink-0 overflow-x-auto px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-max gap-2">
          {photos.map((photo, photoIndex) => (
            <button
              aria-label={t("lightbox.viewPhoto", { number: photoIndex + 1 })}
              className={`h-14 w-20 overflow-hidden rounded-lg border-2 transition sm:h-16 sm:w-24 ${
                photoIndex === index
                  ? "border-aqua opacity-100"
                  : "border-transparent opacity-55 hover:opacity-100"
              }`}
              key={`${photo.url}-${photoIndex}`}
              onClick={() => onIndexChange(photoIndex)}
              type="button"
            >
              <img
                alt=""
                className={coverPhotoClassName()}
                src={optimizePhotoUrl(photo.url, 240)}
                style={coverPhotoStyle(photo)}
              />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

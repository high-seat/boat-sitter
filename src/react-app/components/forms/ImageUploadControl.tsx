import { ImagePlus } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ImageUploadControl({
  hasImage,
  pending,
  onFile,
  profile = false,
}: {
  hasImage: boolean;
  pending: boolean;
  onFile: (file?: File) => void;
  profile?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <label
        className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-teal bg-white px-4 py-3 text-sm font-bold text-teal transition hover:bg-seafoam ${
          pending ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <ImagePlus size={18} />
        {pending
          ? t("upload.processing")
          : profile
            ? t("profile.replacePhoto")
            : hasImage
              ? t("upload.replace")
              : t("upload.upload")}
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={pending}
          onChange={(event) => {
            onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
          type="file"
        />
      </label>
      <p className="mt-2 text-xs leading-relaxed text-slate">
        {profile ? t("profile.photoUploadHint") : t("upload.hint")}
      </p>
    </div>
  );
}

import { ImagePlus } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ImageUploadControl({
  hasImage,
  pending,
  onFile,
  onFiles,
  multiple = false,
  profile = false,
}: {
  hasImage: boolean;
  pending: boolean;
  onFile?: (file?: File) => void;
  onFiles?: (files: File[]) => void;
  multiple?: boolean;
  profile?: boolean;
}) {
  const { t } = useTranslation();

  let label = t("upload.upload");
  if (pending) {
    label = multiple ? t("upload.processingMultiple") : t("upload.processing");
  } else if (profile) {
    label = t("profile.replacePhoto");
  } else if (multiple) {
    label = t("upload.uploadMultiple");
  } else if (hasImage) {
    label = t("upload.replace");
  }

  let hint = t("upload.hint");
  if (profile) hint = t("profile.photoUploadHint");
  else if (multiple) hint = t("upload.hintMultiple");

  return (
    <div>
      <label
        className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-teal bg-white px-4 py-3 text-sm font-bold text-teal transition hover:bg-seafoam ${
          pending ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <ImagePlus size={18} />
        {label}
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={pending}
          multiple={multiple}
          onChange={(event) => {
            const files = [...(event.target.files ?? [])];
            if (multiple) onFiles?.(files);
            else onFile?.(files[0]);
            event.target.value = "";
          }}
          type="file"
        />
      </label>
      <p className="mt-2 text-xs leading-relaxed text-slate">{hint}</p>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

export type VideoCallScheduleValues = {
  startsAt: string;
  durationMinutes: number;
};

const DURATION_OPTIONS = [15, 30, 45, 60] as const;

function toLocalDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalTimeInputValue(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function defaultSchedule(initial?: Partial<VideoCallScheduleValues>): {
  date: string;
  time: string;
  durationMinutes: number;
} {
  if (initial?.startsAt) {
    const starts = new Date(initial.startsAt);
    if (!Number.isNaN(starts.getTime())) {
      return {
        date: toLocalDateInputValue(starts),
        time: toLocalTimeInputValue(starts),
        durationMinutes: initial.durationMinutes ?? 30,
      };
    }
  }
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  return {
    date: toLocalDateInputValue(tomorrow),
    time: "10:00",
    durationMinutes: initial?.durationMinutes ?? 30,
  };
}

export function VideoCallScheduleModal({
  otherPartyName,
  mode,
  initial,
  pending = false,
  onCancel,
  onSubmit,
}: {
  otherPartyName: string;
  mode: "propose" | "adjust";
  initial?: Partial<VideoCallScheduleValues>;
  pending?: boolean;
  onCancel: () => void;
  onSubmit: (values: VideoCallScheduleValues) => void;
}) {
  const { t } = useTranslation();
  const defaults = useMemo(() => defaultSchedule(initial), [initial]);
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [durationMinutes, setDurationMinutes] = useState(defaults.durationMinutes);
  const [error, setError] = useState("");

  const minDate = toLocalDateInputValue(new Date());

  function submit() {
    if (!date || !time) {
      setError(t("applications.videoCall.incomplete"));
      return;
    }
    const startsAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startsAt.getTime())) {
      setError(t("applications.videoCall.incomplete"));
      return;
    }
    if (startsAt.getTime() <= Date.now()) {
      setError(t("applications.videoCall.pastError"));
      return;
    }
    setError("");
    onSubmit({
      startsAt: startsAt.toISOString(),
      durationMinutes,
    });
  }

  return (
    <Modal
      onClose={onCancel}
      pending={pending}
      title={
        mode === "adjust"
          ? t("applications.videoCall.adjustTitle")
          : t("applications.requestVideoCallConfirmTitle")
      }
      titleId="video-call-schedule-title"
      wide
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-seafoam text-teal">
          <Video size={20} />
        </span>
        <p className="text-sm leading-6 text-slate">
          {mode === "adjust"
            ? t("applications.videoCall.adjustText", { name: otherPartyName })
            : t("applications.requestVideoCallConfirmText", { name: otherPartyName })}
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-navy">
            {t("applications.videoCall.date")}
          </span>
          <input
            className="form-input w-full"
            min={minDate}
            onChange={(event) => setDate(event.target.value)}
            required
            type="date"
            value={date}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-navy">
            {t("applications.videoCall.time")}
          </span>
          <input
            className="form-input w-full"
            onChange={(event) => setTime(event.target.value)}
            required
            type="time"
            value={time}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-bold text-navy">
            {t("applications.videoCall.duration")}
          </span>
          <Select
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            value={String(durationMinutes)}
            variant="form"
          >
            {DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {t("applications.videoCall.durationMinutes", { count: minutes })}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {error ? (
        <p className="mt-4 text-sm font-semibold text-coral" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          className="rounded-xl border border-line px-5 py-3 font-bold text-navy"
          disabled={pending}
          onClick={onCancel}
          type="button"
        >
          {t("common.cancel")}
        </button>
        <button
          className="rounded-xl bg-navy px-5 py-3 font-bold text-white hover:bg-ink disabled:opacity-60"
          disabled={pending}
          onClick={submit}
          type="button"
        >
          {(() => {
            if (pending) return t("common.saving");
            if (mode === "adjust") return t("applications.videoCall.adjustAction");
            return t("applications.requestVideoCallConfirmAction");
          })()}
        </button>
      </div>
    </Modal>
  );
}

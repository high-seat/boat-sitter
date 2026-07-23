import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { canLeaveReview, reviewDaysRemaining } from "@/dateUtils";
import {
  createReview,
  respondToReview,
  summarizeSitterRating,
  type SitApplication,
  type SitReview,
} from "@/mockApi";
import { queries } from "@/queries";
import { SitterReviewsSkeleton } from "@/components/ui/MemberProfileSkeleton";

function formatReviewDate(language: string, iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(language, { month: "long", year: "numeric" }).format(date);
}

export function StarRating({
  rating,
  size = 14,
  interactive = false,
  onChange,
  label,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
  label?: string;
}) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(0);
  const display = interactive && hovered ? hovered : rating;

  return (
    <div
      aria-label={label ?? t("reviews.ratingOutOf", { rating: display || 0 })}
      className="flex items-center gap-0.5 text-sun"
      onMouseLeave={() => interactive && setHovered(0)}
      role={interactive ? "radiogroup" : "img"}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(display);
        if (!interactive) {
          return (
            <Star
              aria-hidden="true"
              className={filled ? "fill-current" : "fill-none text-line"}
              key={star}
              size={size}
            />
          );
        }
        return (
          <button
            aria-checked={rating === star}
            aria-label={t("reviews.starOption", { count: star })}
            className="rounded p-0.5 transition hover:scale-110"
            key={star}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHovered(star)}
            role="radio"
            type="button"
          >
            <Star
              aria-hidden="true"
              className={star <= (hovered || rating) ? "fill-current" : "fill-none text-line"}
              size={size}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({
  review,
  canRespond,
  language,
}: {
  review: SitReview;
  canRespond: boolean;
  language: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [responseText, setResponseText] = useState("");
  const [error, setError] = useState("");
  const respondMutation = useMutation({
    mutationFn: () =>
      respondToReview({
        reviewId: review.id,
        sitterName: review.sitterName,
        text: responseText,
      }),
    onSuccess: async () => {
      setResponseText("");
      setError("");
      await queryClient.invalidateQueries({ queryKey: queries.reviews.getQueryKey() });
    },
    onError: (err) => {
      const code = err instanceof Error ? err.message : "";
      setError(
        (() => {
          if (code === "REVIEW_RESPONSE_TOO_SHORT") return t("reviews.responseTooShort");
          if (code === "REVIEW_RESPONSE_EXISTS") return t("reviews.responseExists");
          return t("reviews.responseFailed");
        })(),
      );
    },
  });

  return (
    <article className="py-6 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <img alt="" className="size-10 rounded-full object-cover" src={review.ownerImage} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-navy">{review.ownerName}</p>
              <p className="text-xs text-slate">
                {review.boatName} · {review.location} ·{" "}
                {formatReviewDate(language, review.createdAt)}
              </p>
            </div>
            <StarRating rating={review.rating} size={12} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate">“{review.text}”</p>
          {review.response ? (
            <div className="mt-4 rounded-xl border border-line bg-cream/70 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-teal">
                {t("reviews.responseFrom", { name: review.sitterName })}
              </p>
              <p className="mt-2 text-sm leading-6 text-navy">{review.response.text}</p>
              <p className="mt-2 text-xs text-slate">
                {formatReviewDate(language, review.response.createdAt)}
              </p>
            </div>
          ) : null}
          {!review.response && canRespond ? (
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                respondMutation.mutate();
              }}
            >
              <label className="block">
                <span className="form-label">{t("reviews.respondLabel")}</span>
                <textarea
                  className="form-input min-h-24 resize-y"
                  maxLength={600}
                  onChange={(event) => setResponseText(event.target.value)}
                  placeholder={t("reviews.respondPlaceholder")}
                  value={responseText}
                />
              </label>
              {error && (
                <p className="text-sm font-semibold text-coral" role="alert">
                  {error}
                </p>
              )}
              <button
                className="rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                disabled={respondMutation.isPending || responseText.trim().length < 8}
                type="submit"
              >
                {respondMutation.isPending ? t("reviews.responding") : t("reviews.respondOnce")}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function LeaveReviewForm({
  application,
  ownerName,
  onSubmitted,
}: {
  application: SitApplication;
  ownerName: string;
  onSubmitted?: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const { data: existing } = useQuery({
    ...queries.reviews.application(application.id),
  });
  const { data: sit, isLoading: sitLoading } = useQuery({
    ...queries.boat.detail(application.sitId),
  });
  const mutation = useMutation({
    mutationFn: () =>
      createReview({
        applicationId: application.id,
        rating,
        text,
        ownerName,
      }),
    onSuccess: async () => {
      setError("");
      await queryClient.invalidateQueries({ queryKey: queries.reviews.getQueryKey() });
      onSubmitted?.();
    },
    onError: (err) => {
      const code = err instanceof Error ? err.message : "";
      setError(
        (() => {
          if (code === "REVIEW_TEXT_TOO_SHORT") return t("reviews.textTooShort");
          if (code === "REVIEW_ALREADY_EXISTS") return t("reviews.alreadyExists");
          if (code === "REVIEW_WINDOW_CLOSED") return t("reviews.windowClosed");
          if (code === "REVIEW_SIT_NOT_COMPLETED") return t("reviews.sitNotCompleted");
          return t("reviews.submitFailed");
        })(),
      );
    },
  });

  if (application.status !== "accepted" || existing) return null;
  if (sitLoading || !sit || !canLeaveReview(sit)) return null;

  const daysRemaining = reviewDaysRemaining(sit);

  return (
    <section className="rounded-2xl border border-aqua/40 bg-aqua/10 p-5">
      <div className="mb-4 rounded-xl border border-teal/25 bg-seafoam px-4 py-3 text-sm leading-6 text-navy">
        {t("reviews.windowBanner", { days: daysRemaining })}
      </div>
      <p className="eyebrow">{t("reviews.leaveKicker")}</p>
      <h3 className="mt-1 font-display text-xl font-bold text-navy">
        {t("reviews.leaveTitle", { name: application.applicant.name })}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate">
        {t("reviews.leaveHint", { boat: application.boatName })}
      </p>
      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <div>
          <p className="form-label">{t("reviews.yourRating")}</p>
          <StarRating
            interactive
            label={t("reviews.yourRating")}
            onChange={setRating}
            rating={rating}
            size={22}
          />
        </div>
        <label className="block">
          <span className="form-label">{t("reviews.yourReview")}</span>
          <textarea
            className="form-input min-h-28 resize-y"
            maxLength={800}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("reviews.yourReviewPlaceholder")}
            value={text}
          />
        </label>
        {error && (
          <p className="text-sm font-semibold text-coral" role="alert">
            {error}
          </p>
        )}
        <button
          className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          disabled={mutation.isPending || text.trim().length < 20}
          type="submit"
        >
          {mutation.isPending ? t("reviews.submitting") : t("reviews.submit")}
        </button>
      </form>
    </section>
  );
}

export function SitterReviewsSection({
  sitterName,
  currentUserName,
  limit,
  profilePath,
  showEmpty = true,
}: {
  sitterName: string;
  currentUserName?: string;
  limit?: number;
  profilePath?: string;
  showEmpty?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { data: reviews = [], isLoading } = useQuery({
    ...queries.reviews.sitter(sitterName),
    enabled: Boolean(sitterName),
  });
  const summary = summarizeSitterRating(reviews);
  const visible = typeof limit === "number" ? reviews.slice(0, limit) : reviews;
  const canRespond = currentUserName === sitterName;

  if (isLoading) {
    return <SitterReviewsSkeleton />;
  }
  if (!reviews.length) {
    if (!showEmpty) return null;
    return (
      <section className="rounded-2xl border border-line bg-white p-7">
        <p className="eyebrow">{t("member.fromOwners")}</p>
        <h2 className="detail-title">{t("reviews.title")}</h2>
        <p className="mt-4 text-sm leading-6 text-slate">{t("reviews.empty")}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("member.fromOwners")}</p>
          <h2 className="detail-title">
            {typeof limit === "number" ? t("reviews.recentTitle") : t("reviews.title")}
          </h2>
          <p className="mt-1 text-sm text-slate">
            {t("reviews.summary", {
              average: summary.average.toFixed(1),
              count: summary.count,
            })}
          </p>
        </div>
        <span className="flex items-center gap-2 text-sm font-bold text-navy">
          <StarRating rating={summary.average} size={16} />
          {summary.average.toFixed(1)}
        </span>
      </div>
      <div className="mt-6 divide-y divide-line">
        {visible.map((review) => (
          <ReviewCard
            canRespond={canRespond && !limit}
            key={review.id}
            language={i18n.language}
            review={review}
          />
        ))}
      </div>
      {typeof limit === "number" && reviews.length > limit && profilePath && (
        <Link
          className="mt-4 inline-flex text-sm font-bold text-teal hover:text-navy"
          to={profilePath}
        >
          {t("reviews.viewAll", { count: reviews.length })}
        </Link>
      )}
    </section>
  );
}

export function SitterRatingBadge({ sitterName }: { sitterName: string }) {
  const { t } = useTranslation();
  const { data: reviews = [] } = useQuery({
    ...queries.reviews.sitter(sitterName),
    enabled: Boolean(sitterName),
  });
  const summary = summarizeSitterRating(reviews);
  if (!summary.count) {
    return <span className="text-sm text-slate">{t("reviews.noRatingYet")}</span>;
  }
  return (
    <span className="flex items-center gap-1.5 text-sm font-bold text-navy">
      <StarRating rating={summary.average} size={14} />
      {summary.average.toFixed(1)} · {t("member.reviews", { count: summary.count })}
    </span>
  );
}

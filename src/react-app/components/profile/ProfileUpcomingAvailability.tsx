import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { sitOverlapsAvailabilityWindow } from "../../../shared/availabilityMatch";
import { formatInclusiveDateRange, formatSitDates } from "@/dateUtils";
import { getIntlLocale } from "@/i18n";
import {
  containsOffPlatformContactDetails,
  inviteSitterToSit,
  isAcceptingApplications,
  type Sit,
  type SitApplication,
  type Vessel,
} from "@/mockApi";
import { queries, type PublicAvailabilityWindow } from "@/queries";
import { useAppStore } from "@/store";
import { CharacterCount } from "@/components/ui/CharacterCount";
import { IconTooltip } from "@/components/ui/IconTooltip";
import { Modal } from "@/components/ui/Modal";
import { ShimmerBlock } from "@/components/ui/Shimmer";
import { SitPicker } from "@/components/ui/SitPicker";

const INVITE_MESSAGE_MAX = 2000;

type MatchingSit = {
  id: string;
  boatName: string;
  boatImage: string;
  dates: string;
  dateStart: string;
  duration: string;
  country: string;
  location: string;
};

function formatWindowRange(language: string, from: string, to: string) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${from} – ${to}`;
  }
  return formatInclusiveDateRange(getIntlLocale(language), start, end);
}

/** True when the owner already has an open request/thread with this sitter for the sit. */
function hasOpenRequestForSit(applications: SitApplication[], sitId: string, sitterName: string) {
  return applications.some((application) => {
    if (application.sitId !== sitId) return false;
    if (application.applicant.name !== sitterName) return false;
    return (
      application.status === "invited" ||
      application.status === "new" ||
      application.status === "shortlisted" ||
      application.status === "accepted"
    );
  });
}

function UpcomingAvailabilitySkeleton() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="rounded-2xl border border-line bg-white p-7"
      data-testid="profile-availability-skeleton"
    >
      <ShimmerBlock className="h-7 w-48 max-w-[70%]" />
      <div aria-hidden="true" className="mt-5 space-y-3">
        <ShimmerBlock className="h-20 w-full rounded-xl" />
        <ShimmerBlock className="h-20 w-full rounded-xl" />
      </div>
    </section>
  );
}

function ownerOpenMatchingSits(
  userName: string | undefined,
  vessels: Vessel[],
  sits: Sit[],
): MatchingSit[] {
  if (!userName) return [];
  const myVessels = vessels.filter((vessel) => vessel.owner === userName);
  const nameById = new Map(myVessels.map((vessel) => [vessel.id, vessel.name]));
  const imageById = new Map(myVessels.map((vessel) => [vessel.id, vessel.image]));
  const myBoatIds = new Set(myVessels.map((vessel) => vessel.id));
  return sits
    .filter((sit) => myBoatIds.has(sit.boatId) && isAcceptingApplications(sit))
    .map((sit) => ({
      id: sit.id,
      boatName: nameById.get(sit.boatId) ?? sit.location,
      boatImage: imageById.get(sit.boatId) ?? "",
      dates: sit.dates,
      dateStart: sit.dateStart,
      duration: sit.duration,
      country: sit.country,
      location: sit.location,
    }));
}

function InviteSitterModal({
  close,
  matchingSits,
  sitterName,
}: {
  close: () => void;
  matchingSits: MatchingSit[];
  sitterName: string;
}) {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sitId, setSitId] = useState(matchingSits[0]?.id ?? "");
  const selected = matchingSits.find((sit) => sit.id === sitId) ?? matchingSits[0];

  function defaultMessageFor(sit: MatchingSit | undefined) {
    if (!sit) return "";
    return t("member.inviteSitterDefaultMessage", {
      name: sitterName,
      boat: sit.boatName,
      dates: formatSitDates(getIntlLocale(i18n.language), sit.dateStart, sit.duration),
    });
  }

  const [message, setMessage] = useState(() => defaultMessageFor(selected));

  const mutation = useMutation({
    mutationFn: () => inviteSitterToSit(sitId, sitterName, message),
    onSuccess: async (application) => {
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
      await queryClient.invalidateQueries({ queryKey: queries.notifications.getQueryKey() });
      close();
      navigate(`/messages?application=${encodeURIComponent(application.id)}`);
    },
  });

  const hasBlockedContactDetails = containsOffPlatformContactDetails(message);
  const canSend =
    Boolean(sitId) && message.trim().length > 0 && !hasBlockedContactDetails && !mutation.isPending;

  return (
    <Modal
      onClose={close}
      pending={mutation.isPending}
      title={t("member.inviteSitterTitle", { name: sitterName })}
      titleId="invite-sitter-title"
    >
      <div className="space-y-4" data-testid="profile-invite-sitter-modal">
        <SitPicker
          label={t("member.inviteSitterSitLabel")}
          onChange={(nextId) => {
            setSitId(nextId);
            const next = matchingSits.find((sit) => sit.id === nextId);
            if (next) setMessage(defaultMessageFor(next));
          }}
          sits={matchingSits}
          testId="profile-invite-sit-select"
          value={sitId}
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-navy">
            {t("member.inviteSitterMessageLabel")}
          </span>
          <textarea
            className="form-input min-h-32 w-full resize-y"
            data-testid="profile-invite-message"
            maxLength={INVITE_MESSAGE_MAX}
            onChange={(event) => setMessage(event.target.value)}
            value={message}
          />
          <CharacterCount className="mt-1" current={message.length} max={INVITE_MESSAGE_MAX} />
        </label>
        {hasBlockedContactDetails ? (
          <p className="text-sm text-amber-800" role="alert">
            {t("apply.contactDetailsBlocked")}
          </p>
        ) : null}
        {mutation.isError ? (
          <p className="text-sm text-rose-700" role="alert">
            {t("member.inviteSitterFailed")}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            className="rounded-full border border-line px-5 py-3 font-bold text-navy hover:bg-cream disabled:opacity-60"
            disabled={mutation.isPending}
            onClick={close}
            type="button"
          >
            {t("common.cancel")}
          </button>
          <button
            className="rounded-full bg-teal px-5 py-3 font-bold text-white hover:bg-teal/90 disabled:opacity-60"
            data-testid="profile-invite-send"
            disabled={!canSend}
            onClick={() => mutation.mutate()}
            type="button"
          >
            {mutation.isPending ? t("member.inviteSitterSending") : t("member.inviteSitterSend")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AvailabilityWindowRow({
  alreadyRequested,
  isSelf,
  matchingSits,
  onRequest,
  window: win,
}: {
  alreadyRequested: boolean;
  isSelf: boolean;
  matchingSits: MatchingSit[];
  onRequest: (sits: MatchingSit[]) => void;
  window: PublicAvailabilityWindow;
}) {
  const { i18n, t } = useTranslation();
  const regionsLabel =
    win.regions.length > 0 ? win.regions.join(", ") : t("availability.openAnywhere");
  const overlapping = matchingSits.filter((sit) =>
    sitOverlapsAvailabilityWindow(sit, {
      dateStart: win.dateStart,
      dateEnd: win.dateEnd,
      regions: win.regions,
    }),
  );
  const showMatch = !isSelf && overlapping.length > 0;

  return (
    <li
      className="rounded-xl border border-line bg-cream/40 px-4 py-3"
      data-testid={`profile-availability-window-${win.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 font-semibold text-navy">
          <CalendarDays className="shrink-0 text-teal" size={16} />
          <span className="min-w-0">
            {formatWindowRange(i18n.language, win.dateStart, win.dateEnd)}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {showMatch ? (
            <span
              className="rounded-full bg-teal/15 px-2.5 py-1 text-xs font-bold text-teal"
              data-testid={`profile-availability-match-${win.id}`}
            >
              {t("member.availabilityMatches")}
            </span>
          ) : null}
          <span className="rounded-full bg-seafoam px-2.5 py-1 text-xs font-bold text-teal">
            {t("availability.phase.open")}
          </span>
        </div>
      </div>
      <p className="mt-2 flex min-w-0 items-start gap-2 text-sm text-slate">
        <MapPin className="mt-0.5 shrink-0" size={14} />
        <span className="min-w-0">{regionsLabel}</span>
      </p>
      {win.notes.trim() ? <p className="mt-2 text-sm leading-6 text-slate">{win.notes}</p> : null}
      {showMatch ? (
        <IconTooltip
          hidden={!alreadyRequested}
          label={t("member.requestToSitMyBoatRequestedHint")}
          side="top"
          wrap
        >
          <button
            aria-disabled={alreadyRequested}
            className="mt-3 inline-flex rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid={`profile-availability-request-${win.id}`}
            disabled={alreadyRequested}
            onClick={() => {
              if (alreadyRequested) return;
              onRequest(overlapping);
            }}
            type="button"
          >
            {alreadyRequested
              ? t("member.requestToSitMyBoatRequested")
              : t("member.requestToSitMyBoat")}
          </button>
        </IconTooltip>
      ) : null}
    </li>
  );
}

export function ProfileUpcomingAvailability({
  isSelf,
  memberName,
}: {
  isSelf: boolean;
  memberName: string;
}) {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const canMatch = Boolean(user) && !isSelf;
  const [inviteSits, setInviteSits] = useState<MatchingSit[] | null>(null);

  const { data: windows = [], isLoading } = useQuery({
    ...queries.availability.member(memberName),
    enabled: Boolean(memberName),
  });
  const { data: vessels = [], isPending: vesselsPending } = useQuery({
    ...queries.vessels.all,
    enabled: canMatch,
  });
  const { data: sits = [], isPending: sitsPending } = useQuery({
    ...queries.sits.all,
    enabled: canMatch,
  });
  const { data: applications = [] } = useQuery({
    ...queries.applications.user(user?.name),
    enabled: canMatch,
  });

  const matchingSits = useMemo(() => {
    if (canMatch && (vesselsPending || sitsPending)) return [];
    return ownerOpenMatchingSits(user?.name, vessels, sits);
  }, [canMatch, vesselsPending, sitsPending, user?.name, vessels, sits]);

  if (isLoading) return <UpcomingAvailabilitySkeleton />;
  if (!windows.length && !isSelf) return null;

  return (
    <section
      className="rounded-2xl border border-line bg-white p-7"
      data-testid="profile-upcoming-availability"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="detail-title">{t("member.upcomingAvailability")}</h2>
        {isSelf ? (
          <Link
            className="text-sm font-bold text-teal hover:underline"
            data-testid="profile-manage-availability"
            to="/availability"
          >
            {t("member.manageAvailability")}
          </Link>
        ) : null}
      </div>
      {windows.length === 0 ? (
        <div className="mt-5" data-testid="profile-availability-empty">
          <p className="text-sm text-slate">{t("member.upcomingAvailabilityEmpty")}</p>
          <Link
            className="mt-4 inline-flex rounded-full bg-teal px-6 py-3 font-bold text-white hover:bg-teal/90"
            data-testid="profile-availability-empty-action"
            to="/availability"
          >
            {t("member.addAvailability")}
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3" data-testid="profile-availability-list">
          {windows.map((win) => {
            const overlapping = matchingSits.filter((sit) =>
              sitOverlapsAvailabilityWindow(sit, {
                dateStart: win.dateStart,
                dateEnd: win.dateEnd,
                regions: win.regions,
              }),
            );
            const alreadyRequested = overlapping.some((sit) =>
              hasOpenRequestForSit(applications, sit.id, memberName),
            );
            return (
              <AvailabilityWindowRow
                alreadyRequested={alreadyRequested}
                isSelf={isSelf}
                key={win.id}
                matchingSits={matchingSits}
                onRequest={setInviteSits}
                window={win}
              />
            );
          })}
        </ul>
      )}
      {inviteSits && inviteSits.length > 0 ? (
        <InviteSitterModal
          close={() => setInviteSits(null)}
          matchingSits={inviteSits}
          sitterName={memberName}
        />
      ) : null}
    </section>
  );
}

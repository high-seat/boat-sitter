import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Anchor,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Compass,
  Droplets,
  Flame,
  Fuel,
  Gauge,
  Heart,
  Home,
  ImagePlus,
  Info,
  Languages,
  LifeBuoy,
  List,
  LogOut,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  Pencil,
  Play,
  Plus,
  Quote,
  Search,
  Settings,
  ShieldCheck,
  ShipWheel,
  Sparkles,
  Star,
  Sun,
  TriangleAlert,
  Trash2,
  Video,
  KeyRound,
  Flag,
  Waves,
  Wrench,
  X,
  Zap,
  Users,
} from "lucide-react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { CommandPalette } from "@/components/command/CommandPalette";
import {
  AutoTranslationAttribution,
  useAutoTranslatedOwnerContent,
} from "@/components/listing/AutoTranslatedOwnerContent";
import { BoatMap } from "@/components/maps/BoatMap";
import { BoatsPageLoadingSkeleton, BoatCardSkeleton } from "@/components/ui/BoatCardSkeleton";
import {
  OwnerBoatsLoadingSkeleton,
  OwnerSitsLoadingSkeleton,
} from "@/components/ui/OwnerDashboardSkeleton";
import { EditorLivePreview } from "@/components/ui/EditorLivePreview";
import { VesselPreviewCard } from "@/components/listing/VesselPreviewCard";
import { ResultsPagination } from "@/components/ui/ResultsPagination";
import { SitDetailSkeleton } from "@/components/ui/SitDetailSkeleton";
import { MessagesPageSkeleton } from "@/components/ui/MessagesPageSkeleton";
import { ApplicationReviewSkeleton } from "@/components/ui/ApplicationReviewSkeleton";
import { MemberProfileSkeleton } from "@/components/ui/MemberProfileSkeleton";
import { FeatureIcon } from "@/components/ui/FeatureIcon";
import { FormLabel } from "@/components/ui/FormLabel";
import { CharacterCount } from "@/components/ui/CharacterCount";
import { EditorRequiredFieldsHint } from "@/components/ui/EditorRequiredFieldsHint";
import { IconTooltip } from "@/components/ui/IconTooltip";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import { Select } from "@/components/ui/Select";
import { SegmentedTab, SegmentedTabs, segmentedTabClassName } from "@/components/ui/SegmentedTabs";
import { ShimmerBlock } from "@/components/ui/Shimmer";
import { VesselPicker } from "@/components/ui/VesselPicker";
import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";
import { AuthModal } from "@/components/forms/AuthModal";
import { ConversationPanel } from "@/components/applications/ConversationPanel";
import { formatApplicationSystemMessage } from "@/components/applications/formatApplicationSystemMessage";
import { CloseApplicationsRequestsDialog } from "@/components/applications/CloseApplicationsRequestsDialog";
import { SitEmergencyHelp } from "@/components/applications/SitEmergencyHelp";
import { WithdrawInterestDialog } from "@/components/applications/WithdrawInterestDialog";
import { AdminPage } from "@/components/admin/AdminPage";
import { SitterAvailabilityPage } from "@/components/availability/SitterAvailabilityPage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { isAdminUser } from "@/adminAccess";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { ImageUploadControl } from "@/components/forms/ImageUploadControl";
import { PhoneCountryCodeSelect } from "@/components/forms/PhoneCountryCodeSelect";
import { TermsAgreementCheckbox } from "@/components/forms/TermsAgreementCheckbox";
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  phoneCountryCodeFromLocation,
  resolvePhoneCountryCode,
} from "@/phoneCountryCode";
import { ChangeEmailModal, ChangePasswordModal } from "@/components/forms/ChangeCredentialsModals";
import { EmailConfirmationStatus } from "@/components/settings/EmailConfirmationStatus";
import { UserSafetyActions, BlockedUserBanner } from "@/components/moderation/UserSafetyActions";
import { getIntlLocale, normalizeLanguageCode, SUPPORTED_LANGUAGES } from "@/i18n";
import {
  isHappeningSoon,
  getSitPhase,
  canLeaveReview,
  reviewDaysRemaining,
  SIT_PHASES,
  type SitPhase,
} from "@/dateUtils";
import { deleteMockAccount } from "@/mockAuth";
import { LanguageSelect } from "@/components/layout/LanguageSelect";
import { MessagesNavLink } from "@/components/layout/MessagesNavLink";
import { NotificationsMenu } from "@/components/layout/NotificationsMenu";
import {
  containsOffPlatformContactDetails,
  deleteSit,
  deleteVessel,
  coordinatesForLocation,
  findConfirmedSitDateConflict,
  markNotificationRead,
  saveSit,
  saveVessel,
  sendApplication,
  sendApplicationMessage,
  shareApplicationPhoneNumber,
  startSitEarly,
  requestApplicationVideoCall,
  acceptApplicationVideoCall,
  declineApplicationVideoCall,
  submitSupportRequest,
  summarizeSitterRating,
  updateApplicationStatus,
  withdrawApplication,
  updateOwnerOnVessels,
  isAcceptingApplications,
  isNonSmokerRequirementLabel,
  resolveNonSmokerRequired,
  withoutNonSmokerRequirementLabels,
  type Boat,
  type EngineType,
  type VoltageType,
  type StoveFuelType,
  type ApplicationStatus,
  type BoatPhoto,
  type MockNotification,
  type Sit,
  type SitApplication,
  type SitType,
  type Vessel,
} from "@/mockApi";
import { VesselPrivateAccessCard } from "@/components/listing/VesselPrivateAccessCard";
import {
  convertBoatLength,
  formatBoatLength,
  lengthToMetres,
  metresToUnit,
  normalizeLengthToMetres,
  parseBoatLength,
  type LengthUnit,
} from "@/lengthUtils";
import {
  isValidYearBuilt,
  maxYearBuilt,
  MIN_YEAR_BUILT,
  parseYearBuiltInput,
} from "../shared/yearBuilt";
import { coverPhotoClassName, coverPhotoStyle, optimizePhotoUrl } from "@/photoUtils";
import { useFeatureFlag } from "@/featureFlags";
import { getSitAlsoLookingCount } from "@/sitAlsoLooking";
import { setOwnerDashboardTab } from "@/ownerDashboardDev";
import { APPLICATIONS_PAGE_SIZE } from "../shared/applicationsSearch";
import { VESSEL_TYPES, vesselTypeFromParam, vesselTypeToSlug } from "../shared/vesselTypes";
import {
  LeaveReviewForm,
  SitterRatingBadge,
  SitterReviewsSection,
} from "@/components/reviews/SitterReviews";
import {
  DEFAULT_EMAIL_NOTIFICATIONS,
  DEFAULT_SIT_CREATION_DEFAULTS,
  detectMeasurementSystem,
  useAppStore,
  type EmailNotificationPrefs,
} from "@/store";
import { unreadNewMessageNotificationsForApplication } from "@/unreadMessages";
import { isFullyVerified, startVerification } from "@/verificationService";
import { queries } from "@/queries";
import {
  IdentityVerificationBadge,
  IdentityVerificationCard,
} from "@/components/verification/IdentityVerificationCard";

const fallbackImage =
  "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=85";

const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_STORED_IMAGE_BYTES = 1_500_000;
const DELETE_ACCOUNT_CONFIRMATION_TERM = "DELETE";
const CONVERSATIONS_PER_PAGE = 10;
const SPOKEN_LANGUAGE_OPTIONS = [
  ["English", "spokenLanguages.english"],
  ["French", "spokenLanguages.french"],
  ["Spanish", "spokenLanguages.spanish"],
  ["Italian", "spokenLanguages.italian"],
  ["German", "spokenLanguages.german"],
  ["Dutch", "spokenLanguages.dutch"],
  ["Portuguese", "spokenLanguages.portuguese"],
  ["Greek", "spokenLanguages.greek"],
  ["Croatian", "spokenLanguages.croatian"],
  ["Turkish", "spokenLanguages.turkish"],
  ["Swedish", "spokenLanguages.swedish"],
  ["Norwegian", "spokenLanguages.norwegian"],
  ["Danish", "spokenLanguages.danish"],
  ["Finnish", "spokenLanguages.finnish"],
  ["Japanese", "spokenLanguages.japanese"],
  ["Polish", "spokenLanguages.polish"],
  ["Arabic", "spokenLanguages.arabic"],
] as const;
const LEGACY_SPOKEN_LANGUAGES: Record<string, string> = {
  "English (US)": "English",
  "English (UK)": "English",
  "Français (Monaco)": "French",
  Français: "French",
  Español: "Spanish",
  Italiano: "Italian",
  Deutsch: "German",
  Nederlands: "Dutch",
  Português: "Portuguese",
  Ελληνικά: "Greek",
  Hrvatski: "Croatian",
  Türkçe: "Turkish",
};

function normalizeSpokenLanguage(language: string) {
  return LEGACY_SPOKEN_LANGUAGES[language] ?? language;
}

function findConversationWithUser(
  applications: SitApplication[],
  currentUserName: string,
  otherUserName: string,
) {
  return applications.find(
    (application) =>
      application.messages.length > 0 &&
      ((application.ownerName === currentUserName &&
        application.applicant.name === otherUserName) ||
        (application.applicant.name === currentUserName &&
          application.ownerName === otherUserName)),
  );
}

function openAuth(mode: "login" | "signup") {
  window.dispatchEvent(new CustomEvent("open-auth", { detail: mode }));
}

async function prepareImageUpload(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("upload.invalidType");
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("upload.tooLarge");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("upload.processingUnsupported");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("upload.saveFailed"))),
      "image/webp",
      0.82,
    );
  });

  if (blob.size > MAX_STORED_IMAGE_BYTES) {
    throw new Error("upload.tooDetailed");
  }

  const { apiUploadImage, hasApiSession } = await import("@/apiRemote");
  if (!(await hasApiSession())) {
    throw new Error("upload.failed");
  }
  return await apiUploadImage(blob, "image.webp");
}

const ENGINE_TYPES: EngineType[] = [
  "Not specified",
  "No engine",
  "Inboard diesel",
  "Inboard gasoline",
  "Outboard gasoline",
  "Inboard electric",
  "Outboard electric",
  "Hybrid",
];

const VOLTAGE_TYPES: VoltageType[] = ["Not specified", "12 V DC", "24 V DC", "48 V DC"];

const STOVE_FUEL_TYPES: StoveFuelType[] = [
  "Not specified",
  "No stove",
  "Electric / induction",
  "LPG / propane",
  "Butane",
  "Diesel",
  "Alcohol",
  "Kerosene",
];

const VESSEL_LABEL_KEYS: Record<string, string> = {
  "Sailing yacht": "vessel.sailingYacht",
  Catamaran: "vessel.catamaran",
  "Motor yacht": "vessel.motorYacht",
  Narrowboat: "vessel.narrowboat",
  Trawler: "vessel.trawler",
  Houseboat: "vessel.houseboat",
  "Narrowboat / houseboat": "vessel.narrowboatHouseboat",
  "Not specified": "engine.notSpecified",
  "No engine": "engine.none",
  "Inboard diesel": "engine.inboardDiesel",
  "Inboard gasoline": "engine.inboardGasoline",
  "Outboard gasoline": "engine.outboardGasoline",
  "Inboard electric": "engine.inboardElectric",
  "Outboard electric": "engine.outboardElectric",
  Hybrid: "engine.hybrid",
  "No stove": "stove.none",
  "Electric / induction": "stove.electric",
  "LPG / propane": "stove.lpg",
  Butane: "stove.butane",
  Diesel: "stove.diesel",
  Alcohol: "stove.alcohol",
  Kerosene: "stove.kerosene",
};

const DISPLAY_LABEL_KEYS: Record<string, string> = {
  ...VESSEL_LABEL_KEYS,
  Bathroom: "feature.bathroom",
  "Full kitchen": "feature.fullKitchen",
  "Outdoor BBQ": "feature.outdoorBbq",
  "Air conditioning": "feature.airConditioning",
  Heating: "feature.heating",
  "Wi-Fi": "feature.wifi",
  "Dedicated workspace": "feature.workspace",
  TV: "feature.tv",
  Refrigerator: "feature.refrigerator",
  Freezer: "feature.freezer",
  Oven: "feature.oven",
  Microwave: "feature.microwave",
  "Coffee maker": "feature.coffeeMaker",
  Dishwasher: "feature.dishwasher",
  "Hot water": "feature.hotWater",
  "Deck shower": "feature.deckShower",
  "Washing machine": "feature.washingMachine",
  Dryer: "feature.dryer",
  Fans: "feature.fans",
  "Mosquito screens": "feature.mosquitoScreens",
  "Sound system": "feature.soundSystem",
  "Bedding & linens": "feature.beddingLinens",
  "On-site bathrooms & showers": "feature.facilityBathrooms",
  "24/7 security": "feature.security",
  "Gated access": "feature.gatedAccess",
  Laundry: "feature.laundry",
  "On-site laundry": "feature.laundry",
  "Swimming pool": "feature.pool",
  Restaurant: "feature.restaurant",
  "On-site restaurant": "feature.restaurant",
  Parking: "feature.parking",
  "Fuel dock": "feature.fuelDock",
  "Shore power": "feature.shorePower",
  "Fresh water hookup": "feature.freshWater",
  "Pump-out station": "feature.pumpOut",
  "Dock Wi-Fi": "feature.dockWifi",
  "LPG / gas refill": "feature.gasRefill",
  "Waste & recycling": "feature.wasteRecycling",
  Ice: "feature.ice",
  "Marina staff": "feature.marinaStaff",
  "Mail & package reception": "feature.mailReception",
  Showers: "feature.showers",
  "Accessible bathrooms": "feature.accessibleBathrooms",
  "EV charging": "feature.evCharging",
  "Grocery & provisions": "feature.grocery",
  Chandlery: "feature.chandlery",
  "Cafe / bar": "feature.cafeBar",
  "Clubhouse / lounge": "feature.clubhouse",
  Gym: "feature.gym",
  Sauna: "feature.sauna",
  "Picnic / BBQ area": "feature.picnicBbq",
  "Beach access": "feature.beachAccess",
  "Children's play area": "feature.playArea",
  "Dog exercise area": "feature.dogArea",
  CCTV: "feature.cctv",
  "Locked pontoons": "feature.lockedPontoons",
  "Night lighting": "feature.nightLighting",
  "Boatyard / shipyard": "feature.boatyard",
  "Marine engineer": "feature.marineEngineer",
  "Travel lift": "feature.travelLift",
  Crane: "feature.crane",
  "Slipway / boat ramp": "feature.slipway",
  "Dry storage": "feature.dryStorage",
  "Public transport nearby": "feature.publicTransport",
  "Airport transfer / taxi access": "feature.airportTransfer",
  Tender: "feature.tender",
  Paddleboard: "feature.paddleboard",
  Kayak: "feature.kayak",
  Bicycles: "feature.bicycles",
  "Swim platform": "feature.swimPlatform",
  "Snorkel gear": "feature.snorkelGear",
  "Bluewater / offshore": "experience.bluewater",
  Liveaboard: "experience.liveaboard",
  "Tropical weather": "experience.tropicalWeather",
  "Cold-weather boating": "experience.coldWeather",
  "Dinghy / outboard": "experience.dinghy",
  "First aid": "certification.firstAid",
  "Diesel engine course": "certification.dieselCourse",
  "Diesel troubleshooting": "skill.dieselTroubleshooting",
  "12V electrical": "skill.electrical",
  "Solar / lithium": "skill.solarLithium",
  Watermaker: "skill.watermaker",
  Generator: "skill.generator",
  "Blackwater / heads": "skill.blackwater",
  "Mooring & lines": "skill.mooringLines",
  "Storm preparation": "skill.stormPreparation",
  "Pet care": "skill.petCare",
  "Tender handling": "skill.tenderHandling",
};

function formatSitDates(language: string, dateStart: string, duration: string) {
  const [year, month, day] = dateStart.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  if (Number.isNaN(start.getTime())) return dateStart;
  const end = new Date(start);
  end.setDate(end.getDate() + Number.parseInt(duration, 10));
  const formatter = new Intl.DateTimeFormat(getIntlLocale(language), {
    day: "numeric",
    month: "short",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function Logo() {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(
    () => () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    },
    [],
  );

  function clearLongPressTimer() {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }

  return (
    <Link
      className="flex items-center gap-2.5"
      onClick={(event) => {
        if (!longPressTriggeredRef.current) return;
        event.preventDefault();
        longPressTriggeredRef.current = false;
      }}
      onContextMenu={(event) => {
        if (import.meta.env.DEV) event.preventDefault();
      }}
      onPointerCancel={clearLongPressTimer}
      onPointerDown={() => {
        if (!import.meta.env.DEV) return;
        longPressTriggeredRef.current = false;
        clearLongPressTimer();
        longPressTimerRef.current = setTimeout(() => {
          longPressTriggeredRef.current = true;
          window.dispatchEvent(new CustomEvent("open-command-palette"));
        }, 650);
      }}
      onPointerUp={clearLongPressTimer}
      to="/"
    >
      <span className="grid size-9 place-items-center rounded-full bg-coral text-white">
        <Anchor size={19} strokeWidth={2.5} />
      </span>
      <span className="font-display text-xl font-extrabold tracking-[-0.04em] text-navy">
        Boatstead
      </span>
    </Link>
  );
}

function Header() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const showAdmin = isAdminUser(user);
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors hover:text-navy ${isActive ? "font-semibold text-navy" : "text-slate"}`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <NavLink className={navClass} to="/boats">
              {t("nav.find")}
            </NavLink>
            <NavLink className={navClass} to="/how-it-works">
              {t("nav.how")}
            </NavLink>
            {user ? (
              <NavLink className={navClass} to="/saved">
                {t("nav.saved")}
              </NavLink>
            ) : null}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link
                  className="rounded-full px-3 py-2 text-sm font-semibold text-navy hover:bg-white"
                  to="/my-sits"
                >
                  {t("nav.manage")}
                </Link>
                <Link
                  className="flex min-w-0 max-w-[11.5rem] items-center gap-2 rounded-full bg-white py-1.5 pr-3 pl-1.5 text-sm font-semibold text-navy shadow-sm"
                  data-testid="nav-profile"
                  title={user.name}
                  to="/members/me"
                >
                  <img
                    alt=""
                    className="size-8 shrink-0 rounded-full object-cover"
                    onError={(event) => {
                      const img = event.currentTarget;
                      const fallback = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
                      if (img.src !== fallback) img.src = fallback;
                    }}
                    referrerPolicy="no-referrer"
                    src={user.image}
                  />
                  <span className="min-w-0 truncate" data-testid="nav-profile-name">
                    {user.name}
                  </span>
                </Link>
                <NotificationsMenu />
                <MessagesNavLink />
                <IconTooltip label="Availability">
                  <Link
                    aria-label="Availability"
                    className="rounded-full p-2.5 text-slate hover:bg-white hover:text-navy"
                    to="/availability"
                  >
                    <CalendarDays size={19} />
                  </Link>
                </IconTooltip>
                {showAdmin ? (
                  <IconTooltip label={t("nav.admin")}>
                    <Link
                      aria-label={t("nav.admin")}
                      className="rounded-full p-2.5 text-slate hover:bg-white hover:text-navy"
                      to="/admin"
                    >
                      <ShieldCheck size={18} />
                    </Link>
                  </IconTooltip>
                ) : null}
                <IconTooltip label={t("settings.title")}>
                  <Link
                    aria-label={t("settings.title")}
                    className="rounded-full p-2.5 text-slate hover:bg-white hover:text-navy"
                    to="/settings"
                  >
                    <Settings size={18} />
                  </Link>
                </IconTooltip>
                <IconTooltip label={t("nav.logout")}>
                  <button
                    aria-label={t("nav.logout")}
                    className="rounded-full p-2.5 text-slate hover:bg-white hover:text-coral"
                    onClick={() => setConfirmingLogout(true)}
                    type="button"
                  >
                    <LogOut size={18} />
                  </button>
                </IconTooltip>
              </>
            ) : (
              <>
                <button
                  className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-navy hover:bg-white"
                  onClick={() => openAuth("login")}
                  type="button"
                >
                  {t("nav.login")}
                </button>
                <button
                  className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-coral"
                  onClick={() => openAuth("signup")}
                  type="button"
                >
                  {t("nav.join")}
                </button>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1 md:hidden">
            {user && (
              <>
                <NotificationsMenu />
                <MessagesNavLink />
                <IconTooltip label="Availability">
                  <Link
                    aria-label="Availability"
                    className="rounded-full p-2.5 text-slate hover:bg-white hover:text-navy"
                    to="/availability"
                  >
                    <CalendarDays size={19} />
                  </Link>
                </IconTooltip>
                {showAdmin ? (
                  <IconTooltip label={t("nav.admin")}>
                    <Link
                      aria-label={t("nav.admin")}
                      className="rounded-full p-2.5 text-slate hover:bg-white hover:text-navy"
                      to="/admin"
                    >
                      <ShieldCheck size={18} />
                    </Link>
                  </IconTooltip>
                ) : null}
                <IconTooltip label={t("settings.title")}>
                  <Link
                    aria-label={t("settings.title")}
                    className="rounded-full p-2.5 text-slate hover:bg-white hover:text-navy"
                    to="/settings"
                  >
                    <Settings size={18} />
                  </Link>
                </IconTooltip>
              </>
            )}
          </div>
          <button
            aria-expanded={open}
            aria-label={open ? t("common.close") : t("nav.menu")}
            className="rounded-full p-2 md:hidden"
            onClick={() => setOpen(!open)}
            type="button"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="border-t border-line bg-cream px-5 py-5 md:hidden">
            <div className="flex flex-col gap-4 font-semibold">
              <Link onClick={() => setOpen(false)} to="/boats">
                {t("nav.find")}
              </Link>
              <Link onClick={() => setOpen(false)} to="/how-it-works">
                {t("nav.how")}
              </Link>
              {user ? (
                <Link onClick={() => setOpen(false)} to="/saved">
                  {t("nav.saved")}
                </Link>
              ) : null}
              {user && (
                <>
                  <Link onClick={() => setOpen(false)} to="/messages">
                    {t("nav.messages")}
                  </Link>
                  {showAdmin ? (
                    <Link onClick={() => setOpen(false)} to="/admin">
                      {t("nav.admin")}
                    </Link>
                  ) : null}
                  <Link onClick={() => setOpen(false)} to="/settings">
                    {t("settings.title")}
                  </Link>
                  <button
                    className="text-left text-coral"
                    onClick={() => setConfirmingLogout(true)}
                    type="button"
                  >
                    {t("nav.logout")}
                  </button>
                </>
              )}
              {!user && (
                <>
                  <button className="text-left" onClick={() => openAuth("login")} type="button">
                    {t("nav.login")}
                  </button>
                  <button className="text-left" onClick={() => openAuth("signup")} type="button">
                    {t("nav.join")}
                  </button>
                </>
              )}
            </div>
          </nav>
        )}
      </header>
      {confirmingLogout && (
        <div
          className="fixed inset-0 z-70 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setConfirmingLogout(false);
          }}
        >
          <section
            aria-labelledby="logout-confirm-title"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-float md:p-8"
            role="dialog"
          >
            <span className="grid size-12 place-items-center rounded-full bg-coral/10 text-coral">
              <LogOut size={24} />
            </span>
            <h2
              className="mt-5 font-display text-2xl font-bold text-navy"
              id="logout-confirm-title"
            >
              {t("nav.logoutConfirmTitle")}
            </h2>
            <p className="mt-3 leading-7 text-slate">{t("nav.logoutConfirmText")}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                className="rounded-xl border border-line px-5 py-3 font-bold text-navy"
                onClick={() => setConfirmingLogout(false)}
                type="button"
              >
                {t("common.cancel")}
              </button>
              <button
                className="rounded-xl bg-coral px-5 py-3 font-bold text-white hover:bg-coral-dark"
                onClick={() => {
                  logout();
                  setConfirmingLogout(false);
                  setOpen(false);
                }}
                type="button"
              >
                {t("nav.logoutConfirm")}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function SearchPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [where, setWhere] = useState("");
  const [type, setType] = useState("");
  const [dates, setDates] = useState({ startDate: "", endDate: "" });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (where) params.set("q", where);
    if (type) {
      const slug = vesselTypeToSlug(type);
      if (slug) params.set("type", slug);
    }
    if (dates.startDate) params.set("from", dates.startDate);
    if (dates.endDate) params.set("to", dates.endDate);
    navigate(`/boats?${params.toString()}`);
  }

  return (
    <form
      className={`grid rounded-2xl border border-line bg-white shadow-float md:grid-cols-[1.1fr_0.85fr_0.8fr_auto] ${compact ? "" : "mx-auto max-w-5xl"}`}
      onSubmit={submit}
    >
      <DestinationAutocomplete
        multiple
        onChange={setWhere}
        testId="home-destination"
        value={where}
        variant="home"
      />
      <DateRangePicker endDate={dates.endDate} onChange={setDates} startDate={dates.startDate} />
      <label className="flex items-center gap-3 border-b border-line px-5 py-4 md:border-r md:border-b-0">
        <ShipWheel className="shrink-0 text-coral" size={20} />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-[0.13em] text-slate">
            {t("search.vessel")}
          </span>
          <Select onChange={(event) => setType(event.target.value)} value={type} variant="inline">
            <option value="">{t("search.anyVessel")}</option>
            {VESSEL_TYPES.map((vesselType) => (
              <option key={vesselType} value={vesselType}>
                {displayLabel(t, vesselType)}
              </option>
            ))}
          </Select>
        </span>
      </label>
      <button
        className="m-2 flex items-center justify-center gap-2 rounded-xl bg-coral px-7 py-3 font-bold text-white transition hover:bg-coral-dark"
        type="submit"
      >
        <Search size={18} /> {t("search.submit")}
      </button>
    </form>
  );
}

function TrustItem({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-seafoam text-teal">
        {icon}
      </span>
      <div>
        <h3 className="font-display font-bold text-navy">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate">{children}</p>
      </div>
    </div>
  );
}

function vesselTypeLengthYear(
  t: ReturnType<typeof useTranslation>["t"],
  boat: { type: string; length: string; yearBuilt?: number | null },
  measurementSystem: "metric" | "imperial",
) {
  const parts = [displayLabel(t, boat.type), formatBoatLength(boat.length, measurementSystem)];
  if (boat.yearBuilt) parts.push(t("boat.yearBuiltShort", { year: boat.yearBuilt }));
  return parts.join(" · ");
}

function BoatCard({ boat, preview = false }: { boat: Boat; preview?: boolean }) {
  const { i18n, t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const saved = useAppStore((state) => state.saved);
  const toggleSaved = useAppStore((state) => state.toggleSaved);
  const measurementSystem =
    useAppStore((state) => state.user?.measurementSystem) ?? detectMeasurementSystem();
  const isSaved = Boolean(user) && saved.includes(boat.id);
  const image = (
    <img
      alt={t("boat.imageAlt", { name: boat.name, type: displayLabel(t, boat.type) })}
      className={coverPhotoClassName(
        preview ? "" : "transition duration-500 group-hover:scale-[1.03]",
      )}
      onError={(event) => {
        event.currentTarget.src = fallbackImage;
      }}
      src={optimizePhotoUrl(boat.image || fallbackImage, 900)}
    />
  );

  return (
    <article className={preview ? "pointer-events-none select-none" : "group"}>
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-seafoam">
        {preview ? image : <Link to={`/boats/${boat.id}`}>{image}</Link>}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
          {boat.featured && (
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-navy shadow-sm">
              {t("boat.topMatch")}
            </span>
          )}
          {boat.phase && boat.phase !== "acceptingApplicants" && (
            <SitPhaseBadge phase={boat.phase} size="md" />
          )}
          {boat.phase === "acceptingApplicants" &&
            boat.dateStart &&
            isHappeningSoon(boat.dateStart) && (
              <span className="rounded-full bg-coral px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                {t("boat.happeningSoon")}
              </span>
            )}
          <span className="rounded-full bg-white/95 shadow-sm">
            <SitTypeBadge sitType={boat.sitType} size="md" />
          </span>
        </div>
        {!preview && (
          <button
            aria-label={isSaved ? t("boat.removeSaved") : t("boat.save")}
            className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/90 text-navy shadow-sm transition hover:scale-105"
            onClick={() => {
              if (!user) {
                openAuth("signup");
                return;
              }
              toggleSaved(boat.id);
            }}
            type="button"
          >
            <Heart className={isSaved ? "fill-coral text-coral" : ""} size={19} />
          </button>
        )}
      </div>
      {preview ? (
        <div className="block pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal">
                {vesselTypeLengthYear(t, boat, measurementSystem)}
              </p>
              <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-navy">
                {boat.name}
              </h3>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold">
              <Star className="fill-sun text-sun" size={15} /> {boat.rating}
            </span>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate">
            <MapPin size={15} />{" "}
            {formatSitLocation(boat.location, boat.country).trim() ||
              t("editorPreview.locationUnknown")}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
            {boat.dateStart ? (
              <>
                <span className="font-semibold text-navy">
                  {formatSitDates(i18n.language, boat.dateStart, boat.duration)}
                </span>
                <span className="text-slate">
                  {t("duration.nights", { count: Number.parseInt(boat.duration, 10) || 0 })}
                </span>
              </>
            ) : (
              <span className="text-slate">{t("editorPreview.datesPending")}</span>
            )}
          </div>
        </div>
      ) : (
        <Link className="block pt-4" to={`/boats/${boat.id}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal">
                {vesselTypeLengthYear(t, boat, measurementSystem)}
              </p>
              <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-navy">
                {boat.name}
              </h3>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold">
              <Star className="fill-sun text-sun" size={15} /> {boat.rating}
            </span>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate">
            <MapPin size={15} />{" "}
            {formatSitLocation(boat.location, boat.country).trim() ||
              t("editorPreview.locationUnknown")}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
            <span className="font-semibold text-navy">
              {formatSitDates(i18n.language, boat.dateStart, boat.duration)}
            </span>
            <span className="text-slate">
              {t("duration.nights", { count: Number.parseInt(boat.duration, 10) })}
            </span>
          </div>
        </Link>
      )}
    </article>
  );
}

function FeaturedBoats() {
  const { data: boats = [], isLoading } = useQuery(queries.boats.all);
  if (isLoading) {
    return (
      <div className="grid gap-x-6 gap-y-10 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <BoatCardSkeleton key={item} showBadge={item === 0} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-x-6 gap-y-10 md:grid-cols-3">
      {boats.slice(0, 3).map((boat) => (
        <BoatCard boat={boat} key={boat.id} />
      ))}
    </div>
  );
}

function HomePage() {
  const { t } = useTranslation();
  return (
    <>
      <section className="relative z-10 overflow-x-clip px-5 pt-16 pb-20 lg:px-8 lg:pt-24">
        <div className="ocean-orb absolute -top-40 -right-44 size-152 rounded-full" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-seafoam px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-teal">
                <Waves size={15} /> {t("home.kicker")}
              </span>
              <h1 className="mt-6 font-display text-5xl leading-[1.02] font-extrabold tracking-[-0.055em] text-navy sm:text-6xl lg:text-7xl">
                {t("home.titleOne")}
                <br />
                <span className="text-coral">{t("home.titleTwo")}</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate">{t("home.subtitle")}</p>
              <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-navy">
                <span className="flex items-center gap-2">
                  <CircleCheck className="text-teal" size={18} /> {t("home.verified")}
                </span>
                <span className="flex items-center gap-2">
                  <CircleCheck className="text-teal" size={18} /> {t("home.noFees")}
                </span>
                <span className="flex items-center gap-2">
                  <CircleCheck className="text-teal" size={18} /> {t("home.marine")}
                </span>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="hero-image ml-auto aspect-4/5 max-w-md overflow-hidden rounded-4xl bg-seafoam">
                <img
                  alt={t("home.heroImageAlt")}
                  className="h-full w-full object-cover"
                  src="https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1200&q=90"
                />
              </div>
              <div className="absolute bottom-6 -left-6 rounded-2xl bg-white p-4 shadow-float">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[18, 25, 36].map((id) => (
                      <img
                        alt=""
                        className="size-9 rounded-full border-2 border-white object-cover"
                        key={id}
                        src={`https://i.pravatar.cc/80?img=${id}`}
                      />
                    ))}
                  </div>
                  <div>
                    <div className="flex text-sun">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star className="fill-current" key={star} size={12} />
                      ))}
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-navy">{t("home.handovers")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative z-30 mt-12 lg:-mt-2">
            <SearchPanel />
          </div>
        </div>
      </section>

      <section className="relative z-0 border-y border-line bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
          <TrustItem icon={<ShieldCheck size={22} />} title={t("home.trustTitle")}>
            {t("home.trustText")}
          </TrustItem>
          <TrustItem icon={<Wrench size={22} />} title={t("home.boatTitle")}>
            {t("home.boatText")}
          </TrustItem>
          <TrustItem icon={<MessageCircle size={22} />} title={t("home.handoverTitle")}>
            {t("home.handoverText")}
          </TrustItem>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="eyebrow">{t("home.open")}</p>
              <h2 className="section-title">{t("home.sectionTitle")}</h2>
            </div>
            <Link
              className="hidden items-center gap-2 font-bold text-teal hover:text-coral md:flex"
              to="/boats"
            >
              {t("home.explore")} <ArrowRight size={18} />
            </Link>
          </div>
          <FeaturedBoats />
        </div>
      </section>

      <section className="px-5 pb-24 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-4xl bg-navy px-7 py-14 text-white md:px-14">
          <div className="absolute right-0 bottom-0 text-white/5">
            <Anchor size={280} strokeWidth={1} />
          </div>
          <div className="relative max-w-2xl">
            <p className="eyebrow text-aqua!">{t("home.ownerKicker")}</p>
            <h2 className="font-display text-4xl font-extrabold tracking-[-0.045em] md:text-5xl">
              {t("home.ownerTitle")}
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">{t("home.ownerText")}</p>
            <button
              className="mt-8 rounded-full bg-coral px-6 py-3.5 font-bold transition hover:bg-white hover:text-navy"
              type="button"
            >
              {t("home.list")}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

const BOATS_PER_PAGE = 9;

function parseSitTypeParam(value: string | null): "all" | SitType {
  if (value === "liveaboard" || value === "daytimeChecks") return value;
  return "all";
}

function BoatsPage() {
  const { t } = useTranslation();
  const measurementSystem =
    useAppStore((state) => state.user?.measurementSystem) ?? detectMeasurementSystem();
  const lengthUnit: LengthUnit = measurementSystem === "imperial" ? "ft" : "m";
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [type, setType] = useState(() => vesselTypeFromParam(params.get("type")) ?? "All vessels");
  const [sitTypeFilter, setSitTypeFilter] = useState<"all" | SitType>(() =>
    parseSitTypeParam(params.get("sitType")),
  );
  const [dates, setDates] = useState({
    startDate: params.get("from") ?? "",
    endDate: params.get("to") ?? "",
  });
  const [petOnly, setPetOnly] = useState(params.get("pet") === "1" || params.get("pet") === "true");
  const [availability, setAvailability] = useState<"all" | "open" | "accepted">(() => {
    const value = params.get("availability");
    return value === "open" || value === "accepted" ? value : "all";
  });
  const [minLengthDisplay, setMinLengthDisplay] = useState(() => {
    const metres = Number.parseFloat(params.get("minLength") ?? "");
    return Number.isFinite(metres) ? metresToUnit(metres, lengthUnit) : "";
  });
  const [maxLengthDisplay, setMaxLengthDisplay] = useState(() => {
    const metres = Number.parseFloat(params.get("maxLength") ?? "");
    return Number.isFinite(metres) ? metresToUnit(metres, lengthUnit) : "";
  });
  const [yearFrom, setYearFrom] = useState(params.get("yearFrom") ?? "");
  const [yearTo, setYearTo] = useState(params.get("yearTo") ?? "");
  const [advancedOpen, setAdvancedOpen] = useState(
    () =>
      Boolean(params.get("minLength")) ||
      Boolean(params.get("maxLength")) ||
      Boolean(params.get("yearFrom")) ||
      Boolean(params.get("yearTo")) ||
      params.get("pet") === "1" ||
      params.get("pet") === "true" ||
      params.get("availability") === "open" ||
      params.get("availability") === "accepted",
  );
  const [view, setView] = useState<"list" | "map">(() =>
    params.get("view") === "map" ? "map" : "list",
  );
  const [sort, setSort] = useState<
    "recommended" | "soonest" | "latest" | "shortest" | "longest" | "popular"
  >(() => {
    const value = params.get("sort");
    if (
      value === "soonest" ||
      value === "latest" ||
      value === "shortest" ||
      value === "longest" ||
      value === "popular" ||
      value === "recommended"
    ) {
      return value;
    }
    return "recommended";
  });
  const [page, setPage] = useState(() => {
    const value = Number.parseInt(params.get("page") ?? "0", 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  });
  const [mapBoats, setMapBoats] = useState<Boat[]>([]);
  const [mapTotal, setMapTotal] = useState(0);
  const [mapLoading, setMapLoading] = useState(false);
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  function lengthDisplayToMetres(value: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const metres = lengthToMetres(`${trimmed} ${lengthUnit}`);
    return Number.isFinite(metres) ? Math.round(metres * 100) / 100 : undefined;
  }

  function syncBoatSearchUrl(next: {
    q?: string;
    type?: string;
    sitType?: "all" | SitType;
    from?: string;
    to?: string;
    pet?: boolean;
    availability?: "all" | "open" | "accepted";
    minLengthDisplay?: string;
    maxLengthDisplay?: string;
    yearFrom?: string;
    yearTo?: string;
    sort?: typeof sort;
    page?: number;
    view?: "list" | "map";
  }) {
    const nextParams = new URLSearchParams(window.location.search);
    const q = next.q ?? query;
    const vesselType = next.type ?? type;
    const sitType = next.sitType ?? sitTypeFilter;
    const from = next.from ?? dates.startDate;
    const to = next.to ?? dates.endDate;
    const pet = next.pet ?? petOnly;
    const avail = next.availability ?? availability;
    const minDisplay = next.minLengthDisplay ?? minLengthDisplay;
    const maxDisplay = next.maxLengthDisplay ?? maxLengthDisplay;
    const yearFromValue = next.yearFrom ?? yearFrom;
    const yearToValue = next.yearTo ?? yearTo;
    const sortValue = next.sort ?? sort;
    const pageValue = next.page ?? page;
    const viewValue = next.view ?? view;
    const minLengthM = lengthDisplayToMetres(minDisplay);
    const maxLengthM = lengthDisplayToMetres(maxDisplay);
    const yearFromNum = yearFromValue.trim() ? Number.parseInt(yearFromValue, 10) : undefined;
    const yearToNum = yearToValue.trim() ? Number.parseInt(yearToValue, 10) : undefined;

    if (q) nextParams.set("q", q);
    else nextParams.delete("q");
    if (vesselType && vesselType !== "All vessels") {
      const slug = vesselTypeToSlug(vesselType);
      if (slug) nextParams.set("type", slug);
      else nextParams.delete("type");
    } else nextParams.delete("type");
    if (sitType !== "all") nextParams.set("sitType", sitType);
    else nextParams.delete("sitType");
    if (from) nextParams.set("from", from);
    else nextParams.delete("from");
    if (to) nextParams.set("to", to);
    else nextParams.delete("to");
    if (pet) nextParams.set("pet", "1");
    else nextParams.delete("pet");
    if (avail !== "all") nextParams.set("availability", avail);
    else nextParams.delete("availability");
    if (minLengthM != null) nextParams.set("minLength", String(minLengthM));
    else nextParams.delete("minLength");
    if (maxLengthM != null) nextParams.set("maxLength", String(maxLengthM));
    else nextParams.delete("maxLength");
    if (yearFromNum != null && Number.isFinite(yearFromNum)) {
      nextParams.set("yearFrom", String(yearFromNum));
    } else nextParams.delete("yearFrom");
    if (yearToNum != null && Number.isFinite(yearToNum)) {
      nextParams.set("yearTo", String(yearToNum));
    } else nextParams.delete("yearTo");
    if (sortValue !== "recommended") nextParams.set("sort", sortValue);
    else nextParams.delete("sort");
    if (pageValue > 0) nextParams.set("page", String(pageValue));
    else nextParams.delete("page");
    if (viewValue === "map") nextParams.set("view", "map");
    else nextParams.delete("view");

    const search = nextParams.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`,
    );
  }

  const filterParams = useMemo(
    () => ({
      q: query || undefined,
      type: type === "All vessels" ? undefined : type,
      sitType: sitTypeFilter,
      from: dates.startDate || undefined,
      to: dates.endDate || undefined,
      pet: petOnly || undefined,
      availability,
      minLengthM: lengthDisplayToMetres(minLengthDisplay),
      maxLengthM: lengthDisplayToMetres(maxLengthDisplay),
      yearFrom: yearFrom.trim() ? Number.parseInt(yearFrom, 10) || undefined : undefined,
      yearTo: yearTo.trim() ? Number.parseInt(yearTo, 10) || undefined : undefined,
      sort,
    }),
    [
      availability,
      dates.endDate,
      dates.startDate,
      lengthUnit,
      maxLengthDisplay,
      minLengthDisplay,
      petOnly,
      query,
      sitTypeFilter,
      sort,
      type,
      yearFrom,
      yearTo,
    ],
  );

  const listSearchParams = useMemo(
    () => ({
      ...filterParams,
      page,
      limit: BOATS_PER_PAGE,
    }),
    [filterParams, page],
  );

  const mapFitKey = useMemo(() => JSON.stringify(filterParams), [filterParams]);

  const { data, isLoading, isFetching } = useQuery({
    ...queries.boats.search(listSearchParams),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (view !== "map") return;
    let cancelled = false;
    setMapBoats([]);
    setMapTotal(0);
    setMapLoading(true);

    void (async () => {
      const seen = new Set<string>();
      const accumulated: Boat[] = [];
      let pageIdx = 0;
      let totalPages = 1;
      let total = 0;
      try {
        while (!cancelled && pageIdx < totalPages) {
          const pageParams = { ...filterParams, page: pageIdx, limit: BOATS_PER_PAGE };
          const result = await queryClient.fetchQuery(queries.boats.search(pageParams));
          if (cancelled) return;
          total = result.total;
          totalPages = Math.max(1, result.totalPages);
          for (const boat of result.boats) {
            if (!seen.has(boat.id)) {
              seen.add(boat.id);
              accumulated.push(boat);
            }
          }
          setMapBoats([...accumulated]);
          setMapTotal(total);
          pageIdx += 1;
          if (result.boats.length === 0) break;
        }
      } finally {
        if (!cancelled) setMapLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [view, mapFitKey, filterParams, queryClient]);

  const listBoats = data?.boats ?? [];
  const listTotal = data?.total ?? 0;
  const totalItems = view === "map" ? mapTotal : listTotal;
  const currentPage = data?.page ?? page;
  const totalPages = data?.totalPages ?? 1;
  const mapToggleDisabled = view === "list" && !isLoading && listTotal === 0;

  function updateLocationQuery(value: string) {
    setQuery(value);
    syncBoatSearchUrl({ q: value, page: 0 });
  }

  function updateSitTypeFilter(value: "all" | SitType) {
    setSitTypeFilter(value);
    syncBoatSearchUrl({ sitType: value, page: 0 });
  }

  function updateView(next: "list" | "map") {
    setView(next);
    syncBoatSearchUrl({ view: next });
  }

  useEffect(() => {
    setPage(0);
  }, [
    availability,
    dates.endDate,
    dates.startDate,
    maxLengthDisplay,
    minLengthDisplay,
    petOnly,
    query,
    sitTypeFilter,
    sort,
    type,
    yearFrom,
    yearTo,
  ]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  function goToPage(nextPage: number) {
    setPage(nextPage);
    syncBoatSearchUrl({ page: nextPage });
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderFilteredResults() {
    if (view === "map") {
      if (mapLoading && mapBoats.length === 0) {
        return (
          <div aria-busy="true" aria-live="polite" className="mt-6" role="status">
            <span className="sr-only">{t("map.loadingMore")}</span>
            <ShimmerBlock className="h-[min(68vh,44rem)] min-h-112 w-full rounded-3xl" />
          </div>
        );
      }
      if (mapBoats.length > 0 || mapLoading) {
        return (
          <div className="mt-6">
            {mapLoading ? (
              <p className="mb-3 text-sm font-semibold text-slate" role="status">
                {t("map.loadingProgress", {
                  loaded: mapBoats.length,
                  total: mapTotal || mapBoats.length,
                })}
              </p>
            ) : null}
            <BoatMap boats={mapBoats} fitKey={mapFitKey} />
          </div>
        );
      }
    }
    if (totalItems) {
      return (
        <>
          <div
            className={`mt-6 grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3 ${
              isFetching ? "opacity-70" : ""
            }`}
          >
            {listBoats.map((boat) => (
              <BoatCard boat={boat} key={boat.id} />
            ))}
          </div>
          <ResultsPagination
            currentPage={currentPage}
            onPageChange={goToPage}
            pageSize={BOATS_PER_PAGE}
            totalItems={totalItems}
          />
        </>
      );
    }
    return (
      <div className="mt-16 rounded-2xl border border-line bg-white py-16 text-center">
        <LifeBuoy className="mx-auto text-teal" size={36} />
        <h2 className="mt-4 font-display text-xl font-bold text-navy">{t("boats.empty")}</h2>
        <p className="mt-2 text-sm text-slate">{t("boats.emptyHint")}</p>
        {filtersActive && (
          <button
            className="mt-6 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-ink"
            onClick={resetFilters}
            type="button"
          >
            {t("boats.resetFilters")}
          </button>
        )}
      </div>
    );
  }

  function resetFilters() {
    setQuery("");
    setType("All vessels");
    setSitTypeFilter("all");
    setDates({ startDate: "", endDate: "" });
    setPetOnly(false);
    setAvailability("all");
    setMinLengthDisplay("");
    setMaxLengthDisplay("");
    setYearFrom("");
    setYearTo("");
    setAdvancedOpen(false);
    setSort("recommended");
    setPage(0);
    window.history.replaceState(null, "", window.location.pathname);
  }

  const filtersActive =
    Boolean(query) ||
    type !== "All vessels" ||
    sitTypeFilter !== "all" ||
    Boolean(dates.startDate) ||
    Boolean(dates.endDate) ||
    petOnly ||
    availability !== "all" ||
    Boolean(minLengthDisplay.trim()) ||
    Boolean(maxLengthDisplay.trim()) ||
    Boolean(yearFrom.trim()) ||
    Boolean(yearTo.trim());

  return (
    <main className="px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <h1 className="section-title">{t("boats.title")}</h1>
          <p className="mt-3 text-slate">{t("boats.subtitle")}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm md:flex-row md:flex-wrap">
          <DestinationAutocomplete
            multiple
            onChange={updateLocationQuery}
            testId="boats-destination"
            value={query}
          />
          <DateRangePicker
            endDate={dates.endDate}
            onChange={(next) => {
              setDates(next);
              syncBoatSearchUrl({ from: next.startDate, to: next.endDate, page: 0 });
            }}
            startDate={dates.startDate}
            variant="browse"
          />
          <Select
            aria-label={t("search.vessel")}
            onChange={(event) => {
              const value = event.target.value;
              setType(value);
              syncBoatSearchUrl({ type: value, page: 0 });
            }}
            value={type}
          >
            <option value="All vessels">{t("search.anyVessel")}</option>
            {VESSEL_TYPES.map((option) => (
              <option key={option} value={option}>
                {displayLabel(t, option)}
              </option>
            ))}
          </Select>
          <Select
            aria-label={t("boats.sitTypeLabel")}
            onChange={(event) => updateSitTypeFilter(event.target.value as "all" | SitType)}
            value={sitTypeFilter}
          >
            <option value="all">{t("boats.sitTypeAll")}</option>
            <option value="liveaboard">{t("sitType.liveaboard")}</option>
            <option value="daytimeChecks">{t("sitType.daytimeChecks")}</option>
          </Select>
        </div>
        <div className="mt-3">
          <button
            aria-controls="boats-advanced-filters"
            aria-expanded={advancedOpen}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-teal"
            onClick={() => setAdvancedOpen((open) => !open)}
            type="button"
          >
            {t("boats.advancedFilters")}
            <ChevronDown
              aria-hidden="true"
              className={`transition ${advancedOpen ? "rotate-180" : ""}`}
              size={16}
            />
          </button>
          {advancedOpen ? (
            <div
              className="mt-3 grid gap-3 rounded-2xl border border-line bg-cream/40 p-4 sm:grid-cols-2 lg:grid-cols-4"
              id="boats-advanced-filters"
            >
              <div className="flex h-full flex-col justify-end">
                <label
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${petOnly ? "border-teal bg-seafoam text-teal" : "border-line bg-white text-slate"}`}
                >
                  <span className="flex cursor-pointer items-center gap-2">
                    <input
                      checked={petOnly}
                      className="size-4 accent-teal"
                      onChange={(event) => {
                        const value = event.target.checked;
                        setPetOnly(value);
                        syncBoatSearchUrl({ pet: value, page: 0 });
                      }}
                      type="checkbox"
                    />
                    {t("boats.pets")}
                  </span>
                </label>
              </div>
              <label>
                <span className="form-label">{t("boats.availabilityLabel")}</span>
                <Select
                  aria-label={t("boats.availabilityLabel")}
                  onChange={(event) => {
                    const value = event.target.value as "all" | "open" | "accepted";
                    setAvailability(value);
                    syncBoatSearchUrl({ availability: value, page: 0 });
                  }}
                  value={availability}
                  variant="form"
                >
                  <option value="all">{t("boats.availabilityAll")}</option>
                  <option value="open">{t("boats.availabilityOpen")}</option>
                  <option value="accepted">{t("boats.availabilityAccepted")}</option>
                </Select>
              </label>
              <label>
                <span className="form-label">
                  {t("boats.minLength", {
                    unit: t(lengthUnit === "ft" ? "units.feet" : "units.meters"),
                  })}
                </span>
                <input
                  className="form-input"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => {
                    const value = event.target.value;
                    setMinLengthDisplay(value);
                    syncBoatSearchUrl({ minLengthDisplay: value, page: 0 });
                  }}
                  placeholder={t("boats.lengthPlaceholder")}
                  step="0.1"
                  type="number"
                  value={minLengthDisplay}
                />
              </label>
              <label>
                <span className="form-label">
                  {t("boats.maxLength", {
                    unit: t(lengthUnit === "ft" ? "units.feet" : "units.meters"),
                  })}
                </span>
                <input
                  className="form-input"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => {
                    const value = event.target.value;
                    setMaxLengthDisplay(value);
                    syncBoatSearchUrl({ maxLengthDisplay: value, page: 0 });
                  }}
                  placeholder={t("boats.lengthPlaceholder")}
                  step="0.1"
                  type="number"
                  value={maxLengthDisplay}
                />
              </label>
              <label>
                <span className="form-label">{t("boats.yearFrom")}</span>
                <input
                  className="form-input"
                  inputMode="numeric"
                  max={maxYearBuilt()}
                  min={MIN_YEAR_BUILT}
                  onChange={(event) => {
                    const value = event.target.value;
                    setYearFrom(value);
                    syncBoatSearchUrl({ yearFrom: value, page: 0 });
                  }}
                  placeholder={t("boats.yearPlaceholder")}
                  type="number"
                  value={yearFrom}
                />
              </label>
              <label>
                <span className="form-label">{t("boats.yearTo")}</span>
                <input
                  className="form-input"
                  inputMode="numeric"
                  max={maxYearBuilt()}
                  min={MIN_YEAR_BUILT}
                  onChange={(event) => {
                    const value = event.target.value;
                    setYearTo(value);
                    syncBoatSearchUrl({ yearTo: value, page: 0 });
                  }}
                  placeholder={t("boats.yearPlaceholder")}
                  type="number"
                  value={yearTo}
                />
              </label>
            </div>
          ) : null}
        </div>
        {isLoading && view === "list" ? (
          <BoatsPageLoadingSkeleton />
        ) : (
          <>
            <div
              className="mt-9 flex flex-wrap items-center justify-between gap-3"
              ref={resultsTopRef}
            >
              <p className="text-sm text-slate">{t("boats.results", { count: totalItems })}</p>
              <div className="flex items-center gap-2">
                <div
                  aria-disabled={mapToggleDisabled}
                  aria-label={t("map.viewLabel")}
                  className={`flex rounded-xl border border-line bg-white p-1 ${
                    mapToggleDisabled ? "opacity-50" : ""
                  }`}
                  role="group"
                >
                  <button
                    aria-pressed={view === "list"}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold disabled:cursor-not-allowed ${
                      view === "list" ? "bg-seafoam text-teal" : "text-slate"
                    }`}
                    onClick={() => updateView("list")}
                    type="button"
                  >
                    <List size={16} /> {t("map.listView")}
                  </button>
                  <button
                    aria-pressed={view === "map"}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold disabled:cursor-not-allowed ${
                      view === "map" ? "bg-seafoam text-teal" : "text-slate"
                    }`}
                    disabled={mapToggleDisabled}
                    onClick={() => updateView("map")}
                    type="button"
                  >
                    <Map size={16} /> {t("map.mapView")}
                  </button>
                </div>
                {view === "list" && (
                  <label
                    className={`flex items-center gap-2 text-sm text-slate ${
                      totalItems === 0 ? "opacity-50" : ""
                    }`}
                  >
                    <span className="sr-only">{t("boats.sortLabel")}</span>
                    <Select
                      aria-label={t("boats.sortLabel")}
                      disabled={totalItems === 0}
                      onChange={(event) => {
                        const value = event.target.value as typeof sort;
                        setSort(value);
                        syncBoatSearchUrl({ sort: value, page: 0 });
                      }}
                      value={sort}
                      variant="sort"
                    >
                      <option value="recommended">{t("boats.sortRecommended")}</option>
                      <option value="soonest">{t("boats.sortSoonest")}</option>
                      <option value="latest">{t("boats.sortLatest")}</option>
                      <option value="shortest">{t("boats.sortShortest")}</option>
                      <option value="longest">{t("boats.sortLongest")}</option>
                      <option value="popular">{t("boats.sortPopular")}</option>
                    </Select>
                  </label>
                )}
              </div>
            </div>
            {renderFilteredResults()}
          </>
        )}
      </div>
    </main>
  );
}

const systemIcons = [Gauge, BatteryCharging, Droplets, Zap];

function splitHomePort(homePort: string) {
  const parts = homePort
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return { location: homePort.trim(), country: "" };
  return {
    location: parts.slice(0, -1).join(", "),
    country: parts.at(-1) ?? "",
  };
}

function matchesHomePort(location: string, country: string, homePort: string) {
  const home = splitHomePort(homePort);
  return (
    location.trim().toLowerCase() === home.location.toLowerCase() &&
    country.trim().toLowerCase() === home.country.toLowerCase()
  );
}

function formatSitLocation(location: string, country: string) {
  if (!country || location.toLowerCase().includes(country.toLowerCase())) return location;
  return `${location}, ${country}`;
}

const BOAT_FEATURE_GROUPS = [
  {
    title: "Life aboard",
    options: [
      "Wi-Fi",
      "Bathroom",
      "Hot water",
      "Full kitchen",
      "Refrigerator",
      "Bedding & linens",
      "Heating",
      "Air conditioning",
      "Deck shower",
      "Washing machine",
      "Fans",
      "Mosquito screens",
      "Coffee maker",
      "Microwave",
      "Oven",
      "Freezer",
      "Dryer",
      "Dishwasher",
      "TV",
      "Sound system",
      "Dedicated workspace",
      "Outdoor BBQ",
    ],
  },
  {
    title: "Utilities & services",
    options: [
      "Shore power",
      "Fresh water hookup",
      "Pump-out station",
      "Dock Wi-Fi",
      "Fuel dock",
      "Waste & recycling",
      "LPG / gas refill",
      "Marina staff",
      "Ice",
      "Mail & package reception",
    ],
  },
  {
    title: "Marina facilities",
    options: [
      "Parking",
      "Showers",
      "Laundry",
      "Grocery & provisions",
      "Cafe / bar",
      "Restaurant",
      "Chandlery",
      "Accessible bathrooms",
      "EV charging",
      "Clubhouse / lounge",
      "Beach access",
      "Picnic / BBQ area",
      "Gym",
      "Swimming pool",
      "Sauna",
      "Dog exercise area",
      "Children's play area",
    ],
  },
  {
    title: "Security & access",
    options: ["Gated access", "24/7 security", "CCTV", "Locked pontoons", "Night lighting"],
  },
  {
    title: "Boatyard & transport",
    options: [
      "Public transport nearby",
      "Airport transfer / taxi access",
      "Boatyard / shipyard",
      "Marine engineer",
      "Slipway / boat ramp",
      "Dry storage",
      "Travel lift",
      "Crane",
    ],
  },
  {
    title: "Water & recreation",
    options: ["Tender", "Swim platform", "Snorkel gear", "Kayak", "Paddleboard", "Bicycles"],
  },
];

/** Two rows of three on md+: five chips + a trailing “more” badge. */
const BOAT_FEATURES_COLLAPSED_VISIBLE = 5;

const ALL_BOAT_FEATURES = BOAT_FEATURE_GROUPS.flatMap((group) => group.options);

/** Legacy amenity ids still stored on older vessels. */
const BOAT_FEATURE_ALIASES: Record<string, string> = {
  "On-site laundry": "Laundry",
  "On-site restaurant": "Restaurant",
};

function normalizeBoatFeature(value: string) {
  return BOAT_FEATURE_ALIASES[value] ?? value;
}

function displayLabel(t: ReturnType<typeof useTranslation>["t"], value: string) {
  const key = DISPLAY_LABEL_KEYS[normalizeBoatFeature(value)] ?? DISPLAY_LABEL_KEYS[value];
  return key ? t(key) : value;
}
const FEATURE_GROUP_KEYS: Record<string, string> = {
  "Life aboard": "featureGroup.aboard",
  "Utilities & services": "featureGroup.utilities",
  "Marina facilities": "featureGroup.marina",
  "Security & access": "featureGroup.security",
  "Boatyard & transport": "featureGroup.boatyard",
  "Water & recreation": "featureGroup.recreation",
};
const SITTER_EXPERIENCE = [
  "Sailing yacht",
  "Catamaran",
  "Motor yacht",
  "Trawler",
  "Narrowboat / houseboat",
  "Bluewater / offshore",
  "Liveaboard",
  "Tropical weather",
  "Cold-weather boating",
  "Dinghy / outboard",
];
const SITTER_CERTIFICATIONS = [
  "RYA Day Skipper",
  "RYA Yachtmaster",
  "ICC",
  "ASA 104 / 114",
  "STCW",
  "VHF / SRC",
  "First aid",
  "Diesel engine course",
];
const SITTER_SKILLS = [
  "Diesel troubleshooting",
  "12V electrical",
  "Shore power",
  "Solar / lithium",
  "Watermaker",
  "Generator",
  "Blackwater / heads",
  "Mooring & lines",
  "Storm preparation",
  "Pet care",
  "Tender handling",
];

function ApplyModal({
  boat,
  close,
  confirmedSitConflict,
}: {
  boat: Boat;
  close: () => void;
  confirmedSitConflict?: { sitId: string; boatName: string };
}) {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user)!;
  const requireVerificationToSit = useFeatureFlag("requireVerificationToSit");
  const queryClient = useQueryClient();
  const [message, setMessage] = useState(
    t("apply.defaultMessage", { owner: boat.owner, boat: boat.name }),
  );
  const [partySize, setPartySize] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState("");
  const maxGuests = boat.maxGuests ?? 2;
  const hasSharedLanguage = user.languages.some((language) =>
    boat.ownerLanguages.some(
      (ownerLanguage) => ownerLanguage.toLocaleLowerCase() === language.toLocaleLowerCase(),
    ),
  );
  const hasBlockedContactDetails = containsOffPlatformContactDetails(message);
  const { data: verificationChecks, isLoading: verificationLoading } = useQuery({
    ...queries.verificationChecks.profile(user.name, user.email, user.phoneNumber),
    enabled: requireVerificationToSit,
  });
  let canApply = true;
  if (requireVerificationToSit) {
    canApply = verificationChecks ? isFullyVerified(verificationChecks) : false;
  }
  const acceptingApplications = isAcceptingApplications(boat);
  const verifyMutation = useMutation({
    mutationFn: () => startVerification(user.name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...queries.verificationChecks.getQueryKey(), user.name],
      });
      await queryClient.invalidateQueries({
        queryKey: queries.verification.status(user.name).queryKey,
      });
    },
  });
  const isDaytimeSit = (boat.sitType ?? "liveaboard") === "daytimeChecks";
  const mutation = useMutation({
    mutationFn: () =>
      sendApplication(boat.id, message, isDaytimeSit ? 1 : partySize, {
        name: user.name,
        image: user.image,
        location: user.location,
        bio: user.bio,
        languages: user.languages,
        preferredCountries: user.preferredCountries,
        skills: user.skills,
        memberSince: user.memberSince,
        email: user.email,
        phoneNumber: user.phoneNumber,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
    },
  });
  const verificationBlocked =
    mutation.error instanceof Error &&
    mutation.error.message === "APPLICATION_VERIFICATION_REQUIRED";
  const applicationsClosedError =
    mutation.error instanceof Error && mutation.error.message === "APPLICATIONS_CLOSED";
  const confirmedSitConflictError =
    mutation.error instanceof Error &&
    mutation.error.message === "APPLICATION_CONFIRMED_SIT_CONFLICT";
  const conflictBoatName = confirmedSitConflict?.boatName;

  function submitApplication() {
    if (!acceptingApplications || !canApply || confirmedSitConflict) return;
    if (!acceptedTerms) {
      setTermsError(t("apply.termsRequired"));
      return;
    }
    if (containsOffPlatformContactDetails(message)) return;
    setTermsError("");
    mutation.mutate();
  }

  function getApplicationErrorMessage() {
    if (applicationsClosedError) return t("apply.applicationsClosed");
    if (confirmedSitConflictError) {
      return t("apply.confirmedSitConflict", {
        boat: conflictBoatName ?? boat.name,
      });
    }
    if (verificationBlocked) return t("apply.verificationRequiredText");
    return t("apply.sendFailed");
  }

  function renderApplyFormContent() {
    if (!acceptingApplications) {
      return (
        <div
          className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
          role="alert"
        >
          <p className="font-semibold">{t("detail.applicationsClosed")}</p>
          <p className="mt-1">{t("apply.applicationsClosed")}</p>
          <button
            className="mt-4 w-full rounded-xl bg-navy py-3.5 font-bold text-white"
            onClick={close}
            type="button"
          >
            {t("common.done")}
          </button>
        </div>
      );
    }
    if (confirmedSitConflict) {
      return (
        <div
          className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
          role="alert"
        >
          <p className="font-semibold">{t("apply.confirmedSitConflictTitle")}</p>
          <p className="mt-1">
            {t("apply.confirmedSitConflict", { boat: confirmedSitConflict.boatName })}
          </p>
          <Link
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-navy py-3.5 font-bold text-white"
            onClick={close}
            to={`/boats/${confirmedSitConflict.sitId}`}
          >
            {t("apply.viewConfirmedSit")}
          </Link>
          <button
            className="mt-3 block w-full text-sm font-semibold text-slate hover:text-navy"
            onClick={close}
            type="button"
          >
            {t("common.done")}
          </button>
        </div>
      );
    }
    if (verificationLoading) {
      return <p className="mt-6 text-sm text-slate">{t("apply.verificationChecking")}</p>;
    }
    if (!canApply && verificationChecks) {
      return (
        <div className="mt-5 space-y-5">
          <div
            className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
            role="alert"
          >
            <ShieldCheck className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-semibold">{t("apply.verificationRequiredTitle")}</p>
              <p className="mt-1">{t("apply.verificationRequiredText")}</p>
            </div>
          </div>
          <IdentityVerificationCard
            checks={verificationChecks}
            isSelf
            onStartVerification={() => verifyMutation.mutate()}
            verifying={verifyMutation.isPending}
          />
          <Link
            className="inline-flex w-full items-center justify-center rounded-xl bg-navy py-3.5 font-bold text-white"
            onClick={close}
            to="/members/me"
          >
            {t("apply.verificationRequiredCta")}
          </Link>
        </div>
      );
    }
    const sitType = boat.sitType ?? "liveaboard";
    const sitTypeMeaningKey =
      sitType === "daytimeChecks"
        ? "apply.sitTypeMeaningDaytimeChecks"
        : "apply.sitTypeMeaningLiveaboard";

    return (
      <>
        <div
          className="mt-5 rounded-xl border border-line bg-cream p-4"
          data-sit-type={sitType}
          data-testid="apply-sit-type-reminder"
        >
          <div className="flex flex-wrap items-center gap-2">
            <SitTypeBadge sitType={sitType} size="md" />
            <p className="text-sm font-semibold text-navy" data-testid="apply-sit-type-title">
              {t("apply.sitTypeReminderTitle", { type: t(`sitType.${sitType}`) })}
            </p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate" data-testid="apply-sit-type-meaning">
            {t(sitTypeMeaningKey)}
          </p>
        </div>
        {!hasSharedLanguage && (
          <div className="mt-5 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <Languages className="mt-0.5 shrink-0" size={18} />
            <p>{t("apply.noSharedLanguage", { owner: boat.owner })}</p>
          </div>
        )}
        {!isDaytimeSit ? (
          <label className="mt-5 block" data-testid="apply-party-size">
            <span className="form-label">{t("apply.partySize")}</span>
            <Select
              variant="form"
              onChange={(event) => setPartySize(Number(event.target.value))}
              value={partySize}
            >
              {Array.from({ length: maxGuests }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </Select>
            <span className="mt-1.5 block text-xs leading-5 text-slate">
              {t("apply.partySizeHint", { count: maxGuests })}
            </span>
          </label>
        ) : null}
        <textarea
          aria-invalid={hasBlockedContactDetails}
          className={`mt-5 min-h-40 w-full resize-none rounded-xl border bg-cream p-4 text-sm leading-6 outline-none ${
            hasBlockedContactDetails
              ? "border-red-400 focus:border-red-500"
              : "border-line focus:border-teal"
          }`}
          data-testid="apply-message-input"
          onChange={(event) => setMessage(event.target.value)}
          value={message}
        />
        <p className="mt-2 text-sm leading-6 text-slate" data-testid="apply-message-hint">
          {t("apply.hint", { type: displayLabel(t, boat.type).toLocaleLowerCase() })}
        </p>
        {hasBlockedContactDetails && (
          <div
            className="mt-3 flex gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-900"
            role="alert"
          >
            <TriangleAlert className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-semibold">{t("apply.contactDetailsTerms")}</p>
              <p className="mt-1">{t("apply.contactDetailsBlocked")}</p>
              <Link className="mt-2 inline-flex font-bold underline underline-offset-2" to="/terms">
                {t("footer.terms")}
              </Link>
            </div>
          </div>
        )}
        <div className="mt-4">
          <TermsAgreementCheckbox
            checked={acceptedTerms}
            i18nKey="apply.termsAgreement"
            onChange={(checked) => {
              setAcceptedTerms(checked);
              if (checked) setTermsError("");
            }}
          />
        </div>
        {termsError && (
          <p className="mt-3 text-sm font-semibold text-coral" role="alert">
            {termsError}
          </p>
        )}
        {(verificationBlocked ||
          applicationsClosedError ||
          confirmedSitConflictError ||
          mutation.isError) && (
          <p className="mt-3 text-sm font-semibold text-coral" role="alert">
            {getApplicationErrorMessage()}
          </p>
        )}
        <button
          className="mt-4 w-full rounded-xl bg-coral py-3.5 font-bold text-white transition hover:bg-coral-dark disabled:opacity-60"
          disabled={mutation.isPending || !message.trim() || hasBlockedContactDetails}
          onClick={submitApplication}
          type="button"
        >
          {mutation.isPending ? t("apply.sending") : t("apply.send")}
        </button>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-2000 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-float md:p-8">
        {mutation.isSuccess ? (
          <div className="py-8 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-seafoam text-teal">
              <Check size={32} />
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold text-navy">
              {t("apply.successTitle")}
            </h2>
            <p className="mt-2 text-slate">
              {t("apply.successText", { owner: boat.owner, boat: boat.name })}
            </p>
            <Link
              className="mt-6 inline-flex rounded-full bg-teal px-6 py-3 font-bold text-white hover:bg-teal/90"
              onClick={close}
              to="/my-sits"
            >
              {t("apply.viewInSits")}
            </Link>
            <button
              className="mt-3 block w-full text-sm font-semibold text-slate hover:text-navy"
              onClick={close}
              type="button"
            >
              {t("common.done")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-navy">
                  {t("apply.title", { boat: boat.name })}
                </h2>
              </div>
              <button
                aria-label={t("common.close")}
                className="rounded-full p-2 hover:bg-cream"
                onClick={close}
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            {renderApplyFormContent()}
          </>
        )}
      </div>
    </div>
  );
}

function DetailPage() {
  const { i18n, t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const requireVerificationToSit = useFeatureFlag("requireVerificationToSit");
  const identityVerificationEnabled = useFeatureFlag("identityVerification");
  const sitAlsoLookingEnabled = useFeatureFlag("sitAlsoLooking");
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const saved = useAppStore((state) => state.saved);
  const toggleSaved = useAppStore((state) => state.toggleSaved);
  const { data: boat, isLoading } = useQuery({
    ...queries.boat.detail(id),
  });
  const { data: userApplications = [] } = useQuery({
    ...queries.applications.user(user?.name),
    enabled: Boolean(user),
  });
  const { data: sits = [] } = useQuery({
    ...queries.sits.all,
    enabled: Boolean(user),
  });
  const existingApplication = userApplications.find((application) => application.sitId === id);
  const activeApplication =
    existingApplication && existingApplication.status !== "withdrawn"
      ? existingApplication
      : undefined;
  const confirmedSitConflict =
    user && boat
      ? findConfirmedSitDateConflict(userApplications, sits, user.name, boat)
      : undefined;
  const canSeePrivateAccess =
    Boolean(user) && (user?.name === boat?.owner || activeApplication?.status === "accepted");
  const { data: privateAccess } = useQuery({
    ...queries.sitPrivateAccess.forViewer(id, user?.name),
    enabled: Boolean(boat && user && canSeePrivateAccess),
  });
  const { data: applicantVerification } = useQuery({
    ...queries.verificationChecks.applyGate(user?.name, user?.email, user?.phoneNumber),
    enabled: Boolean(requireVerificationToSit && user && boat && user.name !== boat.owner),
  });
  const applicantNeedsVerification =
    requireVerificationToSit &&
    Boolean(user && boat && user.name !== boat.owner) &&
    applicantVerification !== undefined &&
    !isFullyVerified(applicantVerification);
  const { data: ownerVerification } = useQuery({
    ...queries.verificationChecks.owner(boat?.owner),
    enabled: Boolean(boat?.owner),
  });
  const ownerContentTexts = useMemo(() => {
    if (!boat) return {};
    return {
      description: boat.description,
      home: boat.home,
      ...(boat.pet ? { pet: boat.pet } : {}),
      ...Object.fromEntries(boat.responsibilities.map((item, index) => [`resp-${index}`, item])),
    };
  }, [boat]);
  const ownerTranslation = useAutoTranslatedOwnerContent(
    boat?.ownerLanguages ?? ["English"],
    ownerContentTexts,
  );

  if (isLoading) return <SitDetailSkeleton />;
  if (!boat) return <NotFound />;
  const listingBoat = boat;
  const photos = [{ url: listingBoat.image }, ...listingBoat.gallery].filter(
    (photo, index, allPhotos) => allPhotos.findIndex((item) => item.url === photo.url) === index,
  );
  let photoGridClass = "md:grid-cols-[1.5fr_0.8fr]";
  if (photos.length === 1) photoGridClass = "grid-cols-1";
  else if (photos.length === 2) photoGridClass = "grid-cols-2";
  const experienceRequirements = [
    ...(listingBoat.minYearsExperience
      ? [t("experience.minimumYears", { count: listingBoat.minYearsExperience })]
      : []),
    ...(listingBoat.requiredExperience ?? []),
    ...(listingBoat.requiredCertifications ?? []),
    ...(listingBoat.requiredSkills ?? []).filter((skill) => !isNonSmokerRequirementLabel(skill)),
    ...(resolveNonSmokerRequired(listingBoat) ? [t("requirement.nonSmoker")] : []),
    ...withoutNonSmokerRequirementLabels(listingBoat.requirements),
  ].filter((item, index, all) => all.indexOf(item) === index);

  function getApplyButtonLabel() {
    if (user?.name === listingBoat.owner) return t("detail.ownSit");
    if (activeApplication) return t("detail.requestedSit");
    if (confirmedSitConflict) return t("detail.confirmedSitConflict");
    if (isAcceptingApplications(listingBoat)) return t("detail.apply");
    return t("detail.applicationsClosed");
  }

  return (
    <main className="pb-20">
      <div className="mx-auto max-w-7xl px-5 pt-6 lg:px-8">
        <button
          className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate hover:text-navy"
          onClick={() => navigate(-1)}
          type="button"
        >
          <ArrowLeft size={17} /> {t("detail.back")}
        </button>
        <div className="relative">
          <div className={`grid h-136 gap-2 overflow-hidden rounded-3xl ${photoGridClass}`}>
            <button
              aria-label={t("lightbox.viewPhoto", { number: 1 })}
              className="min-h-0 h-full w-full overflow-hidden"
              onClick={() => setLightboxIndex(0)}
              type="button"
            >
              <img
                alt={boat.name}
                className={coverPhotoClassName()}
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
                src={optimizePhotoUrl(photos[0].url)}
                style={coverPhotoStyle(photos[0])}
              />
            </button>
            {photos.length >= 3 && (
              <div className="hidden min-h-0 grid-rows-2 gap-2 md:grid">
                {[1, 2].map((photoIndex) => {
                  const photo = photos[photoIndex];
                  return (
                    <button
                      aria-label={t("lightbox.viewPhoto", { number: photoIndex + 1 })}
                      className="min-h-0 h-full w-full overflow-hidden"
                      key={photo.url}
                      onClick={() => setLightboxIndex(photoIndex)}
                      type="button"
                    >
                      <img
                        alt={
                          photo.caption?.trim() ||
                          (photoIndex === 1
                            ? t("detail.surroundingsAlt", { boat: boat.name })
                            : t("detail.lifeAboardAlt"))
                        }
                        className={coverPhotoClassName()}
                        onError={(event) => {
                          event.currentTarget.src = fallbackImage;
                        }}
                        src={optimizePhotoUrl(photo.url)}
                        style={coverPhotoStyle(photo)}
                      />
                    </button>
                  );
                })}
              </div>
            )}
            {photos.length === 2 && (
              <button
                aria-label={t("lightbox.viewPhoto", { number: 2 })}
                className="min-h-0 h-full w-full overflow-hidden"
                onClick={() => setLightboxIndex(1)}
                type="button"
              >
                <img
                  alt={
                    photos[1].caption?.trim() || t("detail.surroundingsAlt", { boat: boat.name })
                  }
                  className={coverPhotoClassName()}
                  onError={(event) => {
                    event.currentTarget.src = fallbackImage;
                  }}
                  src={optimizePhotoUrl(photos[1].url)}
                  style={coverPhotoStyle(photos[1])}
                />
              </button>
            )}
          </div>
          <button
            className="absolute right-4 bottom-4 z-10 rounded-full bg-white px-4 py-2 text-sm font-bold text-navy shadow-lg transition hover:bg-seafoam"
            onClick={() => setLightboxIndex(0)}
            type="button"
          >
            {t("detail.viewPhotos")}
          </button>
        </div>
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem]">
          <div>
            <div className="flex items-start justify-between gap-5 border-b border-line pb-8">
              <div>
                <p className="eyebrow">
                  {vesselTypeLengthYear(
                    t,
                    boat,
                    user?.measurementSystem ?? detectMeasurementSystem(),
                  )}
                </p>
                <h1 className="font-display text-4xl font-extrabold tracking-[-0.045em] text-navy md:text-5xl">
                  {boat.name}
                </h1>
                <p className="mt-3 flex items-center gap-2 text-slate">
                  <MapPin size={17} /> {formatSitLocation(boat.location, boat.country)}
                </p>
              </div>
              <button
                aria-label={
                  user && saved.includes(boat.id) ? t("boat.removeSaved") : t("boat.save")
                }
                className="grid size-11 place-items-center rounded-full border border-line bg-white"
                onClick={() => {
                  if (!user) {
                    openAuth("signup");
                    return;
                  }
                  toggleSaved(boat.id);
                }}
                type="button"
              >
                <Heart
                  className={user && saved.includes(boat.id) ? "fill-coral text-coral" : ""}
                  size={20}
                />
              </button>
            </div>

            <section className="border-b border-line py-8">
              <Link
                className="group flex items-center gap-4 rounded-xl transition hover:bg-seafoam/50"
                to={`/members/${boat.id}`}
              >
                <img
                  alt={boat.owner}
                  className="size-14 rounded-full object-cover ring-2 ring-transparent transition group-hover:ring-aqua"
                  src={boat.ownerImage}
                />
                <div>
                  <h2 className="font-display font-bold text-navy group-hover:text-teal">
                    {t("detail.hostedBy", { owner: boat.owner })}
                  </h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate">
                    <Star className="fill-sun text-sun" size={15} /> {boat.rating} ·{" "}
                    {t("detail.ownerReviews", { count: boat.reviews })}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-teal">
                    <MessageCircle aria-hidden="true" size={14} />
                    {t("detail.respondsWithinDay")}
                  </p>
                </div>
              </Link>
              {identityVerificationEnabled && ownerVerification && (
                <div className="mt-5">
                  <IdentityVerificationCard checks={ownerVerification} />
                </div>
              )}
            </section>

            <section className="border-b border-line py-8">
              <h2 className="detail-title">{t("detail.about")}</h2>
              {boat.homePort && (
                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-teal">
                  <Anchor size={16} /> {t("detail.homePort", { homePort: boat.homePort })}
                </p>
              )}
              <p
                className={`mt-4 leading-7 text-slate ${
                  ownerTranslation.pending && ownerTranslation.shouldTranslate
                    ? "animate-pulse"
                    : ""
                }`}
              >
                {ownerTranslation.display("description", boat.description)}
              </p>
              <p
                className={`mt-4 leading-7 text-slate ${
                  ownerTranslation.pending && ownerTranslation.shouldTranslate
                    ? "animate-pulse"
                    : ""
                }`}
              >
                {ownerTranslation.display("home", boat.home)}
              </p>
              {boat.pet && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sun/15 px-4 py-3 text-sm font-semibold text-navy">
                  <Sparkles className="text-coral" size={17} />{" "}
                  {t("detail.alsoAboard", {
                    pet: ownerTranslation.display("pet", boat.pet),
                  })}
                </div>
              )}
              <AutoTranslationAttribution
                failed={ownerTranslation.failed}
                hasTranslations={ownerTranslation.hasTranslations}
                onToggle={() => ownerTranslation.setShowOriginal((current) => !current)}
                pending={ownerTranslation.pending}
                shouldTranslate={ownerTranslation.shouldTranslate}
                showOriginal={ownerTranslation.showOriginal}
              />
            </section>

            {privateAccess && (
              <section className="border-b border-line py-8">
                <VesselPrivateAccessCard
                  details={privateAccess}
                  variant={user?.name === boat.owner ? "owner" : "sitter"}
                />
              </section>
            )}

            <section className="border-b border-line py-8">
              <h2 className="detail-title">{t("detail.brief")}</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-seafoam text-teal">
                    <Fuel size={19} />
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate">
                      {t("vesselEditor.engineType")}
                    </span>
                    <span className="font-semibold text-navy">
                      {displayLabel(t, boat.engineType)}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-seafoam text-teal">
                    <BatteryCharging size={19} />
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate">
                      {t("vesselEditor.voltageType")}
                    </span>
                    <span className="font-semibold text-navy">
                      {displayLabel(t, boat.voltageType)}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-seafoam text-teal">
                    <Flame size={19} />
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate">
                      {t("vesselEditor.stoveFuelType")}
                    </span>
                    <span className="font-semibold text-navy">
                      {displayLabel(t, boat.stoveFuelType)}
                    </span>
                  </span>
                </div>
                {boat.systems.map((system, index) => {
                  const Icon = systemIcons[index % systemIcons.length];
                  return (
                    <div className="flex items-center gap-3" key={system}>
                      <span className="grid size-10 place-items-center rounded-xl bg-seafoam text-teal">
                        <Icon size={19} />
                      </span>
                      <span className="font-semibold text-navy">{system}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="border-b border-line py-8">
              <h2 className="detail-title">{t("detail.responsibilities")}</h2>
              <ul className="mt-5 space-y-3">
                {boat.responsibilities.map((item, index) => (
                  <li
                    className={`flex gap-3 text-slate ${
                      ownerTranslation.pending && ownerTranslation.shouldTranslate
                        ? "animate-pulse"
                        : ""
                    }`}
                    key={item}
                  >
                    <Check className="mt-0.5 shrink-0 text-teal" size={18} />{" "}
                    {ownerTranslation.display(`resp-${index}`, item)}
                  </li>
                ))}
              </ul>
            </section>

            <section className="py-8">
              <h2 className="detail-title">{t("detail.experience")}</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {experienceRequirements.map((item) => (
                  <span
                    className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-navy"
                    key={item}
                  >
                    {displayLabel(t, item)}
                  </span>
                ))}
              </div>
              <h2 className="detail-title mt-9">{t("detail.lifeAboard")}</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {boat.amenities.map((item) => (
                  <span className="flex items-center gap-2 text-sm text-slate" key={item}>
                    <FeatureIcon feature={item} /> {displayLabel(t, item)}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <aside>
            <div className="sticky top-24 rounded-2xl border border-line bg-white p-6 shadow-card">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal">
                {t("detail.availableDates")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <SitTypeBadge sitType={boat.sitType} size="md" />
                {boat.phase && <SitPhaseBadge phase={boat.phase} size="md" />}
                {boat.phase === "acceptingApplicants" && isHappeningSoon(boat.dateStart) && (
                  <span className="inline-flex rounded-full bg-coral px-3 py-1.5 text-xs font-bold text-white">
                    {t("boat.happeningSoon")}
                  </span>
                )}
              </div>
              <p className="mt-2 font-display text-xl font-bold text-navy">
                {formatSitDates(i18n.language, boat.dateStart, boat.duration)}
              </p>
              <p className="mt-1 text-sm text-slate">
                {t("detail.durationAboard", {
                  duration: t("duration.nights", {
                    count: Number.parseInt(boat.duration, 10),
                  }),
                })}
              </p>
              <div className="my-5 border-t border-line" />
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-3">
                  <CalendarDays className="text-coral" size={18} /> {t("detail.flexibleArrival")}
                </p>
                <p className="flex items-center gap-3">
                  <MessageCircle className="text-coral" size={18} /> {t("detail.handoverCall")}
                </p>
                <p className="flex items-center gap-3">
                  <ShieldCheck className="text-coral" size={18} /> {t("detail.contactsVerified")}
                </p>
                {(boat.sitType ?? "liveaboard") !== "daytimeChecks" ? (
                  <p className="flex items-center gap-3" data-testid="detail-max-guests">
                    <Users className="text-coral" size={18} />{" "}
                    {t("detail.maxGuests", { count: boat.maxGuests ?? 2 })}
                  </p>
                ) : null}
              </div>
              <button
                className="mt-6 w-full rounded-xl bg-coral py-3.5 font-bold text-white transition hover:bg-coral-dark disabled:opacity-60"
                disabled={
                  user?.name === boat.owner ||
                  !isAcceptingApplications(boat) ||
                  Boolean(activeApplication) ||
                  Boolean(confirmedSitConflict)
                }
                onClick={() => {
                  if (!isAcceptingApplications(boat) || activeApplication || confirmedSitConflict) {
                    return;
                  }
                  if (user) setApplying(true);
                  else openAuth("login");
                }}
                type="button"
              >
                {getApplyButtonLabel()}
              </button>
              {activeApplication && user?.name !== boat.owner && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <ApplicationStatusBadge status={activeApplication.status} />
                  </div>
                  <Link
                    className="flex w-full items-center justify-center rounded-xl border border-line py-3 text-sm font-bold text-navy hover:border-teal"
                    to="/my-sits"
                  >
                    {t("detail.viewInSits")}
                  </Link>
                  <Link
                    className="flex w-full items-center justify-center rounded-xl border border-teal bg-seafoam py-3 text-sm font-bold text-teal hover:border-teal"
                    to={`/messages?application=${encodeURIComponent(activeApplication.id)}`}
                  >
                    {t("nav.messages")}
                  </Link>
                </div>
              )}
              {!isAcceptingApplications(boat) && user?.name !== boat.owner && (
                <p className="mt-3 text-center text-xs leading-5 text-slate">
                  {t("detail.applicationsClosedHint")}
                </p>
              )}
              {confirmedSitConflict &&
                !activeApplication &&
                user?.name !== boat.owner &&
                isAcceptingApplications(boat) && (
                  <p className="mt-3 text-center text-xs leading-5 text-amber-800">
                    {t("detail.confirmedSitConflictHint", { boat: confirmedSitConflict.boatName })}
                  </p>
                )}
              {applicantNeedsVerification &&
                isAcceptingApplications(boat) &&
                !confirmedSitConflict && (
                  <p className="mt-3 text-center text-xs leading-5 text-amber-800">
                    {t("apply.verificationRequiredText")}
                  </p>
                )}
              {sitAlsoLookingEnabled && isAcceptingApplications(boat) && (
                <p
                  className="mt-3 text-center text-xs font-medium text-teal"
                  data-testid="sit-also-looking"
                >
                  {t("detail.alsoLooking", { count: getSitAlsoLookingCount(boat.id) })}
                </p>
              )}
              <p className="mt-3 text-center text-xs text-slate">
                {t("detail.applicants", { count: boat.applicants })}
              </p>
            </div>
          </aside>
        </div>
        <section className="mt-14">
          <h2 className="section-title">{t("map.sitLocation")}</h2>
          <p className="mt-3 text-slate">
            {t("map.locationText", {
              location: formatSitLocation(boat.location, boat.country),
            })}
          </p>
          <div className="mt-6">
            <BoatMap boats={[boat]} compact />
          </div>
        </section>
      </div>
      {applying && (
        <ApplyModal
          boat={boat}
          close={() => setApplying(false)}
          confirmedSitConflict={confirmedSitConflict}
        />
      )}
      {lightboxIndex !== null && (
        <PhotoLightbox
          boatName={boat.name}
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </main>
  );
}

function SavedPage() {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const saved = useAppStore((state) => state.saved);
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(0);
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const availability = showAll ? "all" : "open";
  const {
    data: visibleBoats = [],
    isLoading,
    isFetching,
  } = useQuery({
    ...queries.savedListings.list(availability, saved),
    enabled: Boolean(user),
  });
  const totalPages = Math.max(1, Math.ceil(visibleBoats.length / BOATS_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageStart = currentPage * BOATS_PER_PAGE;
  const pageEnd = Math.min(pageStart + BOATS_PER_PAGE, visibleBoats.length);
  const pagedBoats = visibleBoats.slice(pageStart, pageEnd);
  const showLoading = isLoading || (isFetching && visibleBoats.length === 0);

  useEffect(() => {
    setPage(0);
  }, [showAll, saved]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  function goToPage(nextPage: number) {
    setPage(nextPage);
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderSavedContent() {
    if (showLoading) {
      return (
        <div
          aria-busy="true"
          aria-live="polite"
          className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <BoatCardSkeleton key={index} showBadge={index === 0} />
          ))}
        </div>
      );
    }
    if (visibleBoats.length) {
      return (
        <>
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {pagedBoats.map((boat) => (
              <BoatCard boat={boat} key={boat.id} />
            ))}
          </div>
          <ResultsPagination
            currentPage={currentPage}
            onPageChange={goToPage}
            pageSize={BOATS_PER_PAGE}
            totalItems={visibleBoats.length}
          />
        </>
      );
    }
    if (saved.length && !showAll) {
      return (
        <div className="mt-12 rounded-3xl border border-line bg-white py-20 text-center">
          <Heart className="mx-auto text-coral" size={38} />
          <h2 className="mt-5 font-display text-2xl font-bold text-navy">
            {t("saved.emptyFiltered")}
          </h2>
          <p className="mt-2 text-slate">{t("saved.emptyFilteredHint")}</p>
        </div>
      );
    }
    return (
      <div className="mt-12 rounded-3xl border border-line bg-white py-20 text-center">
        <Heart className="mx-auto text-coral" size={38} />
        <h2 className="mt-5 font-display text-2xl font-bold text-navy">{t("saved.empty")}</h2>
        <p className="mt-2 text-slate">{t("saved.emptyHint")}</p>
        <Link
          className="mt-6 inline-flex rounded-full bg-navy px-6 py-3 font-bold text-white"
          to="/boats"
        >
          {t("saved.browse")}
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <Heart className="mx-auto text-coral" size={42} />
        <h1 className="mt-5 font-display text-3xl font-extrabold text-navy">
          {t("saved.signInTitle")}
        </h1>
        <p className="mt-3 text-slate">{t("saved.signInText")}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            className="rounded-full border border-line bg-white px-6 py-3 font-bold text-navy hover:border-teal"
            onClick={() => openAuth("login")}
            type="button"
          >
            {t("nav.login")}
          </button>
          <button
            className="rounded-full bg-navy px-6 py-3 font-bold text-white hover:bg-coral"
            onClick={() => openAuth("signup")}
            type="button"
          >
            {t("nav.join")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
      <h1 className="section-title">{t("saved.title")}</h1>
      <label
        className={`mt-6 flex w-fit cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
          showAll ? "border-teal bg-seafoam text-teal" : "border-line text-slate"
        }`}
      >
        <input
          checked={showAll}
          className="size-4 accent-teal"
          onChange={(event) => setShowAll(event.target.checked)}
          type="checkbox"
        />
        {t("saved.showAll")}
      </label>
      <div ref={resultsTopRef} />
      {renderSavedContent()}
    </main>
  );
}

function HowItWorksPage() {
  const { t } = useTranslation();
  const unattendedRisks = [
    "bilge",
    "engine",
    "power",
    "mooring",
    "leaks",
    "ventilation",
    "weather",
    "security",
  ] as const;
  const steps = [
    {
      icon: <Compass />,
      title: t("how.stepProfileTitle"),
      text: t("how.stepProfileText"),
    },
    {
      icon: <Search />,
      title: t("how.stepFindTitle"),
      text: t("how.stepFindText"),
    },
    {
      icon: <MessageCircle />,
      title: t("how.stepMeetTitle"),
      text: t("how.stepMeetText"),
    },
    {
      icon: <Anchor />,
      title: t("how.stepHandoverTitle"),
      text: t("how.stepHandoverText"),
    },
  ];
  const testimonials = [
    {
      quote: t("how.testimonialOneQuote"),
      name: "Nina & Marc",
      detail: t("how.testimonialOneDetail"),
      image: "https://i.pravatar.cc/120?img=48",
      role: t("role.ownerShort"),
    },
    {
      quote: t("how.testimonialTwoQuote"),
      name: "James R.",
      detail: t("how.testimonialTwoDetail"),
      image: "https://i.pravatar.cc/120?img=13",
      role: t("role.sitterShort"),
    },
    {
      quote: t("how.testimonialThreeQuote"),
      name: "Priya",
      detail: t("how.testimonialThreeDetail"),
      image: "https://i.pravatar.cc/120?img=45",
      role: t("role.ownerShort"),
    },
  ];
  return (
    <main>
      <section className="bg-navy px-5 py-20 text-center text-white">
        <h1 className="mx-auto max-w-3xl font-display text-5xl font-extrabold tracking-tighter md:text-6xl">
          {t("how.title")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/70">
          {t("how.subtitle")}
        </p>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-20">
        <aside className="mb-14 flex flex-col gap-5 rounded-3xl border border-coral/30 bg-coral/10 p-7 sm:flex-row sm:items-start md:p-9">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-coral text-white">
            <Anchor size={22} />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold text-navy">
              {t("how.liveaboardTitle")}
            </h2>
            <p className="mt-2 max-w-3xl leading-7 text-slate">{t("how.liveaboardText")}</p>
          </div>
        </aside>
        <div className="grid gap-8 md:grid-cols-2">
          {steps.map((step, index) => (
            <div className="rounded-2xl border border-line bg-white p-7" key={step.title}>
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-xl bg-seafoam text-teal">
                  {step.icon}
                </span>
                <span className="font-display text-4xl font-extrabold text-line">0{index + 1}</span>
              </div>
              <h2 className="mt-6 font-display text-xl font-bold text-navy">{step.title}</h2>
              <p className="mt-2 leading-7 text-slate">{step.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 rounded-3xl bg-seafoam p-8 md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <p className="eyebrow">{t("how.briefKicker")}</p>
              <h2 className="section-title">{t("how.briefTitle")}</h2>
            </div>
            <ul className="grid gap-3 text-sm text-navy sm:grid-cols-2">
              {[
                "how.briefMooring",
                "how.briefBilges",
                "how.briefBattery",
                "how.briefEngines",
                "how.briefHeads",
                "how.briefWeather",
                "how.briefTender",
                "how.briefContacts",
              ].map((item) => (
                <li className="flex items-center gap-2" key={item}>
                  <CircleCheck className="text-teal" size={17} /> {t(item)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <section className="mt-20">
          <div className="max-w-3xl">
            <p className="eyebrow">{t("how.risksKicker")}</p>
            <h2 className="section-title">{t("how.risksTitle")}</h2>
            <p className="mt-4 leading-7 text-slate">{t("how.risksText")}</p>
          </div>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {unattendedRisks.map((risk) => (
              <li
                className="flex gap-3 rounded-2xl border border-line bg-white p-5 leading-6 text-slate"
                key={risk}
              >
                <TriangleAlert className="mt-0.5 shrink-0 text-coral" size={19} />
                <span>{t(`how.risks.${risk}`)}</span>
              </li>
            ))}
          </ul>
        </section>
        <div className="mt-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{t("how.storiesKicker")}</p>
            <h2 className="section-title">{t("how.storiesTitle")}</h2>
            <p className="mt-4 leading-7 text-slate">{t("how.storiesText")}</p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <figure
                className={`relative flex flex-col rounded-2xl border p-7 ${
                  index === 1
                    ? "border-navy bg-navy text-white shadow-float"
                    : "border-line bg-white"
                }`}
                key={testimonial.name}
              >
                <Quote
                  className={index === 1 ? "text-aqua" : "text-coral"}
                  fill="currentColor"
                  size={28}
                />
                <blockquote
                  className={`mt-5 flex-1 text-[15px] leading-7 ${
                    index === 1 ? "text-white/80" : "text-slate"
                  }`}
                >
                  “{testimonial.quote}”
                </blockquote>
                <figcaption
                  className={`mt-7 border-t pt-5 ${
                    index === 1 ? "border-white/15" : "border-line"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      alt=""
                      className="size-11 rounded-full object-cover"
                      src={testimonial.image}
                    />
                    <div className="min-w-0">
                      <p
                        className={`font-display text-sm font-bold ${index === 1 ? "text-white" : "text-navy"}`}
                      >
                        {testimonial.name}
                      </p>
                      <p
                        className={`mt-0.5 truncate text-xs ${index === 1 ? "text-white/60" : "text-slate"}`}
                      >
                        {testimonial.detail}
                      </p>
                    </div>
                    <span
                      className={`ml-auto hidden whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:block ${
                        index === 1 ? "bg-white/10 text-aqua" : "bg-seafoam text-teal"
                      }`}
                    >
                      {testimonial.role}
                    </span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <main className="px-5 py-24 text-center">
      <LifeBuoy className="mx-auto text-coral" size={48} />
      <h1 className="mt-5 font-display text-4xl font-extrabold text-navy">{t("notFound.title")}</h1>
      <p className="mt-3 text-slate">{t("notFound.text")}</p>
      <Link className="mt-6 inline-flex rounded-full bg-navy px-6 py-3 font-bold text-white" to="/">
        {t("notFound.back")}
      </Link>
    </main>
  );
}

const memberDetails: Record<
  string,
  { since: string; location: string; about: string; badges: string[]; ownerSits: number }
> = {
  solstice: {
    since: "2021",
    location: "Lefkada, Greece",
    about:
      "We met crewing across the Atlantic and have called Solstice home for six years. Clear communication and thoughtful care matter most to us. We provide a full systems handover, labelled spares and a local engineer on call.",
    badges: ["Bluewater sailors", "Fast responders", "Detailed handover", "Pet owners"],
    ownerSits: 14,
  },
  "blue-hour": {
    since: "2022",
    location: "St. George’s, Grenada",
    about:
      "I split my year between Grenada and Norway. Blue Hour is professionally maintained, but I value sitters who notice the small things and are confident making sensible weather decisions.",
    badges: ["Catamaran owner", "Storm prepared", "Superhost", "Remote worker"],
    ownerSits: 9,
  },
  mistral: {
    since: "2020",
    location: "Palma, Mallorca",
    about:
      "Mistral has been in our family for a decade. I work in marine interiors and keep careful records for every system aboard. Sitters get a calm, practical handover and excellent local support.",
    badges: ["Motor yacht owner", "Systems expert", "Superhost", "Local support"],
    ownerSits: 19,
  },
  "little-wren": {
    since: "2019",
    location: "Bath, England",
    about:
      "We restored Little Wren ourselves and live aboard year-round with Mackerel and Dot. We love sharing canal life with practical, cat-loving people who are comfortable living gently off-grid.",
    badges: ["Liveaboards", "Canal experts", "Pet owners", "Top rated"],
    ownerSits: 27,
  },
  "north-star": {
    since: "2023",
    location: "Vancouver, Canada",
    about:
      "North Star is my long-range cruising home. I’m a former Coast Guard engineer, so the machinery spaces are exceptionally well documented and maintained.",
    badges: ["Diesel engineer", "Cold-water cruiser", "Fast responder", "Superhost"],
    ownerSits: 7,
  },
  "sea-glass": {
    since: "2022",
    location: "Sausalito, California",
    about:
      "I’m an architect and longtime floating-home resident. Sea Glass is a peaceful, design-led home in a close-knit dock community, with good neighbours always nearby.",
    badges: ["Houseboat owner", "Community host", "Pet owner", "Design lover"],
    ownerSits: 12,
  },
};

function ProfileEditor({ close }: { close: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAppStore((state) => state.user)!;
  const updateProfile = useAppStore((state) => state.updateProfile);
  const [form, setForm] = useState({
    name: user.name,
    image: user.image,
    coverImage: user.coverImage ?? "",
    bio:
      user.bio ??
      "Practical, calm and happiest near the water, with hands-on coastal sailing experience.",
    location: user.location ?? "Brighton, United Kingdom",
    languages: [...new Set((user.languages ?? ["English"]).map(normalizeSpokenLanguage))],
    preferredCountries: user.preferredCountries ?? [],
    skills: (
      user.skills ?? ["RYA Day Skipper", "Diesel basics", "12V systems", "Pet friendly"]
    ).join("\n"),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [coverError, setCoverError] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);

  async function uploadImage(file?: File) {
    if (!file) return;
    setImageError("");
    setImageUploading(true);
    try {
      const image = await prepareImageUpload(file);
      setForm((current) => ({ ...current, image }));
    } catch (error) {
      setImageError(t(error instanceof Error ? error.message : "upload.failed"));
    } finally {
      setImageUploading(false);
    }
  }

  async function uploadCoverImage(file?: File) {
    if (!file) return;
    setCoverError("");
    setCoverUploading(true);
    try {
      const coverImage = await prepareImageUpload(file);
      setForm((current) => ({ ...current, coverImage }));
    } catch (error) {
      setCoverError(t(error instanceof Error ? error.message : "upload.failed"));
    } finally {
      setCoverUploading(false);
    }
  }

  function toggleLanguage(language: string) {
    setForm((current) => ({
      ...current,
      languages: current.languages.includes(language)
        ? current.languages.filter((item) => item !== language)
        : [...current.languages, language],
    }));
  }

  async function save() {
    setSaving(true);
    const name = form.name.trim();
    if (
      name !== user.name ||
      form.image !== user.image ||
      form.languages.some((language) => !user.languages.includes(language)) ||
      user.languages.some((language) => !form.languages.includes(language))
    ) {
      await updateOwnerOnVessels(user.name, {
        name,
        image: form.image,
        languages: form.languages,
      });
      await queryClient.invalidateQueries({ queryKey: queries.vessels.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
    }
    updateProfile({
      ...form,
      name,
      coverImage: form.coverImage || undefined,
      bio: form.bio.trim(),
      location: form.location.trim(),
      skills: form.skills
        .split("\n")
        .map((skill) => skill.trim())
        .filter(Boolean),
    });
    setSaving(false);
    setSaved(true);
    window.setTimeout(close, 500);
  }

  let saveButtonLabel = t("profile.save");
  if (saved) saveButtonLabel = t("common.saved");
  else if (saving) saveButtonLabel = t("common.saving");

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-navy/60 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 max-w-2xl rounded-3xl bg-white p-6 shadow-float md:p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy">{t("profile.edit")}</h2>
            <p className="mt-2 text-sm text-slate">{t("profile.editHint")}</p>
          </div>
          <button
            aria-label={t("common.close")}
            className="rounded-full p-2 hover:bg-cream"
            onClick={close}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <section className="mt-7">
          <span className="form-label">{t("profile.coverImage")}</span>
          <p className="mb-3 text-sm text-slate">{t("profile.coverHint")}</p>
          <div className="grid gap-3 rounded-2xl border border-line bg-cream/50 p-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(13rem,0.7fr)]">
            <div className="aspect-[5/2] overflow-hidden rounded-xl bg-navy">
              {form.coverImage ? (
                <img
                  alt={t("profile.coverPreviewAlt")}
                  className="size-full object-cover"
                  src={form.coverImage}
                />
              ) : (
                <div className="relative grid size-full place-items-center">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_100%,#80d7d0,transparent_35%),radial-gradient(circle_at_80%_0%,#ef7057,transparent_30%)] opacity-40" />
                  <div className="relative text-center text-white/80">
                    <ImagePlus className="mx-auto mb-2" size={28} />
                    <p className="text-sm font-semibold">{t("profile.noCover")}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-2">
              <ImageUploadControl
                hasImage={Boolean(form.coverImage)}
                onFile={(file) => void uploadCoverImage(file)}
                pending={coverUploading}
              />
              {form.coverImage && (
                <button
                  className="self-start text-xs font-bold text-coral"
                  onClick={() => {
                    setForm({ ...form, coverImage: "" });
                    setCoverError("");
                  }}
                  type="button"
                >
                  {t("upload.remove")}
                </button>
              )}
            </div>
          </div>
          {coverError && (
            <p className="mt-2 text-sm font-semibold text-coral" role="alert">
              {coverError}
            </p>
          )}
        </section>

        <section className="mt-7">
          <span className="form-label">{t("profile.photo")}</span>
          <div className="flex flex-wrap items-center gap-4">
            <img
              alt={t("profile.photoPreviewAlt")}
              className="size-24 rounded-full object-cover ring-2 ring-line"
              src={form.image}
            />
            <div className="min-w-0 flex-1">
              <ImageUploadControl
                hasImage={Boolean(form.image)}
                onFile={(file) => void uploadImage(file)}
                pending={imageUploading}
                profile
              />
            </div>
          </div>
          {imageError && (
            <p className="mt-2 text-sm font-semibold text-coral" role="alert">
              {imageError}
            </p>
          )}
        </section>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label>
            <span className="form-label">{t("profile.displayName")}</span>
            <input
              className="form-input"
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              value={form.name}
            />
          </label>
          <div>
            <span className="form-label">{t("profile.location")}</span>
            <DestinationAutocomplete
              cityOnly
              includeCountry
              onChange={(location) => setForm({ ...form, location })}
              value={form.location}
              variant="profile"
            />
          </div>
          <label className="sm:col-span-2">
            <span className="form-label">{t("profile.aboutYou")}</span>
            <textarea
              className="form-input min-h-32 resize-y"
              maxLength={700}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
              placeholder={t("profile.aboutPlaceholder")}
              value={form.bio}
            />
            <span className="mt-1 block text-right text-xs text-slate">{form.bio.length}/700</span>
          </label>
          <label className="sm:col-span-2">
            <span className="form-label">{t("profile.qualifications")}</span>
            <textarea
              className="form-input min-h-28 resize-y"
              onChange={(event) => setForm({ ...form, skills: event.target.value })}
              placeholder={t("profile.qualificationsPlaceholder")}
              value={form.skills}
            />
          </label>
        </div>

        <section className="mt-6">
          <span className="form-label">{t("profile.spokenLanguages")}</span>
          <div className="flex flex-wrap gap-2">
            {SPOKEN_LANGUAGE_OPTIONS.map(([language, labelKey]) => (
              <button
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  form.languages.includes(language)
                    ? "border-teal bg-seafoam text-teal"
                    : "border-line text-slate hover:border-teal"
                }`}
                key={language}
                onClick={() => toggleLanguage(language)}
                type="button"
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <span className="form-label">{t("profile.preferredCountries")}</span>
          <p className="mb-2 text-sm text-slate">{t("profile.preferredCountriesHint")}</p>
          <DestinationAutocomplete
            countryOnly
            multiple
            onChange={(countries) =>
              setForm({
                ...form,
                preferredCountries: countries
                  .split("|")
                  .map((country) => country.trim())
                  .filter(Boolean),
              })
            }
            placeholder={t("profile.preferredCountriesPlaceholder")}
            value={form.preferredCountries.join("|")}
            variant="profile"
          />
        </section>

        <div className="mt-7 flex justify-end gap-3 border-t border-line pt-5">
          <button
            className="rounded-xl px-5 py-3 text-sm font-bold text-slate"
            onClick={close}
            type="button"
          >
            {t("common.cancel")}
          </button>
          <button
            className="rounded-xl bg-coral px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
            disabled={form.name.trim().length < 2 || saving || saved}
            onClick={() => void save()}
            type="button"
          >
            {saveButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useAppStore((state) => state.user);
  const isMe = id === "me";
  const memberKey = decodeURIComponent(id);
  const openEditorFromQuery = isMe && searchParams.get("edit") === "1";
  const [editing, setEditing] = useState(openEditorFromQuery);

  useEffect(() => {
    if (openEditorFromQuery) setEditing(true);
  }, [openEditorFromQuery]);

  function closeProfileEditor() {
    setEditing(false);
    if (!searchParams.has("edit")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("edit");
    setSearchParams(next, { replace: true });
  }
  const identityVerificationEnabled = useFeatureFlag("identityVerification");
  const queryClient = useQueryClient();
  const {
    data: boat,
    isLoading: boatLoading,
    isFetched: boatFetched,
  } = useQuery({
    ...queries.boat.detail(id),
    enabled: Boolean(currentUser) && !isMe,
    retry: false,
  });
  const isBoatOwnerProfile = !isMe && Boolean(boat);
  const isSitterNameProfile = !isMe && boatFetched && !boat;
  let profileName: string;
  if (isMe) profileName = currentUser?.name ?? "";
  else if (isBoatOwnerProfile) profileName = boat!.owner;
  else profileName = memberKey;
  const { data: namedMember, isLoading: namedLoading } = useQuery({
    ...queries.memberProfile.detail(memberKey),
    enabled: Boolean(currentUser) && isSitterNameProfile,
  });
  const { data: sitterReviews = [] } = useQuery({
    ...queries.reviews.sitter(profileName),
    enabled: Boolean(currentUser) && Boolean(profileName) && (isMe || isSitterNameProfile),
  });
  const { data: applications = [] } = useQuery({
    ...queries.applications.user(currentUser?.name),
    enabled: Boolean(currentUser),
  });
  const { data: verification } = useQuery({
    ...queries.verification.status(currentUser?.name),
    enabled: isMe && Boolean(currentUser),
  });
  const { data: verificationChecks } = useQuery({
    ...queries.verificationChecks.member(
      profileName,
      isMe,
      isMe ? (currentUser?.email ?? "") : "",
      isMe ? (currentUser?.phoneNumber ?? "") : "",
      verification?.status,
    ),
    enabled:
      Boolean(currentUser) &&
      Boolean(profileName) &&
      (isMe || isSitterNameProfile || isBoatOwnerProfile),
  });
  const verifyMutation = useMutation({
    mutationFn: () => startVerification(currentUser!.name),
    onSuccess: async (record) => {
      queryClient.setQueryData(queries.verification.status(currentUser?.name).queryKey, record);
      await queryClient.invalidateQueries({ queryKey: queries.verificationChecks.getQueryKey() });
    },
  });

  const pendingReviewApplication = applications.find(
    (application) =>
      application.status === "accepted" &&
      application.ownerName === currentUser?.name &&
      application.applicant.name === profileName,
  );
  const { data: pendingReviewSit } = useQuery({
    ...queries.boat.detail(pendingReviewApplication?.sitId),
    enabled: Boolean(pendingReviewApplication),
  });
  const existingConversation =
    !isMe && currentUser
      ? findConversationWithUser(applications, currentUser.name, profileName)
      : undefined;

  if (!currentUser) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <Users className="mx-auto text-teal" size={42} />
        <h1 className="mt-5 font-display text-3xl font-extrabold text-navy">
          {t("member.signInTitle")}
        </h1>
        <p className="mt-3 text-slate">{t("member.signInText")}</p>
        <button
          className="mt-6 rounded-full bg-navy px-6 py-3 font-bold text-white"
          onClick={() => openAuth("login")}
          type="button"
        >
          {t("nav.login")}
        </button>
      </main>
    );
  }

  if (!isMe && boatLoading) {
    return <MemberProfileSkeleton />;
  }
  if (isSitterNameProfile && namedLoading) {
    return <MemberProfileSkeleton />;
  }
  if (!isMe && !boat && !namedMember) return <NotFound />;

  const ratingSummary = summarizeSitterRating(sitterReviews);
  let profile: {
    name: string;
    image: string;
    coverImage?: string;
    activity: string;
    location: string;
    since: string;
    about: string;
    badges: string[];
    ownerSits: number;
    sitterSits: number;
    rating: number;
    reviews: number;
    showSitterReviews: boolean;
  };
  if (isMe) {
    profile = {
      name: currentUser!.name,
      image: currentUser!.image,
      coverImage: currentUser!.coverImage,
      activity: t("member.member"),
      location: currentUser!.location ?? "Brighton, United Kingdom",
      since: String(currentUser!.memberSince),
      about:
        currentUser!.bio ??
        "Practical, calm and happiest near the water, with hands-on coastal sailing experience.",
      badges: currentUser!.skills ?? [
        "RYA Day Skipper",
        "Diesel basics",
        "12V systems",
        "Pet friendly",
      ],
      ownerSits: currentUser!.name === "Maya & Finn" ? 14 : 0,
      sitterSits:
        currentUser!.name === "Alex Morgan"
          ? Math.max(8, ratingSummary.count)
          : applications.filter(
              (application) =>
                application.applicant.name === currentUser!.name &&
                application.status === "accepted",
            ).length,
      rating: ratingSummary.count ? ratingSummary.average : 0,
      reviews: ratingSummary.count,
      showSitterReviews: true,
    };
  } else if (isBoatOwnerProfile) {
    profile = {
      name: boat!.owner,
      image: boat!.ownerImage,
      coverImage: currentUser?.name === boat!.owner ? currentUser.coverImage : undefined,
      activity: t("member.member"),
      location: memberDetails[id]?.location ?? formatSitLocation(boat!.location, boat!.country),
      since: memberDetails[id]?.since ?? "2022",
      about: memberDetails[id]?.about ?? boat!.description,
      badges: memberDetails[id]?.badges ?? ["Verified owner", "Fast responder"],
      ownerSits: memberDetails[id]?.ownerSits ?? boat!.reviews,
      sitterSits: 0,
      rating: boat!.rating,
      reviews: boat!.reviews,
      showSitterReviews: false,
    };
  } else {
    profile = {
      name: namedMember!.name,
      image: namedMember!.image,
      coverImage: namedMember!.coverImage,
      activity: t("member.member"),
      location: namedMember!.location,
      since: String(namedMember!.memberSince),
      about: namedMember!.bio,
      badges: [...namedMember!.certifications, ...namedMember!.skills.slice(0, 3)],
      ownerSits: 0,
      sitterSits: namedMember!.completedSits,
      rating: ratingSummary.count ? ratingSummary.average : 0,
      reviews: ratingSummary.count,
      showSitterReviews: true,
    };
  }

  function renderProfileReviews() {
    if (profile.showSitterReviews) {
      if (profile.reviews > 0) {
        return (
          <span className="flex items-center gap-1.5 font-bold text-navy">
            <Star className="fill-sun text-sun" size={16} /> {profile.rating.toFixed(1)} ·{" "}
            {t("member.reviews", { count: profile.reviews })}
          </span>
        );
      }
      return <span>{t("reviews.noRatingYet")}</span>;
    }
    return (
      <span className="flex items-center gap-1.5">
        <Star className="fill-sun text-sun" size={16} /> {profile.rating} ·{" "}
        {t("member.reviews", { count: profile.reviews })}
      </span>
    );
  }

  return (
    <main className="px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          <div className="relative isolate">
            <div className="h-40 bg-navy">
              {profile.coverImage ? (
                <img alt="" className="size-full object-cover" src={profile.coverImage} />
              ) : (
                <div className="pointer-events-none h-full bg-[radial-gradient(circle_at_20%_100%,#80d7d0,transparent_35%),radial-gradient(circle_at_80%_0%,#ef7057,transparent_30%)] opacity-40" />
              )}
            </div>
            <div className="relative px-6 pb-8 sm:px-10">
              <div className="relative -mt-16 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
                <img
                  alt={profile.name}
                  className="relative z-20 size-32 shrink-0 rounded-full border-4 border-white bg-white object-cover shadow-card"
                  src={profile.image}
                />
                <div className="relative z-10 flex w-full flex-wrap gap-3 sm:ml-auto sm:w-auto sm:max-w-[calc(100%-9.5rem)] sm:justify-end sm:pb-1">
                  {!isMe && (
                    <>
                      {existingConversation && (
                        <Link
                          className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-navy hover:border-teal"
                          to={`/messages?application=${encodeURIComponent(existingConversation.id)}`}
                        >
                          <span className="flex items-center gap-2">
                            <MessageCircle size={17} /> {t("member.message")}
                          </span>
                        </Link>
                      )}
                      <UserSafetyActions image={profile.image} name={profile.name} />
                    </>
                  )}
                  {isMe && (
                    <>
                      <button
                        className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-teal"
                        onClick={() => setEditing(true)}
                        type="button"
                      >
                        <Pencil size={16} /> {t("profile.edit")}
                      </button>
                      <Link
                        className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-teal"
                        to="/settings"
                      >
                        <Settings size={16} /> {t("settings.title")}
                      </Link>
                    </>
                  )}
                  {identityVerificationEnabled &&
                    (verificationChecks ? (
                      <IdentityVerificationBadge checks={verificationChecks} />
                    ) : (
                      <span className="flex items-center gap-2 rounded-full bg-cream px-4 py-2.5 text-sm font-bold text-slate">
                        <ShieldCheck size={17} /> {t("member.verificationNeeded")}
                      </span>
                    ))}
                </div>
              </div>
              {!isMe && <BlockedUserBanner name={profile.name} />}
              <div className="mt-5">
                <p className="eyebrow">{profile.activity}</p>
                <h1 className="font-display text-4xl font-extrabold tracking-[-0.045em] text-navy">
                  {profile.name}
                </h1>
                <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} /> {profile.location}
                  </span>
                  {renderProfileReviews()}
                  <span>{t("member.since", { year: profile.since })}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-line bg-white p-7">
              <h2 className="detail-title">
                {isMe ? t("member.aboutMe") : t("member.aboutName", { name: profile.name })}
              </h2>
              <p className="mt-4 leading-7 text-slate">{profile.about}</p>
              <h2 className="detail-title mt-8">{t("member.experienceTrust")}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.badges.map((badge) => (
                  <span
                    className="flex items-center gap-2 rounded-full bg-seafoam px-3.5 py-2 text-sm font-semibold text-teal"
                    key={badge}
                  >
                    <Check size={15} /> {badge}
                  </span>
                ))}
              </div>
              {isMe && (currentUser?.languages?.length ?? 0) > 0 && (
                <>
                  <h2 className="detail-title mt-8">{t("member.languages")}</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentUser?.languages?.map((language) => (
                      <span
                        className="rounded-full border border-line bg-cream px-3.5 py-2 text-sm font-semibold text-navy"
                        key={language}
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {isMe && (currentUser?.preferredCountries?.length ?? 0) > 0 && (
                <>
                  <h2 className="detail-title mt-8">{t("profile.preferredCountries")}</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentUser?.preferredCountries?.map((country) => (
                      <span
                        className="flex items-center gap-2 rounded-full border border-line bg-cream px-3.5 py-2 text-sm font-semibold text-navy"
                        key={country}
                      >
                        <MapPin className="text-teal" size={14} /> {country}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
            {pendingReviewApplication &&
              currentUser &&
              pendingReviewSit &&
              canLeaveReview(pendingReviewSit) && (
                <LeaveReviewForm
                  application={pendingReviewApplication}
                  ownerName={currentUser.name}
                />
              )}
            {profile.showSitterReviews && (
              <SitterReviewsSection
                currentUserName={currentUser?.name}
                showEmpty
                sitterName={profile.name}
              />
            )}
          </div>
          <aside className="space-y-4">
            <div className="grid gap-4 rounded-2xl border border-line bg-white p-6">
              <div>
                <p className="text-3xl font-extrabold text-navy">{profile.ownerSits}</p>
                <p className="mt-1 text-sm text-slate">
                  {t("member.sitsAsOwner", { count: profile.ownerSits })}
                </p>
              </div>
              <div className="border-t border-line pt-4">
                <p className="text-3xl font-extrabold text-navy">{profile.sitterSits}</p>
                <p className="mt-1 text-sm text-slate">
                  {t("member.sitsAsSitter", { count: profile.sitterSits })}
                </p>
              </div>
            </div>
            {identityVerificationEnabled && verificationChecks && (
              <IdentityVerificationCard
                checks={verificationChecks}
                isSelf={isMe}
                onStartVerification={() => verifyMutation.mutate()}
                verifying={verifyMutation.isPending}
              />
            )}
            {!isMe && boat && (
              <Link
                className="block rounded-2xl border border-line bg-white p-4 transition hover:border-teal"
                to={`/boats/${boat.id}`}
              >
                <img
                  alt={boat.name}
                  className="aspect-2/1 w-full rounded-xl object-cover"
                  src={boat.image}
                />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-teal">
                  {t("member.theirBoat")}
                </p>
                <p className="mt-1 font-display text-lg font-bold text-navy">{boat.name}</p>
              </Link>
            )}
          </aside>
        </div>
      </div>
      {editing && <ProfileEditor close={closeProfileEditor} />}
    </main>
  );
}

/** Max character lengths for vessel editor form fields */
const VESSEL_MAX_LENGTHS = {
  name: 100,
  description: 2000,
  home: 1500,
  systems: 1000,
  customAmenities: 500,
  wifiNetwork: 64,
  wifiPassword: 64,
  accessCodes: 500,
  otherPrivateNotes: 1000,
} as const;

function VesselEditor({ boat, close }: { boat?: Vessel; close: () => void }) {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user)!;
  const queryClient = useQueryClient();
  const preferredLengthUnit: LengthUnit = user.measurementSystem === "imperial" ? "ft" : "m";
  const initialParsed = parseBoatLength(boat?.length ?? "", "m");
  const initialLengthValue = initialParsed.value
    ? convertBoatLength(initialParsed.value, initialParsed.unit, preferredLengthUnit)
    : "";
  const [imageError, setImageError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [expandedFeatureGroups, setExpandedFeatureGroups] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      const amenities = (boat?.amenities ?? []).map(normalizeBoatFeature);
      for (const group of BOAT_FEATURE_GROUPS) {
        if (
          group.options.length > BOAT_FEATURES_COLLAPSED_VISIBLE &&
          group.options
            .slice(BOAT_FEATURES_COLLAPSED_VISIBLE)
            .some((feature) => amenities.includes(feature))
        ) {
          initial[group.title] = true;
        }
      }
      return initial;
    },
  );
  const [gallery, setGallery] = useState<BoatPhoto[]>(() =>
    (boat?.gallery ?? []).map((photo) => ({ ...photo })),
  );
  const [lengthValue, setLengthValue] = useState(initialLengthValue);
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>(preferredLengthUnit);
  const [lengthUnknown, setLengthUnknown] = useState(!initialLengthValue);
  const [yearUnknown, setYearUnknown] = useState(boat?.yearBuilt == null);
  const [yearBuiltInput, setYearBuiltInput] = useState(
    boat?.yearBuilt != null ? String(boat.yearBuilt) : "",
  );
  const [yearBuiltError, setYearBuiltError] = useState("");
  const [createSitNow, setCreateSitNow] = useState(true);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [form, setForm] = useState({
    name: boat?.name ?? "",
    type: boat?.type ?? "Not specified",
    engineType: boat?.engineType ?? "Not specified",
    voltageType: boat?.voltageType ?? "Not specified",
    stoveFuelType: boat?.stoveFuelType ?? "Not specified",
    homePort: boat?.homePort ?? "",
    image: boat?.image ?? "",
    description: boat?.description ?? "",
    home: boat?.home ?? "",
    systems: boat?.systems.join("\n") ?? "",
    amenities:
      boat?.amenities
        .map(normalizeBoatFeature)
        .filter((item) => ALL_BOAT_FEATURES.includes(item)) ?? [],
    customAmenities:
      boat?.amenities
        .map(normalizeBoatFeature)
        .filter((item) => !ALL_BOAT_FEATURES.includes(item))
        .join("\n") ?? "",
    wifiNetwork: boat?.privateAccess?.wifiNetwork ?? "",
    wifiPassword: boat?.privateAccess?.wifiPassword ?? "",
    accessCodes: boat?.privateAccess?.accessCodes ?? "",
    otherPrivateNotes: boat?.privateAccess?.otherNotes ?? "",
  });
  const isCreatingVessel = !boat;
  const vesselCreateBaseline = useRef(
    isCreatingVessel
      ? JSON.stringify({
          form: {
            name: "",
            type: "Not specified",
            engineType: "Not specified",
            voltageType: "Not specified",
            stoveFuelType: "Not specified",
            homePort: "",
            image: "",
            description: "",
            home: "",
            systems: "",
            amenities: [] as string[],
            customAmenities: "",
            wifiNetwork: "",
            wifiPassword: "",
            accessCodes: "",
            otherPrivateNotes: "",
          },
          gallery: [] as BoatPhoto[],
          lengthValue: "",
          lengthUnit: preferredLengthUnit,
          lengthUnknown: true,
          yearUnknown: true,
          yearBuiltInput: "",
          createSitNow: true,
        })
      : null,
  );
  const isVesselCreateDirty = useMemo(() => {
    if (!vesselCreateBaseline.current) return false;
    return (
      JSON.stringify({
        form,
        gallery,
        lengthValue,
        lengthUnit,
        lengthUnknown,
        yearUnknown,
        yearBuiltInput,
        createSitNow,
      }) !== vesselCreateBaseline.current
    );
  }, [
    createSitNow,
    form,
    gallery,
    lengthUnit,
    lengthUnknown,
    lengthValue,
    yearBuiltInput,
    yearUnknown,
  ]);

  function requestVesselClose() {
    if (isVesselCreateDirty) {
      setDiscardOpen(true);
      return;
    }
    close();
  }
  const { data: sits = [] } = useQuery({
    ...queries.sits.all,
    enabled: Boolean(boat),
  });
  const underwaySitCount = useMemo(() => {
    if (!boat) return 0;
    return sits.filter((sit) => sit.boatId === boat.id && resolveSitPhase(sit) === "stayUnderway")
      .length;
  }, [boat, sits]);

  async function uploadImage(file?: File) {
    if (!file) return;
    setImageError("");
    setImageUploading(true);
    try {
      const image = await prepareImageUpload(file);
      setForm((current) => ({ ...current, image }));
    } catch (error) {
      setImageError(t(error instanceof Error ? error.message : "upload.failed"));
    } finally {
      setImageUploading(false);
    }
  }

  async function uploadGalleryImages(files: File[]) {
    if (files.length === 0) return;
    setGalleryError("");
    setGalleryUploading(true);
    try {
      const uploaded: BoatPhoto[] = [];
      for (const file of files) {
        uploaded.push({ url: await prepareImageUpload(file) });
      }
      setGallery((current) => [...current, ...uploaded]);
    } catch (error) {
      setGalleryError(t(error instanceof Error ? error.message : "upload.failed"));
    } finally {
      setGalleryUploading(false);
    }
  }

  function updateGalleryCaption(index: number, caption: string) {
    setGallery((current) =>
      current.map((photo, photoIndex) =>
        photoIndex === index
          ? { url: photo.url, ...(caption.trim() ? { caption: caption.slice(0, 160) } : {}) }
          : photo,
      ),
    );
  }

  function removeGalleryPhoto(index: number) {
    setGallery((current) => current.filter((_, photoIndex) => photoIndex !== index));
    setGalleryError("");
  }

  const mutation = useMutation({
    mutationFn: () => {
      const id =
        boat?.id ??
        `${form.name
          .toLowerCase()
          .replaceAll(/[^a-z0-9]+/g, "-")
          .replaceAll(/^-|-$/g, "")}-${Date.now().toString().slice(-5)}`;
      let yearBuilt: number | null = null;
      if (!yearUnknown) {
        const parsed = parseYearBuiltInput(yearBuiltInput);
        if (parsed == null || !isValidYearBuilt(parsed)) {
          throw new Error("vesselEditor.yearBuiltInvalid");
        }
        yearBuilt = parsed;
      }
      return saveVessel({
        id,
        name: form.name,
        type: form.type,
        engineType: form.engineType,
        voltageType: form.voltageType,
        stoveFuelType: form.stoveFuelType,
        homePort: form.homePort,
        description: form.description,
        home: form.home,
        length:
          lengthUnknown || !lengthValue
            ? ""
            : normalizeLengthToMetres(`${lengthValue} ${lengthUnit}`),
        yearBuilt,
        image: form.image,
        gallery: gallery.map((photo) => ({
          url: photo.url,
          ...(photo.caption?.trim() ? { caption: photo.caption.trim() } : {}),
        })),
        owner: user.name,
        ownerLanguages: user.languages,
        ownerImage: user.image,
        rating: boat?.rating ?? 0,
        reviews: boat?.reviews ?? 0,
        systems: form.systems.split("\n").filter(Boolean),
        amenities: [
          ...form.amenities,
          ...form.customAmenities
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        ],
        privateAccess: {
          wifiNetwork: form.wifiNetwork,
          wifiPassword: form.wifiPassword,
          accessCodes: form.accessCodes,
          otherNotes: form.otherPrivateNotes,
        },
      });
    },
    onSuccess: async (vessel) => {
      await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.vessels.all.queryKey });
      if (!boat && createSitNow) {
        navigate(`/owner/sits/new?boatId=${encodeURIComponent(vessel.id)}`);
        return;
      }
      close();
    },
  });

  function submitVessel() {
    setYearBuiltError("");
    if (!yearUnknown) {
      const parsed = parseYearBuiltInput(yearBuiltInput);
      if (parsed == null || !isValidYearBuilt(parsed)) {
        setYearBuiltError(
          t("vesselEditor.yearBuiltInvalid", {
            min: MIN_YEAR_BUILT,
            max: maxYearBuilt(),
          }),
        );
        return;
      }
    }
    mutation.mutate();
  }

  const publishBlockedReasons = useMemo(() => {
    const reasons: string[] = [];
    if (!form.image.trim()) reasons.push(t("vesselEditor.coverImage"));
    if (!form.name.trim()) reasons.push(t("vesselEditor.name"));
    if (!form.homePort.trim()) reasons.push(t("vesselEditor.homePort"));
    if (!form.type.trim() || form.type === "Not specified") {
      reasons.push(t("vesselEditor.type"));
    }
    return reasons;
  }, [form.homePort, form.image, form.name, form.type, t]);

  const publishDisabled = mutation.isPending || publishBlockedReasons.length > 0;
  const publishBlockedTooltip =
    publishBlockedReasons.length > 0
      ? t("vesselEditor.publishBlocked", {
          items: new Intl.ListFormat(getIntlLocale(i18n.language), {
            style: "long",
            type: "conjunction",
          }).format(publishBlockedReasons),
        })
      : "";

  let vesselSaveButtonLabel = t("vesselEditor.publish");
  if (mutation.isPending) vesselSaveButtonLabel = t("common.saving");
  else if (boat) vesselSaveButtonLabel = t("vesselEditor.save");

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="order-2 rounded-3xl border border-line bg-white p-6 shadow-card md:p-8 lg:order-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-navy">
                {boat
                  ? t("vesselEditor.editTitle", { boat: boat.name })
                  : t("vesselEditor.addTitle")}
              </h1>
            </div>
            <button
              className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-bold text-navy hover:border-teal"
              data-testid="vessel-editor-back"
              onClick={requestVesselClose}
              type="button"
            >
              <ArrowLeft size={16} /> {t("common.back")}
            </button>
          </div>
          {!boat ? <EditorRequiredFieldsHint className="mt-4" /> : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {underwaySitCount > 0 ? (
              <div
                className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950 sm:col-span-2"
                role="status"
              >
                <TriangleAlert className="mt-0.5 shrink-0 text-amber-700" size={20} />
                <div>
                  <p className="font-bold">
                    {t("vesselEditor.underwayBannerTitle", { count: underwaySitCount })}
                  </p>
                  <p className="mt-1">{t("vesselEditor.underwayBanner")}</p>
                </div>
              </div>
            ) : null}
            <section className="sm:col-span-2" data-testid="vessel-cover">
              <FormLabel required>{t("vesselEditor.coverImage")}</FormLabel>
              <div className="grid gap-3 rounded-2xl border border-line bg-cream/50 p-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(13rem,0.7fr)]">
                <div className="aspect-video overflow-hidden rounded-xl bg-seafoam">
                  {form.image ? (
                    <img
                      alt={t("vesselEditor.coverPreviewAlt")}
                      className="size-full object-cover"
                      data-testid="vessel-cover-preview"
                      src={form.image}
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-center text-slate">
                      <div>
                        <ImagePlus className="mx-auto mb-2 text-teal" size={28} />
                        <p className="text-sm font-semibold">{t("vesselEditor.noCover")}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <div data-testid="vessel-cover-upload">
                    <ImageUploadControl
                      hasImage={Boolean(form.image)}
                      onFile={(file) => void uploadImage(file)}
                      pending={imageUploading}
                    />
                  </div>
                  {form.image && (
                    <button
                      className="self-start text-xs font-bold text-coral"
                      data-testid="vessel-cover-remove"
                      onClick={() => {
                        setForm({ ...form, image: "" });
                        setImageError("");
                        setGalleryOpen(false);
                      }}
                      type="button"
                    >
                      {t("upload.remove")}
                    </button>
                  )}
                </div>
              </div>
              {imageError && (
                <p className="mt-2 text-sm font-semibold text-coral" role="alert">
                  {imageError}
                </p>
              )}
            </section>
            {form.image ? (
              <div className="sm:col-span-2">
                <button
                  aria-controls="vessel-editor-more-photos"
                  aria-expanded={galleryOpen}
                  className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-teal"
                  data-testid="vessel-add-more-photos"
                  onClick={() => setGalleryOpen((open) => !open)}
                  type="button"
                >
                  {gallery.length > 0
                    ? t("vesselEditor.addMorePhotosCount", { count: gallery.length })
                    : t("vesselEditor.addMorePhotos")}
                  <ChevronDown
                    aria-hidden="true"
                    className={`transition ${galleryOpen ? "rotate-180" : ""}`}
                    size={16}
                  />
                </button>
                {galleryOpen ? (
                  <section className="mt-3" id="vessel-editor-more-photos">
                    <p className="mb-3 text-sm text-slate">{t("vesselEditor.galleryHint")}</p>
                    <div className="rounded-2xl border border-line bg-cream/50 p-3">
                      {gallery.length === 0 ? (
                        <p className="mb-3 text-sm font-semibold text-slate">
                          {t("vesselEditor.galleryEmpty")}
                        </p>
                      ) : (
                        <ul className="mb-3 grid gap-3 sm:grid-cols-2">
                          {gallery.map((photo, index) => (
                            <li
                              className="overflow-hidden rounded-xl border border-line bg-white"
                              key={`${photo.url}-${index}`}
                            >
                              <div className="aspect-video overflow-hidden bg-seafoam">
                                <img
                                  alt={t("vesselEditor.galleryPhotoAlt", { number: index + 1 })}
                                  className="size-full object-cover"
                                  src={photo.url}
                                />
                              </div>
                              <div className="flex flex-col gap-3 p-3">
                                <label className="block">
                                  <FormLabel optional>{t("vesselEditor.galleryCaption")}</FormLabel>
                                  <input
                                    className="form-input"
                                    data-testid="vessel-gallery-caption"
                                    maxLength={160}
                                    onChange={(event) =>
                                      updateGalleryCaption(index, event.target.value)
                                    }
                                    placeholder={t("vesselEditor.galleryCaptionPlaceholder")}
                                    value={photo.caption ?? ""}
                                  />
                                </label>
                                <button
                                  className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-coral"
                                  data-testid="vessel-gallery-remove"
                                  onClick={() => removeGalleryPhoto(index)}
                                  type="button"
                                >
                                  <Trash2 size={14} />
                                  {t("vesselEditor.removeGalleryPhoto")}
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <ImageUploadControl
                        hasImage={gallery.length > 0}
                        multiple
                        onFiles={(files) => void uploadGalleryImages(files)}
                        pending={galleryUploading}
                      />
                    </div>
                    {galleryError && (
                      <p className="mt-2 text-sm font-semibold text-coral" role="alert">
                        {galleryError}
                      </p>
                    )}
                  </section>
                ) : null}
              </div>
            ) : null}
            <label className="sm:col-span-2">
              <FormLabel required>{t("vesselEditor.name")}</FormLabel>
              <div className="relative">
                <input
                  className="form-input"
                  maxLength={VESSEL_MAX_LENGTHS.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder={t("vesselEditor.namePlaceholder")}
                  value={form.name}
                />
                <CharacterCount
                  className="absolute right-3 bottom-2"
                  current={form.name.length}
                  max={VESSEL_MAX_LENGTHS.name}
                />
              </div>
            </label>
            <div className="sm:col-span-2">
              <FormLabel required>{t("vesselEditor.homePort")}</FormLabel>
              <DestinationAutocomplete
                includeCountry
                onChange={(homePort) => setForm({ ...form, homePort })}
                placeholder={t("search.destination")}
                requireSelection
                testId="vessel-home-port"
                value={form.homePort}
                variant="profile"
              />
              <p className="mt-2 text-xs leading-5 text-slate" data-testid="vessel-home-port-hint">
                {t("vesselEditor.homePortHint")}
              </p>
            </div>
            <label>
              <FormLabel required>{t("vesselEditor.type")}</FormLabel>
              <Select
                data-testid="vessel-type"
                variant="form"
                onChange={(event) => setForm({ ...form, type: event.target.value })}
                value={form.type}
              >
                <option value="Not specified">{displayLabel(t, "Not specified")}</option>
                {VESSEL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {displayLabel(t, type)}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              <FormLabel optional>{t("vesselEditor.engineType")}</FormLabel>
              <Select
                variant="form"
                onChange={(event) =>
                  setForm({ ...form, engineType: event.target.value as EngineType })
                }
                value={form.engineType}
              >
                {ENGINE_TYPES.map((engineType) => (
                  <option key={engineType} value={engineType}>
                    {displayLabel(t, engineType)}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              <FormLabel optional>{t("vesselEditor.voltageType")}</FormLabel>
              <Select
                variant="form"
                onChange={(event) =>
                  setForm({ ...form, voltageType: event.target.value as VoltageType })
                }
                value={form.voltageType}
              >
                {VOLTAGE_TYPES.map((voltageType) => (
                  <option key={voltageType} value={voltageType}>
                    {displayLabel(t, voltageType)}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              <FormLabel optional>{t("vesselEditor.stoveFuelType")}</FormLabel>
              <Select
                variant="form"
                onChange={(event) =>
                  setForm({ ...form, stoveFuelType: event.target.value as StoveFuelType })
                }
                value={form.stoveFuelType}
              >
                {STOVE_FUEL_TYPES.map((stoveFuelType) => (
                  <option key={stoveFuelType} value={stoveFuelType}>
                    {displayLabel(t, stoveFuelType)}
                  </option>
                ))}
              </Select>
            </label>
            <div>
              <FormLabel optional>{t("vesselEditor.length")}</FormLabel>
              <IconTooltip
                className="w-full"
                hidden={!lengthUnknown}
                label={t("vesselEditor.lengthDisabledHint")}
                wrap
              >
                <span
                  className={`grid w-full grid-cols-[minmax(0,1fr)_7.5rem] gap-2 ${
                    lengthUnknown ? "pointer-events-none" : ""
                  }`}
                  data-testid="vessel-length-fields"
                >
                  <input
                    className="form-input"
                    data-testid="vessel-length-value"
                    disabled={lengthUnknown}
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => {
                      setLengthValue(event.target.value);
                      if (event.target.value.trim()) setLengthUnknown(false);
                    }}
                    placeholder={t("vesselEditor.lengthValuePlaceholder")}
                    step="0.1"
                    type="number"
                    value={lengthUnknown ? "" : lengthValue}
                  />
                  <Select
                    variant="form"
                    aria-label={t("vesselEditor.lengthUnit")}
                    data-testid="vessel-length-unit"
                    disabled={lengthUnknown}
                    onChange={(event) => {
                      const nextUnit = event.target.value as LengthUnit;
                      setLengthValue((current) => convertBoatLength(current, lengthUnit, nextUnit));
                      setLengthUnit(nextUnit);
                    }}
                    value={lengthUnit}
                  >
                    <option value="m">{t("units.meters")}</option>
                    <option value="ft">{t("units.feet")}</option>
                  </Select>
                </span>
              </IconTooltip>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate">
                <input
                  checked={lengthUnknown}
                  className="size-4 accent-teal"
                  data-testid="vessel-length-unknown"
                  onChange={(event) => {
                    const unknown = event.target.checked;
                    setLengthUnknown(unknown);
                    if (unknown) setLengthValue("");
                  }}
                  type="checkbox"
                />
                {t("vesselEditor.lengthUnknown")}
              </label>
            </div>
            <div>
              <FormLabel optional>{t("vesselEditor.yearBuilt")}</FormLabel>
              <IconTooltip
                className="w-full"
                hidden={!yearUnknown}
                label={t("vesselEditor.yearBuiltDisabledHint")}
                wrap
              >
                <input
                  aria-invalid={Boolean(yearBuiltError)}
                  className={`form-input ${yearUnknown ? "pointer-events-none" : ""}`}
                  data-testid="vessel-year-built"
                  disabled={yearUnknown}
                  inputMode="numeric"
                  max={maxYearBuilt()}
                  min={MIN_YEAR_BUILT}
                  onChange={(event) => {
                    setYearBuiltInput(event.target.value);
                    setYearBuiltError("");
                    if (event.target.value.trim()) setYearUnknown(false);
                  }}
                  placeholder={t("vesselEditor.yearBuiltPlaceholder")}
                  type="number"
                  value={yearUnknown ? "" : yearBuiltInput}
                />
              </IconTooltip>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate">
                <input
                  checked={yearUnknown}
                  className="size-4 accent-teal"
                  data-testid="vessel-year-unknown"
                  onChange={(event) => {
                    const unknown = event.target.checked;
                    setYearUnknown(unknown);
                    setYearBuiltError("");
                    if (unknown) setYearBuiltInput("");
                  }}
                  type="checkbox"
                />
                {t("vesselEditor.yearBuiltUnknown")}
              </label>
              {yearBuiltError ? (
                <p className="mt-2 text-sm font-semibold text-coral" role="alert">
                  {yearBuiltError}
                </p>
              ) : null}
            </div>
            {(
              [
                [
                  "description",
                  t("vesselEditor.about"),
                  t("vesselEditor.aboutPlaceholder"),
                  VESSEL_MAX_LENGTHS.description,
                ],
                [
                  "home",
                  t("vesselEditor.lifeAboard"),
                  t("vesselEditor.lifePlaceholder"),
                  VESSEL_MAX_LENGTHS.home,
                ],
                [
                  "systems",
                  t("vesselEditor.systems"),
                  t("vesselEditor.systemsPlaceholder"),
                  VESSEL_MAX_LENGTHS.systems,
                ],
                [
                  "customAmenities",
                  t("vesselEditor.otherFeatures"),
                  t("vesselEditor.onePerLine"),
                  VESSEL_MAX_LENGTHS.customAmenities,
                ],
              ] as const
            ).map(([key, label, placeholder, maxLength]) => (
              <label className="sm:col-span-2" key={key}>
                <FormLabel optional>{label}</FormLabel>
                <div className="relative">
                  <textarea
                    className="form-input min-h-24 resize-y"
                    maxLength={maxLength}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    placeholder={placeholder}
                    value={form[key as keyof typeof form] as string}
                  />
                  <CharacterCount
                    className="absolute right-3 bottom-2"
                    current={(form[key as keyof typeof form] as string).length}
                    max={maxLength}
                  />
                </div>
              </label>
            ))}
            <section className="sm:col-span-2 rounded-2xl border border-teal/30 bg-seafoam/40 p-4 md:p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-teal">
                  <KeyRound aria-hidden="true" size={18} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold text-navy">
                    {t("vesselEditor.privateAccessTitle")}{" "}
                    <span className="text-sm font-semibold text-slate">
                      ({t("common.optional")})
                    </span>
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate">
                    {t("vesselEditor.privateAccessHint")}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label>
                  <FormLabel>{t("vesselEditor.wifiNetwork")}</FormLabel>
                  <div className="relative">
                    <input
                      autoComplete="off"
                      className="form-input"
                      maxLength={VESSEL_MAX_LENGTHS.wifiNetwork}
                      onChange={(event) => setForm({ ...form, wifiNetwork: event.target.value })}
                      placeholder={t("vesselEditor.wifiNetworkPlaceholder")}
                      value={form.wifiNetwork}
                    />
                    <CharacterCount
                      className="absolute right-3 bottom-2"
                      current={form.wifiNetwork.length}
                      max={VESSEL_MAX_LENGTHS.wifiNetwork}
                    />
                  </div>
                </label>
                <label>
                  <FormLabel>{t("vesselEditor.wifiPassword")}</FormLabel>
                  <div className="relative">
                    <input
                      autoComplete="off"
                      className="form-input"
                      maxLength={VESSEL_MAX_LENGTHS.wifiPassword}
                      onChange={(event) => setForm({ ...form, wifiPassword: event.target.value })}
                      placeholder={t("vesselEditor.wifiPasswordPlaceholder")}
                      value={form.wifiPassword}
                    />
                    <CharacterCount
                      className="absolute right-3 bottom-2"
                      current={form.wifiPassword.length}
                      max={VESSEL_MAX_LENGTHS.wifiPassword}
                    />
                  </div>
                </label>
                <label className="sm:col-span-2">
                  <FormLabel>{t("vesselEditor.accessCodes")}</FormLabel>
                  <div className="relative">
                    <textarea
                      className="form-input min-h-24 resize-y"
                      maxLength={VESSEL_MAX_LENGTHS.accessCodes}
                      onChange={(event) => setForm({ ...form, accessCodes: event.target.value })}
                      placeholder={t("vesselEditor.accessCodesPlaceholder")}
                      value={form.accessCodes}
                    />
                    <CharacterCount
                      className="absolute right-3 bottom-2"
                      current={form.accessCodes.length}
                      max={VESSEL_MAX_LENGTHS.accessCodes}
                    />
                  </div>
                </label>
                <label className="sm:col-span-2">
                  <FormLabel>{t("vesselEditor.otherPrivateNotes")}</FormLabel>
                  <div className="relative">
                    <textarea
                      className="form-input min-h-24 resize-y"
                      maxLength={VESSEL_MAX_LENGTHS.otherPrivateNotes}
                      onChange={(event) =>
                        setForm({ ...form, otherPrivateNotes: event.target.value })
                      }
                      placeholder={t("vesselEditor.otherPrivateNotesPlaceholder")}
                      value={form.otherPrivateNotes}
                    />
                    <CharacterCount
                      className="absolute right-3 bottom-2"
                      current={form.otherPrivateNotes.length}
                      max={VESSEL_MAX_LENGTHS.otherPrivateNotes}
                    />
                  </div>
                </label>
              </div>
            </section>
          </div>
          <section className="mt-7">
            <p className="eyebrow">{t("vesselEditor.featuresKicker")}</p>
            <h3 className="font-display text-lg font-bold text-navy">
              {t("vesselEditor.featuresTitle")}{" "}
              <span className="text-sm font-semibold text-slate">({t("common.optional")})</span>
            </h3>
            <p className="mt-1 text-sm text-slate">{t("vesselEditor.featuresHint")}</p>
            <div className="mt-5 space-y-5">
              {BOAT_FEATURE_GROUPS.map((group) => {
                const canCollapse = group.options.length > BOAT_FEATURES_COLLAPSED_VISIBLE;
                const expanded = Boolean(expandedFeatureGroups[group.title]);
                const visibleOptions =
                  !canCollapse || expanded
                    ? group.options
                    : group.options.slice(0, BOAT_FEATURES_COLLAPSED_VISIBLE);
                const hiddenCount = group.options.length - BOAT_FEATURES_COLLAPSED_VISIBLE;
                return (
                  <div
                    data-testid={`vessel-feature-group-${group.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "")}`}
                    key={group.title}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-slate">
                      {t(FEATURE_GROUP_KEYS[group.title])}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                      {visibleOptions.map((feature) => {
                        const selected = form.amenities.includes(feature);
                        return (
                          <button
                            aria-pressed={selected}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                              selected
                                ? "border-teal bg-seafoam text-teal"
                                : "border-line bg-white text-navy hover:border-teal"
                            }`}
                            key={feature}
                            onClick={() =>
                              setForm({
                                ...form,
                                amenities: selected
                                  ? form.amenities.filter((item) => item !== feature)
                                  : [...form.amenities, feature],
                              })
                            }
                            type="button"
                          >
                            <FeatureIcon feature={feature} />
                            <span className="min-w-0 flex-1">{displayLabel(t, feature)}</span>
                            {selected && <Check className="shrink-0" size={15} />}
                          </button>
                        );
                      })}
                      {canCollapse && !expanded ? (
                        <button
                          aria-expanded={false}
                          className="flex items-center justify-center rounded-xl border border-dashed border-teal/50 bg-seafoam/50 px-3 py-3 text-sm font-semibold text-teal transition hover:border-teal hover:bg-seafoam"
                          data-testid="vessel-feature-group-more"
                          onClick={() =>
                            setExpandedFeatureGroups((prev) => ({
                              ...prev,
                              [group.title]: true,
                            }))
                          }
                          type="button"
                        >
                          {t("vesselEditor.featuresMore", { count: hiddenCount })}
                        </button>
                      ) : null}
                      {canCollapse && expanded ? (
                        <button
                          aria-expanded={true}
                          className="flex items-center justify-center rounded-xl border border-dashed border-line bg-white px-3 py-3 text-sm font-semibold text-slate transition hover:border-teal hover:text-teal"
                          data-testid="vessel-feature-group-show-less"
                          onClick={() =>
                            setExpandedFeatureGroups((prev) => ({
                              ...prev,
                              [group.title]: false,
                            }))
                          }
                          type="button"
                        >
                          {t("vesselEditor.featuresShowLess")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <div className="mt-6 space-y-4 border-t border-line pt-5">
            {!boat ? (
              <p className="text-sm leading-5 text-slate" data-testid="vessel-publish-sit-note">
                {t("vesselEditor.publishNotListedNote")}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                className="rounded-xl px-5 py-3 text-sm font-bold text-slate"
                data-testid="vessel-editor-cancel"
                onClick={requestVesselClose}
                type="button"
              >
                {t("common.cancel")}
              </button>
              <div className="flex flex-wrap items-center gap-3">
                {!boat ? (
                  <label
                    className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy"
                    data-testid="vessel-create-sit-now"
                  >
                    <input
                      checked={createSitNow}
                      className="size-4 accent-teal"
                      data-testid="vessel-create-sit-now-input"
                      onChange={(event) => setCreateSitNow(event.target.checked)}
                      type="checkbox"
                    />
                    {t("vesselEditor.createSitNow")}
                  </label>
                ) : null}
                <IconTooltip
                  hidden={!publishBlockedTooltip || mutation.isPending}
                  label={publishBlockedTooltip}
                  side="top"
                  wrap
                >
                  <button
                    className="rounded-xl bg-coral px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
                    data-testid="vessel-publish"
                    disabled={publishDisabled}
                    onClick={submitVessel}
                    type="button"
                  >
                    {vesselSaveButtonLabel}
                  </button>
                </IconTooltip>
              </div>
            </div>
          </div>
        </div>
        <div className="order-1 lg:sticky lg:top-24 lg:order-2 lg:self-start">
          <EditorLivePreview hint={t("editorPreview.vesselHint")}>
            <VesselPreviewCard
              vessel={{
                name: form.name,
                type: form.type,
                length:
                  lengthUnknown || !lengthValue
                    ? ""
                    : normalizeLengthToMetres(`${lengthValue} ${lengthUnit}`),
                yearBuilt: yearUnknown ? null : (parseYearBuiltInput(yearBuiltInput) ?? null),
                homePort: form.homePort,
                image: form.image,
                engineType: form.engineType,
                voltageType: form.voltageType,
                stoveFuelType: form.stoveFuelType,
              }}
            />
          </EditorLivePreview>
        </div>
      </div>
      {discardOpen ? (
        <ConfirmDialog
          cancelLabel={t("editor.discardKeepEditing")}
          confirmLabel={t("editor.discardConfirm")}
          onCancel={() => setDiscardOpen(false)}
          onConfirm={close}
          testId="editor-discard-dialog"
          text={t("editor.discardText")}
          title={t("editor.discardTitle")}
          titleId="vessel-discard-title"
          tone="danger"
        />
      ) : null}
    </main>
  );
}

function VesselEditorPage({ mode }: { mode: "new" | "edit" }) {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const navigate = useNavigate();
  const { boatId } = useParams();
  const { data: vessels = [], isLoading } = useQuery({
    ...queries.vessels.all,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <Anchor className="mx-auto text-coral" size={42} />
        <h1 className="mt-5 font-display text-3xl font-extrabold text-navy">
          {t("owner.signInRequired")}
        </h1>
        <p className="mt-3 text-slate">{t("owner.accessBoatHint")}</p>
        <button
          className="mt-6 rounded-full bg-navy px-6 py-3 font-bold text-white"
          onClick={() => openAuth("login")}
          type="button"
        >
          {t("owner.chooseAccount")}
        </button>
      </main>
    );
  }

  if (mode === "edit" && isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <div className="h-136 animate-pulse rounded-3xl bg-seafoam" />
      </main>
    );
  }

  const boat = mode === "edit" ? vessels.find((vessel) => vessel.id === boatId) : undefined;
  if (mode === "edit" && (!boat || boat.owner !== user.name)) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <ShipWheel className="mx-auto text-teal" size={42} />
        <h1 className="mt-5 font-display text-3xl font-extrabold text-navy">
          {t("owner.boatNotFound")}
        </h1>
        <p className="mt-3 text-slate">{t("owner.boatUnavailable")}</p>
        <button
          className="mt-6 rounded-full bg-navy px-6 py-3 font-bold text-white"
          onClick={() => navigate("/my-boats")}
          type="button"
        >
          {t("owner.backToBoats")}
        </button>
      </main>
    );
  }

  return <VesselEditor boat={boat} close={() => navigate("/my-boats")} />;
}

function SitEditor({
  sit,
  vessels,
  close,
  locked = false,
  preferredBoatId,
}: {
  sit?: Sit;
  vessels: Vessel[];
  close: () => void;
  locked?: boolean;
  preferredBoatId?: string;
}) {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAppStore((state) => state.user);
  const sitDefaults = {
    ...DEFAULT_SIT_CREATION_DEFAULTS,
    ...user?.sitDefaults,
  };
  const initialBoatId =
    sit?.boatId ??
    (preferredBoatId && vessels.some((vessel) => vessel.id === preferredBoatId)
      ? preferredBoatId
      : vessels[0]?.id) ??
    "";
  const initialVessel = vessels.find((vessel) => vessel.id === initialBoatId);
  const initialHomePort = splitHomePort(initialVessel?.homePort ?? "");
  const existingEnd = useMemo(() => {
    if (!sit) return "";
    const end = new Date(`${sit.dateStart}T00:00:00`);
    end.setDate(end.getDate() + Number.parseInt(sit.duration, 10));
    return end.toISOString().slice(0, 10);
  }, [sit]);
  const [sameAsHomePort, setSameAsHomePort] = useState(
    !sit || matchesHomePort(sit.location, sit.country, initialVessel?.homePort ?? ""),
  );
  const [form, setForm] = useState({
    boatId: initialBoatId,
    location: sit?.location ?? initialHomePort.location,
    country: sit?.country ?? initialHomePort.country,
    fullAddress: sit?.fullAddress ?? "",
    startDate: sit?.dateStart ?? "",
    endDate: existingEnd,
    sitType: sit?.sitType ?? "liveaboard",
    responsibilities: sit?.responsibilities.join("\n") ?? "",
    requirements: withoutNonSmokerRequirementLabels(
      sit?.requirements.filter(
        (requirement) => !(sit.requiredSkills ?? []).includes(requirement),
      ) ?? [],
    ).join("\n"),
    minYearsExperience: String(sit?.minYearsExperience ?? 0),
    requiredExperience: sit?.requiredExperience ?? [],
    requiredCertifications: sit?.requiredCertifications ?? [],
    requiredSkills: sit?.requiredSkills ?? [],
    maxGuests: String(sit?.maxGuests ?? 2),
    pet: sit?.pet ?? "",
    nonSmokerRequired: sit ? resolveNonSmokerRequired(sit) : sitDefaults.nonSmokerRequired,
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const requireVerificationToSit = useFeatureFlag("requireVerificationToSit");
  const isCreating = !sit;
  const sitCreateBaseline = useRef(
    isCreating
      ? JSON.stringify({
          form: {
            boatId: initialBoatId,
            location: initialHomePort.location,
            country: initialHomePort.country,
            fullAddress: "",
            startDate: "",
            endDate: "",
            sitType: "liveaboard",
            responsibilities: "",
            requirements: "",
            minYearsExperience: "0",
            requiredExperience: [] as string[],
            requiredCertifications: [] as string[],
            requiredSkills: [] as string[],
            maxGuests: "2",
            pet: "",
            nonSmokerRequired: sitDefaults.nonSmokerRequired,
          },
          sameAsHomePort: true,
          acceptedTerms: false,
        })
      : null,
  );
  const isSitCreateDirty = useMemo(() => {
    if (!sitCreateBaseline.current) return false;
    return (
      JSON.stringify({
        form,
        sameAsHomePort,
        acceptedTerms,
      }) !== sitCreateBaseline.current
    );
  }, [acceptedTerms, form, sameAsHomePort]);

  function requestSitClose() {
    if (isSitCreateDirty) {
      setDiscardOpen(true);
      return;
    }
    close();
  }
  const { data: verificationChecks, isLoading: verificationLoading } = useQuery({
    ...queries.verificationChecks.sitCreate(user?.name, user?.email, user?.phoneNumber),
    enabled: Boolean(isCreating && requireVerificationToSit && user),
  });
  let canCreateSit = true;
  if (requireVerificationToSit) {
    canCreateSit = verificationChecks ? isFullyVerified(verificationChecks) : false;
  }
  const verifyMutation = useMutation({
    mutationFn: () => startVerification(user!.name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...queries.verificationChecks.getQueryKey(), user?.name],
      });
      await queryClient.invalidateQueries({
        queryKey: queries.verification.status(user?.name).queryKey,
      });
    },
  });
  const mutation = useMutation({
    mutationFn: () => {
      if (locked) throw new Error("sitEditor.lockedBanner");
      if (!acceptedTerms) throw new Error("sitEditor.termsRequired");
      if (isCreating && requireVerificationToSit && !canCreateSit) {
        throw new Error("SIT_VERIFICATION_REQUIRED");
      }
      const selectedVessel = vessels.find((vessel) => vessel.id === form.boatId);
      const homePort = splitHomePort(selectedVessel?.homePort ?? "");
      const start = new Date(`${form.startDate}T00:00:00`);
      const end = new Date(`${form.endDate}T00:00:00`);
      const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
      const formatter = new Intl.DateTimeFormat(getIntlLocale(i18n.language), {
        day: "numeric",
        month: "short",
      });
      const location = sameAsHomePort ? homePort.location : form.location.trim();
      const country = sameAsHomePort ? homePort.country : form.country.trim();
      const coordinates = coordinatesForLocation(location, country);
      return saveSit(
        {
          id: sit?.id ?? `sit-${form.boatId}-${Date.now().toString().slice(-6)}`,
          boatId: form.boatId,
          dateStart: form.startDate,
          dates: `${formatter.format(start)} – ${formatter.format(end)}`,
          duration: t("duration.nights", { count: nights }),
          location,
          country,
          fullAddress: form.fullAddress.trim() || undefined,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          approximateLocation: true,
          sitType: form.sitType as "liveaboard" | "daytimeChecks",
          responsibilities: form.responsibilities.split("\n").filter(Boolean),
          requirements: withoutNonSmokerRequirementLabels(
            form.requirements.split("\n").filter(Boolean),
          ),
          minYearsExperience: Number(form.minYearsExperience),
          requiredExperience: form.requiredExperience,
          requiredCertifications: form.requiredCertifications,
          requiredSkills: form.requiredSkills,
          maxGuests: form.sitType === "daytimeChecks" ? 1 : Math.max(1, Number(form.maxGuests)),
          applicants: sit?.applicants ?? 0,
          pet: form.pet || undefined,
          featured: sit?.featured,
          nonSmokerRequired: form.nonSmokerRequired,
          applicationsOpen: sit ? sit.applicationsOpen !== false : true,
        },
        isCreating && user
          ? {
              creator: {
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
              },
            }
          : undefined,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.sits.all.queryKey });
      close();
    },
  });

  function toggleRequirement(
    field: "requiredExperience" | "requiredCertifications" | "requiredSkills",
    option: string,
  ) {
    if (locked) return;
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(option)
        ? current[field].filter((item) => item !== option)
        : [...current[field], option],
    }));
  }

  const selectedVessel = vessels.find((vessel) => vessel.id === form.boatId);
  const previewBoat = useMemo((): Boat | null => {
    if (!selectedVessel) return null;
    const home = splitHomePort(selectedVessel.homePort);
    const location = (sameAsHomePort ? home.location : form.location.trim()) || home.location;
    const country = (sameAsHomePort ? home.country : form.country.trim()) || home.country;
    let nights = 0;
    if (form.startDate && form.endDate) {
      const start = new Date(`${form.startDate}T00:00:00`);
      const end = new Date(`${form.endDate}T00:00:00`);
      nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
    }
    return {
      id: sit?.id ?? "preview-sit",
      boatId: selectedVessel.id,
      name: selectedVessel.name,
      type: selectedVessel.type,
      length: selectedVessel.length,
      location,
      country,
      latitude: coordinatesForLocation(location, country).latitude,
      longitude: coordinatesForLocation(location, country).longitude,
      approximateLocation: true,
      homePort: selectedVessel.homePort,
      dates: "",
      dateStart: form.startDate,
      duration: nights ? String(nights) : "0",
      image: selectedVessel.image,
      gallery: selectedVessel.gallery,
      owner: selectedVessel.owner,
      ownerLanguages: selectedVessel.ownerLanguages,
      ownerImage: selectedVessel.ownerImage,
      rating: selectedVessel.rating,
      reviews: selectedVessel.reviews,
      maxGuests: form.sitType === "daytimeChecks" ? 1 : Math.max(1, Number(form.maxGuests) || 1),
      applicants: sit?.applicants ?? 0,
      description: selectedVessel.description,
      home: selectedVessel.home,
      responsibilities: form.responsibilities.split("\n").filter(Boolean),
      sitType: form.sitType as "liveaboard" | "daytimeChecks",
      systems: selectedVessel.systems,
      engineType: selectedVessel.engineType,
      voltageType: selectedVessel.voltageType,
      stoveFuelType: selectedVessel.stoveFuelType,
      requirements: form.requirements.split("\n").filter(Boolean),
      minYearsExperience: Number(form.minYearsExperience) || 0,
      requiredExperience: form.requiredExperience,
      requiredCertifications: form.requiredCertifications,
      requiredSkills: form.requiredSkills,
      amenities: selectedVessel.amenities,
      pet: form.pet || undefined,
      nonSmokerRequired: form.nonSmokerRequired,
      accepted: false,
      applicationsOpen: true,
      phase: "acceptingApplicants",
    };
  }, [
    form.boatId,
    form.country,
    form.endDate,
    form.location,
    form.maxGuests,
    form.minYearsExperience,
    form.nonSmokerRequired,
    form.pet,
    form.requiredCertifications,
    form.requiredExperience,
    form.requiredSkills,
    form.requirements,
    form.responsibilities,
    form.sitType,
    form.startDate,
    sameAsHomePort,
    selectedVessel,
    sit?.applicants,
    sit?.id,
  ]);

  const publishBlockedReasons = useMemo(() => {
    const reasons: string[] = [];
    if (!form.boatId) reasons.push(t("sitEditor.boat"));
    if (!form.startDate || !form.endDate) reasons.push(t("sitEditor.dates"));
    if (!sameAsHomePort && !form.location.trim()) reasons.push(t("sitEditor.location"));
    if (!sameAsHomePort && !form.country.trim()) reasons.push(t("sitEditor.country"));
    if (!form.fullAddress.trim()) reasons.push(t("sitEditor.fullAddress"));
    if (!form.fullAddress.trim()) reasons.push(t("sitEditor.fullAddress"));
    if (form.sitType !== "daytimeChecks") {
      const guests = Number(form.maxGuests);
      if (!Number.isFinite(guests) || guests < 1 || guests > 12) {
        reasons.push(t("sitEditor.maxGuests"));
      }
    }
    return reasons;
  }, [
    form.boatId,
    form.country,
    form.endDate,
    form.fullAddress,
    form.location,
    form.maxGuests,
    form.sitType,
    form.startDate,
    sameAsHomePort,
    t,
  ]);

  const publishDisabled = mutation.isPending || publishBlockedReasons.length > 0;
  const publishBlockedTooltip =
    publishBlockedReasons.length > 0
      ? t("sitEditor.publishBlocked", {
          items: new Intl.ListFormat(getIntlLocale(i18n.language), {
            style: "long",
            type: "conjunction",
          }).format(publishBlockedReasons),
        })
      : "";
  const showSitVerificationLoading = isCreating && requireVerificationToSit && verificationLoading;
  const showSitVerificationGate =
    isCreating && requireVerificationToSit && !canCreateSit && Boolean(verificationChecks);
  let sitSaveButtonLabel = t("sitEditor.publish");
  if (mutation.isPending) sitSaveButtonLabel = t("common.saving");
  else if (sit) sitSaveButtonLabel = t("sitEditor.save");

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="order-2 min-w-0 rounded-3xl border border-line bg-white p-6 shadow-card md:p-8 lg:order-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">{t("sitEditor.kicker")}</p>
              <h1 className="font-display text-3xl font-bold text-navy">
                {sit ? t("sitEditor.editTitle") : t("sitEditor.createTitle")}
              </h1>
              <p className="mt-2 text-sm text-slate">{t("sitEditor.hint")}</p>
              {!sit ? <EditorRequiredFieldsHint className="mt-2" /> : null}
            </div>
            <button
              className="flex shrink-0 items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-bold text-navy hover:border-teal"
              data-testid="sit-editor-back"
              onClick={requestSitClose}
              type="button"
            >
              <ArrowLeft size={16} /> {t("common.back")}
            </button>
          </div>
          {!sit && (
            <div className="mt-6 space-y-4">
              <div
                className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950"
                role="note"
              >
                <ShipWheel className="mt-0.5 shrink-0 text-amber-700" size={20} />
                <div className="min-w-0">
                  <p className="font-bold">{t("sitEditor.boatDetailsBannerTitle")}</p>
                  <p className="mt-1">{t("sitEditor.boatDetailsBanner")}</p>
                  {form.boatId ? (
                    <Link
                      className="mt-2 inline-flex font-bold text-amber-900 underline decoration-amber-400 underline-offset-2 hover:text-navy"
                      to={`/owner/boats/${form.boatId}/edit`}
                    >
                      {t("sitEditor.boatDetailsBannerCta")}
                    </Link>
                  ) : null}
                </div>
              </div>
              <div
                className="flex gap-3 rounded-2xl border border-teal/30 bg-seafoam px-5 py-4 text-sm leading-6 text-navy"
                role="note"
              >
                <Info className="mt-0.5 shrink-0 text-teal" size={20} />
                <div>
                  <p className="font-bold">{t("sitEditor.createEditLimitTitle")}</p>
                  <p className="mt-1 text-slate">{t("sitEditor.createEditLimit")}</p>
                </div>
              </div>
            </div>
          )}
          {showSitVerificationLoading ? (
            <p className="mt-6 text-sm text-slate">{t("sitEditor.verificationChecking")}</p>
          ) : null}
          {showSitVerificationGate ? (
            <div className="mt-6 space-y-5">
              <div
                className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
                role="alert"
              >
                <ShieldCheck className="mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-semibold">{t("sitEditor.verificationRequiredTitle")}</p>
                  <p className="mt-1">{t("sitEditor.verificationRequiredText")}</p>
                </div>
              </div>
              <IdentityVerificationCard
                checks={verificationChecks!}
                isSelf
                onStartVerification={() => verifyMutation.mutate()}
                verifying={verifyMutation.isPending}
              />
              <Link
                className="inline-flex w-full items-center justify-center rounded-xl bg-navy py-3.5 font-bold text-white"
                onClick={close}
                to="/members/me"
              >
                {t("sitEditor.verificationRequiredCta")}
              </Link>
              <button
                className="block w-full text-sm font-semibold text-slate hover:text-navy"
                onClick={requestSitClose}
                type="button"
              >
                {t("common.cancel")}
              </button>
            </div>
          ) : null}
          {!showSitVerificationLoading && !showSitVerificationGate ? (
            <>
              {locked && (
                <div
                  className="mt-5 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950"
                  role="status"
                >
                  <TriangleAlert className="mt-0.5 shrink-0 text-amber-700" size={20} />
                  <div>
                    <p className="font-bold">{t("sitEditor.lockedBannerTitle")}</p>
                    <p className="mt-1">{t("sitEditor.lockedBanner")}</p>
                  </div>
                </div>
              )}
              <fieldset className="mt-6 space-y-5 disabled:opacity-70" disabled={locked}>
                <VesselPicker
                  disabled={Boolean(sit) || locked}
                  onChange={(boatId) => {
                    const vessel = vessels.find((item) => item.id === boatId);
                    const homePort = splitHomePort(vessel?.homePort ?? "");
                    setForm({
                      ...form,
                      boatId,
                      ...(sameAsHomePort
                        ? { location: homePort.location, country: homePort.country }
                        : {}),
                    });
                  }}
                  value={form.boatId}
                  vessels={vessels}
                />
                <section className="rounded-2xl border border-line bg-cream/60 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      checked={sameAsHomePort}
                      className="mt-0.5 size-4 accent-teal"
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setSameAsHomePort(checked);
                        if (checked) {
                          const vessel = vessels.find((item) => item.id === form.boatId);
                          const homePort = splitHomePort(vessel?.homePort ?? "");
                          setForm({
                            ...form,
                            location: homePort.location,
                            country: homePort.country,
                          });
                        }
                      }}
                      type="checkbox"
                    />
                    <span>
                      <span className="block text-sm font-bold text-navy">
                        {t("sitEditor.sameAsHomePort", {
                          homePort:
                            vessels.find((vessel) => vessel.id === form.boatId)?.homePort ?? "",
                        })}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate">
                        {t("sitEditor.sameAsHomePortHint")}
                      </span>
                    </span>
                  </label>
                </section>
                {!sameAsHomePort && (
                  <section className="grid gap-4 rounded-2xl border border-line p-4 sm:grid-cols-2">
                    <div>
                      <FormLabel required>{t("sitEditor.location")}</FormLabel>
                      <DestinationAutocomplete
                        cityOnly
                        onChange={(location) => setForm({ ...form, location })}
                        onSelect={(destination) =>
                          setForm({
                            ...form,
                            location: destination.name,
                            country: destination.detail,
                          })
                        }
                        placeholder={t("sitEditor.locationPlaceholder")}
                        value={form.location}
                        variant="profile"
                      />
                    </div>
                    <div>
                      <FormLabel required>{t("sitEditor.country")}</FormLabel>
                      <DestinationAutocomplete
                        countryOnly
                        onChange={(country) => setForm({ ...form, country })}
                        placeholder={t("sitEditor.countryPlaceholder")}
                        value={form.country}
                        variant="profile"
                      />
                    </div>
                  </section>
                )}
                <section className="rounded-2xl border border-teal/30 bg-seafoam/50 p-4">
                  <label className="block">
                    <FormLabel required>{t("sitEditor.fullAddress")}</FormLabel>
                    <textarea
                      className="form-input mt-1 min-h-24"
                      data-testid="sit-full-address"
                      onChange={(event) => setForm({ ...form, fullAddress: event.target.value })}
                      placeholder={t("sitEditor.fullAddressPlaceholder")}
                      value={form.fullAddress}
                    />
                  </label>
                  <p className="mt-2 text-xs leading-5 text-slate" role="note">
                    {t("sitEditor.fullAddressHint")}
                  </p>
                </section>
                <div>
                  <FormLabel required>{t("sitEditor.dates")}</FormLabel>
                  <DateRangePicker
                    endDate={form.endDate}
                    onChange={({ startDate, endDate }) => setForm({ ...form, startDate, endDate })}
                    startDate={form.startDate}
                    variant="browse"
                  />
                </div>
                <fieldset>
                  <FormLabel as="legend">{t("sitEditor.sitType")}</FormLabel>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                        form.sitType === "liveaboard"
                          ? "border-teal bg-seafoam"
                          : "border-line hover:border-teal/50"
                      }`}
                    >
                      <input
                        checked={form.sitType === "liveaboard"}
                        className="mt-1 size-4 accent-teal"
                        name="sitType"
                        onChange={() => setForm({ ...form, sitType: "liveaboard" })}
                        type="radio"
                        value="liveaboard"
                      />
                      <span>
                        <span className="block text-sm font-bold text-navy">
                          {t("sitType.liveaboard")}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate">
                          {t("sitType.liveaboardHint")}
                        </span>
                      </span>
                    </label>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                        form.sitType === "daytimeChecks"
                          ? "border-teal bg-seafoam"
                          : "border-line hover:border-teal/50"
                      }`}
                    >
                      <input
                        checked={form.sitType === "daytimeChecks"}
                        className="mt-1 size-4 accent-teal"
                        name="sitType"
                        onChange={() =>
                          setForm({ ...form, sitType: "daytimeChecks", maxGuests: "1" })
                        }
                        type="radio"
                        value="daytimeChecks"
                      />
                      <span>
                        <span className="block text-sm font-bold text-navy">
                          {t("sitType.daytimeChecks")}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate">
                          {t("sitType.daytimeChecksHint")}
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>
                {form.sitType !== "daytimeChecks" ? (
                  <label data-testid="sit-editor-max-guests">
                    <FormLabel required>{t("sitEditor.maxGuests")}</FormLabel>
                    <input
                      className="form-input"
                      max="12"
                      min="1"
                      onChange={(event) => setForm({ ...form, maxGuests: event.target.value })}
                      required
                      type="number"
                      value={form.maxGuests}
                    />
                    <span className="mt-1.5 block text-xs leading-5 text-slate">
                      {t("sitEditor.maxGuestsHint")}
                    </span>
                  </label>
                ) : null}
                <label>
                  <FormLabel optional>{t("sitEditor.responsibilities")}</FormLabel>
                  <textarea
                    className="form-input min-h-28 resize-y"
                    onChange={(event) => setForm({ ...form, responsibilities: event.target.value })}
                    placeholder={t("sitEditor.responsibilitiesPlaceholder")}
                    value={form.responsibilities}
                  />
                </label>
                <section className="rounded-2xl border border-line bg-cream/60 p-5">
                  <p className="eyebrow">{t("sitEditor.requirementsKicker")}</p>
                  <h3 className="font-display text-lg font-bold text-navy">
                    {t("sitEditor.requirementsTitle")}{" "}
                    <span className="text-sm font-semibold text-slate">
                      ({t("common.optional")})
                    </span>
                  </h3>
                  <label className="mt-5 block">
                    <FormLabel>{t("sitEditor.minimumYears")}</FormLabel>
                    <Select
                      variant="form"
                      onChange={(event) =>
                        setForm({ ...form, minYearsExperience: event.target.value })
                      }
                      value={form.minYearsExperience}
                    >
                      <option value="0">{t("sitEditor.noMinimum")}</option>
                      {[1, 2, 3, 5, 10].map((years) => (
                        <option key={years} value={years}>
                          {t("sitEditor.yearsPlus", { count: years })}
                        </option>
                      ))}
                    </Select>
                  </label>
                  {[
                    {
                      title: t("sitEditor.vesselExperience"),
                      field: "requiredExperience" as const,
                      options: SITTER_EXPERIENCE,
                    },
                    {
                      title: t("sitEditor.certifications"),
                      field: "requiredCertifications" as const,
                      options: SITTER_CERTIFICATIONS,
                    },
                    {
                      title: t("sitEditor.skills"),
                      field: "requiredSkills" as const,
                      options: SITTER_SKILLS,
                    },
                  ].map((group) => (
                    <div className="mt-5" key={group.field}>
                      <FormLabel as="p">{group.title}</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {group.options.map((option) => {
                          const selected = form[group.field].includes(option);
                          return (
                            <button
                              className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                                selected
                                  ? "border-teal bg-seafoam text-teal"
                                  : "border-line bg-white text-slate hover:border-teal"
                              }`}
                              key={option}
                              onClick={() => toggleRequirement(group.field, option)}
                              type="button"
                            >
                              {selected && <Check className="mr-1 inline" size={13} />}
                              {displayLabel(t, option)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <label className="mt-5 flex items-start gap-3 rounded-xl border border-line bg-white px-4 py-3">
                    <input
                      checked={form.nonSmokerRequired}
                      className="mt-1 size-4 accent-teal"
                      onChange={(event) =>
                        setForm({ ...form, nonSmokerRequired: event.target.checked })
                      }
                      type="checkbox"
                    />
                    <span>
                      <span className="block text-sm font-bold text-navy">
                        {t("sitEditor.nonSmoker")}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-slate">
                        {t("sitEditor.nonSmokerHint")}
                      </span>
                    </span>
                  </label>
                </section>
                <label>
                  <FormLabel optional>{t("sitEditor.additional")}</FormLabel>
                  <textarea
                    className="form-input min-h-24 resize-y"
                    onChange={(event) => setForm({ ...form, requirements: event.target.value })}
                    placeholder={t("sitEditor.additionalPlaceholder")}
                    value={form.requirements}
                  />
                </label>
                <label>
                  <FormLabel optional>{t("sitEditor.pets")}</FormLabel>
                  <input
                    className="form-input"
                    onChange={(event) => setForm({ ...form, pet: event.target.value })}
                    placeholder={t("sitEditor.petsPlaceholder")}
                    value={form.pet}
                  />
                </label>
                {!locked && (
                  <TermsAgreementCheckbox
                    checked={acceptedTerms}
                    i18nKey="sitEditor.termsAgreement"
                    onChange={(checked) => {
                      setAcceptedTerms(checked);
                      if (checked) setTermsError("");
                    }}
                    required
                  />
                )}
                {termsError && (
                  <p className="text-sm font-semibold text-coral" role="alert">
                    {termsError}
                  </p>
                )}
              </fieldset>
              <div className="mt-6 flex justify-end gap-3 border-t border-line pt-5">
                <button
                  className="rounded-xl px-5 py-3 text-sm font-bold text-slate"
                  data-testid="sit-editor-cancel"
                  onClick={requestSitClose}
                  type="button"
                >
                  {locked ? t("common.close") : t("common.cancel")}
                </button>
                {!locked && (
                  <IconTooltip
                    hidden={!publishBlockedTooltip || mutation.isPending}
                    label={publishBlockedTooltip}
                    side="top"
                    wrap
                  >
                    <button
                      className="rounded-xl bg-coral px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
                      data-testid="sit-publish"
                      disabled={publishDisabled}
                      onClick={() => {
                        if (!acceptedTerms) {
                          setTermsError(t("sitEditor.termsRequired"));
                          return;
                        }
                        setTermsError("");
                        mutation.mutate();
                      }}
                      type="button"
                    >
                      {sitSaveButtonLabel}
                    </button>
                  </IconTooltip>
                )}
              </div>
            </>
          ) : null}
        </div>
        <div className="order-1 lg:sticky lg:top-24 lg:order-2 lg:self-start">
          <EditorLivePreview hint={t("editorPreview.sitHint")}>
            {previewBoat ? (
              <BoatCard boat={previewBoat} preview />
            ) : (
              <p className="text-sm text-slate">{t("editorPreview.selectBoat")}</p>
            )}
          </EditorLivePreview>
        </div>
      </div>
      {discardOpen ? (
        <ConfirmDialog
          cancelLabel={t("editor.discardKeepEditing")}
          confirmLabel={t("editor.discardConfirm")}
          onCancel={() => setDiscardOpen(false)}
          onConfirm={close}
          testId="editor-discard-dialog"
          text={t("editor.discardText")}
          title={t("editor.discardTitle")}
          titleId="sit-discard-title"
          tone="danger"
        />
      ) : null}
    </main>
  );
}

function SitEditorPage({ mode }: { mode: "new" | "edit" }) {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const navigate = useNavigate();
  const { sitId } = useParams();
  const [searchParams] = useSearchParams();
  const preferredBoatId = searchParams.get("boatId") ?? undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const { data: vessels = [], isLoading: vesselsLoading } = useQuery({
    ...queries.vessels.all,
  });
  const { data: sits = [], isLoading: sitsLoading } = useQuery({
    ...queries.sits.all,
  });
  const { data: ownerApplications = [] } = useQuery({
    ...queries.applications.user(user?.name),
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <Anchor className="mx-auto text-coral" size={42} />
        <h1 className="mt-5 font-display text-3xl font-extrabold text-navy">
          {t("owner.signInRequired")}
        </h1>
        <p className="mt-3 text-slate">{t("owner.accessDashboardHint")}</p>
        <button
          className="mt-6 rounded-full bg-navy px-6 py-3 font-bold text-white"
          onClick={() => openAuth("login")}
          type="button"
        >
          {t("owner.chooseAccount")}
        </button>
      </main>
    );
  }

  if (vesselsLoading || (mode === "edit" && sitsLoading)) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="h-136 animate-pulse rounded-3xl bg-seafoam" />
      </main>
    );
  }

  const ownedBoats = vessels.filter((boat) => boat.owner === user.name);
  if (mode === "new" && ownedBoats.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <ShipWheel className="mx-auto text-teal" size={42} />
        <h1 className="mt-5 font-display text-3xl font-extrabold text-navy">
          {t("owner.firstBoat")}
        </h1>
        <p className="mt-3 text-slate">{t("owner.sitsEmptyHintNoBoats")}</p>
        <button
          className="mt-6 rounded-full bg-coral px-6 py-3 font-bold text-white"
          onClick={() => navigate("/owner/boats/new")}
          type="button"
        >
          {t("vesselEditor.addTitle")}
        </button>
      </main>
    );
  }

  const sit = mode === "edit" ? sits.find((item) => item.id === sitId) : undefined;
  const sitBoat = sit ? ownedBoats.find((boat) => boat.id === sit.boatId) : undefined;
  if (mode === "edit" && (!sit || !sitBoat)) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <ShipWheel className="mx-auto text-teal" size={42} />
        <h1 className="mt-5 font-display text-3xl font-extrabold text-navy">
          {t("owner.sitNotFound")}
        </h1>
        <p className="mt-3 text-slate">{t("owner.sitUnavailable")}</p>
        <button
          className="mt-6 rounded-full bg-navy px-6 py-3 font-bold text-white"
          onClick={() => navigate("/my-sits")}
          type="button"
        >
          {t("owner.backToSits")}
        </button>
      </main>
    );
  }

  const locked =
    mode === "edit" &&
    Boolean(sit) &&
    (sit!.applicants > 0 || ownerApplications.some((application) => application.sitId === sit!.id));

  return (
    <SitEditor
      close={() => navigate("/my-sits")}
      locked={locked}
      preferredBoatId={preferredBoatId}
      sit={sit}
      vessels={ownedBoats}
    />
  );
}

function OwnerBoatsPage() {
  const { i18n, t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const archivedSits = useAppStore((state) => state.archivedSits);
  const archiveSit = useAppStore((state) => state.archiveSit);
  const unarchiveSit = useAppStore((state) => state.unarchiveSit);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const requireVerificationToSit = useFeatureFlag("requireVerificationToSit");
  const activeTab: "boats" | "sits" = location.pathname.startsWith("/my-boats") ? "boats" : "sits";
  const [sitPhaseFilter, setSitPhaseFilter] = useState<"all" | SitPhase | "archived">("all");
  const [flaggingSit, setFlaggingSit] = useState<Sit | null>(null);
  const [closeApplicationsConfirm, setCloseApplicationsConfirm] = useState<Sit | null>(null);
  const [withdrawConfirm, setWithdrawConfirm] = useState<SitApplication | null>(null);
  const [startEarlyConfirm, setStartEarlyConfirm] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<
    | { type: "boat"; id: string; name: string }
    | {
        type: "sit";
        id: string;
        boatName: string;
        dates: string;
        applicantCount: number;
        hasAccepted: boolean;
      }
    | { type: "archiveSit"; id: string; boatName: string; dates: string }
    | null
  >(null);

  useEffect(() => {
    setOwnerDashboardTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onOpenCreateSit = () => {
      navigate("/owner/sits/new");
    };
    window.addEventListener("open-create-sit", onOpenCreateSit);
    return () => window.removeEventListener("open-create-sit", onOpenCreateSit);
  }, [navigate]);

  const { data: vessels = [], isLoading: vesselsLoading } = useQuery({
    ...queries.vessels.all,
  });
  const { data: sits = [], isLoading: sitsLoading } = useQuery({
    ...queries.sits.all,
  });
  const { data: ownerApplications = [], isLoading: applicationsLoading } = useQuery({
    ...queries.applications.user(user?.name),
    enabled: Boolean(user),
  });
  const { data: ownerVerificationChecks, isLoading: ownerVerificationLoading } = useQuery({
    ...queries.verificationChecks.ownerCreateSit(user?.name, user?.email, user?.phoneNumber),
    enabled: Boolean(requireVerificationToSit && user),
  });
  let canCreateSit = true;
  if (requireVerificationToSit) {
    canCreateSit = ownerVerificationChecks ? isFullyVerified(ownerVerificationChecks) : false;
  }
  const removeVesselMutation = useMutation({
    mutationFn: deleteVessel,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.vessels.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.sits.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
    },
  });
  const removeSitMutation = useMutation({
    mutationFn: deleteSit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.sits.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
    },
  });
  const toggleApplicationsMutation = useMutation({
    mutationFn: (sit: Sit) => {
      const { accepted: _accepted, phase: _phase, ...persistable } = sit;
      return saveSit({
        ...persistable,
        applicationsOpen: !isAcceptingApplications(sit),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.sits.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
    },
  });
  const startSitEarlyMutation = useMutation({
    mutationFn: (id: string) => startSitEarly(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.sits.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
      setStartEarlyConfirm(null);
    },
  });
  const withdrawMutation = useMutation({
    mutationFn: ({ applicationId, explanation }: { applicationId: string; explanation: string }) =>
      withdrawApplication(applicationId, user!.name, explanation),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
      await queryClient.invalidateQueries({ queryKey: queries.sits.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
      setWithdrawConfirm(null);
    },
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <Anchor className="mx-auto text-coral" size={42} />
        <h1 className="mt-5 font-display text-3xl font-extrabold text-navy">
          {t("owner.signInRequired")}
        </h1>
        <p className="mt-3 text-slate">{t("owner.accessDashboardHint")}</p>
        <button
          className="mt-6 rounded-full bg-navy px-6 py-3 font-bold text-white"
          onClick={() => openAuth("login")}
          type="button"
        >
          {t("owner.chooseAccount")}
        </button>
      </main>
    );
  }

  const ownedBoats = vessels.filter((boat) => boat.owner === user.name);
  const ownedBoatIds = new Set(ownedBoats.map((boat) => boat.id));
  const allOwnedSits = sits.filter((sit) => ownedBoatIds.has(sit.boatId));
  const ownedSits = allOwnedSits.filter((sit) => !archivedSits.includes(sit.id));
  const archivedOwnedSits = allOwnedSits
    .filter((sit) => archivedSits.includes(sit.id))
    .sort((a, b) => b.dateStart.localeCompare(a.dateStart));
  const sitterApplications = ownerApplications.filter(
    (application) => application.applicant.name === user.name,
  );
  const ownedSitsByPhase = SIT_PHASES.reduce(
    (groups, phase) => {
      groups[phase] = ownedSits
        .filter((sit) => resolveSitPhase(sit) === phase)
        .sort((a, b) => a.dateStart.localeCompare(b.dateStart));
      return groups;
    },
    {} as Record<SitPhase, Sit[]>,
  );
  let visibleOwnedPhases: SitPhase[];
  if (sitPhaseFilter === "archived") {
    visibleOwnedPhases = [];
  } else if (sitPhaseFilter === "all") {
    visibleOwnedPhases = SIT_PHASES.filter((phase) => ownedSitsByPhase[phase].length > 0);
  } else if (ownedSitsByPhase[sitPhaseFilter].length > 0) {
    visibleOwnedPhases = [sitPhaseFilter];
  } else {
    visibleOwnedPhases = [];
  }
  const showArchivedSection =
    archivedOwnedSits.length > 0 && (sitPhaseFilter === "all" || sitPhaseFilter === "archived");
  function sitterApplicationMatchesPhaseFilter(application: SitApplication) {
    if (sitPhaseFilter === "all") return true;
    if (sitPhaseFilter === "archived") return false;
    const sit = sits.find((item) => item.id === application.sitId);
    return sit ? resolveSitPhase(sit) === sitPhaseFilter : false;
  }
  const activeSitterApplications = sitterApplications.filter(
    (application) =>
      application.status !== "withdrawn" && sitterApplicationMatchesPhaseFilter(application),
  );
  const withdrawnSitterApplications = sitterApplications.filter(
    (application) =>
      application.status === "withdrawn" && sitterApplicationMatchesPhaseFilter(application),
  );
  const sitsTabCount = ownedSits.length + archivedOwnedSits.length + sitterApplications.length;
  const isLoading = vesselsLoading || sitsLoading;
  const boatsCountLoading = vesselsLoading;
  const sitsCountLoading = vesselsLoading || sitsLoading || applicationsLoading;
  const sitCreateBlockedByBoat = activeTab === "sits" && ownedBoats.length === 0;
  const sitCreateBlockedByVerification =
    activeTab === "sits" &&
    ownedBoats.length > 0 &&
    requireVerificationToSit &&
    (ownerVerificationLoading || !canCreateSit);
  const sitCreateMuted = sitCreateBlockedByBoat || sitCreateBlockedByVerification;

  function renderOwnedSitCard(sit: Sit, options?: { archived?: boolean }) {
    const boat = ownedBoats.find((item) => item.id === sit.boatId)!;
    const applicationCount = ownerApplications.filter(
      (application) => application.sitId === sit.id,
    ).length;
    const applicantCount = Math.max(applicationCount, sit.applicants);
    const editLocked = applicationCount > 0 || sit.applicants > 0;
    const phase = resolveSitPhase(sit);
    const isArchived = Boolean(options?.archived);
    const sitDates = formatSitDates(i18n.language, sit.dateStart, sit.duration);

    function renderSitArchiveOrDeleteAction() {
      if (isArchived) {
        return (
          <IconTooltip label={t("owner.unarchiveSit")} wrap>
            <button
              aria-label={t("owner.unarchiveSitLabel", { boat: boat.name })}
              className="rounded-xl border border-line p-2.5 text-navy hover:border-teal hover:text-teal"
              onClick={() => unarchiveSit(sit.id)}
              type="button"
            >
              <ArchiveRestore aria-hidden="true" size={17} />
            </button>
          </IconTooltip>
        );
      }
      if (phase === "stayUnderway") {
        return (
          <IconTooltip label={t("owner.sitDeleteUnderway")} wrap>
            <button
              aria-label={t("owner.sitDeleteUnderway")}
              className="rounded-xl border border-line p-2.5 text-slate opacity-50"
              disabled
              type="button"
            >
              <Trash2 size={17} />
            </button>
          </IconTooltip>
        );
      }
      if (phase === "stayCompleted") {
        return (
          <IconTooltip label={t("owner.archiveSitLabel", { boat: boat.name })} wrap>
            <button
              aria-label={t("owner.archiveSitLabel", { boat: boat.name })}
              className="rounded-xl border border-line p-2.5 text-navy hover:border-teal hover:text-teal"
              onClick={() => {
                setDeleteConfirm({
                  type: "archiveSit",
                  id: sit.id,
                  boatName: boat.name,
                  dates: sitDates,
                });
              }}
              type="button"
            >
              <Archive aria-hidden="true" size={17} />
            </button>
          </IconTooltip>
        );
      }
      return (
        <button
          aria-label={t("owner.deleteSitLabel", { boat: boat.name })}
          className="rounded-xl border border-line p-2.5 text-slate hover:border-coral hover:text-coral"
          onClick={() => {
            setDeleteConfirm({
              type: "sit",
              id: sit.id,
              boatName: boat.name,
              dates: sitDates,
              applicantCount,
              hasAccepted: Boolean(sit.accepted),
            });
          }}
          type="button"
        >
          <Trash2 size={17} />
        </button>
      );
    }

    return (
      <article
        className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-5 shadow-card sm:flex-row sm:items-center"
        key={sit.id}
      >
        <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-seafoam text-teal">
          <CalendarDays size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-teal">
            {boat.name} · {formatSitLocation(sit.location, sit.country)}
          </p>
          <Link
            className="mt-1 block font-display text-xl font-bold text-navy hover:text-teal"
            to={`/boats/${sit.id}`}
          >
            {sitDates}
          </Link>
          <div className="mt-2 flex flex-wrap gap-2">
            <SitParticipationBadge role="owner" />
            <SitPhaseBadge
              phase={
                sit.phase ??
                getSitPhase({
                  dateStart: sit.dateStart,
                  duration: sit.duration,
                  applicationsOpen: sit.applicationsOpen,
                  accepted: sit.accepted,
                  applicants: sit.applicants,
                })
              }
            />
            {!isAcceptingApplications(sit) &&
              (sit.phase ?? getSitPhase(sit)) === "acceptingApplicants" && (
                <span className="inline-flex rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold text-slate">
                  {t("owner.applicationsClosed")}
                </span>
              )}
          </div>
          <p className="mt-1 text-sm text-slate">
            {t("owner.sitSummary", {
              duration: sit.duration,
              applicants: applicantCount,
              tasks: sit.responsibilities.length,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isArchived && resolveSitPhase(sit) === "acceptingApplicants" && !sit.accepted ? (
            <button
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-60 ${
                isAcceptingApplications(sit)
                  ? "border-line text-navy hover:border-teal"
                  : "border-teal bg-seafoam text-teal hover:bg-seafoam/80"
              }`}
              disabled={toggleApplicationsMutation.isPending}
              onClick={() => {
                if (isAcceptingApplications(sit)) {
                  setCloseApplicationsConfirm(sit);
                  return;
                }
                toggleApplicationsMutation.mutate(sit);
              }}
              type="button"
            >
              {isAcceptingApplications(sit) ? t("owner.closeRequests") : t("owner.openRequests")}
            </button>
          ) : null}
          {!isArchived && resolveSitPhase(sit) === "applicantChosen" && (
            <button
              className="flex items-center gap-2 rounded-xl border border-teal bg-seafoam px-4 py-2.5 text-sm font-bold text-teal hover:bg-seafoam/80 disabled:opacity-60"
              disabled={startSitEarlyMutation.isPending}
              onClick={() => {
                setStartEarlyConfirm(sit.id);
              }}
              type="button"
            >
              <Play size={16} /> {t("owner.startSitEarly")}
            </button>
          )}
          {!isArchived && resolveSitPhase(sit) === "stayUnderway" && (
            <>
              <SitEmergencyHelp />
              <button
                className="flex items-center gap-2 rounded-xl border border-coral/40 bg-coral/10 px-4 py-2.5 text-sm font-bold text-coral hover:border-coral"
                onClick={() => setFlaggingSit(sit)}
                type="button"
              >
                <Flag size={16} /> {t("sitIssue.flagButton")}
              </button>
            </>
          )}
          <button
            className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-navy hover:border-teal"
            onClick={() => navigate(`/owner/sits/${sit.id}/applications`)}
            type="button"
          >
            <MessageCircle size={16} />{" "}
            {t("applications.reviewCount", {
              count: ownerApplications.filter((application) => application.sitId === sit.id).length,
            })}
          </button>
          {!isArchived &&
            (editLocked ? (
              <IconTooltip label={t("owner.sitEditLocked")} wrap>
                <button
                  className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-navy opacity-50"
                  disabled
                  type="button"
                >
                  <Pencil size={16} /> {t("common.edit")}
                </button>
              </IconTooltip>
            ) : (
              <button
                className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-navy hover:border-teal"
                onClick={() => navigate(`/owner/sits/${sit.id}/edit`)}
                type="button"
              >
                <Pencil size={16} /> {t("common.edit")}
              </button>
            ))}
          {renderSitArchiveOrDeleteAction()}
        </div>
      </article>
    );
  }

  function renderSitterApplicationCard(application: SitApplication) {
    const sit = sits.find((item) => item.id === application.sitId);
    const vessel = vessels.find((item) => item.id === (sit?.boatId ?? application.sitId));
    const boatImage = vessel?.image;
    const isWithdrawn = application.status === "withdrawn";
    return (
      <article
        className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:flex-row sm:items-center sm:gap-5"
        key={application.id}
      >
        <div className="flex min-w-0 flex-1 gap-4">
          <Link
            aria-label={t("sits.viewListing")}
            className="block size-20 shrink-0 self-start overflow-hidden rounded-xl bg-cream sm:size-24"
            to={`/boats/${application.sitId}`}
          >
            {boatImage ? (
              <img
                alt={t("boat.imageAlt", {
                  name: application.boatName,
                  type: displayLabel(t, vessel?.type ?? "Boat"),
                })}
                className="size-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
                src={optimizePhotoUrl(boatImage, 320)}
              />
            ) : (
              <span className="grid size-full place-items-center text-navy">
                <Anchor aria-hidden="true" size={28} />
              </span>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-teal">
              {application.boatName}
            </p>
            <Link
              className="mt-1 block font-display text-xl font-bold text-navy hover:text-teal"
              to={`/boats/${application.sitId}`}
            >
              {sit
                ? formatSitDates(i18n.language, sit.dateStart, sit.duration)
                : application.boatName}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <SitParticipationBadge role="sitter" />
              <ApplicationStatusBadge status={application.status} />
              {sit && (
                <SitPhaseBadge
                  phase={
                    sit.phase ??
                    getSitPhase({
                      dateStart: sit.dateStart,
                      duration: sit.duration,
                      applicationsOpen: sit.applicationsOpen,
                      accepted: sit.accepted,
                      applicants: sit.applicants,
                    })
                  }
                />
              )}
            </div>
            <p className="mt-1 text-sm text-slate">
              {t("sits.withOwner", { owner: application.ownerName })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {sit && application.status === "accepted" && resolveSitPhase(sit) === "stayUnderway" && (
            <SitEmergencyHelp />
          )}
          <Link
            className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-navy hover:border-teal"
            to={`/boats/${application.sitId}`}
          >
            <Anchor size={16} /> {t("sits.viewListing")}
          </Link>
          <Link
            className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-navy hover:border-teal"
            to={`/messages?application=${encodeURIComponent(application.id)}`}
          >
            <MessageCircle size={16} /> {t("nav.messages")}
          </Link>
          {!isWithdrawn && application.status !== "declined" && (
            <button
              className="flex items-center gap-2 rounded-xl border border-coral/40 px-4 py-2.5 text-sm font-bold text-coral hover:border-coral hover:bg-coral/5 disabled:opacity-60"
              disabled={withdrawMutation.isPending}
              onClick={() => setWithdrawConfirm(application)}
              type="button"
            >
              {t("sits.withdrawInterest")}
            </button>
          )}
        </div>
      </article>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="section-title">
            {activeTab === "boats" ? t("owner.myBoatsTitle") : t("owner.mySitsTitle")}
          </h1>
          <p className="mt-3 text-slate">
            {activeTab === "boats" ? t("owner.boatsHint") : t("owner.sitsHint")}
          </p>
        </div>
        <div className="group relative">
          <button
            aria-describedby={(() => {
              if (sitCreateBlockedByBoat) return "sit-requires-boat-tooltip";
              if (sitCreateBlockedByVerification) return "sit-requires-verification-tooltip";
              return undefined;
            })()}
            className={`flex items-center justify-center gap-2 rounded-full px-5 py-3 font-bold transition ${
              sitCreateMuted
                ? "bg-slate/25 text-slate hover:bg-slate/35"
                : "bg-coral text-white hover:bg-coral-dark"
            }`}
            onClick={() => {
              if (activeTab === "boats" || ownedBoats.length === 0) {
                navigate("/owner/boats/new");
              } else {
                navigate("/owner/sits/new");
              }
            }}
            type="button"
          >
            <Plus size={18} />{" "}
            {activeTab === "boats" ? t("vesselEditor.addTitle") : t("sitEditor.createShort")}
          </button>
          {sitCreateBlockedByBoat && (
            <span
              className="pointer-events-none absolute top-[calc(100%+0.5rem)] right-0 z-20 hidden w-64 rounded-xl bg-navy px-3 py-2 text-sm font-medium text-white shadow-float group-focus-within:block group-hover:block"
              id="sit-requires-boat-tooltip"
              role="tooltip"
            >
              {t("owner.sitRequiresBoatTooltip")}
            </span>
          )}
          {sitCreateBlockedByVerification && (
            <span
              className="pointer-events-none absolute top-[calc(100%+0.5rem)] right-0 z-20 hidden w-64 rounded-xl bg-navy px-3 py-2 text-sm font-medium text-white shadow-float group-focus-within:block group-hover:block"
              id="sit-requires-verification-tooltip"
              role="tooltip"
            >
              {t("owner.sitRequiresVerificationTooltip")}
            </span>
          )}
        </div>
      </div>
      <div className="mt-8">
        <SegmentedTabs fullWidthOnMobile testId="owner-dashboard-tabs">
          {(
            [
              { tab: "sits", to: "/my-sits" },
              { tab: "boats", to: "/my-boats" },
            ] as const
          ).map(({ tab, to }) => (
            <NavLink
              className={({ isActive }) =>
                segmentedTabClassName(isActive, "flex-1 px-6 capitalize sm:flex-none")
              }
              end
              key={tab}
              role="tab"
              to={to}
            >
              {t(`owner.tab.${tab}`)}{" "}
              {(tab === "boats" ? boatsCountLoading : sitsCountLoading) ? (
                <ShimmerBlock className="ml-1 inline-block h-3 w-4 align-middle" />
              ) : (
                <span className="ml-1 text-xs text-slate">
                  {tab === "boats" ? ownedBoats.length : sitsTabCount}
                </span>
              )}
            </NavLink>
          ))}
        </SegmentedTabs>
      </div>
      {removeVesselMutation.isError && (
        <p
          className="mt-5 rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral"
          role="alert"
        >
          {removeVesselMutation.error instanceof Error &&
          removeVesselMutation.error.message === "VESSEL_HAS_SITS"
            ? t("owner.deleteBlocked")
            : t("owner.deleteError")}
        </p>
      )}
      {removeSitMutation.isError && (
        <p
          className="mt-5 rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral"
          role="alert"
        >
          {(() => {
            if (
              removeSitMutation.error instanceof Error &&
              removeSitMutation.error.message === "SIT_IS_UNDERWAY"
            ) {
              return t("owner.sitDeleteUnderway");
            }
            if (
              removeSitMutation.error instanceof Error &&
              removeSitMutation.error.message === "SIT_IS_COMPLETED"
            ) {
              return t("owner.deleteSitCompletedError");
            }
            return t("owner.deleteSitError");
          })()}
        </p>
      )}
      {startSitEarlyMutation.isError && (
        <p
          className="mt-5 rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral"
          role="alert"
        >
          {t("owner.startSitEarlyError")}
        </p>
      )}
      {isLoading && activeTab === "boats" ? <OwnerBoatsLoadingSkeleton /> : null}
      {isLoading && activeTab !== "boats" ? <OwnerSitsLoadingSkeleton /> : null}
      {!isLoading && activeTab === "boats" && ownedBoats.length ? (
        <div className="mt-10 space-y-4">
          {ownedBoats.map((boat) => {
            const hasSits = ownedSits.some((sit) => sit.boatId === boat.id);
            const deleteButton = (
              <button
                aria-label={
                  hasSits
                    ? t("owner.deleteBlocked")
                    : t("owner.deleteBoatLabel", { boat: boat.name })
                }
                className="rounded-xl border border-line p-2.5 text-slate hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:text-slate"
                disabled={hasSits}
                onClick={() => {
                  setDeleteConfirm({ type: "boat", id: boat.id, name: boat.name });
                }}
                type="button"
              >
                <Trash2 size={17} />
              </button>
            );
            return (
              <article
                className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-center"
                key={boat.id}
              >
                <img
                  alt={boat.name}
                  className="aspect-2/1 w-full rounded-xl object-cover sm:size-32"
                  src={boat.image}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal">
                    {vesselTypeLengthYear(
                      t,
                      boat,
                      user?.measurementSystem ?? detectMeasurementSystem(),
                    )}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-navy">{boat.name}</p>
                  <p className="mt-1 text-sm text-slate">
                    {t("detail.homePort", { homePort: boat.homePort })}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    {t("owner.engineSummary", { engine: displayLabel(t, boat.engineType) })}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    {t("owner.voltageSummary", { voltage: displayLabel(t, boat.voltageType) })}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    {t("owner.stoveSummary", { fuel: displayLabel(t, boat.stoveFuelType) })}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-teal">
                    {t("owner.sitPeriods", {
                      count: ownedSits.filter((sit) => sit.boatId === boat.id).length,
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-navy hover:border-teal"
                    onClick={() => navigate(`/owner/boats/${boat.id}/edit`)}
                    type="button"
                  >
                    <Pencil size={16} /> {t("common.edit")}
                  </button>
                  {hasSits ? (
                    <IconTooltip label={t("owner.deleteBlocked")} wrap>
                      {deleteButton}
                    </IconTooltip>
                  ) : (
                    deleteButton
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
      {!isLoading &&
      activeTab === "sits" &&
      (ownedSits.length || archivedOwnedSits.length || sitterApplications.length) ? (
        <div className="mt-10 space-y-8">
          {(ownedSits.length > 0 || archivedOwnedSits.length > 0) && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {sitterApplications.length > 0 ? (
                <h2 className="font-display text-lg font-bold text-navy">
                  {t("sits.hostingHeading")}
                </h2>
              ) : (
                <p className="text-sm text-slate">{t("owner.sitPhaseFilterHint")}</p>
              )}
              <label className="flex items-center gap-2 text-sm text-slate sm:ml-auto">
                <span className="sr-only">{t("owner.sitPhaseFilter")}</span>
                <Select
                  aria-label={t("owner.sitPhaseFilter")}
                  onChange={(event) =>
                    setSitPhaseFilter(event.target.value as "all" | SitPhase | "archived")
                  }
                  value={sitPhaseFilter}
                  variant="sort"
                >
                  <option value="all">{t("owner.sitPhaseFilterAll")}</option>
                  {SIT_PHASES.map((phase) => (
                    <option key={phase} value={phase}>
                      {t(`sitPhase.${phase}`)}
                      {ownedSitsByPhase[phase].length ? ` (${ownedSitsByPhase[phase].length})` : ""}
                    </option>
                  ))}
                  <option value="archived">
                    {t("owner.sitPhaseFilterArchived")}
                    {archivedOwnedSits.length ? ` (${archivedOwnedSits.length})` : ""}
                  </option>
                </Select>
              </label>
            </div>
          )}
          {ownedSits.length > 0 &&
            visibleOwnedPhases.length === 0 &&
            sitPhaseFilter !== "archived" && (
              <div className="rounded-2xl border border-dashed border-line bg-white py-12 text-center">
                <p className="font-display text-lg font-bold text-navy">
                  {t("owner.sitPhaseEmpty")}
                </p>
                <button
                  className="mt-4 text-sm font-bold text-teal hover:underline"
                  onClick={() => setSitPhaseFilter("all")}
                  type="button"
                >
                  {t("owner.sitPhaseFilterAll")}
                </button>
              </div>
            )}
          {visibleOwnedPhases.map((phase) => (
            <section className="space-y-4" key={phase}>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-lg font-bold text-navy">
                  {t(`sitPhase.${phase}`)}
                </h2>
                <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-bold text-slate">
                  {t("owner.sitPhaseCount", {
                    count: ownedSitsByPhase[phase].length,
                  })}
                </span>
              </div>
              {ownedSitsByPhase[phase].map((sit) => renderOwnedSitCard(sit))}
            </section>
          ))}
          {showArchivedSection && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-lg font-bold text-navy">
                  {t("owner.archivedSitsHeading")}
                </h2>
                <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-bold text-slate">
                  {t("owner.archivedSitsCount", { count: archivedOwnedSits.length })}
                </span>
              </div>
              {archivedOwnedSits.map((sit) => renderOwnedSitCard(sit, { archived: true }))}
            </section>
          )}
          {sitPhaseFilter === "archived" && archivedOwnedSits.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-white py-12 text-center">
              <Archive className="mx-auto text-teal" size={36} />
              <p className="mt-4 font-display text-lg font-bold text-navy">
                {t("owner.emptyArchivedSits")}
              </p>
              <button
                className="mt-4 text-sm font-bold text-teal hover:underline"
                onClick={() => setSitPhaseFilter("all")}
                type="button"
              >
                {t("owner.sitPhaseFilterAll")}
              </button>
            </div>
          )}
          {activeSitterApplications.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-lg font-bold text-navy">
                {t("sits.requestedHeading")}
              </h2>
              {activeSitterApplications.map((application) =>
                renderSitterApplicationCard(application),
              )}
            </section>
          )}
          {withdrawnSitterApplications.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-lg font-bold text-navy">
                  {t("sits.withdrawnHeading")}
                </h2>
                <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-bold text-slate">
                  {t("sits.withdrawnCount", { count: withdrawnSitterApplications.length })}
                </span>
              </div>
              {withdrawnSitterApplications.map((application) =>
                renderSitterApplicationCard(application),
              )}
            </section>
          )}
        </div>
      ) : null}
      {!isLoading &&
      !(activeTab === "boats" && ownedBoats.length > 0) &&
      !(
        activeTab === "sits" &&
        (ownedSits.length > 0 || archivedOwnedSits.length > 0 || sitterApplications.length > 0)
      ) ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-white py-16 text-center">
          <ShipWheel className="mx-auto text-teal" size={36} />
          <h2 className="mt-4 font-display text-xl font-bold text-navy">
            {activeTab === "boats" ? t("owner.firstBoat") : t("owner.sitsEmptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate">
            {(() => {
              if (activeTab === "boats") return t("owner.firstBoatHint");
              if (ownedBoats.length) return t("owner.sitsEmptyHintWithBoats");
              return t("owner.sitsEmptyHintNoBoats");
            })()}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {activeTab === "boats" || ownedBoats.length === 0 ? (
              <button
                className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white hover:bg-coral-dark"
                onClick={() => navigate("/owner/boats/new")}
                type="button"
              >
                <Plus size={16} />
                {t("owner.firstBoat")}
              </button>
            ) : (
              <div className="group relative">
                <button
                  aria-describedby={
                    requireVerificationToSit && (ownerVerificationLoading || !canCreateSit)
                      ? "sit-empty-requires-verification-tooltip"
                      : undefined
                  }
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
                    requireVerificationToSit && (ownerVerificationLoading || !canCreateSit)
                      ? "bg-slate/25 text-slate hover:bg-slate/35"
                      : "bg-coral text-white hover:bg-coral-dark"
                  }`}
                  onClick={() => navigate("/owner/sits/new")}
                  type="button"
                >
                  <Plus size={16} />
                  {t("owner.firstSit")}
                </button>
                {requireVerificationToSit && (ownerVerificationLoading || !canCreateSit) && (
                  <span
                    className="pointer-events-none absolute top-[calc(100%+0.5rem)] left-1/2 z-20 hidden w-64 -translate-x-1/2 rounded-xl bg-navy px-3 py-2 text-sm font-medium text-white shadow-float group-focus-within:block group-hover:block"
                    id="sit-empty-requires-verification-tooltip"
                    role="tooltip"
                  >
                    {t("owner.sitRequiresVerificationTooltip")}
                  </span>
                )}
              </div>
            )}
            {activeTab === "sits" && (
              <Link
                className="inline-flex rounded-full border border-line px-5 py-2.5 text-sm font-bold text-navy hover:border-teal"
                to="/boats"
              >
                {t("owner.browseOpenSits")}
              </Link>
            )}
          </div>
        </div>
      ) : null}
      {flaggingSit && (
        <FlagSitIssueModal
          boatName={
            ownedBoats.find((boat) => boat.id === flaggingSit.boatId)?.name ?? flaggingSit.boatId
          }
          close={() => setFlaggingSit(null)}
          sitLabel={formatSitDates(i18n.language, flaggingSit.dateStart, flaggingSit.duration)}
        />
      )}
      {closeApplicationsConfirm && (
        <CloseApplicationsRequestsDialog
          pending={toggleApplicationsMutation.isPending}
          onCancel={() => setCloseApplicationsConfirm(null)}
          onConfirm={() => {
            toggleApplicationsMutation.mutate(closeApplicationsConfirm, {
              onSuccess: () => setCloseApplicationsConfirm(null),
            });
          }}
        />
      )}
      {withdrawConfirm && (
        <WithdrawInterestDialog
          application={withdrawConfirm}
          onCancel={() => setWithdrawConfirm(null)}
          onConfirm={(explanation) =>
            withdrawMutation.mutate({
              applicationId: withdrawConfirm.id,
              explanation,
            })
          }
          pending={withdrawMutation.isPending}
        />
      )}
      {deleteConfirm?.type === "boat" && (
        <ConfirmDialog
          confirmLabel={t("owner.deleteConfirmAction")}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => {
            removeVesselMutation.mutate(deleteConfirm.id, {
              onSuccess: () => setDeleteConfirm(null),
            });
          }}
          pending={removeVesselMutation.isPending}
          text={t("owner.deleteBoatConfirm", { boat: deleteConfirm.name })}
          title={t("owner.deleteBoatTitle", { boat: deleteConfirm.name })}
          titleId="delete-boat-confirm-title"
          tone="danger"
        />
      )}
      {deleteConfirm?.type === "sit" && (
        <ConfirmDialog
          confirmLabel={t("owner.deleteConfirmAction")}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => {
            removeSitMutation.mutate(deleteConfirm.id, {
              onSuccess: () => setDeleteConfirm(null),
            });
          }}
          pending={removeSitMutation.isPending}
          text={t("owner.deleteSitConfirm", {
            dates: deleteConfirm.dates,
            boat: deleteConfirm.boatName,
          })}
          title={t("owner.deleteSitTitle", { boat: deleteConfirm.boatName })}
          titleId="delete-sit-confirm-title"
          tone="danger"
        >
          {deleteConfirm.hasAccepted ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 font-medium text-amber-950">
              {t("owner.deleteSitAcceptedWarning")}
            </p>
          ) : null}
          {!deleteConfirm.hasAccepted && deleteConfirm.applicantCount > 0 ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 font-medium text-amber-950">
              {t("owner.deleteSitApplicantsWarning", {
                count: deleteConfirm.applicantCount,
              })}
            </p>
          ) : null}
        </ConfirmDialog>
      )}
      {deleteConfirm?.type === "archiveSit" && (
        <ConfirmDialog
          confirmLabel={t("owner.archiveSitAction")}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => {
            archiveSit(deleteConfirm.id);
            setDeleteConfirm(null);
          }}
          text={t("owner.archiveSitConfirm", {
            dates: deleteConfirm.dates,
            boat: deleteConfirm.boatName,
          })}
          title={t("owner.archiveSitTitle", { boat: deleteConfirm.boatName })}
          titleId="archive-sit-confirm-title"
          tone="default"
        />
      )}
      {startEarlyConfirm && (
        <ConfirmDialog
          confirmLabel={t("owner.startSitEarlyAction")}
          onCancel={() => setStartEarlyConfirm(null)}
          onConfirm={() => {
            startSitEarlyMutation.mutate(startEarlyConfirm);
          }}
          pending={startSitEarlyMutation.isPending}
          text={t("owner.startSitEarlyConfirm")}
          title={t("owner.startSitEarlyTitle")}
          titleId="start-sit-early-confirm-title"
          tone="warning"
        />
      )}
    </main>
  );
}

const EMAIL_NOTIFICATION_KEYS = [
  "newApplications",
  "applicationUpdates",
  "messages",
  "sitReminders",
  "productUpdates",
] as const satisfies ReadonlyArray<keyof EmailNotificationPrefs>;

const ACCOUNT_TABS = ["personal", "security", "preferences", "privacy"] as const;
type AccountTab = (typeof ACCOUNT_TABS)[number];
const LEGACY_ACCOUNT_TABS: Record<string, AccountTab> = {
  localization: "personal",
  notifications: "preferences",
};

function SettingsPage() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppStore((state) => state.user);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const deleteAccount = useAppStore((state) => state.deleteAccount);
  const blockedUsers = useAppStore((state) => state.blockedUsers);
  const unblockUser = useAppStore((state) => state.unblockUser);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [accountFlash, setAccountFlash] = useState("");
  const [personalStatus, setPersonalStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [personalForm, setPersonalForm] = useState({
    legalName: user?.legalName ?? user?.name ?? "",
    location: user?.location ?? "",
    phoneCountryCode: resolvePhoneCountryCode({
      location: user?.location ?? "",
      phoneCountryCode: user?.phoneCountryCode,
      phoneNumber: user?.phoneNumber,
    }),
    phoneNumber: user?.phoneNumber ?? "",
  });
  const accountTabs = ACCOUNT_TABS;
  const requestedTab = searchParams.get("tab");
  const activeTab: AccountTab = ACCOUNT_TABS.includes(requestedTab as AccountTab)
    ? (requestedTab as AccountTab)
    : (LEGACY_ACCOUNT_TABS[requestedTab ?? ""] ?? "personal");

  useEffect(() => {
    if (!user) return;
    setPersonalForm({
      legalName: user.legalName ?? user.name,
      location: user.location,
      phoneCountryCode: resolvePhoneCountryCode({
        location: user.location,
        phoneCountryCode: user.phoneCountryCode,
        phoneNumber: user.phoneNumber,
      }),
      phoneNumber: user.phoneNumber,
    });
  }, [user]);

  useEffect(() => {
    if (!requestedTab) return;
    const mapped = LEGACY_ACCOUNT_TABS[requestedTab];
    if (!mapped) return;
    setSearchParams(mapped === "personal" ? {} : { tab: mapped }, { replace: true });
  }, [requestedTab, setSearchParams]);

  function setActiveTab(tab: AccountTab) {
    setSearchParams(tab === "personal" ? {} : { tab }, { replace: true });
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-24 text-center">
        <Settings className="mx-auto text-teal" size={42} />
        <h1 className="mt-5 font-display text-3xl font-extrabold text-navy">
          {t("settings.signInTitle")}
        </h1>
        <p className="mt-3 text-slate">{t("settings.signInText")}</p>
        <button
          className="mt-6 rounded-full bg-navy px-6 py-3 font-bold text-white"
          onClick={() => openAuth("login")}
          type="button"
        >
          {t("nav.login")}
        </button>
      </main>
    );
  }

  const member = user;

  function submitPersonalDetails(event: React.FormEvent) {
    event.preventDefault();
    setPersonalStatus("saving");
    const legalName = personalForm.legalName.trim();
    if (legalName.length < 2) {
      setPersonalStatus("idle");
      return;
    }
    updateProfile({
      legalName,
      location: personalForm.location.trim(),
      phoneCountryCode: personalForm.phoneCountryCode,
      phoneNumber: personalForm.phoneNumber.trim(),
    });
    setPersonalStatus("saved");
    window.setTimeout(() => setPersonalStatus("idle"), 2000);
  }

  function flashAccountMessage(message: string) {
    setAccountFlash(message);
    window.setTimeout(() => setAccountFlash(""), 2500);
  }

  const emailNotifications = {
    ...DEFAULT_EMAIL_NOTIFICATIONS,
    ...member.emailNotifications,
  };
  const sitDefaults = {
    ...DEFAULT_SIT_CREATION_DEFAULTS,
    ...member.sitDefaults,
  };

  return (
    <>
      <main className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <h1 className="section-title">{t("settings.title")}</h1>
        <p className="mt-3 text-slate">{t("settings.subtitle")}</p>

        <div className="mt-8 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0">
          <SegmentedTabs aria-label={t("settings.title")} testId="settings-tabs">
            {accountTabs.map((tab) => (
              <SegmentedTab active={activeTab === tab} key={tab} onClick={() => setActiveTab(tab)}>
                {t(`settings.tab.${tab}`)}
              </SegmentedTab>
            ))}
          </SegmentedTabs>
        </div>

        {accountFlash ? (
          <p className="mt-5 text-sm font-semibold text-teal" role="status">
            {accountFlash}
          </p>
        ) : null}

        {activeTab === "personal" && (
          <div className="mt-8 space-y-8">
            <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="font-display text-xl font-bold text-navy">
                {t("settings.personalTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate">{t("settings.personalHint")}</p>
              <form className="mt-6 space-y-5" onSubmit={submitPersonalDetails}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label>
                    <span className="form-label">{t("settings.legalName")}</span>
                    <input
                      autoComplete="name"
                      className="form-input"
                      onChange={(event) =>
                        setPersonalForm((current) => ({
                          ...current,
                          legalName: event.target.value,
                        }))
                      }
                      required
                      value={personalForm.legalName}
                    />
                    <p className="mt-2 text-sm leading-6 text-slate">
                      {t("settings.legalNameHint")}
                    </p>
                  </label>
                  <div>
                    <span className="form-label">{t("profile.location")}</span>
                    <DestinationAutocomplete
                      cityOnly
                      includeCountry
                      onChange={(location) =>
                        setPersonalForm((current) => ({
                          ...current,
                          location,
                          phoneCountryCode: current.phoneNumber.trim()
                            ? current.phoneCountryCode
                            : phoneCountryCodeFromLocation(
                                location,
                                current.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
                              ),
                        }))
                      }
                      value={personalForm.location}
                      variant="profile"
                    />
                  </div>
                </div>
                <div>
                  <span className="form-label">{t("profile.phoneNumber")}</span>
                  <div className="grid grid-cols-[minmax(9.5rem,10.5rem)_minmax(0,1fr)] gap-3">
                    <div>
                      <span className="sr-only">{t("profile.callingCode")}</span>
                      <PhoneCountryCodeSelect
                        onChange={(phoneCountryCode) =>
                          setPersonalForm((current) => ({ ...current, phoneCountryCode }))
                        }
                        value={personalForm.phoneCountryCode}
                      />
                    </div>
                    <label>
                      <span className="sr-only">{t("profile.phoneNumber")}</span>
                      <input
                        autoComplete="tel-national"
                        className="form-input"
                        inputMode="tel"
                        onChange={(event) =>
                          setPersonalForm((current) => ({
                            ...current,
                            phoneNumber: event.target.value,
                          }))
                        }
                        placeholder={t("profile.phonePlaceholder")}
                        type="tel"
                        value={personalForm.phoneNumber}
                      />
                    </label>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate">{t("profile.phoneHint")}</p>
                </div>
                <button
                  className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                  disabled={personalStatus === "saving"}
                  type="submit"
                >
                  {(() => {
                    if (personalStatus === "saved") return t("settings.personalSaved");
                    if (personalStatus === "saving") return t("common.saving");
                    return t("settings.savePersonal");
                  })()}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="font-display text-xl font-bold text-navy">
                {t("settings.localizationTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate">{t("settings.localizationHint")}</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block">
                    <span className="form-label">{t("settings.language")}</span>
                    <Select
                      variant="form"
                      onChange={(event) => {
                        void i18n.changeLanguage(event.target.value);
                        updateProfile({ preferredLanguage: event.target.value });
                      }}
                      value={normalizeLanguageCode(i18n.resolvedLanguage ?? i18n.language)}
                    >
                      {SUPPORTED_LANGUAGES.map((language) => (
                        <option key={language.code} value={language.code}>
                          {language.flag} {language.label}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <p className="mt-3 text-sm leading-6 text-slate">{t("settings.languageHint")}</p>
                </div>
                <div>
                  <label className="block">
                    <span className="form-label">{t("settings.measurementSystem")}</span>
                    <Select
                      variant="form"
                      onChange={(event) =>
                        updateProfile({
                          measurementSystem: event.target.value as "metric" | "imperial",
                        })
                      }
                      value={user.measurementSystem}
                    >
                      <option value="metric">{t("settings.metric")}</option>
                      <option value="imperial">{t("settings.imperial")}</option>
                    </Select>
                  </label>
                  <p className="mt-3 text-sm leading-6 text-slate">
                    {t("settings.measurementHint")}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "security" && (
          <div className="mt-8 space-y-8">
            <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="font-display text-xl font-bold text-navy">
                {t("settings.securityTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate">{t("settings.accountHint")}</p>

              <div className="mt-6">
                <span className="form-label">{t("auth.email")}</span>
                <p className="mt-1 wrap-break-word text-base font-semibold text-navy">
                  {user.email}
                </p>
              </div>

              <EmailConfirmationStatus
                confirmed={member.emailConfirmed}
                email={member.email}
                onFlash={flashAccountMessage}
              />

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="rounded-xl border border-line px-5 py-3 text-sm font-bold text-navy hover:border-teal"
                  onClick={() => setEmailModalOpen(true)}
                  type="button"
                >
                  {t("settings.changeEmail")}
                </button>
                <button
                  className="rounded-xl border border-line px-5 py-3 text-sm font-bold text-navy hover:border-teal"
                  onClick={() => setPasswordModalOpen(true)}
                  type="button"
                >
                  {t("settings.changePassword")}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-red-300 bg-red-50 p-6">
              <h2 className="font-display text-xl font-bold text-red-800">
                {t("settings.dangerZone")}
              </h2>
              <p className="mt-2 leading-6 text-red-800/75">{t("settings.deleteAccountHint")}</p>
              <button
                className="mt-5 w-full rounded-xl bg-red-600 px-6 py-4 text-base font-extrabold text-white shadow-sm transition hover:bg-red-700 sm:w-auto"
                onClick={() => {
                  setDeleteConfirmation("");
                  setConfirmingDelete(true);
                }}
                type="button"
              >
                <span className="flex items-center justify-center gap-2">
                  <Trash2 size={19} /> {t("settings.deleteAccount")}
                </span>
              </button>
            </section>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="mt-8 space-y-8">
            <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="font-display text-xl font-bold text-navy">
                {t("settings.emailsTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate">{t("settings.emailsHint")}</p>
              <div className="mt-5 space-y-3">
                {EMAIL_NOTIFICATION_KEYS.map((key) => (
                  <label
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-cream/60 px-4 py-3"
                    key={key}
                  >
                    <input
                      checked={emailNotifications[key]}
                      className="mt-0.5 size-4 shrink-0 accent-teal"
                      onChange={(event) =>
                        updateProfile({
                          emailNotifications: {
                            ...emailNotifications,
                            [key]: event.target.checked,
                          },
                        })
                      }
                      type="checkbox"
                    />
                    <span className="text-sm leading-6 font-medium text-navy">
                      {t(`settings.email.${key}`)}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="font-display text-xl font-bold text-navy">
                {t("settings.sitDefaultsTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate">{t("settings.sitDefaultsHint")}</p>
              <label className="mt-5 flex items-start gap-3 rounded-xl border border-line bg-cream/50 px-4 py-3">
                <input
                  checked={sitDefaults.nonSmokerRequired}
                  className="mt-1 size-4 accent-teal"
                  onChange={(event) =>
                    updateProfile({
                      sitDefaults: {
                        ...sitDefaults,
                        nonSmokerRequired: event.target.checked,
                      },
                    })
                  }
                  type="checkbox"
                />
                <span>
                  <span className="block text-sm font-bold text-navy">
                    {t("settings.sitDefaults.nonSmoker")}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate">
                    {t("settings.sitDefaults.nonSmokerHint")}
                  </span>
                </span>
              </label>
            </section>
          </div>
        )}

        {activeTab === "privacy" && (
          <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-card">
            <h2 className="font-display text-xl font-bold text-navy">
              {t("settings.blockedUsersTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate">{t("settings.blockedUsersHint")}</p>
            {blockedUsers.length === 0 ? (
              <p className="mt-5 rounded-xl bg-cream px-4 py-4 text-sm text-slate">
                {t("settings.blockedUsersEmpty")}
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {blockedUsers.map((blocked) => (
                  <li
                    className="flex flex-col gap-3 rounded-xl border border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    key={blocked.name}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        alt=""
                        className="size-11 shrink-0 rounded-full object-cover"
                        src={blocked.image}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-navy">{blocked.name}</p>
                        <p className="text-xs text-slate">
                          {t("settings.blockedOn", {
                            date: new Intl.DateTimeFormat(getIntlLocale(i18n.language), {
                              dateStyle: "medium",
                            }).format(new Date(blocked.blockedAt)),
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      className="rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-navy hover:border-teal"
                      onClick={() => unblockUser(blocked.name)}
                      type="button"
                    >
                      {t("safetyActions.unblock")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      {emailModalOpen && (
        <ChangeEmailModal
          currentEmail={member.email}
          onClose={() => setEmailModalOpen(false)}
          onSuccess={(email) => {
            updateProfile({ email, emailConfirmed: false });
            flashAccountMessage(t("settings.emailUpdated"));
          }}
        />
      )}
      {passwordModalOpen && (
        <ChangePasswordModal
          email={member.email}
          onClose={() => setPasswordModalOpen(false)}
          onSuccess={() => flashAccountMessage(t("settings.passwordUpdated"))}
        />
      )}

      {confirmingDelete && (
        <div
          className="fixed inset-0 z-70 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !deleting) {
              setDeleteConfirmation("");
              setConfirmingDelete(false);
            }
          }}
        >
          <section
            aria-labelledby="delete-account-title"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-float md:p-8"
            role="dialog"
          >
            <span className="grid size-12 place-items-center rounded-full bg-red-100 text-red-700">
              <Trash2 size={24} />
            </span>
            <h2
              className="mt-5 font-display text-2xl font-bold text-navy"
              id="delete-account-title"
            >
              {t("settings.deleteConfirmTitle")}
            </h2>
            <p className="mt-3 leading-7 text-slate">{t("settings.deleteConfirmText")}</p>
            <label className="mt-5 block">
              <span className="form-label">
                {t("settings.deleteConfirmationLabel", {
                  term: DELETE_ACCOUNT_CONFIRMATION_TERM,
                })}
              </span>
              <input
                autoComplete="off"
                autoFocus
                className="form-input"
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder={DELETE_ACCOUNT_CONFIRMATION_TERM}
                spellCheck={false}
                type="text"
                value={deleteConfirmation}
              />
            </label>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                className="rounded-xl border border-line px-5 py-3 font-bold text-navy"
                disabled={deleting}
                onClick={() => {
                  setDeleteConfirmation("");
                  setConfirmingDelete(false);
                }}
                type="button"
              >
                {t("common.cancel")}
              </button>
              <button
                className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-60"
                disabled={deleting || deleteConfirmation !== DELETE_ACCOUNT_CONFIRMATION_TERM}
                onClick={() => {
                  setDeleting(true);
                  void deleteMockAccount(user.name)
                    .catch(() => {})
                    .then(() => deleteAccount())
                    .then(() => navigate("/"))
                    .finally(() => setDeleting(false));
                }}
                type="button"
              >
                {deleting ? t("settings.deletingAccount") : t("settings.deleteConfirm")}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

const SAFETY_SECTIONS = [
  "verification",
  "profiles",
  "video",
  "expectations",
  "handover",
  "insurance",
  "pets",
  "marina",
  "redFlags",
  "reporting",
  "emergency",
] as const;

function SafetyPage() {
  const { t } = useTranslation();
  return (
    <main>
      <section className="bg-navy px-5 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">{t("safety.title")}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-white/70">{t("safety.intro")}</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-4xl gap-5 px-5 py-12">
        <section className="rounded-2xl border border-coral/30 bg-coral/10 p-6">
          <h2 className="font-display text-xl font-bold text-navy">{t("how.liveaboardTitle")}</h2>
          <p className="mt-2 leading-7 text-slate">{t("how.liveaboardText")}</p>
        </section>
        {SAFETY_SECTIONS.map((section) => (
          <section className="rounded-2xl border border-line bg-white p-6" key={section}>
            <h2 className="font-display text-xl font-bold text-navy">
              {t(`safety.${section}.title`)}
            </h2>
            <p className="mt-2 leading-7 text-slate">{t(`safety.${section}.text`)}</p>
          </section>
        ))}
        <aside className="rounded-2xl border border-coral/30 bg-coral/10 p-6 text-navy">
          <h2 className="font-display text-xl font-bold">{t("safety.disclaimerTitle")}</h2>
          <p className="mt-2 leading-7">{t("safety.disclaimerText")}</p>
        </aside>
      </div>
    </main>
  );
}

function SupportPage() {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const [form, setForm] = useState({
    topic: "",
    name: user?.name ?? "",
    email: user?.email ?? "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "pending" | "success">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      name: user.name,
      email: user.email,
    }));
  }, [user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const name = user?.name ?? form.name;
    const email = user?.email ?? form.email;
    if (!form.topic || !name.trim() || !form.message.trim()) {
      setError(t("support.requiredError"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("support.emailError"));
      return;
    }
    setStatus("pending");
    try {
      await submitSupportRequest({
        topic: form.topic,
        name: name.trim(),
        email: email.trim(),
        message: form.message.trim(),
      });
      setStatus("success");
    } catch {
      setStatus("idle");
      setError(t("support.submitError"));
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
      <h1 className="section-title">{t("support.title")}</h1>
      <p className="mt-3 max-w-2xl text-slate">{t("support.intro")}</p>
      <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl bg-seafoam p-6">
          <h2 className="font-display text-xl font-bold text-navy">{t("support.categories")}</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate">
            {["account", "listing", "safety", "technical", "other"].map((topic) => (
              <li className="flex items-center gap-2" key={topic}>
                <CircleCheck className="text-teal" size={16} /> {t(`support.topic.${topic}`)}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <h2 className="font-display text-xl font-bold text-navy">{t("support.formTitle")}</h2>
          {status === "success" ? (
            <div className="py-10 text-center">
              <CircleCheck className="mx-auto text-teal" size={38} />
              <p className="mt-4 font-bold text-navy">{t("support.success")}</p>
            </div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={(event) => void submit(event)}>
              <label className="block">
                <span className="form-label">{t("support.topic")}</span>
                <Select
                  variant="form"
                  onChange={(event) => setForm({ ...form, topic: event.target.value })}
                  required
                  value={form.topic}
                >
                  <option value="">{t("support.chooseTopic")}</option>
                  {["account", "listing", "safety", "technical", "other"].map((topic) => (
                    <option key={topic} value={topic}>
                      {t(`support.topic.${topic}`)}
                    </option>
                  ))}
                </Select>
              </label>
              {user ? (
                <aside className="rounded-2xl border border-line bg-cream/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate">
                    {t("support.accountDetails")}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      alt=""
                      className="size-12 rounded-full object-cover"
                      onError={(event) => {
                        const img = event.currentTarget;
                        const fallback = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
                        if (img.src !== fallback) img.src = fallback;
                      }}
                      referrerPolicy="no-referrer"
                      src={user.image}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-navy">{user.name}</p>
                      <p className="mt-0.5 truncate text-sm text-slate">{user.email}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate">
                    {t("support.accountDetailsHint")}
                  </p>
                </aside>
              ) : (
                <>
                  <label className="block">
                    <span className="form-label">{t("support.name")}</span>
                    <input
                      className="form-input"
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      required
                      type="text"
                      value={form.name}
                    />
                  </label>
                  <label className="block">
                    <span className="form-label">{t("support.email")}</span>
                    <input
                      className="form-input"
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      required
                      type="email"
                      value={form.email}
                    />
                  </label>
                </>
              )}
              <label className="block">
                <span className="form-label">{t("support.message")}</span>
                <textarea
                  className="form-input min-h-36 resize-y"
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  required
                  value={form.message}
                />
              </label>
              {error && (
                <p className="text-sm font-semibold text-coral" role="alert">
                  {error}
                </p>
              )}
              <button
                className="w-full rounded-xl bg-coral py-3.5 font-bold text-white disabled:opacity-60"
                disabled={status === "pending"}
                type="submit"
              >
                {status === "pending" ? t("support.sending") : t("support.send")}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

const TERMS_SECTIONS = [
  "eligibility",
  "accounts",
  "platform",
  "listings",
  "liveaboard",
  "responsibilities",
  "verification",
  "prohibited",
  "payments",
  "cancellations",
  "insurance",
  "damage",
  "intellectualProperty",
  "privacy",
  "termination",
  "disclaimers",
  "liability",
  "indemnity",
  "disputes",
  "changes",
  "contact",
] as const;

function TermsPage() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-4xl px-5 py-14 lg:px-8">
      <h1 className="section-title">{t("terms.title")}</h1>
      <p className="mt-3 text-sm text-slate">{t("terms.updated")}</p>
      <aside className="mt-6 rounded-2xl border border-coral/30 bg-coral/10 p-5 font-semibold text-navy">
        {t("terms.reviewNotice")}
      </aside>
      <div className="mt-10 space-y-8">
        {TERMS_SECTIONS.map((section, index) => (
          <section key={section}>
            <h2 className="font-display text-xl font-bold text-navy">
              {index + 1}. {t(`terms.${section}.title`)}
            </h2>
            <p className="mt-2 leading-7 text-slate">{t(`terms.${section}.text`)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}

function ApplicationStatusBadge({
  status,
  ownerView = false,
}: {
  status: ApplicationStatus;
  /** When true, show owner-only statuses such as shortlisted. */
  ownerView?: boolean;
}) {
  const { t } = useTranslation();
  const displayStatus = status === "shortlisted" && !ownerView ? "new" : status;
  const colors: Record<ApplicationStatus, string> = {
    new: "bg-aqua/20 text-teal",
    shortlisted: "bg-sun/25 text-navy",
    accepted: "bg-seafoam text-teal",
    declined: "bg-red-100 text-red-700",
    withdrawn: "bg-slate/15 text-slate",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${colors[displayStatus]}`}>
      {t(`applications.status.${displayStatus}`)}
    </span>
  );
}

function patchApplicationInQueriesCache(old: unknown, updated: SitApplication): unknown {
  if (!old) return old;
  if (Array.isArray(old)) {
    return old.map((item) =>
      item && typeof item === "object" && "id" in item && item.id === updated.id ? updated : item,
    );
  }
  if (
    typeof old === "object" &&
    old !== null &&
    "applications" in old &&
    Array.isArray((old as { applications: unknown }).applications)
  ) {
    const page = old as {
      applications: SitApplication[];
      accepted?: SitApplication[];
    };
    return {
      ...page,
      applications: page.applications.map((item) => (item.id === updated.id ? updated : item)),
      accepted: Array.isArray(page.accepted)
        ? page.accepted.map((item) => (item.id === updated.id ? updated : item))
        : page.accepted,
    };
  }
  return old;
}

function sitParticipationRole(application: SitApplication, userName: string) {
  return application.ownerName === userName ? "owner" : "sitter";
}

function SitParticipationBadge({ role }: { role: "owner" | "sitter" }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
        role === "owner" ? "bg-seafoam text-teal" : "bg-cream text-slate"
      }`}
    >
      {role === "owner" ? t("role.ownerShort") : t("role.sitterShort")}
    </span>
  );
}

function SitTypeBadge({
  sitType,
  size = "sm",
}: {
  sitType: "liveaboard" | "daytimeChecks" | undefined;
  size?: "sm" | "md";
}) {
  const { t } = useTranslation();
  const type = sitType ?? "liveaboard";
  const isLiveaboard = type === "liveaboard";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${
        isLiveaboard ? "bg-teal/10 text-teal" : "bg-sun/20 text-amber-700"
      } ${size === "md" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]"}`}
    >
      {isLiveaboard ? (
        <Home size={size === "md" ? 14 : 12} />
      ) : (
        <Sun size={size === "md" ? 14 : 12} />
      )}
      {t(`sitType.${type}Short`)}
    </span>
  );
}

function SitPhaseBadge({ phase, size = "sm" }: { phase: SitPhase; size?: "sm" | "md" }) {
  const { t } = useTranslation();
  const colors: Record<SitPhase, string> = {
    acceptingApplicants: "bg-aqua/20 text-teal",
    applicantChosen: "bg-seafoam text-teal",
    stayUnderway: "bg-coral/15 text-coral",
    stayCompleted: "bg-navy/10 text-navy",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${colors[phase]} ${
        size === "md" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]"
      }`}
    >
      {t(`sitPhase.${phase}`)}
    </span>
  );
}

function SitPhaseStepper({ phase }: { phase: SitPhase }) {
  const { t } = useTranslation();
  const currentIndex = SIT_PHASES.indexOf(phase);
  return (
    <ol className="grid gap-2 sm:grid-cols-4">
      {SIT_PHASES.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        return (
          <li
            className={`rounded-xl border px-3 py-2.5 text-center ${(() => {
              if (current) return "border-teal bg-seafoam text-teal";
              if (done) return "border-line bg-white text-navy";
              return "border-line bg-cream/70 text-slate";
            })()}`}
            key={step}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70">
              {t("sitPhase.step", { number: index + 1 })}
            </span>
            <span className="mt-1 block text-xs font-bold leading-4">{t(`sitPhase.${step}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function resolveSitPhase(sit: Sit): SitPhase {
  return (
    sit.phase ??
    getSitPhase({
      dateStart: sit.dateStart,
      duration: sit.duration,
      applicationsOpen: sit.applicationsOpen,
      accepted: sit.accepted,
      applicants: sit.applicants,
    })
  );
}

/** Prefer live accepted-application state when the sits cache is briefly stale. */
function resolveSitPhaseWithAcceptance(sit: Sit, hasAcceptedApplicant: boolean): SitPhase {
  if (!hasAcceptedApplicant) return resolveSitPhase(sit);
  return getSitPhase({
    dateStart: sit.dateStart,
    duration: sit.duration,
    applicationsOpen: false,
    accepted: true,
    applicants: sit.applicants,
  });
}

function patchSitAcceptanceInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  sitId: string,
  accepted: boolean,
) {
  queryClient.setQueryData<Sit[]>(queries.sits.all.queryKey, (current) => {
    if (!current) return current;
    return current.map((sit) => {
      if (sit.id !== sitId) return sit;
      const next = {
        ...sit,
        accepted,
        applicationsOpen: accepted ? false : true,
      };
      return {
        ...next,
        phase: getSitPhase({
          dateStart: next.dateStart,
          duration: next.duration,
          applicationsOpen: next.applicationsOpen,
          accepted: next.accepted,
          applicants: next.applicants,
        }),
      };
    });
  });
}

function FlagSitIssueModal({
  boatName,
  sitLabel,
  close,
}: {
  boatName: string;
  sitLabel: string;
  close: () => void;
}) {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user)!;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      submitSupportRequest({
        topic: "safety",
        name: user.name,
        email: user.email,
        message: t("sitIssue.messagePrefix", {
          boat: boatName,
          sit: sitLabel,
          details: message.trim(),
        }),
      }),
    onSuccess: () => {
      setError("");
    },
  });

  function submit() {
    if (message.trim().length < 20) {
      setError(t("sitIssue.messageTooShort"));
      return;
    }
    setError("");
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-2000 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-float md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{t("sitIssue.kicker")}</p>
            <h2 className="font-display text-2xl font-bold text-navy">{t("sitIssue.title")}</h2>
          </div>
          <button
            aria-label={t("common.close")}
            className="rounded-full p-2 hover:bg-cream"
            onClick={close}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        {mutation.isSuccess ? (
          <div className="mt-6 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-seafoam text-teal">
              <Check size={28} />
            </span>
            <p className="mt-4 font-bold text-navy">{t("sitIssue.success")}</p>
            <p className="mt-2 text-sm leading-6 text-slate">{t("sitIssue.successHint")}</p>
            <button
              className="mt-6 rounded-full bg-navy px-6 py-3 font-bold text-white"
              onClick={close}
              type="button"
            >
              {t("common.done")}
            </button>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm leading-6 text-slate">
              {t("sitIssue.hint", { boat: boatName })}
            </p>
            <label className="mt-5 block">
              <span className="form-label">{t("sitIssue.messageLabel")}</span>
              <textarea
                className="form-input mt-1.5 min-h-36 resize-y"
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t("sitIssue.messagePlaceholder")}
                value={message}
              />
            </label>
            {error && (
              <p className="mt-3 text-sm font-semibold text-coral" role="alert">
                {error}
              </p>
            )}
            {mutation.isError && (
              <p className="mt-3 text-sm font-semibold text-coral" role="alert">
                {t("sitIssue.submitError")}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl px-5 py-3 text-sm font-bold text-slate"
                onClick={close}
                type="button"
              >
                {t("common.cancel")}
              </button>
              <button
                className="rounded-xl bg-coral px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
                disabled={mutation.isPending || !message.trim()}
                onClick={submit}
                type="button"
              >
                {mutation.isPending ? t("sitIssue.sending") : t("sitIssue.submit")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function applicationRequirementMatch(application: SitApplication, sit: Sit | undefined) {
  const requiredSkills = sit?.requiredSkills ?? [];
  const requiredCertifications = sit?.requiredCertifications ?? [];
  const minimumYears = sit?.minYearsExperience ?? 0;
  const matchTotal =
    requiredSkills.length + requiredCertifications.length + (minimumYears > 0 ? 1 : 0);
  const matchCount =
    requiredSkills.filter((skill) => application.applicant.skills.includes(skill)).length +
    requiredCertifications.filter((certification) =>
      application.applicant.certifications.includes(certification),
    ).length +
    (minimumYears > 0 && application.applicant.yearsExperience >= minimumYears ? 1 : 0);
  return { matchCount, matchTotal };
}

function ApplicationReviewPage() {
  const { i18n, t } = useTranslation();
  const { sitId = "" } = useParams();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [composerFocusKey, setComposerFocusKey] = useState(0);
  const [flaggingIssue, setFlaggingIssue] = useState(false);
  const [closeApplicationsConfirm, setCloseApplicationsConfirm] = useState(false);
  const [startEarlyConfirm, setStartEarlyConfirm] = useState(false);
  const [confirmingStatus, setConfirmingStatus] = useState<
    "accepted" | "declined" | "unaccept" | null
  >(null);
  const [sharePhone, setSharePhone] = useState(false);
  const [sort, setSort] = useState<"newest" | "experience" | "skillMatch" | "priorSits">("newest");
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>("all");
  const [experienceFilter, setExperienceFilter] = useState<
    "any" | "meetsMin" | "fivePlus" | "tenPlus"
  >("any");
  const [listPage, setListPage] = useState(0);

  const { data: sits = [], isLoading: sitsLoading } = useQuery({
    ...queries.sits.all,
  });
  const { data: vessels = [], isLoading: vesselsLoading } = useQuery({
    ...queries.vessels.all,
  });

  const listParams = useMemo(
    () => ({
      sort,
      status: statusFilter,
      experience: experienceFilter,
      page: listPage,
      limit: APPLICATIONS_PAGE_SIZE,
    }),
    [experienceFilter, listPage, sort, statusFilter],
  );

  const {
    data: applicationsPage,
    isLoading,
    isFetching,
  } = useQuery({
    ...queries.applications.sit(sitId, listParams),
    placeholderData: keepPreviousData,
    enabled: Boolean(sitId),
  });

  const visibleApplications = applicationsPage?.applications ?? [];
  const acceptedApplications = applicationsPage?.accepted ?? [];
  const filteredTotal = applicationsPage?.total ?? 0;
  const sitTotal = applicationsPage?.sitTotal ?? 0;
  const currentListPage = applicationsPage?.page ?? listPage;
  const listTotalPages = applicationsPage?.totalPages ?? 1;

  const sit = sits.find((item) => item.id === sitId);
  const vessel = vessels.find((item) => item.id === sit?.boatId);
  const allowed = Boolean(user && vessel && vessel.owner === user.name);
  const pageLoading = (isLoading && !applicationsPage) || sitsLoading || vesselsLoading;
  const sitPhase = sit ? resolveSitPhaseWithAcceptance(sit, acceptedApplications.length > 0) : null;

  const selectableApplications = useMemo(() => {
    if (statusFilter === "accepted") return acceptedApplications;
    if (statusFilter !== "all") return visibleApplications;
    return [...acceptedApplications, ...visibleApplications];
  }, [acceptedApplications, statusFilter, visibleApplications]);

  useEffect(() => {
    setListPage(0);
  }, [experienceFilter, sort, statusFilter]);

  useEffect(() => {
    if (listPage > listTotalPages - 1) setListPage(Math.max(0, listTotalPages - 1));
  }, [listPage, listTotalPages]);

  useEffect(() => {
    if (!selectableApplications.length) {
      setSelectedId("");
      return;
    }
    if (!selectableApplications.some((application) => application.id === selectedId)) {
      setSelectedId(selectableApplications[0].id);
    }
  }, [selectableApplications, selectedId]);

  const selected = selectableApplications.find((application) => application.id === selectedId);

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      ownerPhone,
      status,
    }: {
      id: string;
      ownerPhone?: string;
      status: ApplicationStatus;
    }) => updateApplicationStatus(id, status, ownerPhone),
    onSuccess: async (_updated, variables) => {
      const acceptedNow = variables.status === "accepted";
      const unaccepting = variables.status === "new";
      if (acceptedNow || unaccepting) {
        patchSitAcceptanceInCache(queryClient, sitId, acceptedNow);
      }
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
      await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.sits.all.queryKey });
    },
  });
  const toggleApplicationsMutation = useMutation({
    mutationFn: () => {
      if (!sit) throw new Error("APPLICATION_SIT_NOT_FOUND");
      const { accepted: _accepted, phase: _phase, ...persistable } = sit;
      return saveSit({
        ...persistable,
        applicationsOpen: !isAcceptingApplications(sit),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.sits.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
    },
  });
  const startSitEarlyMutation = useMutation({
    mutationFn: () => {
      if (!sit) throw new Error("APPLICATION_SIT_NOT_FOUND");
      return startSitEarly(sit.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.sits.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
      setStartEarlyConfirm(false);
    },
  });
  const messageMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      sendApplicationMessage(id, user!.name, text),
    onSuccess: async (updated) => {
      queryClient.setQueriesData({ queryKey: queries.applications.getQueryKey() }, (old) =>
        patchApplicationInQueriesCache(old, updated),
      );
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
    },
  });
  const videoCallMutation = useMutation({
    mutationFn: ({
      id,
      proposal,
      counter,
    }: {
      id: string;
      proposal: { startsAt: string; durationMinutes: number };
      counter?: boolean;
    }) => requestApplicationVideoCall(id, user!.name, proposal, { counter }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
    },
  });
  const videoCallAcceptMutation = useMutation({
    mutationFn: ({ id, messageId }: { id: string; messageId: string }) =>
      acceptApplicationVideoCall(id, user!.name, messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
    },
  });
  const videoCallDeclineMutation = useMutation({
    mutationFn: ({ id, messageId }: { id: string; messageId: string }) =>
      declineApplicationVideoCall(id, user!.name, messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
    },
  });
  const sharePhoneMutation = useMutation({
    mutationFn: ({ id, phoneNumber }: { id: string; phoneNumber: string }) =>
      shareApplicationPhoneNumber(id, user!.name, phoneNumber),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
    },
  });

  if (!user || (!pageLoading && !allowed)) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <ShieldCheck className="mx-auto text-teal" size={42} />
        <h1 className="mt-5 font-display text-3xl font-extrabold text-navy">
          {t("applications.ownerOnly")}
        </h1>
        <button
          className="mt-6 rounded-full bg-navy px-6 py-3 font-bold text-white"
          onClick={() => navigate("/my-sits")}
          type="button"
        >
          {t("owner.backToSits")}
        </button>
      </main>
    );
  }

  const requiredSkills = sit?.requiredSkills ?? [];
  const ownerPhone = user?.phoneNumber.trim()
    ? `${user.phoneCountryCode} ${user.phoneNumber.trim()}`
    : "";
  const selectedMatch = selected
    ? applicationRequirementMatch(selected, sit)
    : { matchCount: 0, matchTotal: 0 };
  const { matchCount, matchTotal } = selectedMatch;
  const primaryAcceptedApplication = acceptedApplications[0];
  const anotherApplicantAccepted = Boolean(
    primaryAcceptedApplication && selected && selected.status !== "accepted",
  );
  const actionClasses = {
    accepted: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    declined: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
  } as const;

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <button
        className="mb-6 flex items-center gap-2 text-sm font-bold text-slate hover:text-navy"
        onClick={() => navigate("/my-sits")}
        type="button"
      >
        <ArrowLeft size={17} /> {t("applications.backToSits")}
      </button>
      {pageLoading ? <ApplicationReviewSkeleton /> : null}
      {!pageLoading ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="section-title">
                {t("applications.title", { boat: vessel?.name ?? "" })}
              </h1>
              <p className="mt-3 text-slate">{t("applications.subtitle", { count: sitTotal })}</p>
              {sit && sitPhase && (
                <div className="mt-3">
                  <SitPhaseBadge phase={sitPhase} size="md" />
                </div>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {sit && sitPhase === "acceptingApplicants" && (
                <button
                  className={`rounded-full border px-5 py-2.5 text-sm font-bold disabled:opacity-60 ${
                    isAcceptingApplications(sit)
                      ? "border-line bg-white text-navy hover:border-teal"
                      : "border-teal bg-seafoam text-teal hover:bg-seafoam/80"
                  }`}
                  disabled={toggleApplicationsMutation.isPending}
                  onClick={() => {
                    if (isAcceptingApplications(sit)) {
                      setCloseApplicationsConfirm(true);
                      return;
                    }
                    toggleApplicationsMutation.mutate();
                  }}
                  type="button"
                >
                  {isAcceptingApplications(sit)
                    ? t("applications.closeRequests")
                    : t("applications.openRequests")}
                </button>
              )}
              {sit && sitPhase === "applicantChosen" && (
                <button
                  className="flex items-center gap-2 rounded-full border border-teal bg-seafoam px-5 py-2.5 text-sm font-bold text-teal hover:bg-seafoam/80 disabled:opacity-60"
                  disabled={startSitEarlyMutation.isPending}
                  onClick={() => setStartEarlyConfirm(true)}
                  type="button"
                >
                  <Play size={16} /> {t("owner.startSitEarly")}
                </button>
              )}
              {sit && sitPhase === "stayUnderway" && (
                <>
                  <SitEmergencyHelp shape="pill" />
                  <button
                    className="flex items-center gap-2 rounded-full border border-coral/40 bg-coral/10 px-5 py-2.5 text-sm font-bold text-coral hover:border-coral"
                    onClick={() => setFlaggingIssue(true)}
                    type="button"
                  >
                    <Flag size={16} /> {t("sitIssue.flagButton")}
                  </button>
                </>
              )}
            </div>
          </div>
          {sit && sitPhase && (
            <div className="mt-6">
              <SitPhaseStepper phase={sitPhase} />
            </div>
          )}
          {sit && sitPhase === "acceptingApplicants" && !isAcceptingApplications(sit) && (
            <div
              className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"
              role="status"
            >
              {t("applications.requestsClosedNotice")}
            </div>
          )}
          {sit && sitPhase === "acceptingApplicants" && sitTotal > 0 && (
            <div
              className="mt-5 flex gap-3 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-4 text-sm leading-6 text-navy sm:px-5"
              role="status"
            >
              <Video className="mt-0.5 shrink-0 text-coral" size={22} />
              <div>
                <p className="font-bold">{t("applications.videoCallBannerTitle")}</p>
                <p className="mt-1 text-slate">{t("applications.videoCallBanner")}</p>
              </div>
            </div>
          )}

          {sitTotal > 0 ? (
            <div className={`mt-8 space-y-6 ${isFetching ? "opacity-70" : ""}`}>
              {acceptedApplications.length > 0 &&
                (statusFilter === "all" || statusFilter === "accepted") && (
                  <section className="overflow-hidden rounded-3xl border border-teal/35 bg-[linear-gradient(135deg,#dff1ec_0%,#ffffff_55%)] p-5 shadow-card sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="eyebrow text-teal">{t("applications.acceptedKicker")}</p>
                        <h2 className="mt-1 font-display text-2xl font-bold text-navy">
                          {acceptedApplications.length === 1
                            ? t("applications.acceptedTitle")
                            : t("applications.acceptedTitlePlural", {
                                count: acceptedApplications.length,
                              })}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">
                          {t("applications.acceptedHint")}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                        <Check size={14} strokeWidth={3} /> {t("applications.status.accepted")}
                      </span>
                    </div>
                    {sit && sitPhase === "applicantChosen" && (
                      <div
                        className="mt-5 flex gap-3 rounded-2xl border border-teal/30 bg-seafoam px-4 py-4 text-sm leading-6 text-navy sm:px-5"
                        role="status"
                      >
                        <KeyRound className="mt-0.5 shrink-0 text-teal" size={22} />
                        <div>
                          <p className="font-bold">{t("applications.handoverBannerTitle")}</p>
                          <p className="mt-1 text-slate">{t("applications.handoverBanner")}</p>
                        </div>
                      </div>
                    )}
                    {sit && sitPhase === "stayUnderway" && (
                      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-4 text-sm leading-6 text-navy sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex gap-3">
                          <Flag className="mt-0.5 shrink-0 text-coral" size={22} />
                          <div>
                            <p className="font-bold">{t("sitIssue.bannerTitle")}</p>
                            <p className="mt-1 text-slate">{t("sitIssue.bannerHint")}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <SitEmergencyHelp shape="pill" />
                          <button
                            className="rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white"
                            onClick={() => setFlaggingIssue(true)}
                            type="button"
                          >
                            {t("sitIssue.flagButton")}
                          </button>
                        </div>
                      </div>
                    )}
                    {sit && canLeaveReview(sit) && (
                      <div
                        className="mt-5 rounded-2xl border border-teal/25 bg-seafoam px-4 py-4 text-sm leading-6 text-navy sm:px-5"
                        role="status"
                      >
                        {t("reviews.windowBanner", { days: reviewDaysRemaining(sit) })}
                      </div>
                    )}
                    <div className="mt-5 grid gap-3">
                      {acceptedApplications.map((application) => {
                        const isSelected = application.id === selected?.id;
                        return (
                          <button
                            className={`flex w-full flex-col gap-4 rounded-2xl border bg-white/90 p-4 text-left transition sm:flex-row sm:items-center ${
                              isSelected
                                ? "border-teal shadow-card ring-2 ring-teal/25"
                                : "border-teal/40 hover:border-teal hover:bg-seafoam/40"
                            }`}
                            key={application.id}
                            onClick={() => {
                              setSelectedId(application.id);
                              setComposerFocusKey((key) => key + 1);
                              window.requestAnimationFrame(() => {
                                document
                                  .getElementById("application-detail-panel")
                                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
                              });
                            }}
                            type="button"
                          >
                            <img
                              alt=""
                              className="size-16 rounded-full object-cover"
                              src={application.applicant.image}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-display text-xl font-bold text-navy">
                                  {application.applicant.name}
                                </span>
                                <ApplicationStatusBadge ownerView status={application.status} />
                              </span>
                              <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate">
                                <span className="flex items-center gap-1.5">
                                  <MapPin size={14} /> {application.applicant.location}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Users size={14} /> {t("applications.partySize")}:{" "}
                                  {application.partySize}
                                </span>
                                <SitterRatingBadge sitterName={application.applicant.name} />
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-2 text-sm font-bold text-teal">
                              {isSelected ? (
                                <>
                                  <Check size={16} />
                                  {t("applications.acceptedViewing")}
                                </>
                              ) : (
                                <>
                                  <ArrowLeft size={16} className="rotate-180" />
                                  {t("applications.acceptedView")}
                                </>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

              <div className="grid min-w-0 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
                <aside className="h-fit min-w-0 rounded-2xl border border-line bg-white p-3 shadow-card">
                  <div className="space-y-2 border-b border-line pb-3">
                    <label className="block">
                      <span className="sr-only">{t("applications.sortLabel")}</span>
                      <Select
                        variant="form"
                        aria-label={t("applications.sortLabel")}
                        onChange={(event) => setSort(event.target.value as typeof sort)}
                        value={sort}
                      >
                        <option value="newest">{t("applications.sortNewest")}</option>
                        <option value="experience">{t("applications.sortExperience")}</option>
                        <option value="skillMatch">{t("applications.sortSkillMatch")}</option>
                        <option value="priorSits">{t("applications.sortPriorSits")}</option>
                      </Select>
                    </label>
                    <label className="block">
                      <span className="sr-only">{t("applications.filterStatusLabel")}</span>
                      <Select
                        variant="form"
                        aria-label={t("applications.filterStatusLabel")}
                        onChange={(event) =>
                          setStatusFilter(event.target.value as typeof statusFilter)
                        }
                        value={statusFilter}
                      >
                        <option value="all">{t("applications.filterStatusAll")}</option>
                        {(["new", "shortlisted", "accepted", "declined", "withdrawn"] as const).map(
                          (status) => (
                            <option key={status} value={status}>
                              {t(`applications.status.${status}`)}
                            </option>
                          ),
                        )}
                      </Select>
                    </label>
                    <label className="block">
                      <span className="sr-only">{t("applications.filterExperienceLabel")}</span>
                      <Select
                        variant="form"
                        aria-label={t("applications.filterExperienceLabel")}
                        onChange={(event) =>
                          setExperienceFilter(event.target.value as typeof experienceFilter)
                        }
                        value={experienceFilter}
                      >
                        <option value="any">{t("applications.filterExperienceAny")}</option>
                        <option value="meetsMin">
                          {t("applications.filterExperienceMeetsMin")}
                        </option>
                        <option value="fivePlus">
                          {t("applications.filterExperienceFivePlus")}
                        </option>
                        <option value="tenPlus">{t("applications.filterExperienceTenPlus")}</option>
                      </Select>
                    </label>
                    <p className="px-1 text-xs font-semibold text-slate">
                      {t("applications.filteredCount", {
                        count:
                          statusFilter === "accepted"
                            ? acceptedApplications.length
                            : visibleApplications.length,
                        total:
                          statusFilter === "accepted" ? acceptedApplications.length : filteredTotal,
                      })}
                    </p>
                  </div>
                  <div className={`mt-2 space-y-1 ${isFetching ? "opacity-70" : ""}`}>
                    {statusFilter === "accepted" ? (
                      <p className="px-3 py-6 text-center text-sm text-slate">
                        {acceptedApplications.length
                          ? t("applications.acceptedListHint")
                          : t("applications.filterEmpty")}
                      </p>
                    ) : null}
                    {statusFilter !== "accepted" && visibleApplications.length
                      ? visibleApplications.map((application) => {
                          const match = applicationRequirementMatch(application, sit);
                          return (
                            <button
                              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                                application.id === selected?.id ? "bg-seafoam" : "hover:bg-cream"
                              }`}
                              key={application.id}
                              onClick={() => {
                                setSelectedId(application.id);
                                setComposerFocusKey((key) => key + 1);
                              }}
                              type="button"
                            >
                              <img
                                alt=""
                                className="size-11 rounded-full object-cover"
                                src={application.applicant.image}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-bold text-navy">
                                  {application.applicant.name}
                                </span>
                                <span className="mt-1 block text-[11px] font-semibold text-slate">
                                  {t("applications.listMeta", {
                                    years: application.applicant.yearsExperience,
                                    matches: match.matchCount,
                                    total: match.matchTotal || 0,
                                    sits: application.applicant.completedSits,
                                  })}
                                </span>
                                <span className="mt-1 block">
                                  <ApplicationStatusBadge ownerView status={application.status} />
                                </span>
                              </span>
                            </button>
                          );
                        })
                      : null}
                    {statusFilter !== "accepted" && !visibleApplications.length ? (
                      <p className="px-3 py-6 text-center text-sm text-slate">
                        {t("applications.filterEmpty")}
                      </p>
                    ) : null}
                  </div>
                  {statusFilter !== "accepted" ? (
                    <ResultsPagination
                      className="mt-3 flex flex-col items-stretch gap-3 border-t border-line pt-3"
                      currentPage={currentListPage}
                      onPageChange={setListPage}
                      pageSize={APPLICATIONS_PAGE_SIZE}
                      totalItems={filteredTotal}
                    />
                  ) : null}
                </aside>

                {selected ? (
                  <div className="space-y-6" id="application-detail-panel">
                    {selected.status !== "accepted" && primaryAcceptedApplication ? (
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-teal/40 bg-seafoam px-4 py-2 text-sm font-bold text-teal transition hover:border-teal hover:bg-white"
                        onClick={() => {
                          setSelectedId(primaryAcceptedApplication.id);
                          window.requestAnimationFrame(() => {
                            document
                              .getElementById("application-detail-panel")
                              ?.scrollIntoView({ behavior: "smooth", block: "start" });
                          });
                        }}
                        type="button"
                      >
                        <ArrowLeft size={16} />
                        {t("applications.returnToAccepted", {
                          name: primaryAcceptedApplication.applicant.name,
                        })}
                      </button>
                    ) : null}
                    <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                        <img
                          alt={selected.applicant.name}
                          className="size-20 rounded-full object-cover"
                          src={selected.applicant.image}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="font-display text-2xl font-bold text-navy">
                              {selected.applicant.name}
                            </h2>
                            <ApplicationStatusBadge ownerView status={selected.status} />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate">
                            <p className="flex items-center gap-1.5">
                              <MapPin size={14} /> {selected.applicant.location}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <CalendarDays size={14} />{" "}
                              {t("member.since", { year: selected.applicant.memberSince })}
                            </p>
                            <SitterRatingBadge sitterName={selected.applicant.name} />
                          </div>
                          <p className="mt-3 leading-7 text-slate">{selected.applicant.bio}</p>
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Link
                              className="text-sm font-bold text-teal hover:text-navy"
                              to={`/members/${encodeURIComponent(selected.applicant.name)}`}
                            >
                              {t("reviews.viewProfile")}
                            </Link>
                            <UserSafetyActions
                              image={selected.applicant.image}
                              name={selected.applicant.name}
                            />
                          </div>
                          <BlockedUserBanner name={selected.applicant.name} />
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-cream p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate">
                            {t("applications.experience")}
                          </p>
                          <p className="mt-2 font-bold text-navy">
                            {t("applications.yearsExperience", {
                              count: selected.applicant.yearsExperience,
                            })}
                          </p>
                        </div>
                        <div className="rounded-xl bg-cream p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate">
                            {t("applications.requirementMatch")}
                          </p>
                          <p className="mt-2 font-bold text-navy">
                            {matchTotal
                              ? t("applications.matchCount", {
                                  count: matchCount,
                                  total: matchTotal,
                                })
                              : t("applications.noSpecificRequirements")}
                          </p>
                        </div>
                        <div className="rounded-xl bg-cream p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate">
                            {t("applications.priorSits")}
                          </p>
                          <p className="mt-2 font-bold text-navy">
                            {t("applications.priorSitsCount", {
                              count: selected.applicant.completedSits,
                            })}
                          </p>
                        </div>
                        <div className="rounded-xl bg-cream p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate">
                            {t("applications.partySize")}
                          </p>
                          <p className="mt-2 flex items-center gap-2 font-bold text-navy">
                            <Users size={17} /> {selected.partySize}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <SitterReviewsSection
                          limit={3}
                          profilePath={`/members/${encodeURIComponent(selected.applicant.name)}`}
                          showEmpty={false}
                          sitterName={selected.applicant.name}
                        />
                      </div>

                      {selected.status === "accepted" && sit && canLeaveReview(sit) && (
                        <div className="mt-6">
                          <LeaveReviewForm application={selected} ownerName={user.name} />
                        </div>
                      )}

                      {[
                        {
                          label: t("applications.certifications"),
                          values: selected.applicant.certifications,
                          highlighted: [] as string[],
                        },
                        {
                          label: t("applications.skills"),
                          values: selected.applicant.skills,
                          highlighted: requiredSkills,
                        },
                        {
                          label: t("applications.languages"),
                          values: selected.applicant.languages,
                          highlighted: user.languages,
                        },
                        {
                          label: t("profile.preferredCountries"),
                          values: selected.applicant.preferredCountries ?? [],
                          highlighted: [] as string[],
                        },
                      ].map(({ highlighted, label, values }) => (
                        <div className="mt-5" key={label}>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate">
                            {label}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {values.map((value) => {
                              const isHighlighted = highlighted.some(
                                (item) => item.toLocaleLowerCase() === value.toLocaleLowerCase(),
                              );
                              return (
                                <span
                                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                    isHighlighted
                                      ? "border-teal/40 bg-seafoam text-teal"
                                      : "border-line bg-white text-navy"
                                  }`}
                                  key={value}
                                >
                                  {isHighlighted && <Check aria-hidden="true" size={13} />}
                                  {value}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      <div className="mt-6 rounded-2xl border border-aqua/40 bg-aqua/10 p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-teal">
                          {t("applications.initialMessage")}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap leading-7 text-navy">
                          {selected.initialMessage}
                        </p>
                      </div>

                      {anotherApplicantAccepted ? (
                        <div
                          className="mt-6 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950"
                          role="status"
                        >
                          <TriangleAlert className="mt-0.5 shrink-0 text-amber-700" size={20} />
                          <div>
                            <p className="font-bold">
                              {t("applications.anotherAcceptedBannerTitle")}
                            </p>
                            <p className="mt-1">
                              {t("applications.anotherAcceptedBanner", {
                                name: primaryAcceptedApplication.applicant.name,
                              })}
                            </p>
                          </div>
                        </div>
                      ) : null}
                      {!anotherApplicantAccepted && selected.status === "accepted" ? (
                        <div className="mt-6">
                          <button
                            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
                            disabled={statusMutation.isPending}
                            onClick={() => {
                              setSharePhone(false);
                              setConfirmingStatus("unaccept");
                            }}
                            type="button"
                          >
                            {t("applications.action.unaccept")}
                          </button>
                        </div>
                      ) : null}
                      {!anotherApplicantAccepted && selected.status !== "accepted" ? (
                        <div className="mt-6 flex flex-wrap gap-2">
                          <label
                            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                              selected.status === "shortlisted"
                                ? "border-amber-400 bg-amber-100 text-amber-900"
                                : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                            }`}
                          >
                            <input
                              checked={selected.status === "shortlisted"}
                              className="size-4 accent-amber-600"
                              disabled={statusMutation.isPending}
                              onChange={(event) =>
                                statusMutation.mutate({
                                  id: selected.id,
                                  status: event.target.checked ? "shortlisted" : "new",
                                })
                              }
                              type="checkbox"
                            />
                            {t("applications.action.shortlisted")}
                          </label>
                          {(["accepted", "declined"] as const).map((status) => (
                            <button
                              className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${actionClasses[status]} ${
                                selected.status === status
                                  ? "ring-2 ring-current/25 ring-offset-2"
                                  : ""
                              }`}
                              disabled={statusMutation.isPending}
                              key={status}
                              onClick={() => {
                                setSharePhone(false);
                                setConfirmingStatus(status);
                              }}
                              type="button"
                            >
                              {t(`applications.action.${status}`)}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </section>

                    <ConversationPanel
                      application={selected}
                      composerFocusKey={composerFocusKey}
                      currentUser={user.name}
                      onRequestVideoCall={(proposal) =>
                        videoCallMutation.mutate({ id: selected.id, proposal })
                      }
                      onRespondToVideoCall={({ action, messageId, proposal }) => {
                        if (action === "accept") {
                          videoCallAcceptMutation.mutate({ id: selected.id, messageId });
                          return;
                        }
                        if (action === "decline") {
                          videoCallDeclineMutation.mutate({ id: selected.id, messageId });
                          return;
                        }
                        if (proposal) {
                          videoCallMutation.mutate({
                            id: selected.id,
                            proposal,
                            counter: true,
                          });
                        }
                      }}
                      onSend={async (text) => {
                        await messageMutation.mutateAsync({ id: selected.id, text });
                      }}
                      onSharePhone={(phoneNumber) =>
                        sharePhoneMutation.mutate({ id: selected.id, phoneNumber })
                      }
                      pending={
                        messageMutation.isPending ||
                        videoCallMutation.isPending ||
                        videoCallAcceptMutation.isPending ||
                        videoCallDeclineMutation.isPending ||
                        sharePhoneMutation.isPending
                      }
                      translationLanguage={user.preferredLanguage}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center">
                    <MessageCircle className="mx-auto text-teal" size={38} />
                    <p className="mt-4 font-bold text-navy">{t("applications.filterEmpty")}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
          {!sitTotal ? (
            <div className="mt-8 rounded-2xl border border-dashed border-line bg-white py-16 text-center">
              <MessageCircle className="mx-auto text-teal" size={38} />
              <p className="mt-4 font-bold text-navy">{t("applications.empty")}</p>
            </div>
          ) : null}
        </>
      ) : null}
      {confirmingStatus && selected && (
        <div
          className="fixed inset-0 z-70 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !statusMutation.isPending) {
              setConfirmingStatus(null);
            }
          }}
        >
          <section
            aria-labelledby="application-status-confirm-title"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-float md:p-8"
            role="dialog"
          >
            <span
              className={`grid size-12 place-items-center rounded-full ${(() => {
                if (confirmingStatus === "accepted") return "bg-emerald-100 text-emerald-700";
                if (confirmingStatus === "unaccept") return "bg-amber-100 text-amber-800";
                return "bg-red-100 text-red-700";
              })()}`}
            >
              {confirmingStatus === "accepted" ? <Check size={24} /> : null}
              {confirmingStatus === "unaccept" ? <TriangleAlert size={24} /> : null}
              {confirmingStatus !== "accepted" && confirmingStatus !== "unaccept" ? (
                <X size={24} />
              ) : null}
            </span>
            <h2
              className="mt-5 font-display text-2xl font-bold text-navy"
              id="application-status-confirm-title"
            >
              {t(`applications.confirm.${confirmingStatus}Title`, {
                name: selected.applicant.name,
              })}
            </h2>
            <p className="mt-3 leading-7 text-slate">
              {t(`applications.confirm.${confirmingStatus}Text`, {
                name: selected.applicant.name,
              })}
            </p>
            {confirmingStatus === "accepted" && (
              <>
                <div
                  className="mt-4 flex gap-3 rounded-xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm leading-6 text-navy"
                  role="note"
                >
                  <Video className="mt-0.5 shrink-0 text-coral" size={18} />
                  <p>{t("applications.confirm.acceptedVideoCallNote")}</p>
                </div>
                <div
                  className="mt-3 flex gap-3 rounded-xl border border-teal/25 bg-teal/10 px-4 py-3 text-sm leading-6 text-navy"
                  role="note"
                >
                  <Users className="mt-0.5 shrink-0 text-teal" size={18} />
                  <p>{t("applications.confirm.acceptedCloseNote")}</p>
                </div>
                <div className="mt-5 rounded-xl border border-line bg-cream p-4">
                  <label className="flex items-start gap-3">
                    <input
                      checked={sharePhone}
                      className="mt-1 size-4 accent-teal"
                      disabled={!ownerPhone}
                      onChange={(event) => setSharePhone(event.target.checked)}
                      type="checkbox"
                    />
                    <span className="text-sm font-semibold leading-6 text-navy">
                      {t("applications.sharePhone", { name: selected.applicant.name })}
                    </span>
                  </label>
                  {!ownerPhone && (
                    <p className="mt-2 pl-7 text-sm leading-6 text-slate">
                      {t("applications.sharePhoneUnavailable")}
                    </p>
                  )}
                </div>
              </>
            )}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                className="rounded-xl border border-line px-5 py-3 font-bold text-navy"
                disabled={statusMutation.isPending}
                onClick={() => setConfirmingStatus(null)}
                type="button"
              >
                {t("common.cancel")}
              </button>
              <button
                className={`rounded-xl px-5 py-3 font-bold text-white disabled:opacity-60 ${(() => {
                  if (confirmingStatus === "accepted") return "bg-emerald-600 hover:bg-emerald-700";
                  if (confirmingStatus === "unaccept") return "bg-amber-700 hover:bg-amber-800";
                  return "bg-red-600 hover:bg-red-700";
                })()}`}
                disabled={statusMutation.isPending}
                onClick={() => {
                  statusMutation.mutate({
                    id: selected.id,
                    ownerPhone:
                      confirmingStatus === "accepted" && sharePhone ? ownerPhone : undefined,
                    status: confirmingStatus === "unaccept" ? "new" : confirmingStatus,
                  });
                  setConfirmingStatus(null);
                }}
                type="button"
              >
                {t(`applications.confirm.${confirmingStatus}Action`)}
              </button>
            </div>
          </section>
        </div>
      )}
      {flaggingIssue && sit && (
        <FlagSitIssueModal
          boatName={vessel?.name ?? sit.boatId}
          close={() => setFlaggingIssue(false)}
          sitLabel={formatSitDates(i18n.language, sit.dateStart, sit.duration)}
        />
      )}
      {closeApplicationsConfirm && sit && (
        <CloseApplicationsRequestsDialog
          pending={toggleApplicationsMutation.isPending}
          onCancel={() => setCloseApplicationsConfirm(false)}
          onConfirm={() => {
            toggleApplicationsMutation.mutate(undefined, {
              onSuccess: () => setCloseApplicationsConfirm(false),
            });
          }}
        />
      )}
      {startEarlyConfirm && sit && (
        <ConfirmDialog
          confirmLabel={t("owner.startSitEarlyAction")}
          onCancel={() => setStartEarlyConfirm(false)}
          onConfirm={() => {
            startSitEarlyMutation.mutate();
          }}
          pending={startSitEarlyMutation.isPending}
          text={t("owner.startSitEarlyConfirm")}
          title={t("owner.startSitEarlyTitle")}
          titleId="start-sit-early-review-confirm-title"
          tone="warning"
        />
      )}
    </main>
  );
}

function MessagesPage() {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const archivedConversations = useAppStore((state) => state.archivedConversations);
  const archiveConversation = useAppStore((state) => state.archiveConversation);
  const unarchiveConversation = useAppStore((state) => state.unarchiveConversation);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const requestedApplicationId = searchParams.get("application");
  const { data: applications = [], isLoading } = useQuery({
    ...queries.applications.user(user?.name),
    enabled: Boolean(user),
  });
  const { data: sits = [] } = useQuery({
    ...queries.sits.all,
    enabled: Boolean(user),
  });
  const [messagesTab, setMessagesTab] = useState<"inbox" | "archived">("inbox");
  const [selectedId, setSelectedId] = useState("");
  const [composerFocusKey, setComposerFocusKey] = useState(0);
  const [conversationPage, setConversationPage] = useState(0);

  const inboxApplications = useMemo(
    () => applications.filter((application) => !archivedConversations.includes(application.id)),
    [applications, archivedConversations],
  );
  const archivedApplications = useMemo(
    () => applications.filter((application) => archivedConversations.includes(application.id)),
    [applications, archivedConversations],
  );
  const tabApplications = messagesTab === "inbox" ? inboxApplications : archivedApplications;

  useEffect(() => {
    if (
      requestedApplicationId &&
      archivedConversations.includes(requestedApplicationId) &&
      applications.some((application) => application.id === requestedApplicationId)
    ) {
      setMessagesTab("archived");
    }
  }, [requestedApplicationId, archivedConversations, applications]);

  useEffect(() => {
    if (!tabApplications.length) {
      setSelectedId("");
      return;
    }
    if (
      requestedApplicationId &&
      tabApplications.some((application) => application.id === requestedApplicationId)
    ) {
      setSelectedId(requestedApplicationId);
      return;
    }
    if (!tabApplications.some((application) => application.id === selectedId)) {
      setSelectedId(tabApplications[0].id);
    }
  }, [tabApplications, requestedApplicationId, selectedId]);

  const notificationsQuery = queries.notifications.user(user?.name);
  const { data: notifications = [] } = useQuery({
    ...notificationsQuery,
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!user || !selectedId) return;
    const unread = unreadNewMessageNotificationsForApplication(notifications, selectedId);
    if (!unread.length) return;

    const queryKey = queries.notifications.user(user.name).queryKey;
    queryClient.setQueryData<MockNotification[]>(queryKey, (current = []) =>
      current.map((item) =>
        unread.some((notification) => notification.id === item.id) ? { ...item, read: true } : item,
      ),
    );

    void Promise.all(
      unread.map((notification) => markNotificationRead(notification.id, user.name)),
    ).finally(() => {
      void queryClient.invalidateQueries({ queryKey });
    });
  }, [notifications, queryClient, selectedId, user]);

  const totalConversationPages = Math.max(
    1,
    Math.ceil(tabApplications.length / CONVERSATIONS_PER_PAGE),
  );
  const conversationPageStart = conversationPage * CONVERSATIONS_PER_PAGE;
  const visibleApplications = tabApplications.slice(
    conversationPageStart,
    conversationPageStart + CONVERSATIONS_PER_PAGE,
  );
  const conversationRangeStart = tabApplications.length === 0 ? 0 : conversationPageStart + 1;
  const conversationRangeEnd = Math.min(
    conversationPageStart + CONVERSATIONS_PER_PAGE,
    tabApplications.length,
  );

  useEffect(() => {
    const index = tabApplications.findIndex((application) => application.id === selectedId);
    if (index >= 0) {
      setConversationPage(Math.floor(index / CONVERSATIONS_PER_PAGE));
    }
  }, [selectedId, tabApplications]);

  useEffect(() => {
    setConversationPage((current) => Math.min(current, totalConversationPages - 1));
  }, [totalConversationPages]);

  useEffect(() => {
    setConversationPage(0);
  }, [messagesTab]);

  const selected = tabApplications.find((application) => application.id === selectedId);
  const selectedSit = sits.find((sit) => sit.id === selected?.sitId);
  const messageMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      sendApplicationMessage(id, user!.name, text),
    onSuccess: async (updated) => {
      queryClient.setQueriesData({ queryKey: queries.applications.getQueryKey() }, (old) =>
        patchApplicationInQueriesCache(old, updated),
      );
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
    },
  });
  const videoCallMutation = useMutation({
    mutationFn: ({
      id,
      proposal,
      counter,
    }: {
      id: string;
      proposal: { startsAt: string; durationMinutes: number };
      counter?: boolean;
    }) => requestApplicationVideoCall(id, user!.name, proposal, { counter }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
    },
  });
  const videoCallAcceptMutation = useMutation({
    mutationFn: ({ id, messageId }: { id: string; messageId: string }) =>
      acceptApplicationVideoCall(id, user!.name, messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
    },
  });
  const videoCallDeclineMutation = useMutation({
    mutationFn: ({ id, messageId }: { id: string; messageId: string }) =>
      declineApplicationVideoCall(id, user!.name, messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
    },
  });
  const sharePhoneMutation = useMutation({
    mutationFn: ({ id, phoneNumber }: { id: string; phoneNumber: string }) =>
      shareApplicationPhoneNumber(id, user!.name, phoneNumber),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
    },
  });

  function handleArchiveSelected() {
    if (!selected) return;
    const currentId = selected.id;
    const remaining = inboxApplications.filter((application) => application.id !== currentId);
    archiveConversation(currentId);
    setSelectedId(remaining[0]?.id ?? "");
    setMessagesTab("inbox");
  }

  function handleUnarchiveSelected() {
    if (!selected) return;
    const currentId = selected.id;
    unarchiveConversation(currentId);
    setMessagesTab("inbox");
    setSelectedId(currentId);
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
      <h1 className="section-title">{t("messages.title")}</h1>
      {!user ? (
        <div className="mt-8 rounded-2xl border border-line bg-white py-16 text-center">
          <MessageCircle className="mx-auto text-teal" size={38} />
          <p className="mt-4 font-bold text-navy">{t("messages.signIn")}</p>
        </div>
      ) : (
        <>
          <div className="mt-8">
            <SegmentedTabs fullWidthOnMobile testId="messages-tabs">
              {(["inbox", "archived"] as const).map((tab) => (
                <SegmentedTab
                  active={messagesTab === tab}
                  aria-pressed={messagesTab === tab}
                  className="flex-1 px-6 sm:flex-none"
                  key={tab}
                  onClick={() => setMessagesTab(tab)}
                >
                  {t(`messages.tab.${tab}`)}{" "}
                  <span className="ml-1 text-xs text-slate">
                    {tab === "inbox" ? inboxApplications.length : archivedApplications.length}
                  </span>
                </SegmentedTab>
              ))}
            </SegmentedTabs>
          </div>
          {isLoading ? <MessagesPageSkeleton /> : null}
          {!isLoading && tabApplications.length && selected ? (
            <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
              <aside className="h-fit min-w-0 rounded-2xl border border-line bg-white p-2 shadow-card">
                {visibleApplications.map((application) => {
                  const otherName =
                    application.ownerName === user.name
                      ? application.applicant.name
                      : application.ownerName;
                  const participationRole = sitParticipationRole(application, user.name);
                  return (
                    <button
                      className={`w-full rounded-xl p-3 text-left transition ${
                        application.id === selected.id ? "bg-seafoam" : "hover:bg-cream"
                      }`}
                      key={application.id}
                      onClick={() => {
                        setSelectedId(application.id);
                        setComposerFocusKey((key) => key + 1);
                      }}
                      type="button"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-bold text-navy">{otherName}</span>
                        <ApplicationStatusBadge
                          ownerView={participationRole === "owner"}
                          status={application.status}
                        />
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-xs text-slate">
                        <SitParticipationBadge role={participationRole} />
                        <span className="truncate">{application.boatName}</span>
                      </span>
                      <span className="mt-2 block truncate text-sm text-slate">
                        {(() => {
                          const last = application.messages.at(-1);
                          if (!last) return "";
                          return last.kind === "system"
                            ? formatApplicationSystemMessage(t, last, application, user.name)
                            : last.text;
                        })()}
                      </span>
                    </button>
                  );
                })}
                {tabApplications.length > CONVERSATIONS_PER_PAGE && (
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-line px-1 pt-2">
                    <button
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-navy hover:bg-cream disabled:opacity-40"
                      disabled={conversationPage === 0}
                      onClick={() => setConversationPage((current) => Math.max(0, current - 1))}
                      type="button"
                    >
                      <ChevronLeft aria-hidden="true" size={14} />
                      {t("messages.newerConversations")}
                    </button>
                    <p className="text-center text-[11px] font-semibold text-slate">
                      {t("messages.conversationsRange", {
                        start: conversationRangeStart,
                        end: conversationRangeEnd,
                        total: tabApplications.length,
                      })}
                    </p>
                    <button
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-navy hover:bg-cream disabled:opacity-40"
                      disabled={conversationPage >= totalConversationPages - 1}
                      onClick={() =>
                        setConversationPage((current) =>
                          Math.min(totalConversationPages - 1, current + 1),
                        )
                      }
                      type="button"
                    >
                      {t("messages.olderConversations")}
                      <ChevronRight aria-hidden="true" size={14} />
                    </button>
                  </div>
                )}
              </aside>
              <div className="min-w-0">
                {(() => {
                  const otherName =
                    selected.ownerName === user.name ? selected.applicant.name : selected.ownerName;
                  const otherImage =
                    selected.ownerName === user.name
                      ? selected.applicant.image
                      : selected.ownerImage ||
                        `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(otherName)}`;
                  const otherProfilePath =
                    selected.ownerName === user.name
                      ? `/members/${encodeURIComponent(selected.applicant.name)}`
                      : `/members/${selected.sitId}`;
                  const isArchived = archivedConversations.includes(selected.id);
                  return (
                    <>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <Link
                            aria-label={t("messages.viewProfile")}
                            className="shrink-0 rounded-full ring-2 ring-transparent transition hover:ring-aqua"
                            to={otherProfilePath}
                          >
                            <img
                              alt=""
                              className="size-12 rounded-full object-cover"
                              src={otherImage}
                            />
                          </Link>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                className="font-display text-xl font-bold text-navy hover:text-teal"
                                to={otherProfilePath}
                              >
                                {otherName}
                              </Link>
                              <SitParticipationBadge
                                role={sitParticipationRole(selected, user.name)}
                              />
                            </div>
                            <p className="text-sm text-slate">
                              {t("messages.aboutBoat", { boat: selected.boatName })}
                            </p>
                            <Link
                              className="mt-1 inline-flex text-sm font-bold text-teal hover:text-navy"
                              to={otherProfilePath}
                            >
                              {t("messages.viewProfile")}
                            </Link>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <ApplicationStatusBadge
                            ownerView={sitParticipationRole(selected, user.name) === "owner"}
                            status={selected.status}
                          />
                          {selected.status === "accepted" &&
                            selectedSit &&
                            resolveSitPhase(selectedSit) === "stayUnderway" && <SitEmergencyHelp />}
                          <IconTooltip
                            label={isArchived ? t("messages.unarchive") : t("messages.archive")}
                          >
                            <button
                              aria-label={
                                isArchived ? t("messages.unarchive") : t("messages.archive")
                              }
                              className="inline-flex size-10 items-center justify-center rounded-xl border border-line bg-white text-navy transition hover:border-teal hover:text-teal"
                              onClick={isArchived ? handleUnarchiveSelected : handleArchiveSelected}
                              type="button"
                            >
                              {isArchived ? (
                                <ArchiveRestore aria-hidden="true" size={18} />
                              ) : (
                                <Archive aria-hidden="true" size={18} />
                              )}
                            </button>
                          </IconTooltip>
                          <UserSafetyActions image={otherImage} name={otherName} />
                        </div>
                      </div>
                      <BlockedUserBanner name={otherName} />
                      {selected.status === "accepted" &&
                        selected.ownerName === user.name &&
                        selectedSit &&
                        canLeaveReview(selectedSit) && (
                          <div className="mb-4">
                            <LeaveReviewForm application={selected} ownerName={user.name} />
                          </div>
                        )}
                    </>
                  );
                })()}
                <ConversationPanel
                  application={selected}
                  composerFocusKey={composerFocusKey}
                  currentUser={user.name}
                  onRequestVideoCall={(proposal) =>
                    videoCallMutation.mutate({ id: selected.id, proposal })
                  }
                  onRespondToVideoCall={({ action, messageId, proposal }) => {
                    if (action === "accept") {
                      videoCallAcceptMutation.mutate({ id: selected.id, messageId });
                      return;
                    }
                    if (action === "decline") {
                      videoCallDeclineMutation.mutate({ id: selected.id, messageId });
                      return;
                    }
                    if (proposal) {
                      videoCallMutation.mutate({
                        id: selected.id,
                        proposal,
                        counter: true,
                      });
                    }
                  }}
                  onSend={async (text) => {
                    await messageMutation.mutateAsync({ id: selected.id, text });
                  }}
                  onSharePhone={(phoneNumber) =>
                    sharePhoneMutation.mutate({ id: selected.id, phoneNumber })
                  }
                  pending={
                    messageMutation.isPending ||
                    videoCallMutation.isPending ||
                    videoCallAcceptMutation.isPending ||
                    videoCallDeclineMutation.isPending ||
                    sharePhoneMutation.isPending
                  }
                  translationLanguage={user.preferredLanguage}
                />
              </div>
            </div>
          ) : null}
          {!isLoading && !(tabApplications.length && selected) ? (
            <div className="mt-8 rounded-2xl border border-line bg-white py-16 text-center">
              {messagesTab === "archived" ? (
                <Archive className="mx-auto text-teal" size={38} />
              ) : (
                <MessageCircle className="mx-auto text-teal" size={38} />
              )}
              <p className="mt-4 font-bold text-navy">
                {(() => {
                  if (messagesTab === "archived") return t("messages.emptyArchived");
                  if (applications.length > 0) return t("messages.emptyInbox");
                  return t("messages.empty");
                })()}
              </p>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

function Footer() {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const showAdmin = isAdminUser(user);
  return (
    <footer className="border-t border-line bg-white px-5 py-10 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <Logo />
        <p className="text-center text-sm text-slate">{t("app.tagline")}</p>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="flex gap-5 text-sm font-semibold text-slate">
            <Link className="hover:text-navy" to="/safety">
              {t("footer.safety")}
            </Link>
            <Link className="hover:text-navy" to="/support">
              {t("footer.support")}
            </Link>
            <Link className="hover:text-navy" to="/terms">
              {t("footer.terms")}
            </Link>
            {showAdmin ? (
              <Link className="hover:text-navy" to="/admin">
                {t("footer.admin")}
              </Link>
            ) : null}
          </div>
          <LanguageSelect />
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const { i18n, t } = useTranslation();

  useEffect(() => {
    document.title = t("meta.title");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", t("meta.description"));
  }, [i18n.resolvedLanguage, t]);

  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header />
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="/boats" element={<BoatsPage />} />
        <Route path="/boats/:id" element={<DetailPage />} />
        <Route path="/my-boats" element={<OwnerBoatsPage />} />
        <Route path="/my-sits" element={<OwnerBoatsPage />} />
        <Route path="/owner/boats" element={<Navigate replace to="/my-boats" />} />
        <Route path="/owner/boats/new" element={<VesselEditorPage mode="new" />} />
        <Route path="/owner/boats/:boatId/edit" element={<VesselEditorPage mode="edit" />} />
        <Route path="/owner/sits/new" element={<SitEditorPage mode="new" />} />
        <Route path="/owner/sits/:sitId/edit" element={<SitEditorPage mode="edit" />} />
        <Route path="/owner/sits/:sitId/applications" element={<ApplicationReviewPage />} />
        <Route path="/members/:id" element={<MemberPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/availability" element={<SitterAvailabilityPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AuthModal />
      <CommandPalette />
      <Footer />
    </div>
  );
}

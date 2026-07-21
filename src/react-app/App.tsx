import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Compass,
  Droplets,
  Flame,
  Fuel,
  Gauge,
  Heart,
  ImagePlus,
  LifeBuoy,
  List,
  LogOut,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  Pencil,
  Plus,
  Quote,
  Search,
  Settings,
  ShieldCheck,
  ShipWheel,
  Sparkles,
  Star,
  Trash2,
  Waves,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { Link, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { CommandPalette } from "@/components/command/CommandPalette";
import { ConversationPanel } from "@/components/applications/ConversationPanel";
import { BoatMap } from "@/components/maps/BoatMap";
import { FeatureIcon } from "@/components/ui/FeatureIcon";
import { IconTooltip } from "@/components/ui/IconTooltip";
import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";
import { AuthModal } from "@/components/forms/AuthModal";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { ImageUploadControl } from "@/components/forms/ImageUploadControl";
import { getIntlLocale, normalizeLanguageCode, SUPPORTED_LANGUAGES } from "@/i18n";
import { isHappeningSoon } from "@/dateUtils";
import { deleteMockAccount } from "@/mockAuth";
import { LanguageSelect } from "@/components/layout/LanguageSelect";
import { NotificationsMenu } from "@/components/layout/NotificationsMenu";
import {
  deleteSit,
  deleteVessel,
  coordinatesForLocation,
  getBoat,
  getBoats,
  getApplicationsForSit,
  getApplicationsForUser,
  getSits,
  getVessels,
  saveSit,
  saveVessel,
  sendApplication,
  sendApplicationMessage,
  submitSupportRequest,
  updateApplicationStatus,
  updateOwnerOnVessels,
  type Boat,
  type EngineType,
  type VoltageType,
  type StoveFuelType,
  type ApplicationStatus,
  type Sit,
  type Vessel,
} from "@/mockApi";
import { useAppStore } from "@/store";
import { getVerificationStatus, startVerification } from "@/verificationService";

const fallbackImage =
  "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=85";

const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_STORED_IMAGE_BYTES = 1_500_000;
const DELETE_ACCOUNT_CONFIRMATION_TERM = "DELETE";

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

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("upload.readFailed"));
    reader.readAsDataURL(blob);
  });
}

const VESSEL_TYPES = [
  "Sailing yacht",
  "Catamaran",
  "Motor yacht",
  "Narrowboat",
  "Trawler",
  "Houseboat",
] as const;

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
  "On-site laundry": "feature.laundry",
  "Swimming pool": "feature.pool",
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

function displayLabel(t: ReturnType<typeof useTranslation>["t"], value: string) {
  const key = DISPLAY_LABEL_KEYS[value];
  return key ? t(key) : value;
}

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
  return (
    <Link className="flex items-center gap-2.5" to="/">
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
            <NavLink className={navClass} to="/saved">
              {t("nav.saved")}
            </NavLink>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {user && <NotificationsMenu />}
            {user ? (
              <>
                <Link
                  className="rounded-full px-3 py-2 text-sm font-semibold text-navy hover:bg-white"
                  to="/owner/boats"
                >
                  {t("nav.manage")}
                </Link>
                <Link
                  className="flex items-center gap-2 rounded-full bg-white py-1.5 pr-3 pl-1.5 text-sm font-semibold text-navy shadow-sm"
                  to="/members/me"
                >
                  <img className="size-8 rounded-full object-cover" src={user.image} alt="" />
                  {user.name}
                </Link>
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
          <div className="ml-auto md:hidden">{user && <NotificationsMenu />}</div>
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
              <Link onClick={() => setOpen(false)} to="/saved">
                {t("nav.saved")}
              </Link>
              {user && (
                <>
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
    if (type) params.set("type", type);
    if (dates.startDate) params.set("from", dates.startDate);
    if (dates.endDate) params.set("to", dates.endDate);
    navigate(`/boats?${params.toString()}`);
  }

  return (
    <form
      className={`grid rounded-2xl border border-line bg-white shadow-float md:grid-cols-[1.2fr_0.9fr_0.9fr_auto] ${compact ? "" : "mx-auto max-w-5xl"}`}
      onSubmit={submit}
    >
      <DestinationAutocomplete multiple onChange={setWhere} value={where} variant="home" />
      <DateRangePicker endDate={dates.endDate} onChange={setDates} startDate={dates.startDate} />
      <label className="flex items-center gap-3 border-b border-line px-5 py-4 md:border-r md:border-b-0">
        <ShipWheel className="shrink-0 text-coral" size={20} />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-[0.13em] text-slate">
            {t("search.vessel")}
          </span>
          <select
            className="w-full appearance-none bg-transparent text-sm font-medium outline-none"
            onChange={(event) => setType(event.target.value)}
            value={type}
          >
            <option value="">{t("search.anyVessel")}</option>
            {VESSEL_TYPES.map((vesselType) => (
              <option key={vesselType} value={vesselType}>
                {displayLabel(t, vesselType)}
              </option>
            ))}
          </select>
        </span>
        <ChevronDown className="text-slate" size={16} />
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

function BoatCard({ boat }: { boat: Boat }) {
  const { i18n, t } = useTranslation();
  const saved = useAppStore((state) => state.saved);
  const toggleSaved = useAppStore((state) => state.toggleSaved);
  const isSaved = saved.includes(boat.id);

  return (
    <article className="group">
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-seafoam">
        <Link to={`/boats/${boat.id}`}>
          <img
            alt={t("boat.imageAlt", { name: boat.name, type: displayLabel(t, boat.type) })}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            onError={(event) => {
              event.currentTarget.src = fallbackImage;
            }}
            src={boat.image}
          />
        </Link>
        <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
          {boat.featured && (
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-navy shadow-sm">
              {t("boat.topMatch")}
            </span>
          )}
          {isHappeningSoon(boat.dateStart) && (
            <span className="rounded-full bg-coral px-3 py-1.5 text-xs font-bold text-white shadow-sm">
              {t("boat.happeningSoon")}
            </span>
          )}
        </div>
        <button
          aria-label={isSaved ? t("boat.removeSaved") : t("boat.save")}
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/90 text-navy shadow-sm transition hover:scale-105"
          onClick={() => toggleSaved(boat.id)}
          type="button"
        >
          <Heart className={isSaved ? "fill-coral text-coral" : ""} size={19} />
        </button>
      </div>
      <Link className="block pt-4" to={`/boats/${boat.id}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal">
              {displayLabel(t, boat.type)} · {boat.length}
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
          <MapPin size={15} /> {formatSitLocation(boat.location, boat.country)}
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
    </article>
  );
}

function FeaturedBoats() {
  const { data: boats = [], isLoading } = useQuery({ queryKey: ["boats"], queryFn: getBoats });
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div className="h-96 animate-pulse rounded-2xl bg-seafoam" key={item} />
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

function BoatsPage() {
  const { t } = useTranslation();
  const { data: boats = [], isLoading } = useQuery({ queryKey: ["boats"], queryFn: getBoats });
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [type, setType] = useState(params.get("type") ?? "All vessels");
  const [dates, setDates] = useState({
    startDate: params.get("from") ?? "",
    endDate: params.get("to") ?? "",
  });
  const [petOnly, setPetOnly] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [sort, setSort] = useState<"soonest" | "latest" | "shortest" | "longest" | "popular">(
    "soonest",
  );

  function updateLocationQuery(value: string) {
    setQuery(value);
    const nextParams = new URLSearchParams(window.location.search);
    if (value) nextParams.set("q", value);
    else nextParams.delete("q");
    const search = nextParams.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`,
    );
  }

  const filtered = useMemo(
    () =>
      boats.filter((boat) => {
        const searchValues = query
          .split("|")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);
        const searchable =
          `${boat.location} ${boat.country} ${boat.region} ${boat.name}`.toLowerCase();
        const matchesQuery =
          searchValues.length === 0 || searchValues.some((value) => searchable.includes(value));
        const matchesType = type === "All vessels" || boat.type === type;
        const boatStart = new Date(`${boat.dateStart}T00:00:00`);
        const boatEnd = new Date(boatStart);
        boatEnd.setDate(boatEnd.getDate() + Number.parseInt(boat.duration, 10));
        const requestedStart = dates.startDate
          ? new Date(`${dates.startDate}T00:00:00`)
          : undefined;
        const requestedEnd = dates.endDate ? new Date(`${dates.endDate}T00:00:00`) : undefined;
        const matchesDates =
          (!requestedStart || boatEnd >= requestedStart) &&
          (!requestedEnd || boatStart <= requestedEnd);
        return matchesQuery && matchesType && matchesDates && (!petOnly || Boolean(boat.pet));
      }),
    [boats, dates.endDate, dates.startDate, petOnly, query, type],
  );
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (sort === "latest") return b.dateStart.localeCompare(a.dateStart);
        if (sort === "shortest") {
          return Number.parseInt(a.duration, 10) - Number.parseInt(b.duration, 10);
        }
        if (sort === "longest") {
          return Number.parseInt(b.duration, 10) - Number.parseInt(a.duration, 10);
        }
        if (sort === "popular") {
          return (
            b.applicants - a.applicants ||
            b.rating - a.rating ||
            b.reviews - a.reviews ||
            a.dateStart.localeCompare(b.dateStart)
          );
        }
        return a.dateStart.localeCompare(b.dateStart);
      }),
    [filtered, sort],
  );

  return (
    <main className="px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="eyebrow">{t("boats.kicker")}</p>
          <h1 className="section-title">{t("boats.title")}</h1>
          <p className="mt-3 text-slate">{t("boats.subtitle")}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm md:flex-row">
          <DestinationAutocomplete multiple onChange={updateLocationQuery} value={query} />
          <DateRangePicker
            endDate={dates.endDate}
            onChange={setDates}
            startDate={dates.startDate}
            variant="browse"
          />
          <select
            className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold outline-none"
            onChange={(event) => setType(event.target.value)}
            value={type}
          >
            <option value="All vessels">{t("search.anyVessel")}</option>
            {VESSEL_TYPES.map((option) => (
              <option key={option} value={option}>
                {displayLabel(t, option)}
              </option>
            ))}
          </select>
          <label
            className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${petOnly ? "border-teal bg-seafoam text-teal" : "border-line text-slate"}`}
          >
            <span className="flex cursor-pointer items-center gap-2">
              <input
                checked={petOnly}
                className="size-4 accent-teal"
                onChange={(event) => setPetOnly(event.target.checked)}
                type="checkbox"
              />
              {t("boats.pets")}
            </span>
          </label>
        </div>
        <div className="mt-9 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate">{t("boats.results", { count: filtered.length })}</p>
          <div className="flex items-center gap-2">
            <div
              aria-label={t("map.viewLabel")}
              className="flex rounded-xl border border-line bg-white p-1"
              role="group"
            >
              <button
                aria-pressed={view === "list"}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${
                  view === "list" ? "bg-seafoam text-teal" : "text-slate"
                }`}
                onClick={() => setView("list")}
                type="button"
              >
                <List size={16} /> {t("map.listView")}
              </button>
              <button
                aria-pressed={view === "map"}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${
                  view === "map" ? "bg-seafoam text-teal" : "text-slate"
                }`}
                onClick={() => setView("map")}
                type="button"
              >
                <Map size={16} /> {t("map.mapView")}
              </button>
            </div>
            {view === "list" && (
              <label className="flex items-center gap-2 text-sm text-slate">
                <span className="sr-only">{t("boats.sortLabel")}</span>
                <select
                  aria-label={t("boats.sortLabel")}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-navy outline-none focus:border-teal"
                  onChange={(event) => setSort(event.target.value as typeof sort)}
                  value={sort}
                >
                  <option value="soonest">{t("boats.sortSoonest")}</option>
                  <option value="latest">{t("boats.sortLatest")}</option>
                  <option value="shortest">{t("boats.sortShortest")}</option>
                  <option value="longest">{t("boats.sortLongest")}</option>
                  <option value="popular">{t("boats.sortPopular")}</option>
                </select>
              </label>
            )}
          </div>
        </div>
        {isLoading ? (
          <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div className="h-96 animate-pulse rounded-2xl bg-seafoam" key={item} />
            ))}
          </div>
        ) : filtered.length && view === "map" ? (
          <div className="mt-6">
            <BoatMap boats={sorted} />
          </div>
        ) : filtered.length ? (
          <div className="mt-6 grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {sorted.map((boat) => (
              <BoatCard boat={boat} key={boat.id} />
            ))}
          </div>
        ) : (
          <div className="mt-16 rounded-2xl border border-line bg-white py-16 text-center">
            <LifeBuoy className="mx-auto text-teal" size={36} />
            <h2 className="mt-4 font-display text-xl font-bold text-navy">{t("boats.empty")}</h2>
            <p className="mt-2 text-sm text-slate">{t("boats.emptyHint")}</p>
          </div>
        )}
      </div>
    </main>
  );
}

const systemIcons = [Gauge, BatteryCharging, Droplets, Zap];

type LengthUnit = "m" | "ft";

function parseBoatLength(length: string, fallbackUnit: LengthUnit) {
  const match = length.trim().match(/^(\d+(?:[.,]\d+)?)\s*(m|ft)?$/i);
  return {
    value: match?.[1]?.replace(",", ".") ?? "",
    unit: (match?.[2]?.toLowerCase() as LengthUnit | undefined) ?? fallbackUnit,
  };
}

function convertBoatLength(value: string, from: LengthUnit, to: LengthUnit) {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount) || from === to) return value;
  const converted = from === "ft" ? amount * 0.3048 : amount / 0.3048;
  return String(Math.round(converted * 10) / 10);
}

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
      "Bathroom",
      "Full kitchen",
      "Outdoor BBQ",
      "Air conditioning",
      "Heating",
      "Wi-Fi",
      "Dedicated workspace",
      "TV",
      "Refrigerator",
      "Freezer",
      "Oven",
      "Microwave",
      "Coffee maker",
      "Dishwasher",
      "Hot water",
      "Deck shower",
      "Washing machine",
      "Dryer",
      "Fans",
      "Mosquito screens",
      "Sound system",
      "Bedding & linens",
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
      "LPG / gas refill",
      "Waste & recycling",
      "Ice",
      "Marina staff",
      "Mail & package reception",
    ],
  },
  {
    title: "Marina facilities",
    options: [
      "On-site bathrooms & showers",
      "Showers",
      "Accessible bathrooms",
      "On-site laundry",
      "Parking",
      "EV charging",
      "Grocery & provisions",
      "Chandlery",
      "Cafe / bar",
      "On-site restaurant",
      "Clubhouse / lounge",
      "Gym",
      "Swimming pool",
      "Sauna",
      "Picnic / BBQ area",
      "Beach access",
      "Children's play area",
      "Dog exercise area",
    ],
  },
  {
    title: "Security & access",
    options: ["24/7 security", "CCTV", "Gated access", "Locked pontoons", "Night lighting"],
  },
  {
    title: "Boatyard & transport",
    options: [
      "Boatyard / shipyard",
      "Marine engineer",
      "Travel lift",
      "Crane",
      "Slipway / boat ramp",
      "Dry storage",
      "Public transport nearby",
      "Airport transfer / taxi access",
    ],
  },
  {
    title: "Water & recreation",
    options: ["Tender", "Paddleboard", "Kayak", "Bicycles", "Swim platform"],
  },
];

const ALL_BOAT_FEATURES = BOAT_FEATURE_GROUPS.flatMap((group) => group.options);
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

function ApplyModal({ boat, close }: { boat: Boat; close: () => void }) {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user)!;
  const queryClient = useQueryClient();
  const [message, setMessage] = useState(
    t("apply.defaultMessage", { owner: boat.owner, boat: boat.name }),
  );
  const mutation = useMutation({
    mutationFn: () =>
      sendApplication(boat.id, message, {
        name: user.name,
        image: user.image,
        location: user.location,
        bio: user.bio,
        languages: user.languages,
        preferredCountries: user.preferredCountries,
        skills: user.skills,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-float md:p-8">
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
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">{t("apply.kicker")}</p>
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
            <p className="mt-4 text-sm leading-6 text-slate">
              {t("apply.hint", { type: displayLabel(t, boat.type).toLocaleLowerCase() })}
            </p>
            <textarea
              className="mt-5 min-h-40 w-full resize-none rounded-xl border border-line bg-cream p-4 text-sm leading-6 outline-none focus:border-teal"
              onChange={(event) => setMessage(event.target.value)}
              value={message}
            />
            <button
              className="mt-4 w-full rounded-xl bg-coral py-3.5 font-bold text-white transition hover:bg-coral-dark disabled:opacity-60"
              disabled={mutation.isPending || !message.trim()}
              onClick={() => mutation.mutate()}
              type="button"
            >
              {mutation.isPending ? t("apply.sending") : t("apply.send")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DetailPage() {
  const { i18n, t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const saved = useAppStore((state) => state.saved);
  const toggleSaved = useAppStore((state) => state.toggleSaved);
  const { data: boat, isLoading } = useQuery({
    queryKey: ["boat", id],
    queryFn: () => getBoat(id),
  });

  if (isLoading)
    return <div className="mx-auto my-20 h-96 max-w-6xl animate-pulse rounded-3xl bg-seafoam" />;
  if (!boat) return <NotFound />;
  const experienceRequirements = [
    ...(boat.minYearsExperience
      ? [t("experience.minimumYears", { count: boat.minYearsExperience })]
      : []),
    ...(boat.requiredExperience ?? []),
    ...(boat.requiredCertifications ?? []),
    ...(boat.requiredSkills ?? []),
    ...boat.requirements,
  ].filter((item, index, all) => all.indexOf(item) === index);

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
        <div className="grid h-136 gap-2 overflow-hidden rounded-3xl md:grid-cols-[1.5fr_0.8fr]">
          <img alt={boat.name} className="h-full w-full object-cover" src={boat.image} />
          <div className="hidden grid-rows-2 gap-2 md:grid">
            <img
              alt={t("detail.surroundingsAlt", { boat: boat.name })}
              className="h-full w-full object-cover"
              src={boat.gallery[0] ?? fallbackImage}
            />
            <div className="relative overflow-hidden">
              <img
                alt={t("detail.lifeAboardAlt")}
                className="h-full w-full object-cover"
                src={boat.gallery[1] ?? fallbackImage}
              />
              <span className="absolute right-4 bottom-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-navy">
                {t("detail.viewPhotos")}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem]">
          <div>
            <div className="flex items-start justify-between gap-5 border-b border-line pb-8">
              <div>
                <p className="eyebrow">
                  {displayLabel(t, boat.type)} · {boat.length}
                </p>
                <h1 className="font-display text-4xl font-extrabold tracking-[-0.045em] text-navy md:text-5xl">
                  {boat.name}
                </h1>
                <p className="mt-3 flex items-center gap-2 text-slate">
                  <MapPin size={17} /> {formatSitLocation(boat.location, boat.country)}
                </p>
              </div>
              <button
                aria-label={saved.includes(boat.id) ? t("boat.removeSaved") : t("boat.save")}
                className="grid size-11 place-items-center rounded-full border border-line bg-white"
                onClick={() => toggleSaved(boat.id)}
                type="button"
              >
                <Heart
                  className={saved.includes(boat.id) ? "fill-coral text-coral" : ""}
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
                </div>
                <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-seafoam px-3 py-2 text-xs font-bold text-teal sm:flex">
                  <ShieldCheck size={15} /> {t("detail.idVerified")}
                </span>
              </Link>
            </section>

            <section className="border-b border-line py-8">
              <h2 className="detail-title">{t("detail.about")}</h2>
              {boat.homePort && (
                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-teal">
                  <Anchor size={16} /> {t("detail.homePort", { homePort: boat.homePort })}
                </p>
              )}
              <p className="mt-4 leading-7 text-slate">{boat.description}</p>
              <p className="mt-4 leading-7 text-slate">{boat.home}</p>
              {boat.pet && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sun/15 px-4 py-3 text-sm font-semibold text-navy">
                  <Sparkles className="text-coral" size={17} />{" "}
                  {t("detail.alsoAboard", { pet: boat.pet })}
                </div>
              )}
            </section>

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
                {boat.responsibilities.map((item) => (
                  <li className="flex gap-3 text-slate" key={item}>
                    <Check className="mt-0.5 shrink-0 text-teal" size={18} /> {item}
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
              {isHappeningSoon(boat.dateStart) && (
                <span className="mt-2 inline-flex rounded-full bg-coral px-3 py-1.5 text-xs font-bold text-white">
                  {t("boat.happeningSoon")}
                </span>
              )}
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
              </div>
              <button
                className="mt-6 w-full rounded-xl bg-coral py-3.5 font-bold text-white transition hover:bg-coral-dark"
                disabled={user?.name === boat.owner}
                onClick={() => (user ? setApplying(true) : openAuth("login"))}
                type="button"
              >
                {user?.name === boat.owner ? t("detail.ownSit") : t("detail.apply")}
              </button>
              <p className="mt-3 text-center text-xs text-slate">
                {t("detail.applicants", { count: boat.applicants })}
              </p>
            </div>
          </aside>
        </div>
        <section className="mt-14">
          <p className="eyebrow">{t("map.locationKicker")}</p>
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
      {applying && <ApplyModal boat={boat} close={() => setApplying(false)} />}
    </main>
  );
}

function SavedPage() {
  const { t } = useTranslation();
  const saved = useAppStore((state) => state.saved);
  const { data: boats = [] } = useQuery({ queryKey: ["boats"], queryFn: getBoats });
  const savedBoats = boats.filter((boat) => saved.includes(boat.id));
  return (
    <main className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
      <p className="eyebrow">{t("saved.kicker")}</p>
      <h1 className="section-title">{t("saved.title")}</h1>
      {savedBoats.length ? (
        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {savedBoats.map((boat) => (
            <BoatCard boat={boat} key={boat.id} />
          ))}
        </div>
      ) : (
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
      )}
    </main>
  );
}

function HowItWorksPage() {
  const { t } = useTranslation();
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
        <p className="eyebrow text-aqua!">{t("how.kicker")}</p>
        <h1 className="mx-auto max-w-3xl font-display text-5xl font-extrabold tracking-tighter md:text-6xl">
          {t("how.title")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/70">
          {t("how.subtitle")}
        </p>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-20">
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

const sitterReviews = [
  {
    boat: "Juniper",
    owner: "Sarah & Tom",
    location: "Preveza, Greece",
    date: "June 2026",
    text: "Alex was exactly who you want looking after a boat: methodical, communicative and calm when a windy front came through. The handover back was immaculate.",
    image: "https://i.pravatar.cc/100?img=14",
  },
  {
    boat: "Kindred",
    owner: "Marcus",
    location: "Lisbon, Portugal",
    date: "February 2026",
    text: "A genuinely capable sitter. Alex spotted a small freshwater pump leak early, sent clear photos and coordinated the fix with our engineer. Highly recommended.",
    image: "https://i.pravatar.cc/100?img=53",
  },
  {
    boat: "Tern",
    owner: "Jo & Ellie",
    location: "Brighton, United Kingdom",
    date: "October 2025",
    text: "Our first time using a boat sitter and we could not have felt more reassured. Great with the systems, our dog, and the marina team.",
    image: "https://i.pravatar.cc/100?img=23",
  },
];

function ProfileEditor({ close }: { close: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAppStore((state) => state.user)!;
  const updateProfile = useAppStore((state) => state.updateProfile);
  const [form, setForm] = useState({
    name: user.name,
    image: user.image,
    bio:
      user.bio ??
      "Practical, calm and happiest near the water, with hands-on coastal sailing experience.",
    location: user.location ?? "Brighton, United Kingdom",
    languages: user.languages ?? ["English"],
    preferredCountries: user.preferredCountries ?? [],
    skills: (
      user.skills ?? ["RYA Day Skipper", "Diesel basics", "12V systems", "Pet friendly"]
    ).join("\n"),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

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
    if (name !== user.name || form.image !== user.image) {
      await updateOwnerOnVessels(user.name, { name, image: form.image });
      await queryClient.invalidateQueries({ queryKey: ["vessels"] });
      await queryClient.invalidateQueries({ queryKey: ["boats"] });
    }
    updateProfile({
      ...form,
      name,
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

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-navy/60 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 max-w-2xl rounded-3xl bg-white p-6 shadow-float md:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">{t("profile.settings")}</p>
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
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  form.languages.includes(language.label)
                    ? "border-teal bg-seafoam text-teal"
                    : "border-line text-slate hover:border-teal"
                }`}
                key={language.code}
                onClick={() => toggleLanguage(language.label)}
                type="button"
              >
                {language.flag} {language.label}
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
            {saved ? t("common.saved") : saving ? t("common.saving") : t("profile.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const currentUser = useAppStore((state) => state.user);
  const isMe = id === "me";
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();
  const { data: boat, isLoading } = useQuery({
    queryKey: ["boat", id],
    queryFn: () => getBoat(id),
    enabled: !isMe,
  });
  const { data: verification } = useQuery({
    queryKey: ["verification", currentUser?.name],
    queryFn: () => getVerificationStatus(currentUser!.name),
    enabled: isMe && Boolean(currentUser),
  });
  const verifyMutation = useMutation({
    mutationFn: () => startVerification(currentUser!.name),
    onSuccess: (record) => queryClient.setQueryData(["verification", currentUser?.name], record),
  });

  if (isMe && !currentUser) return <NotFound />;
  if (!isMe && isLoading)
    return <div className="mx-auto my-20 h-96 max-w-5xl animate-pulse rounded-3xl bg-seafoam" />;
  if (!isMe && !boat) return <NotFound />;

  const profile = isMe
    ? {
        name: currentUser!.name,
        image: currentUser!.image,
        activity: t("member.member"),
        location: currentUser!.location ?? "Brighton, United Kingdom",
        since: "2024",
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
        sitterSits: currentUser!.name === "Alex Morgan" ? 8 : 0,
        rating: 5,
        reviews: 12,
      }
    : {
        name: boat!.owner,
        image: boat!.ownerImage,
        activity: t("member.member"),
        location: memberDetails[id]?.location ?? formatSitLocation(boat!.location, boat!.country),
        since: memberDetails[id]?.since ?? "2022",
        about: memberDetails[id]?.about ?? boat!.description,
        badges: memberDetails[id]?.badges ?? ["Verified owner", "Fast responder"],
        ownerSits: memberDetails[id]?.ownerSits ?? boat!.reviews,
        sitterSits: 0,
        rating: boat!.rating,
        reviews: boat!.reviews,
      };

  return (
    <main className="px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          <div className="h-40 bg-navy">
            <div className="h-full bg-[radial-gradient(circle_at_20%_100%,#80d7d0,transparent_35%),radial-gradient(circle_at_80%_0%,#ef7057,transparent_30%)] opacity-40" />
          </div>
          <div className="px-6 pb-8 sm:px-10">
            <div className="-mt-16 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
              <img
                alt={profile.name}
                className="size-32 rounded-full border-4 border-white bg-white object-cover shadow-card"
                src={profile.image}
              />
              <div className="flex gap-3 pb-1">
                {!isMe && (
                  <button
                    className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-navy hover:border-teal"
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle size={17} /> {t("member.message")}
                    </span>
                  </button>
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
                <span
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold ${
                    !isMe || verification?.status === "verified"
                      ? "bg-seafoam text-teal"
                      : "bg-cream text-slate"
                  }`}
                >
                  <ShieldCheck size={17} />{" "}
                  {!isMe || verification?.status === "verified"
                    ? t("member.identityVerified")
                    : t("member.verificationNeeded")}
                </span>
              </div>
            </div>
            <div className="mt-5">
              <p className="eyebrow">{profile.activity}</p>
              <h1 className="font-display text-4xl font-extrabold tracking-[-0.045em] text-navy">
                {profile.name}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate">
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} /> {profile.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="fill-sun text-sun" size={16} /> {profile.rating} ·{" "}
                  {t("member.reviews", { count: profile.reviews })}
                </span>
                <span>{t("member.since", { year: profile.since })}</span>
              </p>
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
            {isMe && profile.sitterSits > 0 && (
              <section className="rounded-2xl border border-line bg-white p-7">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="eyebrow">{t("member.fromOwners")}</p>
                    <h2 className="detail-title">{t("member.historicReviews")}</h2>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-bold text-navy">
                    <Star className="fill-sun text-sun" size={16} /> 5.0
                  </span>
                </div>
                <div className="mt-6 divide-y divide-line">
                  {sitterReviews.map((review) => (
                    <article className="py-6 first:pt-0 last:pb-0" key={review.boat}>
                      <div className="flex items-center gap-3">
                        <img
                          alt=""
                          className="size-10 rounded-full object-cover"
                          src={review.image}
                        />
                        <div>
                          <p className="text-sm font-bold text-navy">{review.owner}</p>
                          <p className="text-xs text-slate">
                            {review.boat} · {review.location} · {review.date}
                          </p>
                        </div>
                        <div className="ml-auto flex text-sun">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star className="fill-current" key={star} size={12} />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate">“{review.text}”</p>
                    </article>
                  ))}
                </div>
              </section>
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
            {isMe && verification?.status !== "verified" && (
              <div className="rounded-2xl border border-coral/30 bg-white p-6">
                <ShieldCheck className="text-coral" size={28} />
                <h2 className="mt-3 font-display font-bold text-navy">{t("member.verifyTitle")}</h2>
                <p className="mt-2 text-sm leading-5 text-slate">{t("member.verifyText")}</p>
                <button
                  className="mt-4 w-full rounded-xl bg-navy py-3 text-sm font-bold text-white disabled:opacity-60"
                  disabled={verifyMutation.isPending}
                  onClick={() => verifyMutation.mutate()}
                  type="button"
                >
                  {verifyMutation.isPending ? t("member.checking") : t("member.startVerification")}
                </button>
                <p className="mt-2 text-center text-[11px] text-slate">
                  {t("member.providerDemo")}
                </p>
              </div>
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
      {editing && <ProfileEditor close={() => setEditing(false)} />}
    </main>
  );
}

function VesselEditor({ boat, close }: { boat?: Vessel; close: () => void }) {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user)!;
  const queryClient = useQueryClient();
  const preferredLengthUnit: LengthUnit = user.measurementSystem === "imperial" ? "ft" : "m";
  const initialLength = parseBoatLength(boat?.length ?? "", preferredLengthUnit);
  const [imageError, setImageError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [lengthValue, setLengthValue] = useState(initialLength.value);
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>(initialLength.unit);
  const [form, setForm] = useState({
    name: boat?.name ?? "",
    type: boat?.type ?? "Sailing yacht",
    engineType: boat?.engineType ?? "Not specified",
    voltageType: boat?.voltageType ?? "Not specified",
    stoveFuelType: boat?.stoveFuelType ?? "Not specified",
    homePort: boat?.homePort ?? "",
    image: boat?.image ?? "",
    description: boat?.description ?? "",
    home: boat?.home ?? "",
    systems: boat?.systems.join("\n") ?? "",
    amenities: boat?.amenities.filter((item) => ALL_BOAT_FEATURES.includes(item)) ?? [],
    customAmenities:
      boat?.amenities.filter((item) => !ALL_BOAT_FEATURES.includes(item)).join("\n") ?? "",
  });

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

  const mutation = useMutation({
    mutationFn: () => {
      const id =
        boat?.id ??
        `${form.name
          .toLowerCase()
          .replaceAll(/[^a-z0-9]+/g, "-")
          .replaceAll(/^-|-$/g, "")}-${Date.now().toString().slice(-5)}`;
      return saveVessel({
        id,
        ...form,
        length: lengthValue ? `${lengthValue} ${lengthUnit}` : "",
        image: form.image || fallbackImage,
        gallery: boat?.gallery ?? [],
        owner: user.name,
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
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["boats"] });
      await queryClient.invalidateQueries({ queryKey: ["vessels"] });
      close();
    },
  });

  const fields: Array<{
    key: keyof typeof form;
    label: string;
    placeholder: string;
    wide?: boolean;
  }> = [
    { key: "name", label: t("vesselEditor.name"), placeholder: t("vesselEditor.namePlaceholder") },
  ];

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="rounded-3xl border border-line bg-white p-6 shadow-card md:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">{t("owner.tools")}</p>
            <h1 className="font-display text-3xl font-bold text-navy">
              {boat ? t("vesselEditor.editTitle", { boat: boat.name }) : t("vesselEditor.addTitle")}
            </h1>
          </div>
          <button
            className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-bold text-navy hover:border-teal"
            onClick={close}
            type="button"
          >
            <ArrowLeft size={16} /> {t("common.back")}
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="form-label">{t("vesselEditor.type")}</span>
            <select
              className="form-input"
              onChange={(event) => setForm({ ...form, type: event.target.value })}
              value={form.type}
            >
              {VESSEL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {displayLabel(t, type)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="form-label">{t("vesselEditor.engineType")}</span>
            <select
              className="form-input"
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
            </select>
          </label>
          <label>
            <span className="form-label">{t("vesselEditor.voltageType")}</span>
            <select
              className="form-input"
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
            </select>
          </label>
          <label>
            <span className="form-label">{t("vesselEditor.stoveFuelType")}</span>
            <select
              className="form-input"
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
            </select>
          </label>
          <label>
            <span className="form-label">{t("vesselEditor.length")}</span>
            <span className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
              <input
                className="form-input"
                inputMode="decimal"
                min="0"
                onChange={(event) => setLengthValue(event.target.value)}
                placeholder={t("vesselEditor.lengthValuePlaceholder")}
                step="0.1"
                type="number"
                value={lengthValue}
              />
              <select
                aria-label={t("vesselEditor.lengthUnit")}
                className="form-input"
                onChange={(event) => {
                  const nextUnit = event.target.value as LengthUnit;
                  setLengthValue((current) => convertBoatLength(current, lengthUnit, nextUnit));
                  setLengthUnit(nextUnit);
                }}
                value={lengthUnit}
              >
                <option value="m">{t("units.meters")}</option>
                <option value="ft">{t("units.feet")}</option>
              </select>
            </span>
          </label>
          {fields.map((field) => (
            <label className={field.wide ? "sm:col-span-2" : ""} key={field.key}>
              <span className="form-label">{field.label}</span>
              <input
                className="form-input"
                onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                placeholder={field.placeholder}
                value={form[field.key]}
              />
            </label>
          ))}
          <div className="sm:col-span-2">
            <span className="form-label">{t("vesselEditor.homePort")}</span>
            <DestinationAutocomplete
              cityOnly
              includeCountry
              onChange={(homePort) => setForm({ ...form, homePort })}
              value={form.homePort}
              variant="profile"
            />
            <p className="mt-2 text-xs leading-5 text-slate">{t("vesselEditor.homePortHint")}</p>
          </div>
          <section className="sm:col-span-2">
            <span className="form-label">{t("vesselEditor.coverImage")}</span>
            <div className="grid gap-3 rounded-2xl border border-line bg-cream/50 p-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(13rem,0.7fr)]">
              <div className="aspect-video overflow-hidden rounded-xl bg-seafoam">
                {form.image ? (
                  <img
                    alt={t("vesselEditor.coverPreviewAlt")}
                    className="size-full object-cover"
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
                <ImageUploadControl
                  hasImage={Boolean(form.image)}
                  onFile={(file) => void uploadImage(file)}
                  pending={imageUploading}
                />
                {form.image && (
                  <button
                    className="self-start text-xs font-bold text-coral"
                    onClick={() => {
                      setForm({ ...form, image: "" });
                      setImageError("");
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
          {[
            ["description", t("vesselEditor.about"), t("vesselEditor.aboutPlaceholder")],
            ["home", t("vesselEditor.lifeAboard"), t("vesselEditor.lifePlaceholder")],
            ["systems", t("vesselEditor.systems"), t("vesselEditor.systemsPlaceholder")],
            ["customAmenities", t("vesselEditor.otherFeatures"), t("vesselEditor.onePerLine")],
          ].map(([key, label, placeholder]) => (
            <label className="sm:col-span-2" key={key}>
              <span className="form-label">{label}</span>
              <textarea
                className="form-input min-h-24 resize-y"
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
              />
            </label>
          ))}
        </div>
        <section className="mt-7">
          <p className="eyebrow">{t("vesselEditor.featuresKicker")}</p>
          <h3 className="font-display text-lg font-bold text-navy">
            {t("vesselEditor.featuresTitle")}
          </h3>
          <p className="mt-1 text-sm text-slate">{t("vesselEditor.featuresHint")}</p>
          <div className="mt-5 space-y-5">
            {BOAT_FEATURE_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate">
                  {t(FEATURE_GROUP_KEYS[group.title])}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {group.options.map((feature) => {
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
                </div>
              </div>
            ))}
          </div>
        </section>
        <div className="mt-6 flex justify-end gap-3 border-t border-line pt-5">
          <button
            className="rounded-xl px-5 py-3 text-sm font-bold text-slate"
            onClick={close}
            type="button"
          >
            {t("common.cancel")}
          </button>
          <button
            className="rounded-xl bg-coral px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
            disabled={mutation.isPending || !form.name || !form.homePort}
            onClick={() => mutation.mutate()}
            type="button"
          >
            {mutation.isPending
              ? t("common.saving")
              : boat
                ? t("vesselEditor.save")
                : t("vesselEditor.publish")}
          </button>
        </div>
      </div>
    </main>
  );
}

function VesselEditorPage({ mode }: { mode: "new" | "edit" }) {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const navigate = useNavigate();
  const { boatId } = useParams();
  const { data: vessels = [], isLoading } = useQuery({
    queryKey: ["vessels"],
    queryFn: getVessels,
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
          onClick={() => navigate("/owner/boats")}
          type="button"
        >
          {t("owner.backToBoats")}
        </button>
      </main>
    );
  }

  return <VesselEditor boat={boat} close={() => navigate("/owner/boats")} />;
}

function SitEditor({ sit, vessels, close }: { sit?: Sit; vessels: Vessel[]; close: () => void }) {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const initialBoatId = sit?.boatId ?? vessels[0]?.id ?? "";
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
    region: sit?.region ?? "",
    startDate: sit?.dateStart ?? "",
    endDate: existingEnd,
    responsibilities: sit?.responsibilities.join("\n") ?? "",
    requirements:
      sit?.requirements
        .filter((requirement) => !(sit.requiredSkills ?? []).includes(requirement))
        .join("\n") ?? "",
    minYearsExperience: String(sit?.minYearsExperience ?? 0),
    requiredExperience: sit?.requiredExperience ?? [],
    requiredCertifications: sit?.requiredCertifications ?? [],
    requiredSkills: sit?.requiredSkills ?? [],
    pet: sit?.pet ?? "",
  });
  const mutation = useMutation({
    mutationFn: () => {
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
      return saveSit({
        id: sit?.id ?? `sit-${form.boatId}-${Date.now().toString().slice(-6)}`,
        boatId: form.boatId,
        dateStart: form.startDate,
        dates: `${formatter.format(start)} – ${formatter.format(end)}`,
        duration: t("duration.nights", { count: nights }),
        location,
        country,
        region: form.region.trim(),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        responsibilities: form.responsibilities.split("\n").filter(Boolean),
        requirements: form.requirements.split("\n").filter(Boolean),
        minYearsExperience: Number(form.minYearsExperience),
        requiredExperience: form.requiredExperience,
        requiredCertifications: form.requiredCertifications,
        requiredSkills: form.requiredSkills,
        applicants: sit?.applicants ?? 0,
        pet: form.pet || undefined,
        featured: sit?.featured,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["boats"] });
      await queryClient.invalidateQueries({ queryKey: ["sits"] });
      close();
    },
  });

  function toggleRequirement(
    field: "requiredExperience" | "requiredCertifications" | "requiredSkills",
    option: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(option)
        ? current[field].filter((item) => item !== option)
        : [...current[field], option],
    }));
  }

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-navy/60 p-4 backdrop-blur-sm">
      <div className="mx-auto my-10 max-w-2xl rounded-3xl bg-white p-6 shadow-float md:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">{t("sitEditor.kicker")}</p>
            <h2 className="font-display text-2xl font-bold text-navy">
              {sit ? t("sitEditor.editTitle") : t("sitEditor.createTitle")}
            </h2>
            <p className="mt-2 text-sm text-slate">{t("sitEditor.hint")}</p>
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
        <div className="mt-6 space-y-5">
          <label>
            <span className="form-label">{t("sitEditor.boat")}</span>
            <select
              className="form-input"
              disabled={Boolean(sit)}
              onChange={(event) => {
                const boatId = event.target.value;
                const vessel = vessels.find((item) => item.id === boatId);
                const homePort = splitHomePort(vessel?.homePort ?? "");
                setForm({
                  ...form,
                  boatId,
                  ...(sameAsHomePort
                    ? { location: homePort.location, country: homePort.country, region: "" }
                    : {}),
                });
              }}
              value={form.boatId}
            >
              {vessels.map((vessel) => (
                <option key={vessel.id} value={vessel.id}>
                  {vessel.name} · {vessel.homePort}
                </option>
              ))}
            </select>
          </label>
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
                      region: "",
                    });
                  }
                }}
                type="checkbox"
              />
              <span>
                <span className="block text-sm font-bold text-navy">
                  {t("sitEditor.sameAsHomePort", {
                    homePort: vessels.find((vessel) => vessel.id === form.boatId)?.homePort ?? "",
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
                <span className="form-label">{t("sitEditor.location")}</span>
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
                  value={form.location}
                  variant="profile"
                />
              </div>
              <label>
                <span className="form-label">{t("sitEditor.country")}</span>
                <input
                  className="form-input"
                  onChange={(event) => setForm({ ...form, country: event.target.value })}
                  placeholder={t("sitEditor.countryPlaceholder")}
                  value={form.country}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="form-label">{t("sitEditor.region")}</span>
                <input
                  className="form-input"
                  onChange={(event) => setForm({ ...form, region: event.target.value })}
                  placeholder={t("sitEditor.regionPlaceholder")}
                  value={form.region}
                />
              </label>
            </section>
          )}
          <div>
            <span className="form-label">{t("sitEditor.dates")}</span>
            <DateRangePicker
              endDate={form.endDate}
              onChange={({ startDate, endDate }) => setForm({ ...form, startDate, endDate })}
              startDate={form.startDate}
              variant="browse"
            />
          </div>
          <label>
            <span className="form-label">{t("sitEditor.responsibilities")}</span>
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
              {t("sitEditor.requirementsTitle")}
            </h3>
            <label className="mt-5 block">
              <span className="form-label">{t("sitEditor.minimumYears")}</span>
              <select
                className="form-input"
                onChange={(event) => setForm({ ...form, minYearsExperience: event.target.value })}
                value={form.minYearsExperience}
              >
                <option value="0">{t("sitEditor.noMinimum")}</option>
                {[1, 2, 3, 5, 10].map((years) => (
                  <option key={years} value={years}>
                    {t("sitEditor.yearsPlus", { count: years })}
                  </option>
                ))}
              </select>
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
                <p className="form-label">{group.title}</p>
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
          </section>
          <label>
            <span className="form-label">{t("sitEditor.additional")}</span>
            <textarea
              className="form-input min-h-24 resize-y"
              onChange={(event) => setForm({ ...form, requirements: event.target.value })}
              placeholder={t("sitEditor.additionalPlaceholder")}
              value={form.requirements}
            />
          </label>
          <label>
            <span className="form-label">{t("sitEditor.pets")}</span>
            <input
              className="form-input"
              onChange={(event) => setForm({ ...form, pet: event.target.value })}
              placeholder={t("sitEditor.petsPlaceholder")}
              value={form.pet}
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-line pt-5">
          <button
            className="rounded-xl px-5 py-3 text-sm font-bold text-slate"
            onClick={close}
            type="button"
          >
            {t("common.cancel")}
          </button>
          <button
            className="rounded-xl bg-coral px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
            disabled={
              mutation.isPending ||
              !form.boatId ||
              !form.startDate ||
              !form.endDate ||
              (!sameAsHomePort && (!form.location.trim() || !form.country.trim()))
            }
            onClick={() => mutation.mutate()}
            type="button"
          >
            {mutation.isPending
              ? t("common.saving")
              : sit
                ? t("sitEditor.save")
                : t("sitEditor.publish")}
          </button>
        </div>
      </div>
    </div>
  );
}

function OwnerBoatsPage() {
  const { i18n, t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"boats" | "sits">("sits");
  const [editingSit, setEditingSit] = useState<Sit | "new" | null>(null);
  const { data: vessels = [], isLoading: vesselsLoading } = useQuery({
    queryKey: ["vessels"],
    queryFn: getVessels,
  });
  const { data: sits = [], isLoading: sitsLoading } = useQuery({
    queryKey: ["sits"],
    queryFn: getSits,
  });
  const { data: ownerApplications = [] } = useQuery({
    queryKey: ["applications", "user", user?.name],
    queryFn: () => getApplicationsForUser(user!.name),
    enabled: Boolean(user),
  });
  const removeVesselMutation = useMutation({
    mutationFn: deleteVessel,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vessels"] });
      await queryClient.invalidateQueries({ queryKey: ["sits"] });
      await queryClient.invalidateQueries({ queryKey: ["boats"] });
    },
  });
  const removeSitMutation = useMutation({
    mutationFn: deleteSit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sits"] });
      await queryClient.invalidateQueries({ queryKey: ["boats"] });
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
  const ownedSits = sits.filter((sit) => ownedBoatIds.has(sit.boatId));
  const isLoading = vesselsLoading || sitsLoading;

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{t("owner.dashboard")}</p>
          <h1 className="section-title">{t("owner.manage")}</h1>
          <p className="mt-3 text-slate">{t("owner.dashboardHint")}</p>
        </div>
        <div className="group relative">
          <button
            aria-describedby={
              activeTab === "sits" && ownedBoats.length === 0
                ? "sit-requires-boat-tooltip"
                : undefined
            }
            className={`flex items-center justify-center gap-2 rounded-full px-5 py-3 font-bold transition ${
              activeTab === "sits" && ownedBoats.length === 0
                ? "bg-slate/25 text-slate hover:bg-slate/35"
                : "bg-coral text-white hover:bg-coral-dark"
            }`}
            onClick={() => {
              if (activeTab === "boats" || ownedBoats.length === 0) {
                navigate("/owner/boats/new");
              } else {
                setEditingSit("new");
              }
            }}
            type="button"
          >
            <Plus size={18} />{" "}
            {activeTab === "boats" ? t("vesselEditor.addTitle") : t("sitEditor.createShort")}
          </button>
          {activeTab === "sits" && ownedBoats.length === 0 && (
            <span
              className="pointer-events-none absolute top-[calc(100%+0.5rem)] right-0 z-20 hidden w-64 rounded-xl bg-navy px-3 py-2 text-sm font-medium text-white shadow-float group-focus-within:block group-hover:block"
              id="sit-requires-boat-tooltip"
              role="tooltip"
            >
              {t("owner.sitRequiresBoatTooltip")}
            </span>
          )}
        </div>
      </div>
      <div className="mt-8 flex gap-1 rounded-xl bg-seafoam p-1 sm:w-fit">
        {(["sits", "boats"] as const).map((tab) => (
          <button
            className={`flex-1 rounded-lg px-6 py-2.5 text-sm font-bold capitalize transition sm:flex-none ${
              activeTab === tab ? "bg-white text-navy shadow-sm" : "text-slate hover:text-navy"
            }`}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {t(`owner.tab.${tab}`)}{" "}
            <span className="ml-1 text-xs text-slate">
              {tab === "boats" ? ownedBoats.length : ownedSits.length}
            </span>
          </button>
        ))}
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
      {isLoading ? (
        <div className="mt-10 h-56 animate-pulse rounded-2xl bg-seafoam" />
      ) : activeTab === "boats" && ownedBoats.length ? (
        <div className="mt-10 space-y-4">
          {ownedBoats.map((boat) => (
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
                  {displayLabel(t, boat.type)} · {boat.length}
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
                <button
                  aria-label={
                    ownedSits.some((sit) => sit.boatId === boat.id)
                      ? t("owner.deleteBlocked")
                      : t("owner.deleteBoatLabel", { boat: boat.name })
                  }
                  className="rounded-xl border border-line p-2.5 text-slate hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:text-slate"
                  disabled={ownedSits.some((sit) => sit.boatId === boat.id)}
                  onClick={() => {
                    if (window.confirm(t("owner.deleteBoatConfirm", { boat: boat.name }))) {
                      removeVesselMutation.mutate(boat.id);
                    }
                  }}
                  title={
                    ownedSits.some((sit) => sit.boatId === boat.id)
                      ? t("owner.deleteBlocked")
                      : undefined
                  }
                  type="button"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : activeTab === "sits" && ownedSits.length ? (
        <div className="mt-10 space-y-4">
          {ownedSits.map((sit) => {
            const boat = ownedBoats.find((item) => item.id === sit.boatId)!;
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
                    {formatSitDates(i18n.language, sit.dateStart, sit.duration)}
                  </Link>
                  {isHappeningSoon(sit.dateStart) && (
                    <span className="mt-2 inline-flex rounded-full bg-coral px-2.5 py-1 text-[11px] font-bold text-white">
                      {t("boat.happeningSoon")}
                    </span>
                  )}
                  <p className="mt-1 text-sm text-slate">
                    {t("owner.sitSummary", {
                      duration: sit.duration,
                      applicants: sit.applicants,
                      tasks: sit.responsibilities.length,
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-navy hover:border-teal"
                    onClick={() => navigate(`/owner/sits/${sit.id}/applications`)}
                    type="button"
                  >
                    <MessageCircle size={16} />{" "}
                    {t("applications.reviewCount", {
                      count: ownerApplications.filter((application) => application.sitId === sit.id)
                        .length,
                    })}
                  </button>
                  <button
                    className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-navy hover:border-teal"
                    onClick={() => setEditingSit(sit)}
                    type="button"
                  >
                    <Pencil size={16} /> {t("common.edit")}
                  </button>
                  <button
                    aria-label={t("owner.deleteSitLabel", { boat: boat.name })}
                    className="rounded-xl border border-line p-2.5 text-slate hover:border-coral hover:text-coral"
                    onClick={() => {
                      if (
                        window.confirm(
                          t("owner.deleteSitConfirm", {
                            dates: formatSitDates(i18n.language, sit.dateStart, sit.duration),
                            boat: boat.name,
                          }),
                        )
                      ) {
                        removeSitMutation.mutate(sit.id);
                      }
                    }}
                    type="button"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-white py-16 text-center">
          <ShipWheel className="mx-auto text-teal" size={36} />
          <h2 className="mt-4 font-display text-xl font-bold text-navy">
            {activeTab === "boats" ? t("owner.firstBoat") : t("owner.firstSit")}
          </h2>
          <p className="mt-2 text-sm text-slate">
            {activeTab === "boats"
              ? t("owner.firstBoatHint")
              : ownedBoats.length
                ? t("owner.firstSitHint")
                : t("owner.boatBeforeSit")}
          </p>
        </div>
      )}
      {editingSit && ownedBoats.length > 0 && (
        <SitEditor
          close={() => setEditingSit(null)}
          sit={editingSit === "new" ? undefined : editingSit}
          vessels={ownedBoats}
        />
      )}
    </main>
  );
}

function SettingsPage() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const deleteAccount = useAppStore((state) => state.deleteAccount);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
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
  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-14 lg:px-8">
        <p className="eyebrow">{t("settings.kicker")}</p>
        <h1 className="section-title">{t("settings.title")}</h1>
        <p className="mt-3 text-slate">{t("settings.subtitle")}</p>
        <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-card">
          <label>
            <span className="form-label">{t("settings.language")}</span>
            <select
              className="form-input"
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
            </select>
          </label>
          <p className="mt-3 text-sm leading-6 text-slate">{t("settings.languageHint")}</p>
          <div className="my-6 border-t border-line" />
          <label>
            <span className="form-label">{t("settings.measurementSystem")}</span>
            <select
              className="form-input"
              onChange={(event) =>
                updateProfile({
                  measurementSystem: event.target.value as "metric" | "imperial",
                })
              }
              value={user.measurementSystem}
            >
              <option value="metric">{t("settings.metric")}</option>
              <option value="imperial">{t("settings.imperial")}</option>
            </select>
          </label>
          <p className="mt-3 text-sm leading-6 text-slate">{t("settings.measurementHint")}</p>
        </section>

        <section className="mt-8 rounded-2xl border border-red-300 bg-red-50 p-6">
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
      </main>

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
                disabled={
                  deleting || deleteConfirmation !== DELETE_ACCOUNT_CONFIRMATION_TERM
                }
                onClick={() => {
                  setDeleting(true);
                  void deleteMockAccount(user.name).then(() => {
                    deleteAccount();
                    navigate("/");
                  });
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
          <p className="eyebrow text-aqua!">{t("safety.kicker")}</p>
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">{t("safety.title")}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-white/70">{t("safety.intro")}</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-4xl gap-5 px-5 py-12">
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
  const [form, setForm] = useState({ topic: "", name: user?.name ?? "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "pending" | "success">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.topic || !form.name.trim() || !form.message.trim()) {
      setError(t("support.requiredError"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(t("support.emailError"));
      return;
    }
    setStatus("pending");
    try {
      await submitSupportRequest(form);
      setStatus("success");
    } catch {
      setStatus("idle");
      setError(t("support.submitError"));
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
      <p className="eyebrow">{t("support.kicker")}</p>
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
                <select
                  className="form-input"
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
                </select>
              </label>
              {[
                ["name", t("support.name"), "text"],
                ["email", t("support.email"), "email"],
              ].map(([key, label, type]) => (
                <label className="block" key={key}>
                  <span className="form-label">{label}</span>
                  <input
                    className="form-input"
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    required
                    type={type}
                    value={form[key as "name" | "email"]}
                  />
                </label>
              ))}
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
      <p className="eyebrow">{t("terms.kicker")}</p>
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

function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useTranslation();
  const colors: Record<ApplicationStatus, string> = {
    new: "bg-aqua/20 text-teal",
    shortlisted: "bg-sun/25 text-navy",
    accepted: "bg-seafoam text-teal",
    declined: "bg-slate/10 text-slate",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${colors[status]}`}>
      {t(`applications.status.${status}`)}
    </span>
  );
}

function ApplicationReviewPage() {
  const { t } = useTranslation();
  const { sitId = "" } = useParams();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications", "sit", sitId],
    queryFn: () => getApplicationsForSit(sitId),
  });
  const { data: sits = [], isLoading: sitsLoading } = useQuery({
    queryKey: ["sits"],
    queryFn: getSits,
  });
  const { data: vessels = [], isLoading: vesselsLoading } = useQuery({
    queryKey: ["vessels"],
    queryFn: getVessels,
  });
  const [selectedId, setSelectedId] = useState("");
  const [confirmingStatus, setConfirmingStatus] = useState<"accepted" | "declined" | null>(null);

  useEffect(() => {
    if (!applications.length) return;
    if (!applications.some((application) => application.id === selectedId)) {
      setSelectedId(applications[0].id);
    }
  }, [applications, selectedId]);

  const sit = sits.find((item) => item.id === sitId);
  const vessel = vessels.find((item) => item.id === sit?.boatId);
  const selected = applications.find((application) => application.id === selectedId);
  const allowed = Boolean(user && vessel && vessel.owner === user.name);
  const pageLoading = isLoading || sitsLoading || vesselsLoading;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      updateApplicationStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
  const messageMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      sendApplicationMessage(id, user!.name, text),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
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
          onClick={() => navigate("/owner/boats")}
          type="button"
        >
          {t("owner.backToBoats")}
        </button>
      </main>
    );
  }

  const requiredSkills = sit?.requiredSkills ?? [];
  const requiredCertifications = sit?.requiredCertifications ?? [];
  const minimumYears = sit?.minYearsExperience ?? 0;
  const matchTotal =
    requiredSkills.length + requiredCertifications.length + (minimumYears > 0 ? 1 : 0);
  const matchCount = selected
    ? requiredSkills.filter((skill) => selected.applicant.skills.includes(skill)).length +
      requiredCertifications.filter((certification) =>
        selected.applicant.certifications.includes(certification),
      ).length +
      (minimumYears > 0 && selected.applicant.yearsExperience >= minimumYears ? 1 : 0)
    : 0;
  const actionClasses = {
    shortlisted: "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
    accepted: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    declined: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
  } as const;

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <button
        className="mb-6 flex items-center gap-2 text-sm font-bold text-slate hover:text-navy"
        onClick={() => navigate("/owner/boats")}
        type="button"
      >
        <ArrowLeft size={17} /> {t("applications.backToSits")}
      </button>
      <p className="eyebrow">{t("applications.kicker")}</p>
      <h1 className="section-title">{t("applications.title", { boat: vessel?.name ?? "" })}</h1>
      <p className="mt-3 text-slate">
        {t("applications.subtitle", { count: applications.length })}
      </p>

      {pageLoading ? (
        <div className="mt-8 h-80 animate-pulse rounded-2xl bg-seafoam" />
      ) : applications.length && selected ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-line bg-white p-2 shadow-card">
            {applications.map((application) => (
              <button
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                  application.id === selected.id ? "bg-seafoam" : "hover:bg-cream"
                }`}
                key={application.id}
                onClick={() => setSelectedId(application.id)}
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
                  <span className="mt-1 block">
                    <ApplicationStatusBadge status={application.status} />
                  </span>
                </span>
              </button>
            ))}
          </aside>

          <div className="space-y-6">
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
                    <ApplicationStatusBadge status={selected.status} />
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate">
                    <MapPin size={14} /> {selected.applicant.location}
                  </p>
                  <p className="mt-3 leading-7 text-slate">{selected.applicant.bio}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
                      ? t("applications.matchCount", { count: matchCount, total: matchTotal })
                      : t("applications.noSpecificRequirements")}
                  </p>
                </div>
              </div>

              {[
                [t("applications.certifications"), selected.applicant.certifications],
                [t("applications.skills"), selected.applicant.skills],
                [t("applications.languages"), selected.applicant.languages],
                [t("profile.preferredCountries"), selected.applicant.preferredCountries ?? []],
              ].map(([label, values]) => (
                <div className="mt-5" key={label as string}>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate">{label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(values as string[]).map((value) => (
                      <span
                        className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy"
                        key={value}
                      >
                        {value}
                      </span>
                    ))}
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

              <div className="mt-6 flex flex-wrap gap-2">
                {(["shortlisted", "accepted", "declined"] as const).map((status) => (
                  <button
                    className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${actionClasses[status]} ${
                      selected.status === status ? "ring-2 ring-current/25 ring-offset-2" : ""
                    }`}
                    disabled={statusMutation.isPending}
                    key={status}
                    onClick={() => {
                      if (status === "shortlisted") {
                        statusMutation.mutate({ id: selected.id, status });
                      } else {
                        setConfirmingStatus(status);
                      }
                    }}
                    type="button"
                  >
                    {t(`applications.action.${status}`)}
                  </button>
                ))}
              </div>
            </section>

            <ConversationPanel
              application={selected}
              currentUser={user.name}
              onSend={(text) => messageMutation.mutate({ id: selected.id, text })}
              pending={messageMutation.isPending}
            />
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-white py-16 text-center">
          <MessageCircle className="mx-auto text-teal" size={38} />
          <p className="mt-4 font-bold text-navy">{t("applications.empty")}</p>
        </div>
      )}
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
              className={`grid size-12 place-items-center rounded-full ${
                confirmingStatus === "accepted"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {confirmingStatus === "accepted" ? <Check size={24} /> : <X size={24} />}
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
                className={`rounded-xl px-5 py-3 font-bold text-white disabled:opacity-60 ${
                  confirmingStatus === "accepted"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={statusMutation.isPending}
                onClick={() => {
                  statusMutation.mutate({ id: selected.id, status: confirmingStatus });
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
    </main>
  );
}

function MessagesPage() {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications", "user", user?.name],
    queryFn: () => getApplicationsForUser(user!.name),
    enabled: Boolean(user),
  });
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!applications.length) return;
    if (!applications.some((application) => application.id === selectedId)) {
      setSelectedId(applications[0].id);
    }
  }, [applications, selectedId]);

  const selected = applications.find((application) => application.id === selectedId);
  const messageMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      sendApplicationMessage(id, user!.name, text),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
      <p className="eyebrow">{t("messages.kicker")}</p>
      <h1 className="section-title">{t("messages.title")}</h1>
      {!user ? (
        <div className="mt-8 rounded-2xl border border-line bg-white py-16 text-center">
          <MessageCircle className="mx-auto text-teal" size={38} />
          <p className="mt-4 font-bold text-navy">{t("messages.signIn")}</p>
        </div>
      ) : isLoading ? (
        <div className="mt-8 h-80 animate-pulse rounded-2xl bg-seafoam" />
      ) : applications.length && selected ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-line bg-white p-2 shadow-card">
            {applications.map((application) => {
              const otherName =
                application.ownerName === user.name
                  ? application.applicant.name
                  : application.ownerName;
              return (
                <button
                  className={`w-full rounded-xl p-3 text-left transition ${
                    application.id === selected.id ? "bg-seafoam" : "hover:bg-cream"
                  }`}
                  key={application.id}
                  onClick={() => setSelectedId(application.id)}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-bold text-navy">{otherName}</span>
                    <ApplicationStatusBadge status={application.status} />
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate">
                    {application.boatName}
                  </span>
                  <span className="mt-2 block truncate text-sm text-slate">
                    {application.messages.at(-1)?.text}
                  </span>
                </button>
              );
            })}
          </aside>
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-navy">
                  {selected.ownerName === user.name ? selected.applicant.name : selected.ownerName}
                </h2>
                <p className="text-sm text-slate">
                  {t("messages.aboutBoat", { boat: selected.boatName })}
                </p>
              </div>
              <ApplicationStatusBadge status={selected.status} />
            </div>
            <ConversationPanel
              application={selected}
              currentUser={user.name}
              onSend={(text) => messageMutation.mutate({ id: selected.id, text })}
              pending={messageMutation.isPending}
            />
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-line bg-white py-16 text-center">
          <MessageCircle className="mx-auto text-teal" size={38} />
          <p className="mt-4 font-bold text-navy">{t("messages.empty")}</p>
        </div>
      )}
    </main>
  );
}

function Footer() {
  const { t } = useTranslation();
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
        <Route path="/owner/boats" element={<OwnerBoatsPage />} />
        <Route path="/owner/boats/new" element={<VesselEditorPage mode="new" />} />
        <Route path="/owner/boats/:boatId/edit" element={<VesselEditorPage mode="edit" />} />
        <Route path="/owner/sits/:sitId/applications" element={<ApplicationReviewPage />} />
        <Route path="/members/:id" element={<MemberPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
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

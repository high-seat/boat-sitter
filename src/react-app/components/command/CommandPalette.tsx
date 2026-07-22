import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Command } from "cmdk";
import { useQueryClient } from "@tanstack/react-query";
import {
  Anchor,
  CalendarPlus,
  Check,
  ClipboardCopy,
  Eraser,
  Flag,
  Heart,
  Home,
  LifeBuoy,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  ShieldOff,
  ShipWheel,
  UserRound,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import { FEATURE_FLAG_KEYS, FEATURE_FLAGS, useFeatureFlag, type FeatureFlagKey } from "@/featureFlags";
import { useFeatureFlagStore } from "@/featureFlagStore";
import { createDevRandomSit, createDevRandomVessel } from "@/mockApi";
import { getOwnerDashboardTab } from "@/ownerDashboardDev";
import { isAdminUser } from "@/adminAccess";
import { useAppStore } from "@/store";
import {
  getVerificationStatusSync,
  setMockVerificationStatus,
} from "@/verificationService";

const DEMO_PHONE = "5550100100";
const DEMO_PHONE_COUNTRY = "+1";

function openAuth(mode: "login" | "signup") {
  window.dispatchEvent(new CustomEvent("open-auth", { detail: mode }));
}

function readSitBoatId(sitId: string) {
  try {
    const sits = JSON.parse(localStorage.getItem("harbourly-sits") ?? "[]") as Array<{
      id: string;
      boatId: string;
    }>;
    return sits.find((sit) => sit.id === sitId)?.boatId;
  } catch {
    return undefined;
  }
}

function readOwnedBoatCount(ownerName: string) {
  try {
    const vessels = JSON.parse(localStorage.getItem("harbourly-vessels") ?? "[]") as Array<{
      owner: string;
    }>;
    return vessels.filter((vessel) => vessel.owner === ownerName).length;
  } catch {
    return 0;
  }
}

function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "on" | "off";
}) {
  const toneClass =
    tone === "on"
      ? "bg-seafoam text-teal"
      : tone === "off"
        ? "bg-coral/10 text-coral"
        : "bg-cream text-slate";
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function CommandPalette() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAppStore((state) => state.user);
  const loginAs = useAppStore((state) => state.loginAs);
  const logout = useAppStore((state) => state.logout);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const saved = useAppStore((state) => state.saved);
  const toggleSaved = useAppStore((state) => state.toggleSaved);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        triggerRef.current = document.activeElement as HTMLElement;
        setOpen((current) => !current);
      }
    };
    const onMobileTrigger = () => {
      if (!import.meta.env.DEV) return;
      triggerRef.current = document.activeElement as HTMLElement;
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-command-palette", onMobileTrigger);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-command-palette", onMobileTrigger);
    };
  }, []);

  function close() {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus());
  }

  function run(action: () => void) {
    close();
    action();
  }

  async function refreshVerificationQueries() {
    await queryClient.invalidateQueries({ queryKey: ["verification"] });
    await queryClient.invalidateQueries({ queryKey: ["verification-checks"] });
  }

  const boatMatch = matchPath("/boats/:id", location.pathname);
  const applicationsMatch = matchPath("/owner/sits/:sitId/applications", location.pathname);
  const vesselEditMatch = matchPath("/owner/boats/:boatId/edit", location.pathname);
  const memberMatch = matchPath("/members/:id", location.pathname);
  const onOwnerDashboard = Boolean(matchPath("/owner/boats", location.pathname));
  const onOwnerNewBoat = Boolean(matchPath("/owner/boats/new", location.pathname));
  const onSaved = Boolean(matchPath("/saved", location.pathname));
  const onSettings = Boolean(matchPath("/settings", location.pathname));
  const onMessages = Boolean(matchPath("/messages", location.pathname));
  const boatId = boatMatch?.params.id;
  const applicationSitId = applicationsMatch?.params.sitId;
  const applicationBoatId = applicationSitId ? readSitBoatId(applicationSitId) : undefined;
  const editBoatId = vesselEditMatch?.params.boatId;
  const memberParam = memberMatch?.params.id
    ? decodeURIComponent(memberMatch.params.id)
    : undefined;
  const viewingOtherMember =
    Boolean(memberParam) && memberParam !== "me" && memberParam !== user?.name;

  const verificationStatus = useMemo(() => {
    if (!user || !open) return "unverified" as const;
    return getVerificationStatusSync(user.name).status;
  }, [user, open, user?.name, user?.phoneNumber]);

  const isFullyVerifiedNow =
    Boolean(user) &&
    verificationStatus === "verified" &&
    Boolean(user?.email?.trim()) &&
    Boolean(user?.phoneNumber?.trim());

  if (!open) return null;

  const navigation = [
    ["/", t("command.home"), <Home className="size-4" />],
    ["/boats", t("nav.find"), <Search className="size-4" />],
    ["/how-it-works", t("nav.how"), <ShipWheel className="size-4" />],
    ...(user ? [["/saved", t("nav.saved"), <Heart className="size-4" />] as const] : []),
    ["/messages", t("command.messages"), <MessageCircle className="size-4" />],
    ...(isAdminUser(user)
      ? [["/admin", t("nav.admin"), <ShieldCheck className="size-4" />] as const]
      : []),
    ["/safety", t("footer.safety"), <ShieldCheck className="size-4" />],
    ["/support", t("footer.support"), <LifeBuoy className="size-4" />],
    ["/terms", t("footer.terms"), <Anchor className="size-4" />],
  ] as const;

  const contextualItems: ReactNode[] = [];

  if (import.meta.env.DEV) {
    if (boatId) {
      const isSaved = saved.includes(boatId);
      contextualItems.push(
        <CommandItem
          key="copy-boat-id"
          onSelect={() =>
            run(() => {
              void navigator.clipboard?.writeText(boatId);
            })
          }
        >
          <ClipboardCopy className="size-4" />
          Copy boat ID
          <StatusBadge>{boatId}</StatusBadge>
        </CommandItem>,
        <CommandItem
          key="toggle-saved"
          onSelect={() =>
            run(() => {
              if (!user) {
                openAuth("signup");
                return;
              }
              toggleSaved(boatId);
            })
          }
        >
          <Heart className="size-4" />
          {isSaved ? "Remove from saved" : "Save this sit"}
        </CommandItem>,
        <CommandItem
          key="review-applications"
          onSelect={() => run(() => navigate(`/owner/sits/${boatId}/applications`))}
        >
          <Users className="size-4" />
          Review applications for this sit
        </CommandItem>,
      );
    }

    if (onOwnerDashboard && user) {
      const ownerTab = getOwnerDashboardTab();
      if (ownerTab === "boats") {
        contextualItems.push(
          <CommandItem
            key="add-boat"
            onSelect={() => run(() => navigate("/owner/boats/new"))}
          >
            <Plus className="size-4" />
            Add a boat
          </CommandItem>,
          <CommandItem
            key="create-random-boat"
            onSelect={() =>
              run(() => {
                void (async () => {
                  await createDevRandomVessel({
                    name: user.name,
                    image: user.image,
                    languages: user.languages,
                  });
                  await queryClient.invalidateQueries({ queryKey: ["vessels"] });
                  await queryClient.invalidateQueries({ queryKey: ["boats"] });
                })();
              })
            }
          >
            <ShipWheel className="size-4" />
            Create random boat
          </CommandItem>,
        );
      } else {
        contextualItems.push(
          <CommandItem
            key="create-sit"
            onSelect={() =>
              run(() => {
                navigate("/owner/sits/new");
              })
            }
          >
            <ShipWheel className="size-4" />
            Create a sit
          </CommandItem>,
          <CommandItem
            key="create-random-stay"
            onSelect={() =>
              run(() => {
                void (async () => {
                  if (readOwnedBoatCount(user.name) === 0) {
                    await createDevRandomVessel({
                      name: user.name,
                      image: user.image,
                      languages: user.languages,
                    });
                  }
                  await createDevRandomSit({
                    name: user.name,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                  });
                  await queryClient.invalidateQueries({ queryKey: ["vessels"] });
                  await queryClient.invalidateQueries({ queryKey: ["sits"] });
                  await queryClient.invalidateQueries({ queryKey: ["boats"] });
                })();
              })
            }
          >
            <CalendarPlus className="size-4" />
            Create random stay
          </CommandItem>,
        );
      }
    }

    if (onOwnerNewBoat) {
      contextualItems.push(
        <CommandItem
          key="back-owner"
          onSelect={() => run(() => navigate("/owner/boats"))}
        >
          <Anchor className="size-4" />
          Back to boat dashboard
        </CommandItem>,
      );
    }

    if (applicationSitId) {
      contextualItems.push(
        <CommandItem
          key="view-listing"
          onSelect={() =>
            run(() => navigate(`/boats/${applicationBoatId ?? applicationSitId}`))
          }
        >
          <MapPin className="size-4" />
          View public listing
        </CommandItem>,
        <CommandItem
          key="copy-sit-id"
          onSelect={() =>
            run(() => {
              void navigator.clipboard?.writeText(applicationSitId);
            })
          }
        >
          <ClipboardCopy className="size-4" />
          Copy sit ID
          <StatusBadge>{applicationSitId}</StatusBadge>
        </CommandItem>,
      );
    }

    if (editBoatId) {
      contextualItems.push(
        <CommandItem
          key="view-edited-boat"
          onSelect={() => run(() => navigate(`/boats/${editBoatId}`))}
        >
          <MapPin className="size-4" />
          View public listing
        </CommandItem>,
      );
    }

    if (viewingOtherMember && memberParam) {
      contextualItems.push(
        <CommandItem
          key="login-as-member"
          onSelect={() =>
            run(() =>
              loginAs({
                name: memberParam,
                image: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(memberParam)}`,
              }),
            )
          }
        >
          <Users className="size-4" />
          Log in as {memberParam}
        </CommandItem>,
      );
    }

    if (onSaved && saved.length > 0) {
      contextualItems.push(
        <CommandItem
          key="clear-saved"
          onSelect={() =>
            run(() => {
              for (const id of [...saved]) toggleSaved(id);
            })
          }
        >
          <Eraser className="size-4" />
          Clear all saved sits
          <StatusBadge>{saved.length}</StatusBadge>
        </CommandItem>,
      );
    }

    if (onSettings && user) {
      contextualItems.push(
        <CommandItem
          key="settings-demo-phone"
          onSelect={() =>
            run(() =>
              updateProfile({
                phoneNumber: DEMO_PHONE,
                phoneCountryCode: DEMO_PHONE_COUNTRY,
              }),
            )
          }
        >
          <Phone className="size-4" />
          Fill demo phone number
        </CommandItem>,
        <CommandItem
          key="settings-clear-phone"
          onSelect={() => run(() => updateProfile({ phoneNumber: "" }))}
        >
          <Eraser className="size-4" />
          Clear phone number
        </CommandItem>,
        <CommandItem
          key="settings-confirm-email"
          onSelect={() => run(() => updateProfile({ emailConfirmed: true }))}
        >
          <Check className="size-4" />
          Mark email confirmed
        </CommandItem>,
        <CommandItem
          key="settings-unconfirm-email"
          onSelect={() => run(() => updateProfile({ emailConfirmed: false }))}
        >
          <Eraser className="size-4" />
          Mark email unconfirmed
        </CommandItem>,
      );
    }

    if (onMessages) {
      contextualItems.push(
        <CommandItem
          key="go-applications-owner"
          onSelect={() => run(() => navigate("/owner/boats"))}
        >
          <Anchor className="size-4" />
          Open boat dashboard
        </CommandItem>,
      );
    }
  }

  return (
    <div className="fixed inset-0 z-80 flex items-start justify-center px-4 pt-[12vh]">
      <button
        aria-label={t("command.close")}
        className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
        onClick={close}
        type="button"
      />
      <Command
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-float"
        label={t("command.label")}
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 text-slate" />
          <Command.Input
            autoFocus
            className="w-full bg-transparent py-4 text-sm text-navy outline-none placeholder:text-slate"
            placeholder={t("command.placeholder")}
          />
        </div>
        <Command.List className="max-h-96 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center text-sm text-slate">
            {t("command.empty")}
          </Command.Empty>
          {import.meta.env.DEV && contextualItems.length > 0 && (
            <CommandGroup heading="This page">{contextualItems}</CommandGroup>
          )}
          <CommandGroup heading={t("command.navigation")}>
            {navigation.map(([path, label, icon]) => (
              <CommandItem key={path} onSelect={() => run(() => navigate(path))}>
                {icon}
                {label}
              </CommandItem>
            ))}
            {user && (
              <>
                <CommandItem onSelect={() => run(() => navigate("/members/me"))}>
                  <UserRound className="size-4" />
                  {t("command.profile")}
                </CommandItem>
                <CommandItem onSelect={() => run(() => navigate("/settings"))}>
                  <Settings className="size-4" />
                  {t("settings.title")}
                </CommandItem>
                <CommandItem onSelect={() => run(() => navigate("/owner/boats"))}>
                  <Anchor className="size-4" />
                  {t("nav.manage")}
                </CommandItem>
              </>
            )}
          </CommandGroup>
          <CommandGroup heading={t("command.account")}>
            {user ? (
              <CommandItem onSelect={() => run(logout)}>
                <LogOut className="size-4" />
                {t("nav.logout")}
              </CommandItem>
            ) : (
              <>
                <CommandItem onSelect={() => run(() => openAuth("login"))}>
                  <LogIn className="size-4" />
                  {t("nav.login")}
                </CommandItem>
                <CommandItem onSelect={() => run(() => openAuth("signup"))}>
                  <UserRound className="size-4" />
                  {t("auth.signupTab")}
                </CommandItem>
              </>
            )}
          </CommandGroup>
          {import.meta.env.DEV && (
            <>
              <CommandGroup heading="Feature flags">
                {FEATURE_FLAG_KEYS.map((key) => (
                  <FeatureFlagCommandItem key={key} flagKey={key} />
                ))}
                <CommandItem onSelect={() => useFeatureFlagStore.getState().resetFlags()}>
                  <RotateCcw className="size-4" />
                  Reset feature flags
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Developer tools">
                <CommandItem
                  onSelect={() =>
                    run(() =>
                      loginAs({
                        email: "alex.morgan@boatstead.mock",
                        image: "https://i.pravatar.cc/160?img=11",
                        name: "Alex Morgan",
                      }),
                    )
                  }
                >
                  <Users className="size-4 shrink-0" />
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    Use Alex Morgan persona
                    <StatusBadge>Sitter</StatusBadge>
                  </span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    run(() =>
                      loginAs({
                        email: "maya.finn@boatstead.mock",
                        image: "https://i.pravatar.cc/160?img=47",
                        name: "Maya & Finn",
                      }),
                    )
                  }
                >
                  <Users className="size-4 shrink-0" />
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    Use Maya & Finn persona
                    <StatusBadge>Owner</StatusBadge>
                  </span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    run(() =>
                      loginAs({
                        email: "admin@boatstead.mock",
                        image: "https://api.dicebear.com/9.x/initials/svg?seed=Admin",
                        name: "Boatstead Admin",
                      }),
                    )
                  }
                >
                  <ShieldCheck className="size-4 shrink-0" />
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    Use Admin persona
                    <StatusBadge>Admin</StatusBadge>
                  </span>
                </CommandItem>
                {user && (
                  <>
                    <CommandItem
                      onSelect={() =>
                        run(() => {
                          setMockVerificationStatus(user.name, "verified");
                          updateProfile({
                            phoneNumber: user.phoneNumber.trim() || DEMO_PHONE,
                            phoneCountryCode: user.phoneCountryCode || DEMO_PHONE_COUNTRY,
                          });
                          void refreshVerificationQueries();
                        })
                      }
                    >
                      <ShieldCheck className="size-4 shrink-0" />
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                        Make current user verified
                        <StatusBadge tone={isFullyVerifiedNow ? "on" : "off"}>
                          {isFullyVerifiedNow ? "Verified" : "Unverified"}
                        </StatusBadge>
                      </span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() =>
                        run(() => {
                          setMockVerificationStatus(user.name, "unverified");
                          updateProfile({ phoneNumber: "" });
                          void refreshVerificationQueries();
                        })
                      }
                    >
                      <ShieldOff className="size-4 shrink-0" />
                      Make current user unverified
                    </CommandItem>
                    <CommandItem
                      onSelect={() =>
                        run(() => {
                          updateProfile({
                            phoneNumber: DEMO_PHONE,
                            phoneCountryCode: DEMO_PHONE_COUNTRY,
                          });
                          void refreshVerificationQueries();
                        })
                      }
                    >
                      <Phone className="size-4" />
                      Fill demo phone number
                      {user.phoneNumber.trim() ? (
                        <StatusBadge tone="on">Set</StatusBadge>
                      ) : (
                        <StatusBadge tone="off">Missing</StatusBadge>
                      )}
                    </CommandItem>
                    <CommandItem
                      onSelect={() =>
                        run(() => {
                          updateProfile({ phoneNumber: "" });
                          void refreshVerificationQueries();
                        })
                      }
                    >
                      <Eraser className="size-4" />
                      Clear phone number
                    </CommandItem>
                  </>
                )}
                <CommandItem onSelect={() => run(() => navigate("/boats/solstice"))}>
                  <MapPin className="size-4" />
                  Open Solstice listing
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    run(() => {
                      void navigator.clipboard?.writeText(
                        `${window.location.origin}${location.pathname}${location.search}`,
                      );
                    })
                  }
                >
                  <ClipboardCopy className="size-4" />
                  Copy current URL
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    run(() => {
                      void queryClient.invalidateQueries();
                    })
                  }
                >
                  <RotateCcw className="size-4" />
                  Refresh all queries
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </Command.List>
      </Command>
    </div>
  );
}

function FeatureFlagCommandItem({ flagKey }: { flagKey: FeatureFlagKey }) {
  const enabled = useFeatureFlag(flagKey);
  const toggleFlag = useFeatureFlagStore((state) => state.toggleFlag);
  const definition = FEATURE_FLAGS[flagKey];

  return (
    <CommandItem onSelect={() => toggleFlag(flagKey)}>
      <Flag className="size-4 shrink-0" />
      <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate">{definition.label}</span>
          <span className="block truncate text-xs font-normal text-slate">{definition.description}</span>
        </span>
        <StatusBadge tone={enabled ? "on" : "off"}>{enabled ? "On" : "Off"}</StatusBadge>
      </span>
    </CommandItem>
  );
}

function CommandGroup({ children, heading }: { children: ReactNode; heading: string }) {
  return (
    <Command.Group
      className="**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-bold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-slate"
      heading={heading}
    >
      {children}
    </Command.Group>
  );
}

function CommandItem({ children, onSelect }: { children: ReactNode; onSelect: () => void }) {
  return (
    <Command.Item
      className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-navy outline-none data-[selected=true]:bg-seafoam"
      onSelect={onSelect}
    >
      {children}
    </Command.Item>
  );
}

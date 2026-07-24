import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Command } from "cmdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Anchor,
  CalendarPlus,
  Check,
  ClipboardCopy,
  Eraser,
  Flag,
  Heart,
  Home,
  KeyRound,
  LifeBuoy,
  LogIn,
  LogOut,
  UserPlus,
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
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import {
  FEATURE_FLAG_KEYS,
  FEATURE_FLAGS,
  useFeatureFlag,
  type FeatureFlagKey,
} from "@/featureFlags";
import { useFeatureFlagStore } from "@/featureFlagStore";
import { createDevRandomSit, createDevRandomVessel } from "@/mockApi";
import {
  clearStoredDevSecret,
  createRandomBoat,
  deleteAllTestUsers,
  deleteTestUser,
  devLoginAs,
  freshTestUser,
  getStoredDevSecret,
  isDevTestUserEmail,
  listTestUsers,
  setStoredDevSecret,
  useDevToolsStatus,
} from "@/devLogin";
import { isAdminUser } from "@/adminAccess";
import { useAppStore } from "@/store";
import { queries } from "@/queries";
import { getVerificationStatusSync, setMockVerificationStatus } from "@/verificationService";

const DEMO_PHONE = "5550100100";
const DEMO_PHONE_COUNTRY = "+1";

function openAuth(mode: "login" | "signup") {
  window.dispatchEvent(new CustomEvent("open-auth", { detail: mode }));
}

/** Avatar thumbnail for a test-user row; falls back to a person glyph. */
function TestUserAvatar({ src }: { src?: string | null }) {
  if (!src) return <UserRound className="size-5 shrink-0" />;
  return (
    <img
      alt=""
      src={src}
      className="size-6 shrink-0 rounded-full border border-line object-cover"
    />
  );
}

function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "on" | "off";
}) {
  let toneClass = "bg-cream text-slate";
  if (tone === "on") toneClass = "bg-seafoam text-teal";
  else if (tone === "off") toneClass = "bg-coral/10 text-coral";
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
    await queryClient.invalidateQueries({ queryKey: queries.verification.getQueryKey() });
    await queryClient.invalidateQueries({ queryKey: queries.verificationChecks.getQueryKey() });
  }

  const boatMatch = matchPath("/boats/:id", location.pathname);
  const applicationsMatch = matchPath("/owner/sits/:sitId/applications", location.pathname);
  const vesselEditMatch = matchPath("/owner/boats/:boatId/edit", location.pathname);
  const memberMatch = matchPath("/members/:id", location.pathname);
  const onOwnerDashboard = Boolean(
    matchPath("/my-boats", location.pathname) || matchPath("/my-sits", location.pathname),
  );
  const onOwnerNewBoat = Boolean(matchPath("/owner/boats/new", location.pathname));
  const onSaved = Boolean(matchPath("/saved", location.pathname));
  const onSettings = Boolean(matchPath("/settings", location.pathname));
  const onMessages = Boolean(matchPath("/messages", location.pathname));
  const boatId = boatMatch?.params.id;
  const applicationSitId = applicationsMatch?.params.sitId;

  const { data: sits = [] } = useQuery({
    ...queries.sits.all,
    enabled: open && Boolean(applicationSitId || user),
  });
  const { data: vessels = [] } = useQuery({
    ...queries.vessels.all,
    enabled: open && Boolean(user),
  });

  // Whether the real (session-backed) dev test-user tools are available here.
  // Enabled on any non-prod env that answers /api/dev/status (local + staging);
  // false on prod. Only queried while the palette is open.
  const devTools = useDevToolsStatus(open);

  // Reactive read of the cached dev secret (bumped when it's set/cleared).
  const [secretBump, setSecretBump] = useState(0);
  const hasStoredSecret = useMemo(() => Boolean(getStoredDevSecret()), [secretBump, open]);

  // On prod the tool exists for everyone (secret-gated server-side), but we only
  // SHOW it once a secret has been entered — so ordinary visitors never see the
  // dev group. On local/staging it shows whenever the endpoint is reachable.
  const showTestUserTools =
    devTools.enabled && (devTools.environment !== "production" || hasStoredSecret);
  const showProdUnlock =
    devTools.enabled && devTools.environment === "production" && !hasStoredSecret;

  // Load the test-user list, but don't trigger a secret prompt just by opening
  // the palette: only fetch when no secret is required or one is already cached.
  const canListTestUsers =
    open && showTestUserTools && (!devTools.requiresSecret || hasStoredSecret);
  const { data: testUsers = [] } = useQuery({
    queryKey: ["dev-test-users"],
    enabled: canListTestUsers,
    retry: false,
    queryFn: async () => {
      const result = await listTestUsers(devTools.requiresSecret);
      return result.ok ? result.data : [];
    },
  });

  async function createFreshTestUser() {
    const { email, name, image } = freshTestUser();
    const result = await devLoginAs({
      email,
      name,
      image,
      requiresSecret: devTools.requiresSecret,
    });
    if (result.ok) {
      window.location.reload();
      return;
    }
    // needSecret already cleared any bad cached secret; surface the reason.
    window.alert(result.error);
  }

  async function createRandomTestBoat() {
    const result = await createRandomBoat();
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: queries.vessels.all.queryKey });
    await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
    navigate("/my-boats");
  }

  async function switchToTestUser(testEmail: string, testName: string) {
    const result = await devLoginAs({
      email: testEmail,
      name: testName,
      requiresSecret: devTools.requiresSecret,
    });
    if (result.ok) {
      window.location.reload();
      return;
    }
    window.alert(result.error);
  }

  async function removeTestUser(id: string, label: string) {
    if (!window.confirm(`Delete test user "${label}" and all their data?`)) return;
    const result = await deleteTestUser(id, devTools.requiresSecret);
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["dev-test-users"] });
  }

  async function removeAllTestUsers() {
    if (!window.confirm(`Delete ALL ${testUsers.length} test user(s) and their data?`)) return;
    const result = await deleteAllTestUsers(devTools.requiresSecret);
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["dev-test-users"] });
  }

  const applicationBoatId = applicationSitId
    ? sits.find((sit) => sit.id === applicationSitId)?.boatId
    : undefined;
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
    ["/sitters", t("nav.findSitter"), <Users className="size-4" />],
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
      const ownerTab = matchPath("/my-boats", location.pathname) ? "boats" : "sits";
      if (ownerTab === "boats") {
        contextualItems.push(
          <CommandItem key="add-boat" onSelect={() => run(() => navigate("/owner/boats/new"))}>
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
                  await queryClient.invalidateQueries({ queryKey: queries.vessels.all.queryKey });
                  await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
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
                  const ownedCount = vessels.filter((vessel) => vessel.owner === user.name).length;
                  if (ownedCount === 0) {
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
                  await queryClient.invalidateQueries({ queryKey: queries.vessels.all.queryKey });
                  await queryClient.invalidateQueries({ queryKey: queries.sits.all.queryKey });
                  await queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
                })();
              })
            }
          >
            <CalendarPlus className="size-4" />
            Create random sit
          </CommandItem>,
        );
      }
    }

    if (onOwnerNewBoat) {
      contextualItems.push(
        <CommandItem key="back-owner" onSelect={() => run(() => navigate("/my-boats"))}>
          <Anchor className="size-4" />
          Back to boat dashboard
        </CommandItem>,
      );
    }

    if (applicationSitId) {
      contextualItems.push(
        <CommandItem
          key="view-listing"
          onSelect={() => run(() => navigate(`/boats/${applicationBoatId ?? applicationSitId}`))}
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
        <CommandItem key="go-applications-owner" onSelect={() => run(() => navigate("/my-sits"))}>
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
                <CommandItem onSelect={() => run(() => navigate("/my-sits"))}>
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
          {showProdUnlock && (
            <CommandGroup heading="Test users (real session)">
              <CommandItem
                onSelect={() => {
                  const next = window.prompt("Enter the dev login secret to unlock:");
                  if (next == null) return;
                  if (next.trim()) {
                    setStoredDevSecret(next.trim());
                    setSecretBump((n) => n + 1);
                  }
                }}
              >
                <KeyRound className="size-4 shrink-0" />
                Unlock test users (enter secret)
              </CommandItem>
            </CommandGroup>
          )}
          {showTestUserTools && (
            <CommandGroup heading="Test users (real session)">
              <CommandItem onSelect={() => run(() => void createFreshTestUser())}>
                <UserPlus className="size-4 shrink-0" />
                <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  Create fresh test user
                  <StatusBadge tone="on">Real login</StatusBadge>
                </span>
              </CommandItem>
              {isDevTestUserEmail(user?.email) && (
                <CommandItem onSelect={() => run(() => void createRandomTestBoat())}>
                  <ShipWheel className="size-4 shrink-0" />
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    Create random boat
                    <StatusBadge>for {user?.name}</StatusBadge>
                  </span>
                </CommandItem>
              )}
              {testUsers.length > 0 && (
                <CommandItem onSelect={() => run(() => void removeAllTestUsers())}>
                  <Trash2 className="size-4 shrink-0" />
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    Delete all test users
                    <StatusBadge tone="off">{testUsers.length}</StatusBadge>
                  </span>
                </CommandItem>
              )}
              {devTools.requiresSecret && (
                <CommandItem
                  onSelect={() =>
                    run(() => {
                      const next = window.prompt("Set the dev login secret (blank = clear):");
                      if (next == null) return;
                      if (next.trim()) setStoredDevSecret(next.trim());
                      else clearStoredDevSecret();
                      setSecretBump((n) => n + 1);
                    })
                  }
                >
                  <KeyRound className="size-4 shrink-0" />
                  Set / clear dev login secret
                </CommandItem>
              )}
            </CommandGroup>
          )}
          {showTestUserTools && testUsers.length > 0 && (
            <CommandGroup heading="Switch to test user">
              {testUsers.map((testUser) => (
                <CommandItem
                  key={`switch-${testUser.id}`}
                  onSelect={() =>
                    run(
                      () => void switchToTestUser(testUser.email, testUser.name || testUser.email),
                    )
                  }
                >
                  <TestUserAvatar src={testUser.image} />
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate">{testUser.name || testUser.email}</span>
                      <span className="block truncate text-xs font-normal text-slate">
                        {testUser.email}
                      </span>
                    </span>
                    {user?.email?.toLowerCase() === testUser.email.toLowerCase() && (
                      <StatusBadge tone="on">Current</StatusBadge>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {showTestUserTools && testUsers.length > 0 && (
            <CommandGroup heading="Delete a test user">
              {testUsers.map((testUser) => (
                <CommandItem
                  key={testUser.id}
                  onSelect={() =>
                    run(() => void removeTestUser(testUser.id, testUser.name || testUser.email))
                  }
                >
                  <TestUserAvatar src={testUser.image} />
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate">{testUser.name || testUser.email}</span>
                      <span className="block truncate text-xs font-normal text-slate">
                        {testUser.email}
                      </span>
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
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
                <CommandItem
                  onSelect={() =>
                    run(() => {
                      queryClient.clear();
                    })
                  }
                >
                  <Eraser className="size-4" />
                  Clear all React Query caches
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
          <span className="block truncate text-xs font-normal text-slate">
            {definition.description}
          </span>
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

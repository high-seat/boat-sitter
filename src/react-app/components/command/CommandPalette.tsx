import { useEffect, useRef, useState, type ReactNode } from "react";
import { Command } from "cmdk";
import {
  Anchor,
  Heart,
  Home,
  LifeBuoy,
  LogIn,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";

function openAuth(mode: "login" | "signup") {
  window.dispatchEvent(new CustomEvent("open-auth", { detail: mode }));
}

export function CommandPalette() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const loginAs = useAppStore((state) => state.loginAs);
  const logout = useAppStore((state) => state.logout);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        triggerRef.current = document.activeElement as HTMLElement;
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function close() {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus());
  }

  function run(action: () => void) {
    close();
    action();
  }

  if (!open) return null;
  const navigation = [
    ["/", t("command.home"), <Home className="size-4" />],
    ["/boats", t("nav.find"), <Search className="size-4" />],
    ["/saved", t("nav.saved"), <Heart className="size-4" />],
    ["/messages", t("command.messages"), <MessageCircle className="size-4" />],
    ["/safety", t("footer.safety"), <ShieldCheck className="size-4" />],
    ["/support", t("footer.support"), <LifeBuoy className="size-4" />],
    ["/terms", t("footer.terms"), <Anchor className="size-4" />],
  ] as const;

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
            <CommandGroup heading={t("command.developer")}>
              <CommandItem
                onSelect={() =>
                  run(() =>
                    loginAs({
                      image: "https://i.pravatar.cc/160?img=11",
                      name: "Alex Morgan",
                    }),
                  )
                }
              >
                <Users className="size-4" />
                {t("command.useAlex")}
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  run(() =>
                    loginAs({
                      image: "https://i.pravatar.cc/160?img=47",
                      name: "Maya & Finn",
                    }),
                  )
                }
              >
                <Users className="size-4" />
                {t("command.useMayaFinn")}
              </CommandItem>
            </CommandGroup>
          )}
        </Command.List>
      </Command>
    </div>
  );
}

function CommandGroup({ children, heading }: { children: ReactNode; heading: string }) {
  return (
    <Command.Group
      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate"
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

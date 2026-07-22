import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, ShieldAlert, ShieldCheck, Trash2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isAdminUser } from "@/adminAccess";
import {
  deleteAdminUser,
  listAdminAuditLog,
  listAdminUsers,
  updateAdminUser,
  type AdminUser,
  type AdminUserStatus,
} from "@/adminApi";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AdminAuditSkeleton, AdminPageSkeleton } from "@/components/ui/AdminPageSkeleton";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { getIntlLocale } from "@/i18n";
import { useAppStore } from "@/store";
import type { UserRole } from "@/adminAccess";

function openAuth(mode: "login" | "signup") {
  window.dispatchEvent(new CustomEvent("open-auth", { detail: mode }));
}

type AdminTab = "users" | "audit";

export function AdminPage() {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAppStore((state) => state.user);
  const [tab, setTab] = useState<AdminTab>("users");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [formError, setFormError] = useState("");

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: listAdminUsers,
    enabled: Boolean(user && isAdminUser(user)),
  });

  const auditQuery = useQuery({
    queryKey: ["admin-audit"],
    queryFn: listAdminAuditLog,
    enabled: Boolean(user && isAdminUser(user) && tab === "audit"),
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; patch: Parameters<typeof updateAdminUser>[1] }) =>
      updateAdminUser(input.id, input.patch, {
        email: user!.email,
        name: user!.name,
      }),
    onSuccess: async () => {
      setEditing(null);
      setFormError("");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-audit"] });
    },
    onError: (error: Error) => {
      if (error.message === "ADMIN_CANNOT_DEMOTE_SELF") {
        setFormError(t("admin.error.cannotDemoteSelf"));
      } else if (error.message === "ADMIN_USER_NOT_FOUND") {
        setFormError(t("admin.error.notFound"));
      } else {
        setFormError(t("admin.error.generic"));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      deleteAdminUser(id, {
        email: user!.email,
        name: user!.name,
      }),
    onSuccess: async () => {
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-audit"] });
    },
  });

  const filteredUsers = useMemo(() => {
    const list = usersQuery.data ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (entry) =>
        entry.name.toLowerCase().includes(needle) ||
        entry.email.toLowerCase().includes(needle) ||
        entry.location.toLowerCase().includes(needle),
    );
  }, [search, usersQuery.data]);

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <ShieldCheck className="mx-auto text-teal" size={42} />
        <h1 className="mt-5 font-display text-3xl font-extrabold text-navy">
          {t("admin.signInTitle")}
        </h1>
        <p className="mt-3 text-slate">{t("admin.signInText")}</p>
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

  if (!isAdminUser(user)) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <ShieldAlert className="mx-auto text-coral" size={42} />
        <h1 className="mt-5 font-display text-3xl font-extrabold text-navy">
          {t("admin.deniedTitle")}
        </h1>
        <p className="mt-3 text-slate">{t("admin.deniedText")}</p>
      </main>
    );
  }

  const locale = getIntlLocale(i18n.resolvedLanguage);

  return (
    <main className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
      <h1 className="section-title">{t("admin.title")}</h1>
      <p className="mt-3 max-w-2xl text-slate">{t("admin.subtitle")}</p>

      <div className="mt-8 flex w-fit gap-1 rounded-xl bg-seafoam p-1">
        {(
          [
            ["users", t("admin.tab.users")],
            ["audit", t("admin.tab.audit")],
          ] as const
        ).map(([id, label]) => (
          <button
            aria-pressed={tab === id}
            className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${
              tab === id ? "bg-white text-navy shadow-sm" : "text-slate hover:text-navy"
            }`}
            key={id}
            onClick={() => setTab(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "users" ? (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <label className="sr-only" htmlFor="admin-user-search">
              {t("admin.searchPlaceholder")}
            </label>
            <input
              className="form-input w-full max-w-md"
              id="admin-user-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("admin.searchPlaceholder")}
              type="search"
              value={search}
            />
            {!usersQuery.isLoading ? (
              <p className="text-sm font-semibold text-slate">
                {t("admin.usersCount", { count: filteredUsers.length })}
              </p>
            ) : null}
          </div>

          {usersQuery.isLoading ? <AdminPageSkeleton /> : null}
          {!usersQuery.isLoading && filteredUsers.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
              <Users className="mx-auto text-teal" size={36} />
              <p className="mt-4 font-bold text-navy">{t("admin.usersEmpty")}</p>
            </div>
          ) : null}
          {!usersQuery.isLoading && filteredUsers.length > 0 ? (
            <ul className="mt-6 space-y-3">
              {filteredUsers.map((entry) => (
                <li
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-card"
                  key={entry.id}
                >
                  <img alt="" className="size-12 rounded-full object-cover" src={entry.image} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy">{entry.name}</p>
                    <p className="truncate text-sm text-slate">{entry.email}</p>
                    {entry.location ? (
                      <p className="mt-0.5 text-sm text-slate">{entry.location}</p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-seafoam px-3 py-1 text-xs font-bold text-teal">
                    {t(`admin.role.${entry.role}`)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      entry.status === "active" ? "bg-cream text-navy" : "bg-coral/10 text-coral"
                    }`}
                  >
                    {t(`admin.status.${entry.status}`)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      aria-label={t("admin.editUser")}
                      className="rounded-xl border border-line p-2.5 text-navy hover:bg-cream"
                      onClick={() => {
                        setFormError("");
                        setEditing(entry);
                      }}
                      type="button"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      aria-label={t("admin.deleteUser")}
                      className="rounded-xl border border-line p-2.5 text-coral hover:bg-coral/5 disabled:opacity-40"
                      disabled={entry.email.toLowerCase() === user.email.toLowerCase()}
                      onClick={() => setDeleting(entry)}
                      type="button"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
      {tab !== "users" && auditQuery.isLoading ? <AdminAuditSkeleton /> : null}
      {tab !== "users" && !auditQuery.isLoading && (auditQuery.data?.length ?? 0) === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
          <ShieldCheck className="mx-auto text-teal" size={36} />
          <p className="mt-4 font-bold text-navy">{t("admin.auditEmpty")}</p>
        </div>
      ) : null}
      {tab !== "users" && !auditQuery.isLoading && (auditQuery.data?.length ?? 0) > 0 ? (
        <ul className="mt-8 space-y-3">
          {auditQuery.data!.map((entry) => (
            <li className="rounded-2xl border border-line bg-white p-4 shadow-card" key={entry.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-navy">{t(`admin.audit.action.${entry.action}`)}</p>
                <time className="text-sm text-slate" dateTime={entry.at}>
                  {new Date(entry.at).toLocaleString(locale)}
                </time>
              </div>
              <p className="mt-2 text-sm text-slate">
                {t("admin.audit.actor")}: {entry.actorName} ({entry.actorEmail})
              </p>
              <p className="mt-1 text-sm text-slate">
                {t("admin.audit.target")}: {entry.targetName} ({entry.targetEmail})
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {editing ? (
        <AdminUserEditModal
          error={formError}
          pending={updateMutation.isPending}
          onClose={() => {
            if (!updateMutation.isPending) {
              setEditing(null);
              setFormError("");
            }
          }}
          onSave={(patch) => updateMutation.mutate({ id: editing.id, patch })}
          user={editing}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          cancelLabel={t("common.cancel")}
          confirmLabel={deleteMutation.isPending ? t("admin.deleting") : t("admin.deleteConfirm")}
          onCancel={() => {
            if (!deleteMutation.isPending) setDeleting(null);
          }}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          pending={deleteMutation.isPending}
          text={t("admin.deleteConfirmText", { name: deleting.name })}
          title={t("admin.deleteConfirmTitle")}
          tone="danger"
        />
      ) : null}
    </main>
  );
}

function AdminUserEditModal({
  user,
  pending,
  error,
  onClose,
  onSave,
}: {
  user: AdminUser;
  pending: boolean;
  error: string;
  onClose: () => void;
  onSave: (patch: {
    name: string;
    email: string;
    location: string;
    bio: string;
    role: UserRole;
    status: AdminUserStatus;
    memberSince: number;
  }) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [location, setLocation] = useState(user.location);
  const [bio, setBio] = useState(user.bio);
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<AdminUserStatus>(user.status);
  const [memberSince, setMemberSince] = useState(String(user.memberSince));

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setLocation(user.location);
    setBio(user.bio);
    setRole(user.role);
    setStatus(user.status);
    setMemberSince(String(user.memberSince));
  }, [user]);

  return (
    <Modal onClose={onClose} pending={pending} title={t("admin.editUser")} wide>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const year = Number.parseInt(memberSince, 10);
          onSave({
            name: name.trim(),
            email: email.trim(),
            location: location.trim(),
            bio: bio.trim(),
            role,
            status,
            memberSince: Number.isFinite(year) ? year : user.memberSince,
          });
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-navy">{t("admin.field.name")}</span>
          <input
            className="form-input w-full"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-navy">{t("admin.field.email")}</span>
          <input
            className="form-input w-full"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-navy">
            {t("admin.field.location")}
          </span>
          <input
            className="form-input w-full"
            onChange={(event) => setLocation(event.target.value)}
            value={location}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-navy">{t("admin.field.bio")}</span>
          <textarea
            className="form-input min-h-24 w-full"
            onChange={(event) => setBio(event.target.value)}
            value={bio}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-navy">
              {t("admin.field.role")}
            </span>
            <Select
              onChange={(event) => setRole(event.target.value as UserRole)}
              value={role}
              variant="form"
            >
              <option value="member">{t("admin.role.member")}</option>
              <option value="admin">{t("admin.role.admin")}</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-navy">
              {t("admin.field.status")}
            </span>
            <Select
              onChange={(event) => setStatus(event.target.value as AdminUserStatus)}
              value={status}
              variant="form"
            >
              <option value="active">{t("admin.status.active")}</option>
              <option value="disabled">{t("admin.status.disabled")}</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-navy">
              {t("admin.field.memberSince")}
            </span>
            <input
              className="form-input w-full"
              inputMode="numeric"
              onChange={(event) => setMemberSince(event.target.value)}
              value={memberSince}
            />
          </label>
        </div>
        {error ? <p className="text-sm font-semibold text-coral">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            className="rounded-xl border border-line px-5 py-3 font-bold text-navy"
            disabled={pending}
            onClick={onClose}
            type="button"
          >
            {t("common.cancel")}
          </button>
          <button
            className="rounded-xl bg-navy px-5 py-3 font-bold text-white hover:bg-ink disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? t("common.saving") : t("admin.saveUser")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getIntlLocale } from "@/i18n";
import type { SitApplication } from "@/mockApi";

export function ConversationPanel({
  application,
  currentUser,
  onSend,
  pending,
}: {
  application: SitApplication;
  currentUser: string;
  onSend: (message: string) => void;
  pending: boolean;
}) {
  const { i18n, t } = useTranslation();
  const [reply, setReply] = useState("");

  useEffect(() => setReply(""), [application.id]);

  const formatter = new Intl.DateTimeFormat(getIntlLocale(i18n.language), {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section className="rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-display text-lg font-bold text-navy">
          {t("applications.conversation")}
        </h2>
      </div>
      <div className="max-h-96 space-y-4 overflow-y-auto p-5">
        {application.messages.map((message) => {
          const mine = message.senderName === currentUser;
          return (
            <div className={`flex ${mine ? "justify-end" : "justify-start"}`} key={message.id}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  mine ? "bg-navy text-white" : "bg-cream text-navy"
                }`}
              >
                <p className={`text-xs font-bold ${mine ? "text-aqua" : "text-teal"}`}>
                  {message.senderName}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                <p className={`mt-2 text-[11px] ${mine ? "text-white/60" : "text-slate"}`}>
                  {formatter.format(new Date(message.createdAt))}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-line p-4">
        <label>
          <span className="sr-only">{t("applications.reply")}</span>
          <textarea
            className="form-input min-h-24 resize-y"
            onChange={(event) => setReply(event.target.value)}
            placeholder={t("applications.replyPlaceholder")}
            value={reply}
          />
        </label>
        <button
          className="mt-3 flex items-center gap-2 rounded-xl bg-coral px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          disabled={pending || !reply.trim()}
          onClick={() => {
            onSend(reply.trim());
            setReply("");
          }}
          type="button"
        >
          <Send size={16} />
          {pending ? t("applications.sending") : t("applications.sendReply")}
        </button>
      </div>
    </section>
  );
}

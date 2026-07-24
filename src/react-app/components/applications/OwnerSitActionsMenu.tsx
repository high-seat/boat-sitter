import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as Popover from "@radix-ui/react-popover";
import { Ban, CircleCheck, Ellipsis, Eye, Flag, Pencil, Trash2 } from "lucide-react";
import type { SitPhase } from "@/dateUtils";
import { IconTooltip } from "@/components/ui/IconTooltip";
import { ownerSitActionsForPhase, type OwnerSitActionId } from "@/ownerSitActions";

type OwnerSitActionsMenuProps = {
  sitId: string;
  phase: SitPhase;
  /** When true, Edit is shown disabled with a tooltip (applicants already exist). */
  editLocked?: boolean;
  /** Actions already promoted to primary CTAs on this surface. */
  exclude?: readonly OwnerSitActionId[];
  /** Listing cards use a square trigger; sit details uses a pill matching nearby CTAs. */
  triggerShape?: "card" | "pill";
  triggerClassName?: string;
  triggerTestId: string;
  menuTestId: string;
  /** Preserve existing e2e ids that differ between listing and details. */
  actionTestId: (action: OwnerSitActionId) => string;
  stopPropagation?: boolean;
  onEndEarly?: () => void;
  onFlag?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
};

const MENU_ITEM_CLASS =
  "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold hover:bg-cream";

export function OwnerSitActionsMenu({
  sitId,
  phase,
  editLocked = false,
  exclude,
  triggerShape = "card",
  triggerClassName = "",
  triggerTestId,
  menuTestId,
  actionTestId,
  stopPropagation = false,
  onEndEarly,
  onFlag,
  onCancel,
  onDelete,
}: OwnerSitActionsMenuProps) {
  const { t } = useTranslation();
  const actions = ownerSitActionsForPhase(phase, { exclude });
  if (actions.length === 0) return null;

  const triggerClass =
    triggerShape === "pill"
      ? "inline-flex items-center justify-center rounded-full border border-line bg-white px-3.5 py-2.5 text-slate transition hover:border-teal hover:text-navy"
      : "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-line text-slate transition hover:border-teal hover:text-navy";

  function handleTriggerClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (stopPropagation) event.stopPropagation();
  }

  function handleMenuClick(event: React.MouseEvent<HTMLDivElement>) {
    if (stopPropagation) event.stopPropagation();
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          aria-label={t("owner.sitActions")}
          className={`${triggerClass} ${triggerClassName}`}
          data-testid={triggerTestId}
          onClick={handleTriggerClick}
          type="button"
        >
          <Ellipsis aria-hidden="true" size={18} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          avoidCollisions
          className="z-80 min-w-52 overflow-visible rounded-xl border border-line bg-white py-1 shadow-float outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          collisionPadding={12}
          data-testid={menuTestId}
          onClick={handleMenuClick}
          role="menu"
          side="bottom"
          sideOffset={4}
        >
          {actions.map((action) => {
            if (action === "viewListing") {
              return (
                <Popover.Close asChild key={action}>
                  <Link
                    className={`${MENU_ITEM_CLASS} text-navy`}
                    data-testid={actionTestId(action)}
                    role="menuitem"
                    to={`/boats/${sitId}`}
                  >
                    <Eye aria-hidden="true" className="text-teal" size={15} />
                    {t("sits.viewListing")}
                  </Link>
                </Popover.Close>
              );
            }

            if (action === "edit") {
              if (editLocked) {
                return (
                  <IconTooltip
                    className="w-full cursor-not-allowed"
                    key={action}
                    label={t("owner.sitEditLocked")}
                    side="top"
                    wrap
                  >
                    <button
                      className={`${MENU_ITEM_CLASS} pointer-events-none text-slate opacity-50`}
                      data-testid={actionTestId(action)}
                      disabled
                      role="menuitem"
                      type="button"
                    >
                      <Pencil aria-hidden="true" size={15} />
                      {t("common.edit")}
                    </button>
                  </IconTooltip>
                );
              }
              return (
                <Popover.Close asChild key={action}>
                  <Link
                    className={`${MENU_ITEM_CLASS} text-navy`}
                    data-testid={actionTestId(action)}
                    role="menuitem"
                    to={`/owner/sits/${sitId}/edit`}
                  >
                    <Pencil aria-hidden="true" className="text-teal" size={15} />
                    {t("common.edit")}
                  </Link>
                </Popover.Close>
              );
            }

            if (action === "endEarly") {
              return (
                <Popover.Close asChild key={action}>
                  <button
                    className={`${MENU_ITEM_CLASS} text-navy`}
                    data-testid={actionTestId(action)}
                    onClick={onEndEarly}
                    role="menuitem"
                    type="button"
                  >
                    <CircleCheck aria-hidden="true" className="text-teal" size={15} />
                    {t("owner.endSitEarly")}
                  </button>
                </Popover.Close>
              );
            }

            if (action === "flag") {
              return (
                <Popover.Close asChild key={action}>
                  <button
                    className={`${MENU_ITEM_CLASS} text-coral`}
                    data-testid={actionTestId(action)}
                    onClick={onFlag}
                    role="menuitem"
                    type="button"
                  >
                    <Flag aria-hidden="true" size={15} />
                    {t("sitIssue.flagButton")}
                  </button>
                </Popover.Close>
              );
            }

            if (action === "cancel") {
              return (
                <Popover.Close asChild key={action}>
                  <button
                    className={`${MENU_ITEM_CLASS} text-red-700`}
                    data-testid={actionTestId(action)}
                    onClick={onCancel}
                    role="menuitem"
                    type="button"
                  >
                    <Ban aria-hidden="true" size={15} />
                    {t("owner.cancelSit")}
                  </button>
                </Popover.Close>
              );
            }

            // delete
            return (
              <Popover.Close asChild key={action}>
                <button
                  className={`${MENU_ITEM_CLASS} text-coral`}
                  data-testid={actionTestId(action)}
                  onClick={onDelete}
                  role="menuitem"
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={15} />
                  {t("owner.deleteSit")}
                </button>
              </Popover.Close>
            );
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

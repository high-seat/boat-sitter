import type { TFunction } from "i18next";
import type { ApplicationMessage, SitApplication } from "@/mockApi";

/** Localized system message text for the current viewer (owner vs applicant). */
export function formatApplicationSystemMessage(
  t: TFunction,
  message: ApplicationMessage,
  application: SitApplication,
  currentUser: string,
): string {
  if (message.kind !== "system" || !message.systemKind) return message.text;

  if (message.systemKind === "accepted") {
    return currentUser === application.ownerName
      ? t("applications.systemMessage.acceptedOwner", {
          name: application.applicant.name,
        })
      : t("applications.systemMessage.accepted");
  }
  if (message.systemKind === "declined") {
    return t("applications.systemMessage.declined");
  }
  if (message.systemKind === "applicantsClosed") {
    return t("applications.systemMessage.applicantsClosed");
  }
  if (message.systemKind === "videoCallRequest") {
    return t("applications.systemMessage.videoCallRequest", {
      name: message.senderName,
    });
  }
  if (message.systemKind === "videoCallCounter") {
    return t("applications.systemMessage.videoCallCounter", {
      name: message.senderName,
    });
  }
  if (message.systemKind === "videoCallAccepted") {
    return t("applications.systemMessage.videoCallAccepted", {
      name: message.senderName,
    });
  }
  if (message.systemKind === "videoCallDeclined") {
    return t("applications.systemMessage.videoCallDeclined", {
      name: message.senderName,
    });
  }
  return message.text;
}

export function isPendingVideoCallProposal(message: ApplicationMessage) {
  return (
    Boolean(message.videoCall) &&
    (message.systemKind === "videoCallRequest" || message.systemKind === "videoCallCounter")
  );
}

/** Latest open video-call proposal, or null if none / already resolved. */
export function getLatestPendingVideoCallProposal(messages: ApplicationMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.systemKind === "videoCallAccepted" || message.systemKind === "videoCallDeclined") {
      return null;
    }
    if (isPendingVideoCallProposal(message)) {
      return message;
    }
  }
  return null;
}

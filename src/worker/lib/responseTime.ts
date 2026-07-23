import { asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../db";
import { applicationMessages, applications } from "../db/schema";
import { summarizeResponseTime, type ResponseTimeBucket } from "../../shared/responseTime";

/** Average first-reply latency for an owner across their application chats. */
export async function getOwnerResponseTimeBucket(
  db: Db,
  ownerName: string,
): Promise<ResponseTimeBucket | null> {
  const apps = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.ownerName, ownerName));
  if (!apps.length) return null;

  const rows = await db
    .select({
      applicationId: applicationMessages.applicationId,
      senderName: applicationMessages.senderName,
      kind: applicationMessages.kind,
      createdAt: applicationMessages.createdAt,
    })
    .from(applicationMessages)
    .where(
      inArray(
        applicationMessages.applicationId,
        apps.map((app) => app.id),
      ),
    )
    .orderBy(asc(applicationMessages.createdAt));

  return summarizeResponseTime(ownerName, rows);
}

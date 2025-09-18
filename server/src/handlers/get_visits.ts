import { db } from '../db';
import { visitsTable } from '../db/schema';
import { type Visit } from '../schema';

export async function getVisits(): Promise<Visit[]> {
  try {
    const results = await db.select()
      .from(visitsTable)
      .execute();

    return results.map(visit => ({
      ...visit,
      visitDate: visit.visitDate,
      followUpDate: visit.followUpDate,
    }));
  } catch (error) {
    console.error('Failed to fetch visits:', error);
    throw error;
  }
}
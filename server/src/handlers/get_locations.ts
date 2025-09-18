import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type Location } from '../schema';

export async function getLocations(): Promise<Location[]> {
  try {
    const results = await db.select()
      .from(locationsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    throw error;
  }
}
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByIdInput, type Location } from '../schema';

export async function getLocationById(input: GetByIdInput): Promise<Location | null> {
  try {
    const results = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Failed to fetch location by ID:', error);
    throw error;
  }
}
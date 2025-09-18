import { db } from '../db';
import { locationsTable, doctorsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { eq, count } from 'drizzle-orm';

export async function deleteLocation(input: GetByIdInput): Promise<{ success: boolean }> {
  try {
    // First, check if the location exists
    const existingLocation = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, input.id))
      .execute();

    if (existingLocation.length === 0) {
      throw new Error(`Location with ID ${input.id} not found`);
    }

    // Check if there are any doctors associated with this location
    const doctorCount = await db.select({ count: count() })
      .from(doctorsTable)
      .where(eq(doctorsTable.locationId, input.id))
      .execute();

    if (doctorCount[0].count > 0) {
      throw new Error(`Cannot delete location. There are ${doctorCount[0].count} doctor(s) associated with this location`);
    }

    // Delete the location
    await db.delete(locationsTable)
      .where(eq(locationsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Location deletion failed:', error);
    throw error;
  }
}
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateLocationInput, type Location } from '../schema';

export async function updateLocation(input: UpdateLocationInput): Promise<Location | null> {
  try {
    // Build update object with only provided fields
    const updateData: Partial<{ name: string; address: string }> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.address !== undefined) {
      updateData.address = input.address;
    }

    // If no fields to update, return null
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    // Update the location record
    const result = await db.update(locationsTable)
      .set(updateData)
      .where(eq(locationsTable.id, input.id))
      .returning()
      .execute();

    // Return the updated record or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Location update failed:', error);
    throw error;
  }
}
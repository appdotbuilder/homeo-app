import { db } from '../db';
import { visitsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteVisit(input: GetByIdInput): Promise<{ success: boolean }> {
  try {
    // Delete the visit record
    const result = await db.delete(visitsTable)
      .where(eq(visitsTable.id, input.id))
      .returning()
      .execute();

    // Check if any record was actually deleted
    const success = result.length > 0;
    
    return { success };
  } catch (error) {
    console.error('Visit deletion failed:', error);
    throw error;
  }
}
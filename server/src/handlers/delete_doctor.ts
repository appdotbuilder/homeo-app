import { db } from '../db';
import { doctorsTable, visitsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteDoctor(input: GetByIdInput): Promise<{ success: boolean }> {
  try {
    // Check if doctor exists
    const existingDoctor = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, input.id))
      .execute();

    if (existingDoctor.length === 0) {
      throw new Error(`Doctor with ID ${input.id} not found`);
    }

    // Check if doctor has any visits
    const existingVisits = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.doctorId, input.id))
      .execute();

    if (existingVisits.length > 0) {
      throw new Error(`Cannot delete doctor with ID ${input.id} because they have existing visits`);
    }

    // Delete the doctor
    await db.delete(doctorsTable)
      .where(eq(doctorsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Doctor deletion failed:', error);
    throw error;
  }
}
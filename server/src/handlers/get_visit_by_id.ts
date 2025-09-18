import { db } from '../db';
import { visitsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByIdInput, type Visit } from '../schema';

export async function getVisitById(input: GetByIdInput): Promise<Visit | null> {
  try {
    const result = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const visit = result[0];
    return {
      id: visit.id,
      patientId: visit.patientId,
      doctorId: visit.doctorId,
      visitDate: visit.visitDate,
      symptoms: visit.symptoms,
      diagnosis: visit.diagnosis,
      prescription: visit.prescription,
      notes: visit.notes,
      followUpDate: visit.followUpDate,
    };
  } catch (error) {
    console.error('Failed to fetch visit by ID:', error);
    throw error;
  }
}
import { db } from '../db';
import { visitsTable } from '../db/schema';
import { type GetVisitsByPatientInput, type Visit } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getVisitsByPatient(input: GetVisitsByPatientInput): Promise<Visit[]> {
  try {
    // Query visits for the specific patient, ordered by visit date descending (most recent first)
    const results = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.patientId, input.patientId))
      .orderBy(desc(visitsTable.visitDate))
      .execute();

    // Return visits with proper type mapping
    return results.map(visit => ({
      id: visit.id,
      patientId: visit.patientId,
      doctorId: visit.doctorId,
      visitDate: visit.visitDate,
      symptoms: visit.symptoms,
      diagnosis: visit.diagnosis,
      prescription: visit.prescription,
      notes: visit.notes,
      followUpDate: visit.followUpDate
    }));
  } catch (error) {
    console.error('Failed to fetch visits by patient:', error);
    throw error;
  }
}
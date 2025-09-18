import { db } from '../db';
import { patientsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByIdInput, type Patient } from '../schema';

export async function getPatientById(input: GetByIdInput): Promise<Patient | null> {
  try {
    const results = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, input.id))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    const patient = results[0];
    return {
      id: patient.id,
      patientId: patient.patientId,
      cnic: patient.cnic,
      phone: patient.phone,
      name: patient.name,
    };
  } catch (error) {
    console.error('Failed to get patient by ID:', error);
    throw error;
  }
}
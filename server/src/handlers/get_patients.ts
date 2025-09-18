import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type Patient } from '../schema';

export async function getPatients(): Promise<Patient[]> {
  try {
    const results = await db.select()
      .from(patientsTable)
      .execute();

    // Map database results to schema format
    return results.map(patient => ({
      id: patient.id,
      patientId: patient.patientId,
      cnic: patient.cnic,
      phone: patient.phone,
      name: patient.name
    }));
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    throw error;
  }
}
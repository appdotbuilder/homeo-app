import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type PatientSearchInput, type Patient } from '../schema';
import { or, ilike, eq } from 'drizzle-orm';

export async function searchPatients(input: PatientSearchInput): Promise<Patient[]> {
  try {
    const query = input.query.trim();
    
    // Return empty array if query is empty after trimming
    if (!query) {
      return [];
    }
    
    // Build search conditions for different fields
    const searchConditions = [
      // Exact match for patientId
      eq(patientsTable.patientId, query),
      // Partial match for patientId (case-insensitive)
      ilike(patientsTable.patientId, `%${query}%`),
      // Exact match for cnic
      eq(patientsTable.cnic, query),
      // Partial match for cnic
      ilike(patientsTable.cnic, `%${query}%`),
      // Exact match for phone
      eq(patientsTable.phone, query),
      // Partial match for phone
      ilike(patientsTable.phone, `%${query}%`),
      // Partial match for name (case-insensitive)
      ilike(patientsTable.name, `%${query}%`)
    ];

    const results = await db.select()
      .from(patientsTable)
      .where(or(...searchConditions))
      .execute();

    return results.map(patient => ({
      id: patient.id,
      patientId: patient.patientId,
      cnic: patient.cnic,
      phone: patient.phone,
      name: patient.name
    }));
  } catch (error) {
    console.error('Patient search failed:', error);
    throw error;
  }
}
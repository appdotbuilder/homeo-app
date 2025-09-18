import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type UpdatePatientInput, type Patient } from '../schema';
import { eq } from 'drizzle-orm';

export async function updatePatient(input: UpdatePatientInput): Promise<Patient | null> {
  try {
    // Check if patient exists
    const existingPatient = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, input.id))
      .limit(1)
      .execute();

    if (existingPatient.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<{
      cnic: string | null;
      phone: string | null;
      name: string | null;
    }> = {};
    
    if (input.cnic !== undefined) {
      updateData.cnic = input.cnic;
    }
    
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    // If no fields to update, return existing patient
    if (Object.keys(updateData).length === 0) {
      return existingPatient[0];
    }

    // Update patient record
    const result = await db.update(patientsTable)
      .set(updateData)
      .where(eq(patientsTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Patient update failed:', error);
    throw error;
  }
}
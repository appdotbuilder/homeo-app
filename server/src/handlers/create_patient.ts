import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput, type Patient } from '../schema';
import { eq, or, desc } from 'drizzle-orm';

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  try {
    // Validate uniqueness of CNIC and phone if provided
    if (input.cnic || input.phone) {
      const conditions = [];
      
      if (input.cnic) {
        conditions.push(eq(patientsTable.cnic, input.cnic));
      }
      
      if (input.phone) {
        conditions.push(eq(patientsTable.phone, input.phone));
      }
      
      const existingPatients = await db.select()
        .from(patientsTable)
        .where(or(...conditions))
        .execute();
      
      if (existingPatients.length > 0) {
        const existingPatient = existingPatients[0];
        if (existingPatient.cnic === input.cnic) {
          throw new Error('Patient with this CNIC already exists');
        }
        if (existingPatient.phone === input.phone) {
          throw new Error('Patient with this phone number already exists');
        }
      }
    }

    // Generate unique human-readable patient ID
    const lastPatient = await db.select()
      .from(patientsTable)
      .orderBy(desc(patientsTable.id))
      .limit(1)
      .execute();

    const nextNumber = lastPatient.length > 0 ? lastPatient[0].id + 1 : 1;
    const patientId = `P${nextNumber.toString().padStart(3, '0')}`;

    // Insert new patient record
    const result = await db.insert(patientsTable)
      .values({
        patientId,
        cnic: input.cnic || null,
        phone: input.phone || null,
        name: input.name || null,
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Patient creation failed:', error);
    throw error;
  }
}
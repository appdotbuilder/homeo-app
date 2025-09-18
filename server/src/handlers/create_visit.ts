import { db } from '../db';
import { visitsTable, patientsTable, doctorsTable } from '../db/schema';
import { type CreateVisitInput, type Visit } from '../schema';
import { eq } from 'drizzle-orm';

export const createVisit = async (input: CreateVisitInput): Promise<Visit> => {
  try {
    // Validate that the patient exists
    const patient = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, input.patientId))
      .execute();

    if (patient.length === 0) {
      throw new Error(`Patient with ID ${input.patientId} does not exist`);
    }

    // Validate that the doctor exists
    const doctor = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, input.doctorId))
      .execute();

    if (doctor.length === 0) {
      throw new Error(`Doctor with ID ${input.doctorId} does not exist`);
    }

    // Set visitDate to current date if not provided
    const visitDate = input.visitDate || new Date();

    // Insert the new visit record
    const result = await db.insert(visitsTable)
      .values({
        patientId: input.patientId,
        doctorId: input.doctorId,
        visitDate: visitDate,
        symptoms: input.symptoms,
        diagnosis: input.diagnosis,
        prescription: input.prescription,
        notes: input.notes || null,
        followUpDate: input.followUpDate || null,
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Visit creation failed:', error);
    throw error;
  }
};
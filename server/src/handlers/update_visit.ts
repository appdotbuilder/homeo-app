import { db } from '../db';
import { visitsTable, patientsTable, doctorsTable } from '../db/schema';
import { type UpdateVisitInput, type Visit } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateVisit(input: UpdateVisitInput): Promise<Visit | null> {
  try {
    // First verify the visit exists
    const existingVisit = await db.select()
      .from(visitsTable)
      .where(eq(visitsTable.id, input.id))
      .execute();

    if (existingVisit.length === 0) {
      return null;
    }

    // Validate foreign keys if they are being updated
    if (input.patientId !== undefined) {
      const patient = await db.select()
        .from(patientsTable)
        .where(eq(patientsTable.id, input.patientId))
        .execute();

      if (patient.length === 0) {
        throw new Error(`Patient with id ${input.patientId} does not exist`);
      }
    }

    if (input.doctorId !== undefined) {
      const doctor = await db.select()
        .from(doctorsTable)
        .where(eq(doctorsTable.id, input.doctorId))
        .execute();

      if (doctor.length === 0) {
        throw new Error(`Doctor with id ${input.doctorId} does not exist`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (input.patientId !== undefined) updateData.patientId = input.patientId;
    if (input.doctorId !== undefined) updateData.doctorId = input.doctorId;
    if (input.visitDate !== undefined) updateData.visitDate = input.visitDate;
    if (input.symptoms !== undefined) updateData.symptoms = input.symptoms;
    if (input.diagnosis !== undefined) updateData.diagnosis = input.diagnosis;
    if (input.prescription !== undefined) updateData.prescription = input.prescription;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.followUpDate !== undefined) updateData.followUpDate = input.followUpDate;

    // Update the visit record
    const result = await db.update(visitsTable)
      .set(updateData)
      .where(eq(visitsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Visit update failed:', error);
    throw error;
  }
}
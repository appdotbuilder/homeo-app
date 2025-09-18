import { db } from '../db';
import { doctorsTable, locationsTable } from '../db/schema';
import { type CreateDoctorInput, type Doctor } from '../schema';
import { eq } from 'drizzle-orm';

export const createDoctor = async (input: CreateDoctorInput): Promise<Doctor> => {
  try {
    // Validate that the location exists before creating the doctor
    const location = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, input.locationId))
      .execute();

    if (location.length === 0) {
      throw new Error(`Location with id ${input.locationId} does not exist`);
    }

    // Insert doctor record
    const result = await db.insert(doctorsTable)
      .values({
        name: input.name,
        contactNumber: input.contactNumber,
        locationId: input.locationId,
        timings: input.timings
      })
      .returning()
      .execute();

    const doctor = result[0];
    return {
      id: doctor.id,
      name: doctor.name,
      contactNumber: doctor.contactNumber,
      locationId: doctor.locationId,
      timings: doctor.timings
    };
  } catch (error) {
    console.error('Doctor creation failed:', error);
    throw error;
  }
};
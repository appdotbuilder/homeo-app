import { db } from '../db';
import { doctorsTable } from '../db/schema';
import { type GetByIdInput, type Doctor } from '../schema';
import { eq } from 'drizzle-orm';

export const getDoctorById = async (input: GetByIdInput): Promise<Doctor | null> => {
  try {
    const result = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, input.id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const doctor = result[0];
    return {
      id: doctor.id,
      name: doctor.name,
      contactNumber: doctor.contactNumber,
      locationId: doctor.locationId,
      timings: doctor.timings,
    };
  } catch (error) {
    console.error('Get doctor by ID failed:', error);
    throw error;
  }
};
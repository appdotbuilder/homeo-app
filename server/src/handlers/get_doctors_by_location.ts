import { db } from '../db';
import { doctorsTable } from '../db/schema';
import { type GetDoctorsByLocationInput, type Doctor } from '../schema';
import { eq } from 'drizzle-orm';

export async function getDoctorsByLocation(input: GetDoctorsByLocationInput): Promise<Doctor[]> {
  try {
    // Query doctors by location ID
    const results = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.locationId, input.locationId))
      .execute();

    // Convert database results to schema format
    return results.map(doctor => ({
      id: doctor.id,
      name: doctor.name,
      contactNumber: doctor.contactNumber,
      locationId: doctor.locationId,
      timings: doctor.timings
    }));
  } catch (error) {
    console.error('Get doctors by location failed:', error);
    throw error;
  }
}
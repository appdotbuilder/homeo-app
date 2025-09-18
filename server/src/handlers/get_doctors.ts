import { db } from '../db';
import { doctorsTable, locationsTable } from '../db/schema';
import { type Doctor } from '../schema';
import { eq } from 'drizzle-orm';

export const getDoctors = async (): Promise<Doctor[]> => {
  try {
    // Join doctors with their locations to get complete information
    const results = await db.select({
      id: doctorsTable.id,
      name: doctorsTable.name,
      contactNumber: doctorsTable.contactNumber,
      locationId: doctorsTable.locationId,
      timings: doctorsTable.timings,
      locationName: locationsTable.name,
      locationAddress: locationsTable.address
    })
    .from(doctorsTable)
    .innerJoin(locationsTable, eq(doctorsTable.locationId, locationsTable.id))
    .execute();

    // Return doctors with the expected schema structure
    return results.map(result => ({
      id: result.id,
      name: result.name,
      contactNumber: result.contactNumber,
      locationId: result.locationId,
      timings: result.timings
    }));
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    throw error;
  }
};
import { db } from '../db';
import { doctorsTable, locationsTable } from '../db/schema';
import { type UpdateDoctorInput, type Doctor } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateDoctor(input: UpdateDoctorInput): Promise<Doctor | null> {
  try {
    // If locationId is being updated, validate that the location exists
    if (input.locationId !== undefined) {
      const location = await db.select()
        .from(locationsTable)
        .where(eq(locationsTable.id, input.locationId))
        .execute();

      if (location.length === 0) {
        throw new Error(`Location with id ${input.locationId} does not exist`);
      }
    }

    // Build the update object with only defined fields
    const updateData: Partial<typeof doctorsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.contactNumber !== undefined) {
      updateData.contactNumber = input.contactNumber;
    }
    if (input.locationId !== undefined) {
      updateData.locationId = input.locationId;
    }
    if (input.timings !== undefined) {
      updateData.timings = input.timings;
    }

    // If no fields to update, return null
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    // Update the doctor record
    const result = await db.update(doctorsTable)
      .set(updateData)
      .where(eq(doctorsTable.id, input.id))
      .returning()
      .execute();

    // Return null if doctor not found
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Doctor update failed:', error);
    throw error;
  }
}
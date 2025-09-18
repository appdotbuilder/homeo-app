import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput, type Location } from '../schema';

export const createLocation = async (input: CreateLocationInput): Promise<Location> => {
  try {
    // Insert location record
    const result = await db.insert(locationsTable)
      .values({
        name: input.name,
        address: input.address
      })
      .returning()
      .execute();

    // Return the created location
    const location = result[0];
    return {
      id: location.id,
      name: location.name,
      address: location.address
    };
  } catch (error) {
    console.error('Location creation failed:', error);
    throw error;
  }
};
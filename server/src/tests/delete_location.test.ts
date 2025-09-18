import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, doctorsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { deleteLocation } from '../handlers/delete_location';
import { eq } from 'drizzle-orm';

// Test input
const testInput: GetByIdInput = {
  id: 1
};

describe('deleteLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete a location', async () => {
    // Create a test location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Delete the location
    const result = await deleteLocation({ id: locationId });

    expect(result.success).toBe(true);

    // Verify the location is deleted from database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locations).toHaveLength(0);
  });

  it('should throw error when location does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteLocation({ id: nonExistentId })).rejects.toThrow(/Location with ID 999 not found/i);
  });

  it('should throw error when location has associated doctors', async () => {
    // Create a test location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Create a doctor associated with this location
    await db.insert(doctorsTable)
      .values({
        name: 'Dr. Test',
        contactNumber: '123-456-7890',
        locationId: locationId,
        timings: '9 AM - 5 PM'
      })
      .execute();

    // Attempt to delete the location should fail
    await expect(deleteLocation({ id: locationId })).rejects.toThrow(/Cannot delete location.*doctor\(s\) associated/i);

    // Verify the location still exists in database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toEqual('Test Hospital');
  });

  it('should throw error when location has multiple associated doctors', async () => {
    // Create a test location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Create multiple doctors associated with this location
    await db.insert(doctorsTable)
      .values([
        {
          name: 'Dr. Test One',
          contactNumber: '123-456-7890',
          locationId: locationId,
          timings: '9 AM - 5 PM'
        },
        {
          name: 'Dr. Test Two',
          contactNumber: '098-765-4321',
          locationId: locationId,
          timings: '10 AM - 6 PM'
        }
      ])
      .execute();

    // Attempt to delete the location should fail
    await expect(deleteLocation({ id: locationId })).rejects.toThrow(/Cannot delete location.*2 doctor\(s\) associated/i);

    // Verify the location still exists in database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toEqual('Test Hospital');
  });

  it('should successfully delete location after all doctors are removed', async () => {
    // Create a test location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    const locationId = locationResult[0].id;

    // Create a doctor associated with this location
    const doctorResult = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Test',
        contactNumber: '123-456-7890',
        locationId: locationId,
        timings: '9 AM - 5 PM'
      })
      .returning()
      .execute();

    // First attempt should fail due to associated doctor
    await expect(deleteLocation({ id: locationId })).rejects.toThrow(/Cannot delete location.*doctor\(s\) associated/i);

    // Remove the doctor
    await db.delete(doctorsTable)
      .where(eq(doctorsTable.id, doctorResult[0].id))
      .execute();

    // Now deletion should succeed
    const result = await deleteLocation({ id: locationId });

    expect(result.success).toBe(true);

    // Verify the location is deleted from database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, locationId))
      .execute();

    expect(locations).toHaveLength(0);
  });
});
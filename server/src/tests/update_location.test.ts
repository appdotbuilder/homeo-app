import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type UpdateLocationInput } from '../schema';
import { updateLocation } from '../handlers/update_location';
import { eq } from 'drizzle-orm';

describe('updateLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update location name only', async () => {
    // Create a test location first
    const [createdLocation] = await db.insert(locationsTable)
      .values({
        name: 'Original Location',
        address: 'Original Address'
      })
      .returning()
      .execute();

    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      name: 'Updated Location Name'
    };

    const result = await updateLocation(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(createdLocation.id);
    expect(result!.name).toEqual('Updated Location Name');
    expect(result!.address).toEqual('Original Address'); // Should remain unchanged
  });

  it('should update location address only', async () => {
    // Create a test location first
    const [createdLocation] = await db.insert(locationsTable)
      .values({
        name: 'Original Location',
        address: 'Original Address'
      })
      .returning()
      .execute();

    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      address: 'Updated Address'
    };

    const result = await updateLocation(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(createdLocation.id);
    expect(result!.name).toEqual('Original Location'); // Should remain unchanged
    expect(result!.address).toEqual('Updated Address');
  });

  it('should update both name and address', async () => {
    // Create a test location first
    const [createdLocation] = await db.insert(locationsTable)
      .values({
        name: 'Original Location',
        address: 'Original Address'
      })
      .returning()
      .execute();

    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      name: 'Updated Location Name',
      address: 'Updated Address'
    };

    const result = await updateLocation(updateInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(createdLocation.id);
    expect(result!.name).toEqual('Updated Location Name');
    expect(result!.address).toEqual('Updated Address');
  });

  it('should save changes to database', async () => {
    // Create a test location first
    const [createdLocation] = await db.insert(locationsTable)
      .values({
        name: 'Original Location',
        address: 'Original Address'
      })
      .returning()
      .execute();

    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      name: 'Database Test Location',
      address: 'Database Test Address'
    };

    await updateLocation(updateInput);

    // Verify the changes were saved to database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, createdLocation.id))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toEqual('Database Test Location');
    expect(locations[0].address).toEqual('Database Test Address');
  });

  it('should return null when location does not exist', async () => {
    const updateInput: UpdateLocationInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Location'
    };

    const result = await updateLocation(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields are provided to update', async () => {
    // Create a test location first
    const [createdLocation] = await db.insert(locationsTable)
      .values({
        name: 'Original Location',
        address: 'Original Address'
      })
      .returning()
      .execute();

    const updateInput: UpdateLocationInput = {
      id: createdLocation.id
      // No name or address provided
    };

    const result = await updateLocation(updateInput);

    expect(result).toBeNull();

    // Verify original data remains unchanged
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, createdLocation.id))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toEqual('Original Location');
    expect(locations[0].address).toEqual('Original Address');
  });

  it('should handle partial updates correctly', async () => {
    // Create a test location first
    const [createdLocation] = await db.insert(locationsTable)
      .values({
        name: 'Partial Update Location',
        address: 'Partial Update Address'
      })
      .returning()
      .execute();

    // Update only the name
    const updateInput: UpdateLocationInput = {
      id: createdLocation.id,
      name: 'Only Name Updated'
    };

    const result = await updateLocation(updateInput);

    expect(result).toBeTruthy();
    expect(result!.name).toEqual('Only Name Updated');
    expect(result!.address).toEqual('Partial Update Address'); // Should remain unchanged

    // Verify in database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, createdLocation.id))
      .execute();

    expect(locations[0].name).toEqual('Only Name Updated');
    expect(locations[0].address).toEqual('Partial Update Address');
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetByIdInput, type CreateLocationInput } from '../schema';
import { getLocationById } from '../handlers/get_location_by_id';

// Test data
const testLocation: CreateLocationInput = {
  name: 'Test Hospital',
  address: '123 Main Street, Test City'
};

const anotherTestLocation: CreateLocationInput = {
  name: 'Another Clinic',
  address: '456 Oak Avenue, Test Town'
};

describe('getLocationById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return location when ID exists', async () => {
    // Create a test location
    const insertResult = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();

    const createdLocation = insertResult[0];
    
    // Test the handler
    const input: GetByIdInput = { id: createdLocation.id };
    const result = await getLocationById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdLocation.id);
    expect(result!.name).toEqual('Test Hospital');
    expect(result!.address).toEqual('123 Main Street, Test City');
  });

  it('should return null when ID does not exist', async () => {
    // Test with non-existent ID
    const input: GetByIdInput = { id: 99999 };
    const result = await getLocationById(input);

    // Verify null is returned
    expect(result).toBeNull();
  });

  it('should return correct location when multiple locations exist', async () => {
    // Create multiple test locations
    const insertResults = await db.insert(locationsTable)
      .values([testLocation, anotherTestLocation])
      .returning()
      .execute();

    const firstLocation = insertResults[0];
    const secondLocation = insertResults[1];

    // Test fetching the first location
    const input1: GetByIdInput = { id: firstLocation.id };
    const result1 = await getLocationById(input1);

    expect(result1).not.toBeNull();
    expect(result1!.id).toEqual(firstLocation.id);
    expect(result1!.name).toEqual('Test Hospital');
    expect(result1!.address).toEqual('123 Main Street, Test City');

    // Test fetching the second location
    const input2: GetByIdInput = { id: secondLocation.id };
    const result2 = await getLocationById(input2);

    expect(result2).not.toBeNull();
    expect(result2!.id).toEqual(secondLocation.id);
    expect(result2!.name).toEqual('Another Clinic');
    expect(result2!.address).toEqual('456 Oak Avenue, Test Town');
  });

  it('should handle database operations correctly', async () => {
    // Create a location and verify it's in the database
    const insertResult = await db.insert(locationsTable)
      .values(testLocation)
      .returning()
      .execute();

    const createdLocation = insertResult[0];

    // Use the handler to fetch it
    const input: GetByIdInput = { id: createdLocation.id };
    const result = await getLocationById(input);

    // Verify the result matches what was inserted
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdLocation.id);
    expect(result!.name).toEqual(createdLocation.name);
    expect(result!.address).toEqual(createdLocation.address);

    // Double-check by querying the database directly
    const directQuery = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, createdLocation.id))
      .execute();

    expect(directQuery).toHaveLength(1);
    expect(directQuery[0]).toEqual(result!);
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput } from '../schema';
import { createLocation } from '../handlers/create_location';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateLocationInput = {
  name: 'Central Medical Center',
  address: '123 Main Street, Downtown'
};

describe('createLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a location', async () => {
    const result = await createLocation(testInput);

    // Basic field validation
    expect(result.name).toEqual('Central Medical Center');
    expect(result.address).toEqual('123 Main Street, Downtown');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
  });

  it('should save location to database', async () => {
    const result = await createLocation(testInput);

    // Query using proper drizzle syntax
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toEqual('Central Medical Center');
    expect(locations[0].address).toEqual('123 Main Street, Downtown');
    expect(locations[0].id).toEqual(result.id);
  });

  it('should handle different location names and addresses', async () => {
    const hospitalInput: CreateLocationInput = {
      name: 'City General Hospital',
      address: '456 Oak Avenue, Medical District'
    };

    const result = await createLocation(hospitalInput);

    expect(result.name).toEqual('City General Hospital');
    expect(result.address).toEqual('456 Oak Avenue, Medical District');
    expect(result.id).toBeDefined();

    // Verify in database
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations[0].name).toEqual('City General Hospital');
    expect(locations[0].address).toEqual('456 Oak Avenue, Medical District');
  });

  it('should create multiple locations with unique IDs', async () => {
    const firstLocation = await createLocation({
      name: 'First Clinic',
      address: '100 First Street'
    });

    const secondLocation = await createLocation({
      name: 'Second Clinic', 
      address: '200 Second Street'
    });

    expect(firstLocation.id).not.toEqual(secondLocation.id);
    expect(firstLocation.name).toEqual('First Clinic');
    expect(secondLocation.name).toEqual('Second Clinic');

    // Verify both exist in database
    const allLocations = await db.select()
      .from(locationsTable)
      .execute();

    expect(allLocations).toHaveLength(2);
    
    const firstInDb = allLocations.find(l => l.id === firstLocation.id);
    const secondInDb = allLocations.find(l => l.id === secondLocation.id);
    
    expect(firstInDb?.name).toEqual('First Clinic');
    expect(secondInDb?.name).toEqual('Second Clinic');
  });

  it('should handle minimum valid inputs', async () => {
    const minimalInput: CreateLocationInput = {
      name: 'A',
      address: 'B'
    };

    const result = await createLocation(minimalInput);

    expect(result.name).toEqual('A');
    expect(result.address).toEqual('B');
    expect(result.id).toBeDefined();

    // Verify saved correctly
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations[0].name).toEqual('A');
    expect(locations[0].address).toEqual('B');
  });
});
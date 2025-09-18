import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput } from '../schema';
import { getLocations } from '../handlers/get_locations';

// Test data
const testLocation1: CreateLocationInput = {
  name: 'Main Clinic',
  address: '123 Medical Street, City Center'
};

const testLocation2: CreateLocationInput = {
  name: 'Downtown Branch',
  address: '456 Health Avenue, Downtown'
};

const testLocation3: CreateLocationInput = {
  name: 'Suburban Center',
  address: '789 Care Boulevard, Suburbs'
};

describe('getLocations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no locations exist', async () => {
    const result = await getLocations();
    
    expect(result).toEqual([]);
  });

  it('should return all locations from database', async () => {
    // Create test locations
    await db.insert(locationsTable).values([
      testLocation1,
      testLocation2,
      testLocation3
    ]).execute();

    const result = await getLocations();

    expect(result).toHaveLength(3);
    
    // Verify all locations are returned
    const locationNames = result.map(loc => loc.name).sort();
    expect(locationNames).toEqual([
      'Downtown Branch',
      'Main Clinic', 
      'Suburban Center'
    ]);

    // Verify structure of returned data
    result.forEach(location => {
      expect(location.id).toBeDefined();
      expect(typeof location.id).toBe('number');
      expect(location.name).toBeDefined();
      expect(typeof location.name).toBe('string');
      expect(location.address).toBeDefined();
      expect(typeof location.address).toBe('string');
    });
  });

  it('should return single location correctly', async () => {
    await db.insert(locationsTable).values(testLocation1).execute();

    const result = await getLocations();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Main Clinic');
    expect(result[0].address).toEqual('123 Medical Street, City Center');
    expect(result[0].id).toBeDefined();
  });

  it('should maintain consistent data types', async () => {
    await db.insert(locationsTable).values([
      testLocation1,
      testLocation2
    ]).execute();

    const result = await getLocations();

    expect(result).toHaveLength(2);
    
    result.forEach(location => {
      expect(typeof location.id).toBe('number');
      expect(typeof location.name).toBe('string');
      expect(typeof location.address).toBe('string');
      expect(location.name.length).toBeGreaterThan(0);
      expect(location.address.length).toBeGreaterThan(0);
    });
  });

  it('should handle locations with special characters', async () => {
    const specialLocation: CreateLocationInput = {
      name: "St. Mary's Hospital & Clinic",
      address: "123 O'Connor St., Unit #5A"
    };

    await db.insert(locationsTable).values(specialLocation).execute();

    const result = await getLocations();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual("St. Mary's Hospital & Clinic");
    expect(result[0].address).toEqual("123 O'Connor St., Unit #5A");
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, doctorsTable } from '../db/schema';
import { getDoctors } from '../handlers/get_doctors';

describe('getDoctors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no doctors exist', async () => {
    const result = await getDoctors();

    expect(result).toEqual([]);
  });

  it('should return all doctors with correct fields', async () => {
    // Create a location first (foreign key requirement)
    const location = await db.insert(locationsTable)
      .values({
        name: 'Main Hospital',
        address: '123 Main Street'
      })
      .returning()
      .execute();

    // Create test doctors
    await db.insert(doctorsTable)
      .values([
        {
          name: 'Dr. Smith',
          contactNumber: '123-456-7890',
          locationId: location[0].id,
          timings: '9 AM - 5 PM'
        },
        {
          name: 'Dr. Johnson',
          contactNumber: '098-765-4321',
          locationId: location[0].id,
          timings: '10 AM - 6 PM'
        }
      ])
      .execute();

    const result = await getDoctors();

    expect(result).toHaveLength(2);
    
    // Verify first doctor
    expect(result[0]).toMatchObject({
      name: 'Dr. Smith',
      contactNumber: '123-456-7890',
      locationId: location[0].id,
      timings: '9 AM - 5 PM'
    });
    expect(result[0].id).toBeDefined();
    
    // Verify second doctor
    expect(result[1]).toMatchObject({
      name: 'Dr. Johnson',
      contactNumber: '098-765-4321',
      locationId: location[0].id,
      timings: '10 AM - 6 PM'
    });
    expect(result[1].id).toBeDefined();
  });

  it('should return doctors from multiple locations', async () => {
    // Create multiple locations
    const locations = await db.insert(locationsTable)
      .values([
        {
          name: 'Main Hospital',
          address: '123 Main Street'
        },
        {
          name: 'Branch Clinic',
          address: '456 Oak Avenue'
        }
      ])
      .returning()
      .execute();

    // Create doctors in different locations
    await db.insert(doctorsTable)
      .values([
        {
          name: 'Dr. Smith',
          contactNumber: '123-456-7890',
          locationId: locations[0].id,
          timings: '9 AM - 5 PM'
        },
        {
          name: 'Dr. Brown',
          contactNumber: '555-123-4567',
          locationId: locations[1].id,
          timings: '8 AM - 4 PM'
        }
      ])
      .execute();

    const result = await getDoctors();

    expect(result).toHaveLength(2);
    
    // Should have doctors from both locations
    const locationIds = result.map(doctor => doctor.locationId);
    expect(locationIds).toContain(locations[0].id);
    expect(locationIds).toContain(locations[1].id);
  });

  it('should return doctors with all required schema fields', async () => {
    // Create location
    const location = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '789 Test Street'
      })
      .returning()
      .execute();

    // Create doctor
    await db.insert(doctorsTable)
      .values({
        name: 'Dr. Test',
        contactNumber: '111-222-3333',
        locationId: location[0].id,
        timings: '24/7'
      })
      .execute();

    const result = await getDoctors();

    expect(result).toHaveLength(1);
    
    const doctor = result[0];
    
    // Verify all required fields are present and have correct types
    expect(typeof doctor.id).toBe('number');
    expect(typeof doctor.name).toBe('string');
    expect(typeof doctor.contactNumber).toBe('string');
    expect(typeof doctor.locationId).toBe('number');
    expect(typeof doctor.timings).toBe('string');
    
    // Verify no extra fields are returned
    const expectedKeys = ['id', 'name', 'contactNumber', 'locationId', 'timings'];
    const actualKeys = Object.keys(doctor).sort();
    expect(actualKeys).toEqual(expectedKeys.sort());
  });

  it('should maintain correct order of results', async () => {
    // Create location
    const location = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Ave'
      })
      .returning()
      .execute();

    // Create multiple doctors
    const doctorNames = ['Dr. Alpha', 'Dr. Beta', 'Dr. Gamma'];
    await db.insert(doctorsTable)
      .values(doctorNames.map(name => ({
        name,
        contactNumber: '123-456-7890',
        locationId: location[0].id,
        timings: '9 AM - 5 PM'
      })))
      .execute();

    const result = await getDoctors();

    expect(result).toHaveLength(3);
    
    // Results should be ordered by insertion order (or database default ordering)
    const resultNames = result.map(doctor => doctor.name);
    expect(resultNames).toEqual(doctorNames);
  });
});
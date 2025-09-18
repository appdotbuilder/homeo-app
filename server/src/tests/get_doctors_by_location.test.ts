import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, doctorsTable } from '../db/schema';
import { type GetDoctorsByLocationInput } from '../schema';
import { getDoctorsByLocation } from '../handlers/get_doctors_by_location';

describe('getDoctorsByLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return doctors for a specific location', async () => {
    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Main St'
      })
      .returning()
      .execute();
    const locationId = locationResult[0].id;

    // Create test doctors at this location
    await db.insert(doctorsTable)
      .values([
        {
          name: 'Dr. Smith',
          contactNumber: '555-0001',
          locationId: locationId,
          timings: '9 AM - 5 PM'
        },
        {
          name: 'Dr. Johnson',
          contactNumber: '555-0002',
          locationId: locationId,
          timings: '10 AM - 6 PM'
        }
      ])
      .execute();

    const input: GetDoctorsByLocationInput = {
      locationId: locationId
    };

    const result = await getDoctorsByLocation(input);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Dr. Smith');
    expect(result[0].contactNumber).toEqual('555-0001');
    expect(result[0].locationId).toEqual(locationId);
    expect(result[0].timings).toEqual('9 AM - 5 PM');
    expect(result[0].id).toBeDefined();

    expect(result[1].name).toEqual('Dr. Johnson');
    expect(result[1].contactNumber).toEqual('555-0002');
    expect(result[1].locationId).toEqual(locationId);
    expect(result[1].timings).toEqual('10 AM - 6 PM');
    expect(result[1].id).toBeDefined();
  });

  it('should return empty array when no doctors at location', async () => {
    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Empty Hospital',
        address: '456 Empty St'
      })
      .returning()
      .execute();
    const locationId = locationResult[0].id;

    const input: GetDoctorsByLocationInput = {
      locationId: locationId
    };

    const result = await getDoctorsByLocation(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent location', async () => {
    const input: GetDoctorsByLocationInput = {
      locationId: 9999 // Non-existent location ID
    };

    const result = await getDoctorsByLocation(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return doctors for the specified location', async () => {
    // Create two test locations
    const locationResults = await db.insert(locationsTable)
      .values([
        {
          name: 'Hospital A',
          address: '123 A St'
        },
        {
          name: 'Hospital B',
          address: '456 B St'
        }
      ])
      .returning()
      .execute();
    
    const locationAId = locationResults[0].id;
    const locationBId = locationResults[1].id;

    // Create doctors at both locations
    await db.insert(doctorsTable)
      .values([
        {
          name: 'Dr. A1',
          contactNumber: '555-A001',
          locationId: locationAId,
          timings: '9 AM - 5 PM'
        },
        {
          name: 'Dr. A2',
          contactNumber: '555-A002',
          locationId: locationAId,
          timings: '10 AM - 6 PM'
        },
        {
          name: 'Dr. B1',
          contactNumber: '555-B001',
          locationId: locationBId,
          timings: '8 AM - 4 PM'
        }
      ])
      .execute();

    // Query for doctors at location A only
    const input: GetDoctorsByLocationInput = {
      locationId: locationAId
    };

    const result = await getDoctorsByLocation(input);

    expect(result).toHaveLength(2);
    
    // Verify all returned doctors belong to location A
    result.forEach(doctor => {
      expect(doctor.locationId).toEqual(locationAId);
    });

    // Verify specific doctors
    const doctorNames = result.map(d => d.name).sort();
    expect(doctorNames).toEqual(['Dr. A1', 'Dr. A2']);
  });

  it('should preserve all doctor fields correctly', async () => {
    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Clinic',
        address: '789 Test Ave'
      })
      .returning()
      .execute();
    const locationId = locationResult[0].id;

    // Create test doctor with specific data
    await db.insert(doctorsTable)
      .values({
        name: 'Dr. Test Doctor',
        contactNumber: '+1-555-TEST',
        locationId: locationId,
        timings: 'Mon-Fri 8:00-17:00, Sat 9:00-13:00'
      })
      .execute();

    const input: GetDoctorsByLocationInput = {
      locationId: locationId
    };

    const result = await getDoctorsByLocation(input);

    expect(result).toHaveLength(1);
    
    const doctor = result[0];
    expect(doctor.id).toBeDefined();
    expect(typeof doctor.id).toBe('number');
    expect(doctor.name).toEqual('Dr. Test Doctor');
    expect(doctor.contactNumber).toEqual('+1-555-TEST');
    expect(doctor.locationId).toEqual(locationId);
    expect(doctor.timings).toEqual('Mon-Fri 8:00-17:00, Sat 9:00-13:00');
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { doctorsTable, locationsTable } from '../db/schema';
import { type CreateDoctorInput } from '../schema';
import { createDoctor } from '../handlers/create_doctor';
import { eq } from 'drizzle-orm';

describe('createDoctor', () => {
  let testLocationId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test location first since doctors require a valid locationId
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();
    
    testLocationId = locationResult[0].id;
  });

  afterEach(resetDB);

  // Complete test input with all required fields
  const testInput: CreateDoctorInput = {
    name: 'Dr. John Smith',
    contactNumber: '+1-555-123-4567',
    locationId: 0, // Will be set dynamically in tests
    timings: 'Mon-Fri 9:00 AM - 5:00 PM'
  };

  it('should create a doctor with valid location', async () => {
    const input = { ...testInput, locationId: testLocationId };
    const result = await createDoctor(input);

    // Basic field validation
    expect(result.name).toEqual('Dr. John Smith');
    expect(result.contactNumber).toEqual('+1-555-123-4567');
    expect(result.locationId).toEqual(testLocationId);
    expect(result.timings).toEqual('Mon-Fri 9:00 AM - 5:00 PM');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
  });

  it('should save doctor to database', async () => {
    const input = { ...testInput, locationId: testLocationId };
    const result = await createDoctor(input);

    // Query using proper drizzle syntax
    const doctors = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, result.id))
      .execute();

    expect(doctors).toHaveLength(1);
    expect(doctors[0].name).toEqual('Dr. John Smith');
    expect(doctors[0].contactNumber).toEqual('+1-555-123-4567');
    expect(doctors[0].locationId).toEqual(testLocationId);
    expect(doctors[0].timings).toEqual('Mon-Fri 9:00 AM - 5:00 PM');
  });

  it('should throw error for non-existent location', async () => {
    const input = { ...testInput, locationId: 99999 }; // Non-existent location ID

    expect(createDoctor(input)).rejects.toThrow(/Location with id 99999 does not exist/i);
  });

  it('should create doctor with different contact number format', async () => {
    const input = { 
      ...testInput, 
      locationId: testLocationId,
      contactNumber: '03001234567' // Different format
    };
    
    const result = await createDoctor(input);

    expect(result.contactNumber).toEqual('03001234567');
    expect(result.locationId).toEqual(testLocationId);
    
    // Verify it was saved correctly
    const doctors = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, result.id))
      .execute();

    expect(doctors[0].contactNumber).toEqual('03001234567');
  });

  it('should create doctor with complex timing schedule', async () => {
    const input = { 
      ...testInput, 
      locationId: testLocationId,
      timings: 'Mon-Wed 8:00 AM - 12:00 PM, Thu-Fri 2:00 PM - 6:00 PM, Sat 9:00 AM - 1:00 PM'
    };
    
    const result = await createDoctor(input);

    expect(result.timings).toEqual('Mon-Wed 8:00 AM - 12:00 PM, Thu-Fri 2:00 PM - 6:00 PM, Sat 9:00 AM - 1:00 PM');
    
    // Verify it was saved correctly
    const doctors = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, result.id))
      .execute();

    expect(doctors[0].timings).toEqual('Mon-Wed 8:00 AM - 12:00 PM, Thu-Fri 2:00 PM - 6:00 PM, Sat 9:00 AM - 1:00 PM');
  });

  it('should create multiple doctors for same location', async () => {
    const input1 = { 
      ...testInput, 
      locationId: testLocationId,
      name: 'Dr. Alice Johnson'
    };
    
    const input2 = { 
      ...testInput, 
      locationId: testLocationId,
      name: 'Dr. Bob Wilson',
      contactNumber: '+1-555-987-6543'
    };
    
    const result1 = await createDoctor(input1);
    const result2 = await createDoctor(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.locationId).toEqual(testLocationId);
    expect(result2.locationId).toEqual(testLocationId);
    
    // Verify both doctors exist in database
    const doctors = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.locationId, testLocationId))
      .execute();

    expect(doctors).toHaveLength(2);
    expect(doctors.map(d => d.name)).toContain('Dr. Alice Johnson');
    expect(doctors.map(d => d.name)).toContain('Dr. Bob Wilson');
  });
});
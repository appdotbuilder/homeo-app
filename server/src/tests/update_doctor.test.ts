import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { doctorsTable, locationsTable } from '../db/schema';
import { type UpdateDoctorInput } from '../schema';
import { updateDoctor } from '../handlers/update_doctor';
import { eq } from 'drizzle-orm';

describe('updateDoctor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testLocationId: number;
  let testDoctorId: number;
  let secondLocationId: number;

  beforeEach(async () => {
    // Create test locations
    const locations = await db.insert(locationsTable)
      .values([
        { name: 'Main Hospital', address: '123 Main St' },
        { name: 'Branch Clinic', address: '456 Oak Ave' }
      ])
      .returning()
      .execute();

    testLocationId = locations[0].id;
    secondLocationId = locations[1].id;

    // Create test doctor
    const doctors = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Smith',
        contactNumber: '555-1234',
        locationId: testLocationId,
        timings: '9 AM - 5 PM'
      })
      .returning()
      .execute();

    testDoctorId = doctors[0].id;
  });

  it('should update doctor name', async () => {
    const updateInput: UpdateDoctorInput = {
      id: testDoctorId,
      name: 'Dr. Smith Updated'
    };

    const result = await updateDoctor(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testDoctorId);
    expect(result!.name).toEqual('Dr. Smith Updated');
    expect(result!.contactNumber).toEqual('555-1234'); // Unchanged
    expect(result!.locationId).toEqual(testLocationId); // Unchanged
    expect(result!.timings).toEqual('9 AM - 5 PM'); // Unchanged
  });

  it('should update doctor contact number', async () => {
    const updateInput: UpdateDoctorInput = {
      id: testDoctorId,
      contactNumber: '555-9999'
    };

    const result = await updateDoctor(updateInput);

    expect(result).toBeDefined();
    expect(result!.contactNumber).toEqual('555-9999');
    expect(result!.name).toEqual('Dr. Smith'); // Unchanged
  });

  it('should update doctor location', async () => {
    const updateInput: UpdateDoctorInput = {
      id: testDoctorId,
      locationId: secondLocationId
    };

    const result = await updateDoctor(updateInput);

    expect(result).toBeDefined();
    expect(result!.locationId).toEqual(secondLocationId);
    expect(result!.name).toEqual('Dr. Smith'); // Unchanged
  });

  it('should update doctor timings', async () => {
    const updateInput: UpdateDoctorInput = {
      id: testDoctorId,
      timings: '10 AM - 6 PM'
    };

    const result = await updateDoctor(updateInput);

    expect(result).toBeDefined();
    expect(result!.timings).toEqual('10 AM - 6 PM');
    expect(result!.name).toEqual('Dr. Smith'); // Unchanged
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateDoctorInput = {
      id: testDoctorId,
      name: 'Dr. Johnson',
      contactNumber: '555-7777',
      locationId: secondLocationId,
      timings: '8 AM - 4 PM'
    };

    const result = await updateDoctor(updateInput);

    expect(result).toBeDefined();
    expect(result!.name).toEqual('Dr. Johnson');
    expect(result!.contactNumber).toEqual('555-7777');
    expect(result!.locationId).toEqual(secondLocationId);
    expect(result!.timings).toEqual('8 AM - 4 PM');
  });

  it('should save updated doctor to database', async () => {
    const updateInput: UpdateDoctorInput = {
      id: testDoctorId,
      name: 'Dr. Brown',
      contactNumber: '555-8888'
    };

    await updateDoctor(updateInput);

    // Verify changes in database
    const doctors = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, testDoctorId))
      .execute();

    expect(doctors).toHaveLength(1);
    expect(doctors[0].name).toEqual('Dr. Brown');
    expect(doctors[0].contactNumber).toEqual('555-8888');
    expect(doctors[0].locationId).toEqual(testLocationId);
    expect(doctors[0].timings).toEqual('9 AM - 5 PM');
  });

  it('should return null when doctor not found', async () => {
    const updateInput: UpdateDoctorInput = {
      id: 99999, // Non-existent doctor ID
      name: 'Dr. Nobody'
    };

    const result = await updateDoctor(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields to update', async () => {
    const updateInput: UpdateDoctorInput = {
      id: testDoctorId
      // No fields to update
    };

    const result = await updateDoctor(updateInput);

    expect(result).toBeNull();
  });

  it('should throw error when location does not exist', async () => {
    const updateInput: UpdateDoctorInput = {
      id: testDoctorId,
      locationId: 99999 // Non-existent location ID
    };

    await expect(updateDoctor(updateInput)).rejects.toThrow(/Location with id 99999 does not exist/i);
  });

  it('should handle partial updates with valid location', async () => {
    const updateInput: UpdateDoctorInput = {
      id: testDoctorId,
      name: 'Dr. Partial Update',
      locationId: secondLocationId
    };

    const result = await updateDoctor(updateInput);

    expect(result).toBeDefined();
    expect(result!.name).toEqual('Dr. Partial Update');
    expect(result!.locationId).toEqual(secondLocationId);
    expect(result!.contactNumber).toEqual('555-1234'); // Unchanged
    expect(result!.timings).toEqual('9 AM - 5 PM'); // Unchanged

    // Verify in database
    const doctors = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, testDoctorId))
      .execute();

    expect(doctors[0].name).toEqual('Dr. Partial Update');
    expect(doctors[0].locationId).toEqual(secondLocationId);
  });
});
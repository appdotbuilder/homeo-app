import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, doctorsTable } from '../db/schema';
import { type GetByIdInput, type CreateLocationInput, type CreateDoctorInput } from '../schema';
import { getDoctorById } from '../handlers/get_doctor_by_id';

// Test data
const testLocation: CreateLocationInput = {
  name: 'Test Hospital',
  address: '123 Test Street, Test City'
};

const testDoctor: CreateDoctorInput = {
  name: 'Dr. John Doe',
  contactNumber: '+1-555-0123',
  locationId: 1, // Will be set after location creation
  timings: 'Mon-Fri 9:00 AM - 5:00 PM'
};

describe('getDoctorById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a doctor when found', async () => {
    // Create prerequisite location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: testLocation.name,
        address: testLocation.address
      })
      .returning()
      .execute();

    const location = locationResult[0];

    // Create test doctor
    const doctorResult = await db.insert(doctorsTable)
      .values({
        name: testDoctor.name,
        contactNumber: testDoctor.contactNumber,
        locationId: location.id,
        timings: testDoctor.timings
      })
      .returning()
      .execute();

    const createdDoctor = doctorResult[0];

    // Test the handler
    const input: GetByIdInput = { id: createdDoctor.id };
    const result = await getDoctorById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdDoctor.id);
    expect(result!.name).toEqual('Dr. John Doe');
    expect(result!.contactNumber).toEqual('+1-555-0123');
    expect(result!.locationId).toEqual(location.id);
    expect(result!.timings).toEqual('Mon-Fri 9:00 AM - 5:00 PM');
  });

  it('should return null when doctor not found', async () => {
    const input: GetByIdInput = { id: 999 };
    const result = await getDoctorById(input);

    expect(result).toBeNull();
  });

  it('should return correct doctor among multiple doctors', async () => {
    // Create prerequisite location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: testLocation.name,
        address: testLocation.address
      })
      .returning()
      .execute();

    const location = locationResult[0];

    // Create multiple doctors
    const doctor1Result = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Jane Smith',
        contactNumber: '+1-555-1111',
        locationId: location.id,
        timings: 'Mon-Wed 8:00 AM - 4:00 PM'
      })
      .returning()
      .execute();

    const doctor2Result = await db.insert(doctorsTable)
      .values({
        name: 'Dr. Bob Wilson',
        contactNumber: '+1-555-2222',
        locationId: location.id,
        timings: 'Thu-Sat 10:00 AM - 6:00 PM'
      })
      .returning()
      .execute();

    const doctor1 = doctor1Result[0];
    const doctor2 = doctor2Result[0];

    // Test getting first doctor
    const input1: GetByIdInput = { id: doctor1.id };
    const result1 = await getDoctorById(input1);

    expect(result1).not.toBeNull();
    expect(result1!.id).toEqual(doctor1.id);
    expect(result1!.name).toEqual('Dr. Jane Smith');
    expect(result1!.contactNumber).toEqual('+1-555-1111');

    // Test getting second doctor
    const input2: GetByIdInput = { id: doctor2.id };
    const result2 = await getDoctorById(input2);

    expect(result2).not.toBeNull();
    expect(result2!.id).toEqual(doctor2.id);
    expect(result2!.name).toEqual('Dr. Bob Wilson');
    expect(result2!.contactNumber).toEqual('+1-555-2222');
  });

  it('should handle database query correctly', async () => {
    // Create prerequisite location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: testLocation.name,
        address: testLocation.address
      })
      .returning()
      .execute();

    const location = locationResult[0];

    // Create test doctor
    const doctorResult = await db.insert(doctorsTable)
      .values({
        name: testDoctor.name,
        contactNumber: testDoctor.contactNumber,
        locationId: location.id,
        timings: testDoctor.timings
      })
      .returning()
      .execute();

    const createdDoctor = doctorResult[0];

    // Verify doctor exists in database before handler call
    const directQuery = await db.select()
      .from(doctorsTable)
      .execute();

    expect(directQuery).toHaveLength(1);
    expect(directQuery[0].id).toEqual(createdDoctor.id);

    // Test handler returns same data
    const input: GetByIdInput = { id: createdDoctor.id };
    const result = await getDoctorById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(directQuery[0].id);
    expect(result!.name).toEqual(directQuery[0].name);
    expect(result!.contactNumber).toEqual(directQuery[0].contactNumber);
    expect(result!.locationId).toEqual(directQuery[0].locationId);
    expect(result!.timings).toEqual(directQuery[0].timings);
  });
});
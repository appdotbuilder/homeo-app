import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { doctorsTable, locationsTable, patientsTable, visitsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { deleteDoctor } from '../handlers/delete_doctor';
import { eq } from 'drizzle-orm';

// Test input
const testInput: GetByIdInput = {
  id: 1
};

describe('deleteDoctor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a doctor successfully', async () => {
    // Create prerequisite location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    // Create doctor
    await db.insert(doctorsTable)
      .values({
        name: 'Dr. Test Doctor',
        contactNumber: '1234567890',
        locationId: locationResult[0].id,
        timings: '9 AM - 5 PM'
      })
      .execute();

    const result = await deleteDoctor(testInput);

    expect(result.success).toBe(true);

    // Verify doctor was deleted from database
    const doctors = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, testInput.id))
      .execute();

    expect(doctors).toHaveLength(0);
  });

  it('should throw error when doctor does not exist', async () => {
    const nonExistentInput: GetByIdInput = { id: 999 };

    expect(deleteDoctor(nonExistentInput)).rejects.toThrow(/Doctor with ID 999 not found/i);
  });

  it('should throw error when doctor has existing visits', async () => {
    // Create prerequisite location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    // Create doctor
    await db.insert(doctorsTable)
      .values({
        name: 'Dr. Test Doctor',
        contactNumber: '1234567890',
        locationId: locationResult[0].id,
        timings: '9 AM - 5 PM'
      })
      .execute();

    // Create patient
    const patientResult = await db.insert(patientsTable)
      .values({
        patientId: 'P001',
        cnic: '1234567890123',
        phone: '1234567890',
        name: 'Test Patient'
      })
      .returning()
      .execute();

    // Create visit for this doctor
    await db.insert(visitsTable)
      .values({
        patientId: patientResult[0].id,
        doctorId: testInput.id,
        visitDate: new Date(),
        symptoms: 'Test symptoms',
        diagnosis: 'Test diagnosis',
        prescription: 'Test prescription'
      })
      .execute();

    expect(deleteDoctor(testInput)).rejects.toThrow(/Cannot delete doctor with ID 1 because they have existing visits/i);
  });

  it('should not affect other doctors when deleting one', async () => {
    // Create prerequisite location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    // Create multiple doctors
    await db.insert(doctorsTable)
      .values([
        {
          name: 'Dr. First Doctor',
          contactNumber: '1111111111',
          locationId: locationResult[0].id,
          timings: '9 AM - 5 PM'
        },
        {
          name: 'Dr. Second Doctor',
          contactNumber: '2222222222',
          locationId: locationResult[0].id,
          timings: '10 AM - 6 PM'
        }
      ])
      .execute();

    // Delete the first doctor
    const result = await deleteDoctor({ id: 1 });

    expect(result.success).toBe(true);

    // Verify only first doctor was deleted
    const remainingDoctors = await db.select()
      .from(doctorsTable)
      .execute();

    expect(remainingDoctors).toHaveLength(1);
    expect(remainingDoctors[0].name).toEqual('Dr. Second Doctor');
    expect(remainingDoctors[0].id).toEqual(2);
  });

  it('should verify doctor exists before checking visits', async () => {
    // Create prerequisite location
    const locationResult = await db.insert(locationsTable)
      .values({
        name: 'Test Hospital',
        address: '123 Test Street'
      })
      .returning()
      .execute();

    // Create doctor with ID 1
    await db.insert(doctorsTable)
      .values({
        name: 'Dr. Test Doctor',
        contactNumber: '1234567890',
        locationId: locationResult[0].id,
        timings: '9 AM - 5 PM'
      })
      .execute();

    // Try to delete non-existent doctor ID 999
    const nonExistentInput: GetByIdInput = { id: 999 };

    // Should throw "not found" error, not "has visits" error
    expect(deleteDoctor(nonExistentInput)).rejects.toThrow(/Doctor with ID 999 not found/i);
  });
});
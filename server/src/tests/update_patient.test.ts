import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type UpdatePatientInput } from '../schema';
import { updatePatient } from '../handlers/update_patient';
import { eq } from 'drizzle-orm';

describe('updatePatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPatientId: number;

  beforeEach(async () => {
    // Create a test patient for updates
    const result = await db.insert(patientsTable)
      .values({
        patientId: 'P001',
        cnic: '12345-1234567-1',
        phone: '+92-300-1234567',
        name: 'Test Patient'
      })
      .returning()
      .execute();

    testPatientId = result[0].id;
  });

  it('should update patient name only', async () => {
    const input: UpdatePatientInput = {
      id: testPatientId,
      name: 'Updated Patient Name'
    };

    const result = await updatePatient(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testPatientId);
    expect(result!.name).toEqual('Updated Patient Name');
    expect(result!.cnic).toEqual('12345-1234567-1'); // Should remain unchanged
    expect(result!.phone).toEqual('+92-300-1234567'); // Should remain unchanged
    expect(result!.patientId).toEqual('P001'); // Should remain unchanged
  });

  it('should update patient CNIC only', async () => {
    const input: UpdatePatientInput = {
      id: testPatientId,
      cnic: '54321-7654321-9'
    };

    const result = await updatePatient(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testPatientId);
    expect(result!.cnic).toEqual('54321-7654321-9');
    expect(result!.name).toEqual('Test Patient'); // Should remain unchanged
    expect(result!.phone).toEqual('+92-300-1234567'); // Should remain unchanged
  });

  it('should update patient phone only', async () => {
    const input: UpdatePatientInput = {
      id: testPatientId,
      phone: '+92-321-9876543'
    };

    const result = await updatePatient(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testPatientId);
    expect(result!.phone).toEqual('+92-321-9876543');
    expect(result!.name).toEqual('Test Patient'); // Should remain unchanged
    expect(result!.cnic).toEqual('12345-1234567-1'); // Should remain unchanged
  });

  it('should update multiple fields at once', async () => {
    const input: UpdatePatientInput = {
      id: testPatientId,
      name: 'Fully Updated Patient',
      cnic: '98765-9876543-2',
      phone: '+92-333-5555555'
    };

    const result = await updatePatient(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testPatientId);
    expect(result!.name).toEqual('Fully Updated Patient');
    expect(result!.cnic).toEqual('98765-9876543-2');
    expect(result!.phone).toEqual('+92-333-5555555');
    expect(result!.patientId).toEqual('P001'); // Should remain unchanged
  });

  it('should set fields to null when explicitly provided', async () => {
    const input: UpdatePatientInput = {
      id: testPatientId,
      name: null,
      cnic: null
    };

    const result = await updatePatient(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testPatientId);
    expect(result!.name).toBeNull();
    expect(result!.cnic).toBeNull();
    expect(result!.phone).toEqual('+92-300-1234567'); // Should remain unchanged
  });

  it('should return existing patient when no fields to update', async () => {
    const input: UpdatePatientInput = {
      id: testPatientId
    };

    const result = await updatePatient(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testPatientId);
    expect(result!.name).toEqual('Test Patient');
    expect(result!.cnic).toEqual('12345-1234567-1');
    expect(result!.phone).toEqual('+92-300-1234567');
  });

  it('should return null for non-existent patient', async () => {
    const input: UpdatePatientInput = {
      id: 99999,
      name: 'Non-existent Patient'
    };

    const result = await updatePatient(input);

    expect(result).toBeNull();
  });

  it('should save updated patient to database', async () => {
    const input: UpdatePatientInput = {
      id: testPatientId,
      name: 'Database Updated Patient',
      phone: '+92-345-1111111'
    };

    const result = await updatePatient(input);

    // Verify in database
    const savedPatient = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, testPatientId))
      .execute();

    expect(savedPatient).toHaveLength(1);
    expect(savedPatient[0].name).toEqual('Database Updated Patient');
    expect(savedPatient[0].phone).toEqual('+92-345-1111111');
    expect(savedPatient[0].cnic).toEqual('12345-1234567-1'); // Should remain unchanged
  });

  it('should handle unique constraint violations for CNIC', async () => {
    // Create another patient with different CNIC
    await db.insert(patientsTable)
      .values({
        patientId: 'P002',
        cnic: '11111-1111111-1',
        phone: '+92-300-7777777',
        name: 'Another Patient'
      })
      .execute();

    const input: UpdatePatientInput = {
      id: testPatientId,
      cnic: '11111-1111111-1' // Try to use existing CNIC
    };

    // Should throw error due to unique constraint
    await expect(updatePatient(input)).rejects.toThrow(/unique/i);
  });

  it('should handle unique constraint violations for phone', async () => {
    // Create another patient with different phone
    await db.insert(patientsTable)
      .values({
        patientId: 'P003',
        cnic: '22222-2222222-2',
        phone: '+92-300-8888888',
        name: 'Third Patient'
      })
      .execute();

    const input: UpdatePatientInput = {
      id: testPatientId,
      phone: '+92-300-8888888' // Try to use existing phone
    };

    // Should throw error due to unique constraint
    await expect(updatePatient(input)).rejects.toThrow(/unique/i);
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { getPatientById } from '../handlers/get_patient_by_id';

describe('getPatientById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return patient when found', async () => {
    // Create a test patient
    const insertResult = await db.insert(patientsTable)
      .values({
        patientId: 'P001',
        cnic: '12345-1234567-1',
        phone: '+92-300-1234567',
        name: 'John Doe',
      })
      .returning()
      .execute();

    const createdPatient = insertResult[0];
    const input: GetByIdInput = { id: createdPatient.id };

    const result = await getPatientById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPatient.id);
    expect(result!.patientId).toEqual('P001');
    expect(result!.cnic).toEqual('12345-1234567-1');
    expect(result!.phone).toEqual('+92-300-1234567');
    expect(result!.name).toEqual('John Doe');
  });

  it('should return patient with minimal data (only phone)', async () => {
    // Create patient with only phone number
    const insertResult = await db.insert(patientsTable)
      .values({
        patientId: 'P002',
        cnic: null,
        phone: '+92-321-9876543',
        name: null,
      })
      .returning()
      .execute();

    const createdPatient = insertResult[0];
    const input: GetByIdInput = { id: createdPatient.id };

    const result = await getPatientById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPatient.id);
    expect(result!.patientId).toEqual('P002');
    expect(result!.cnic).toBeNull();
    expect(result!.phone).toEqual('+92-321-9876543');
    expect(result!.name).toBeNull();
  });

  it('should return patient with minimal data (only cnic)', async () => {
    // Create patient with only CNIC
    const insertResult = await db.insert(patientsTable)
      .values({
        patientId: 'P003',
        cnic: '54321-7654321-2',
        phone: null,
        name: null,
      })
      .returning()
      .execute();

    const createdPatient = insertResult[0];
    const input: GetByIdInput = { id: createdPatient.id };

    const result = await getPatientById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPatient.id);
    expect(result!.patientId).toEqual('P003');
    expect(result!.cnic).toEqual('54321-7654321-2');
    expect(result!.phone).toBeNull();
    expect(result!.name).toBeNull();
  });

  it('should return null when patient not found', async () => {
    const input: GetByIdInput = { id: 999999 };

    const result = await getPatientById(input);

    expect(result).toBeNull();
  });

  it('should return correct patient when multiple patients exist', async () => {
    // Create multiple test patients
    const patients = await db.insert(patientsTable)
      .values([
        {
          patientId: 'P001',
          cnic: '11111-1111111-1',
          phone: '+92-300-1111111',
          name: 'Patient One',
        },
        {
          patientId: 'P002',
          cnic: '22222-2222222-2',
          phone: '+92-300-2222222',
          name: 'Patient Two',
        },
        {
          patientId: 'P003',
          cnic: '33333-3333333-3',
          phone: '+92-300-3333333',
          name: 'Patient Three',
        },
      ])
      .returning()
      .execute();

    // Get the second patient
    const targetPatient = patients[1];
    const input: GetByIdInput = { id: targetPatient.id };

    const result = await getPatientById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(targetPatient.id);
    expect(result!.patientId).toEqual('P002');
    expect(result!.cnic).toEqual('22222-2222222-2');
    expect(result!.phone).toEqual('+92-300-2222222');
    expect(result!.name).toEqual('Patient Two');

    // Ensure it's not returning other patients
    expect(result!.patientId).not.toEqual('P001');
    expect(result!.patientId).not.toEqual('P003');
  });

  it('should handle edge case with ID 0', async () => {
    const input: GetByIdInput = { id: 0 };

    const result = await getPatientById(input);

    expect(result).toBeNull();
  });

  it('should handle negative ID values', async () => {
    const input: GetByIdInput = { id: -1 };

    const result = await getPatientById(input);

    expect(result).toBeNull();
  });
});
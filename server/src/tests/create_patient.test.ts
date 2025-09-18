import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput } from '../schema';
import { createPatient } from '../handlers/create_patient';
import { eq } from 'drizzle-orm';

describe('createPatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a patient with CNIC only', async () => {
    const testInput: CreatePatientInput = {
      cnic: '12345-6789012-3',
      name: 'John Doe'
    };

    const result = await createPatient(testInput);

    expect(result.id).toBeDefined();
    expect(result.patientId).toEqual('P001');
    expect(result.cnic).toEqual('12345-6789012-3');
    expect(result.phone).toBeNull();
    expect(result.name).toEqual('John Doe');
  });

  it('should create a patient with phone only', async () => {
    const testInput: CreatePatientInput = {
      phone: '+92-300-1234567',
      name: 'Jane Smith'
    };

    const result = await createPatient(testInput);

    expect(result.id).toBeDefined();
    expect(result.patientId).toEqual('P001');
    expect(result.cnic).toBeNull();
    expect(result.phone).toEqual('+92-300-1234567');
    expect(result.name).toEqual('Jane Smith');
  });

  it('should create a patient with both CNIC and phone', async () => {
    const testInput: CreatePatientInput = {
      cnic: '12345-6789012-3',
      phone: '+92-300-1234567',
      name: 'John Smith'
    };

    const result = await createPatient(testInput);

    expect(result.id).toBeDefined();
    expect(result.patientId).toEqual('P001');
    expect(result.cnic).toEqual('12345-6789012-3');
    expect(result.phone).toEqual('+92-300-1234567');
    expect(result.name).toEqual('John Smith');
  });

  it('should create a patient without name', async () => {
    const testInput: CreatePatientInput = {
      cnic: '12345-6789012-3'
    };

    const result = await createPatient(testInput);

    expect(result.id).toBeDefined();
    expect(result.patientId).toEqual('P001');
    expect(result.cnic).toEqual('12345-6789012-3');
    expect(result.phone).toBeNull();
    expect(result.name).toBeNull();
  });

  it('should save patient to database', async () => {
    const testInput: CreatePatientInput = {
      cnic: '12345-6789012-3',
      phone: '+92-300-1234567',
      name: 'Test Patient'
    };

    const result = await createPatient(testInput);

    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, result.id))
      .execute();

    expect(patients).toHaveLength(1);
    expect(patients[0].patientId).toEqual('P001');
    expect(patients[0].cnic).toEqual('12345-6789012-3');
    expect(patients[0].phone).toEqual('+92-300-1234567');
    expect(patients[0].name).toEqual('Test Patient');
  });

  it('should generate sequential patient IDs', async () => {
    const firstInput: CreatePatientInput = {
      cnic: '11111-1111111-1',
      name: 'First Patient'
    };

    const secondInput: CreatePatientInput = {
      phone: '+92-300-1111111',
      name: 'Second Patient'
    };

    const thirdInput: CreatePatientInput = {
      cnic: '33333-3333333-3',
      name: 'Third Patient'
    };

    const first = await createPatient(firstInput);
    const second = await createPatient(secondInput);
    const third = await createPatient(thirdInput);

    expect(first.patientId).toEqual('P001');
    expect(second.patientId).toEqual('P002');
    expect(third.patientId).toEqual('P003');
  });

  it('should throw error for duplicate CNIC', async () => {
    const firstInput: CreatePatientInput = {
      cnic: '12345-6789012-3',
      name: 'First Patient'
    };

    const duplicateInput: CreatePatientInput = {
      cnic: '12345-6789012-3',
      name: 'Duplicate Patient'
    };

    await createPatient(firstInput);

    await expect(createPatient(duplicateInput)).rejects.toThrow(/CNIC already exists/i);
  });

  it('should throw error for duplicate phone', async () => {
    const firstInput: CreatePatientInput = {
      phone: '+92-300-1234567',
      name: 'First Patient'
    };

    const duplicateInput: CreatePatientInput = {
      phone: '+92-300-1234567',
      name: 'Duplicate Patient'
    };

    await createPatient(firstInput);

    await expect(createPatient(duplicateInput)).rejects.toThrow(/phone number already exists/i);
  });

  it('should allow different patients with same name but different CNIC/phone', async () => {
    const firstInput: CreatePatientInput = {
      cnic: '11111-1111111-1',
      name: 'John Doe'
    };

    const secondInput: CreatePatientInput = {
      phone: '+92-300-1234567',
      name: 'John Doe'
    };

    const first = await createPatient(firstInput);
    const second = await createPatient(secondInput);

    expect(first.name).toEqual('John Doe');
    expect(second.name).toEqual('John Doe');
    expect(first.id).not.toEqual(second.id);
    expect(first.patientId).toEqual('P001');
    expect(second.patientId).toEqual('P002');
  });

  it('should handle patient creation when both CNIC and phone are provided but only one conflicts', async () => {
    const existingInput: CreatePatientInput = {
      cnic: '11111-1111111-1',
      phone: '+92-300-1111111',
      name: 'Existing Patient'
    };

    const conflictCnicInput: CreatePatientInput = {
      cnic: '11111-1111111-1',
      phone: '+92-300-9999999',
      name: 'Conflict CNIC'
    };

    const conflictPhoneInput: CreatePatientInput = {
      cnic: '99999-9999999-9',
      phone: '+92-300-1111111',
      name: 'Conflict Phone'
    };

    await createPatient(existingInput);

    await expect(createPatient(conflictCnicInput)).rejects.toThrow(/CNIC already exists/i);
    await expect(createPatient(conflictPhoneInput)).rejects.toThrow(/phone number already exists/i);
  });
});
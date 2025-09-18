import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { getPatients } from '../handlers/get_patients';

describe('getPatients', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no patients exist', async () => {
    const result = await getPatients();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all patients from database', async () => {
    // Create test patients
    await db.insert(patientsTable).values([
      {
        patientId: 'PAT001',
        cnic: '12345-6789012-3',
        phone: '+92-300-1234567',
        name: 'John Doe'
      },
      {
        patientId: 'PAT002',
        cnic: '98765-4321098-7',
        phone: null,
        name: 'Jane Smith'
      },
      {
        patientId: 'PAT003',
        cnic: null,
        phone: '+92-301-9876543',
        name: null
      }
    ]).execute();

    const result = await getPatients();

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      id: expect.any(Number),
      patientId: 'PAT001',
      cnic: '12345-6789012-3',
      phone: '+92-300-1234567',
      name: 'John Doe'
    });
    expect(result[1]).toMatchObject({
      id: expect.any(Number),
      patientId: 'PAT002',
      cnic: '98765-4321098-7',
      phone: null,
      name: 'Jane Smith'
    });
    expect(result[2]).toMatchObject({
      id: expect.any(Number),
      patientId: 'PAT003',
      cnic: null,
      phone: '+92-301-9876543',
      name: null
    });
  });

  it('should handle patients with minimal data correctly', async () => {
    // Create patient with only required fields (patientId + either cnic or phone)
    await db.insert(patientsTable).values({
      patientId: 'MIN001',
      cnic: '11111-1111111-1',
      phone: null,
      name: null
    }).execute();

    const result = await getPatients();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: expect.any(Number),
      patientId: 'MIN001',
      cnic: '11111-1111111-1',
      phone: null,
      name: null
    });
  });

  it('should return patients in database insertion order', async () => {
    const testPatients = [
      { patientId: 'FIRST', cnic: '11111-1111111-1', phone: null, name: 'First Patient' },
      { patientId: 'SECOND', cnic: '22222-2222222-2', phone: null, name: 'Second Patient' },
      { patientId: 'THIRD', cnic: '33333-3333333-3', phone: null, name: 'Third Patient' }
    ];

    // Insert patients sequentially
    for (const patient of testPatients) {
      await db.insert(patientsTable).values(patient).execute();
    }

    const result = await getPatients();

    expect(result).toHaveLength(3);
    expect(result.map(p => p.patientId)).toEqual(['FIRST', 'SECOND', 'THIRD']);
    expect(result.map(p => p.name)).toEqual(['First Patient', 'Second Patient', 'Third Patient']);
  });

  it('should handle large number of patients', async () => {
    // Create multiple patients to test performance
    const patientData = Array.from({ length: 50 }, (_, index) => ({
      patientId: `PAT${String(index + 1).padStart(3, '0')}`,
      cnic: `${String(index + 1).padStart(5, '0')}-${String(index + 1).padStart(7, '0')}-${(index % 10)}`,
      phone: index % 2 === 0 ? `+92-300-${String(index + 1000000).slice(-7)}` : null,
      name: `Patient ${index + 1}`
    }));

    await db.insert(patientsTable).values(patientData).execute();

    const result = await getPatients();

    expect(result).toHaveLength(50);
    expect(result[0].patientId).toBe('PAT001');
    expect(result[49].patientId).toBe('PAT050');
    
    // Verify all results have required fields
    result.forEach(patient => {
      expect(patient.id).toBeDefined();
      expect(patient.patientId).toBeDefined();
      expect(typeof patient.patientId).toBe('string');
      expect(patient.patientId.length).toBeGreaterThan(0);
    });
  });

  it('should preserve all field types correctly', async () => {
    await db.insert(patientsTable).values({
      patientId: 'TYPE001',
      cnic: '12345-6789012-3',
      phone: '+92-300-1234567',
      name: 'Type Test Patient'
    }).execute();

    const result = await getPatients();

    expect(result).toHaveLength(1);
    const patient = result[0];
    
    // Verify field types
    expect(typeof patient.id).toBe('number');
    expect(typeof patient.patientId).toBe('string');
    expect(typeof patient.cnic).toBe('string');
    expect(typeof patient.phone).toBe('string');
    expect(typeof patient.name).toBe('string');
  });
});
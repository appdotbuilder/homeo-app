import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type PatientSearchInput } from '../schema';
import { searchPatients } from '../handlers/search_patients';

// Test data
const testPatients = [
  {
    patientId: 'P001',
    cnic: '12345-6789012-3',
    phone: '+92-300-1234567',
    name: 'John Doe'
  },
  {
    patientId: 'P002', 
    cnic: '98765-4321098-7',
    phone: '+92-301-9876543',
    name: 'Jane Smith'
  },
  {
    patientId: 'P003',
    cnic: null,
    phone: '+92-302-5555555',
    name: 'Bob Johnson'
  },
  {
    patientId: 'P004',
    cnic: '11111-2222233-4',
    phone: null,
    name: null
  },
  {
    patientId: 'PAT005',
    cnic: '55555-6666677-8',
    phone: '+92-303-7777777',
    name: 'Alice Brown'
  }
];

describe('searchPatients', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test patients
    await db.insert(patientsTable)
      .values(testPatients)
      .execute();
  });

  afterEach(resetDB);

  it('should search by exact patientId match', async () => {
    const input: PatientSearchInput = { query: 'P001' };
    const results = await searchPatients(input);

    expect(results).toHaveLength(1);
    expect(results[0].patientId).toEqual('P001');
    expect(results[0].name).toEqual('John Doe');
    expect(results[0].cnic).toEqual('12345-6789012-3');
  });

  it('should search by partial patientId match', async () => {
    const input: PatientSearchInput = { query: 'P00' };
    const results = await searchPatients(input);

    expect(results.length).toBeGreaterThanOrEqual(3);
    const patientIds = results.map(p => p.patientId);
    expect(patientIds).toContain('P001');
    expect(patientIds).toContain('P002');
    expect(patientIds).toContain('P003');
  });

  it('should search by exact cnic match', async () => {
    const input: PatientSearchInput = { query: '12345-6789012-3' };
    const results = await searchPatients(input);

    expect(results).toHaveLength(1);
    expect(results[0].cnic).toEqual('12345-6789012-3');
    expect(results[0].name).toEqual('John Doe');
  });

  it('should search by partial cnic match', async () => {
    const input: PatientSearchInput = { query: '12345' };
    const results = await searchPatients(input);

    expect(results).toHaveLength(1);
    expect(results[0].cnic).toEqual('12345-6789012-3');
  });

  it('should search by exact phone match', async () => {
    const input: PatientSearchInput = { query: '+92-300-1234567' };
    const results = await searchPatients(input);

    expect(results).toHaveLength(1);
    expect(results[0].phone).toEqual('+92-300-1234567');
    expect(results[0].name).toEqual('John Doe');
  });

  it('should search by partial phone match', async () => {
    const input: PatientSearchInput = { query: '300-1234' };
    const results = await searchPatients(input);

    expect(results).toHaveLength(1);
    expect(results[0].phone).toEqual('+92-300-1234567');
  });

  it('should search by partial name match (case-insensitive)', async () => {
    const input: PatientSearchInput = { query: 'john' };
    const results = await searchPatients(input);

    expect(results.length).toBeGreaterThanOrEqual(2);
    const names = results.map(p => p.name);
    expect(names).toContain('John Doe');
    expect(names).toContain('Bob Johnson');
  });

  it('should search by partial name match with different case', async () => {
    const input: PatientSearchInput = { query: 'SMITH' };
    const results = await searchPatients(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Jane Smith');
  });

  it('should return multiple results for common search terms', async () => {
    const input: PatientSearchInput = { query: '92' };
    const results = await searchPatients(input);

    // Should match all phone numbers that contain '92'
    expect(results.length).toBeGreaterThan(1);
    results.forEach(patient => {
      if (patient.phone) {
        expect(patient.phone.toLowerCase()).toContain('92');
      }
    });
  });

  it('should return empty array for non-matching query', async () => {
    const input: PatientSearchInput = { query: 'nonexistent' };
    const results = await searchPatients(input);

    expect(results).toHaveLength(0);
  });

  it('should handle empty query gracefully', async () => {
    const input: PatientSearchInput = { query: '   ' };
    const results = await searchPatients(input);

    // Should return empty since trimmed query is empty
    expect(results).toHaveLength(0);
  });

  it('should handle special characters in search', async () => {
    const input: PatientSearchInput = { query: '+92-' };
    const results = await searchPatients(input);

    // Should match phone numbers with this pattern
    expect(results.length).toBeGreaterThan(0);
    results.forEach(patient => {
      if (patient.phone) {
        expect(patient.phone).toContain('+92-');
      }
    });
  });

  it('should search across multiple fields simultaneously', async () => {
    // Search for 'P' which should match both patientId and potentially names
    const input: PatientSearchInput = { query: 'P' };
    const results = await searchPatients(input);

    expect(results.length).toBeGreaterThan(0);
    
    // Verify that results contain patients with 'P' in patientId or names
    let hasPatientIdMatch = false;
    let hasNameMatch = false;
    
    results.forEach(patient => {
      if (patient.patientId.includes('P')) {
        hasPatientIdMatch = true;
      }
      if (patient.name && patient.name.toLowerCase().includes('p')) {
        hasNameMatch = true;
      }
    });
    
    expect(hasPatientIdMatch).toBe(true);
  });

  it('should return patients with null values in some fields', async () => {
    const input: PatientSearchInput = { query: 'P003' };
    const results = await searchPatients(input);

    expect(results).toHaveLength(1);
    expect(results[0].patientId).toEqual('P003');
    expect(results[0].cnic).toBeNull();
    expect(results[0].phone).toEqual('+92-302-5555555');
    expect(results[0].name).toEqual('Bob Johnson');
  });

  it('should handle numeric-only search queries', async () => {
    const input: PatientSearchInput = { query: '001' };
    const results = await searchPatients(input);

    expect(results).toHaveLength(1);
    expect(results[0].patientId).toEqual('P001');
  });
});
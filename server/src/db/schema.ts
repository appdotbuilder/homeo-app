import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Locations table
export const locationsTable = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
});

// Doctors table
export const doctorsTable = pgTable('doctors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  contactNumber: text('contact_number').notNull(),
  locationId: integer('location_id').notNull().references(() => locationsTable.id),
  timings: text('timings').notNull(),
});

// Patients table
export const patientsTable = pgTable('patients', {
  id: serial('id').primaryKey(),
  patientId: text('patient_id').notNull().unique(), // Auto-generated human-readable ID
  cnic: text('cnic').unique(), // Nullable, but either cnic or phone must be present
  phone: text('phone').unique(), // Nullable, but either cnic or phone must be present
  name: text('name'), // Nullable/optional
});

// Visits table
export const visitsTable = pgTable('visits', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patientsTable.id),
  doctorId: integer('doctor_id').notNull().references(() => doctorsTable.id),
  visitDate: timestamp('visit_date').defaultNow().notNull(),
  symptoms: text('symptoms').notNull(),
  diagnosis: text('diagnosis').notNull(),
  prescription: text('prescription').notNull(),
  notes: text('notes'), // Optional/nullable
  followUpDate: timestamp('follow_up_date'), // Optional/nullable
});

// Relations
export const locationsRelations = relations(locationsTable, ({ many }) => ({
  doctors: many(doctorsTable),
}));

export const doctorsRelations = relations(doctorsTable, ({ one, many }) => ({
  location: one(locationsTable, {
    fields: [doctorsTable.locationId],
    references: [locationsTable.id],
  }),
  visits: many(visitsTable),
}));

export const patientsRelations = relations(patientsTable, ({ many }) => ({
  visits: many(visitsTable),
}));

export const visitsRelations = relations(visitsTable, ({ one }) => ({
  patient: one(patientsTable, {
    fields: [visitsTable.patientId],
    references: [patientsTable.id],
  }),
  doctor: one(doctorsTable, {
    fields: [visitsTable.doctorId],
    references: [doctorsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Location = typeof locationsTable.$inferSelect;
export type NewLocation = typeof locationsTable.$inferInsert;

export type Doctor = typeof doctorsTable.$inferSelect;
export type NewDoctor = typeof doctorsTable.$inferInsert;

export type Patient = typeof patientsTable.$inferSelect;
export type NewPatient = typeof patientsTable.$inferInsert;

export type Visit = typeof visitsTable.$inferSelect;
export type NewVisit = typeof visitsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  locations: locationsTable, 
  doctors: doctorsTable, 
  patients: patientsTable, 
  visits: visitsTable 
};
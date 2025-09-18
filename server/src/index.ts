import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createLocationInputSchema, 
  updateLocationInputSchema,
  createDoctorInputSchema,
  updateDoctorInputSchema,
  createPatientInputSchema,
  updatePatientInputSchema,
  patientSearchInputSchema,
  createVisitInputSchema,
  updateVisitInputSchema,
  getByIdInputSchema,
  getVisitsByPatientInputSchema,
  getDoctorsByLocationInputSchema,
  loginInputSchema
} from './schema';

// Import handlers
import { createLocation } from './handlers/create_location';
import { getLocations } from './handlers/get_locations';
import { getLocationById } from './handlers/get_location_by_id';
import { updateLocation } from './handlers/update_location';
import { deleteLocation } from './handlers/delete_location';

import { createDoctor } from './handlers/create_doctor';
import { getDoctors } from './handlers/get_doctors';
import { getDoctorById } from './handlers/get_doctor_by_id';
import { getDoctorsByLocation } from './handlers/get_doctors_by_location';
import { updateDoctor } from './handlers/update_doctor';
import { deleteDoctor } from './handlers/delete_doctor';

import { createPatient } from './handlers/create_patient';
import { getPatients } from './handlers/get_patients';
import { getPatientById } from './handlers/get_patient_by_id';
import { searchPatients } from './handlers/search_patients';
import { updatePatient } from './handlers/update_patient';

import { createVisit } from './handlers/create_visit';
import { getVisits } from './handlers/get_visits';
import { getVisitById } from './handlers/get_visit_by_id';
import { getVisitsByPatient } from './handlers/get_visits_by_patient';
import { updateVisit } from './handlers/update_visit';
import { deleteVisit } from './handlers/delete_visit';

import { login } from './handlers/login';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

  // Location routes (Superadmin functions)
  createLocation: publicProcedure
    .input(createLocationInputSchema)
    .mutation(({ input }) => createLocation(input)),
  
  getLocations: publicProcedure
    .query(() => getLocations()),
  
  getLocationById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getLocationById(input)),
  
  updateLocation: publicProcedure
    .input(updateLocationInputSchema)
    .mutation(({ input }) => updateLocation(input)),
  
  deleteLocation: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => deleteLocation(input)),

  // Doctor routes (Superadmin functions)
  createDoctor: publicProcedure
    .input(createDoctorInputSchema)
    .mutation(({ input }) => createDoctor(input)),
  
  getDoctors: publicProcedure
    .query(() => getDoctors()),
  
  getDoctorById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getDoctorById(input)),
  
  getDoctorsByLocation: publicProcedure
    .input(getDoctorsByLocationInputSchema)
    .query(({ input }) => getDoctorsByLocation(input)),
  
  updateDoctor: publicProcedure
    .input(updateDoctorInputSchema)
    .mutation(({ input }) => updateDoctor(input)),
  
  deleteDoctor: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => deleteDoctor(input)),

  // Patient routes (Doctor functions)
  createPatient: publicProcedure
    .input(createPatientInputSchema)
    .mutation(({ input }) => createPatient(input)),
  
  getPatients: publicProcedure
    .query(() => getPatients()),
  
  getPatientById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getPatientById(input)),
  
  searchPatients: publicProcedure
    .input(patientSearchInputSchema)
    .query(({ input }) => searchPatients(input)),
  
  updatePatient: publicProcedure
    .input(updatePatientInputSchema)
    .mutation(({ input }) => updatePatient(input)),

  // Visit routes (Doctor functions)
  createVisit: publicProcedure
    .input(createVisitInputSchema)
    .mutation(({ input }) => createVisit(input)),
  
  getVisits: publicProcedure
    .query(() => getVisits()),
  
  getVisitById: publicProcedure
    .input(getByIdInputSchema)
    .query(({ input }) => getVisitById(input)),
  
  getVisitsByPatient: publicProcedure
    .input(getVisitsByPatientInputSchema)
    .query(({ input }) => getVisitsByPatient(input)),
  
  updateVisit: publicProcedure
    .input(updateVisitInputSchema)
    .mutation(({ input }) => updateVisit(input)),
  
  deleteVisit: publicProcedure
    .input(getByIdInputSchema)
    .mutation(({ input }) => deleteVisit(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
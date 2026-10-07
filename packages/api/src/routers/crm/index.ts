/**
 * CRM Main Router
 * 
 * Aggregates all CRM sub-routers with proper security and access control
 */

import { router } from "../../trpc";
import { companiesRouter } from "./companies";
import { contactsRouter } from "./contacts";
import { dealsRouter } from "./deals";
import { activitiesRouter } from "./activities";
import { tasksRouter } from "./tasks";
import { notesRouter } from "./notes";
import { tagsRouter } from "./tags";
import { pipelinesRouter } from "./pipelines";
import { customFieldsRouter } from "./custom-fields";

// TODO: Import remaining routers as they are built
// import { analyticsRouter } from "./analytics";
// import { aiRouter } from "./ai";
// import { syncRouter } from "./sync";

export const crmRouter = router({
  companies: companiesRouter,
  contacts: contactsRouter,
  deals: dealsRouter,
  activities: activitiesRouter,
  tasks: tasksRouter,
  notes: notesRouter,
  tags: tagsRouter,
  pipelines: pipelinesRouter,
  customFields: customFieldsRouter,
  
  // TODO: Add remaining routers as they are built
  // analytics: analyticsRouter,
  // ai: aiRouter,
  // sync: syncRouter,
});

export type CrmRouter = typeof crmRouter;

/**
 * M11 repository interfaces — training / competency SoT.
 * People referenced via WorkforcePersonRef only (never import M04 repositories).
 */

import type { TrainingStatusRef } from "@/platform/workforce/contracts/training-status-ref";
import type { WorkforcePersonRef } from "@/platform/workforce/contracts/workforce-person-ref";
import type {
  Assignment,
  CatalogueCourse,
  CompletionRecord,
  CompetencyRecord,
  PolicyVersion,
} from "../types/domain";

export interface M11TrainingRepository {
  listStatuses(personId?: string): TrainingStatusRef[];
  getStatus(id: string): TrainingStatusRef | null;
  upsertStatus(status: TrainingStatusRef): void;
  resolvePerson(personId: string): WorkforcePersonRef | null;
}

export type M11Repositories = {
  training: M11TrainingRepository;
};

export type M11StoreSnapshot = {
  catalogue: CatalogueCourse[];
  assignments: Assignment[];
  completions: CompletionRecord[];
  competencies: CompetencyRecord[];
  policies: PolicyVersion[];
};

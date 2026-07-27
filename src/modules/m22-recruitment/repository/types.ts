/**
 * M22 repository interfaces — candidate SoT until promotion.
 * Promotion creates M04 person once; must not duplicate people.
 */

import type { CandidateRef } from "@/platform/workforce/contracts/candidate-ref";
import type { WorkforcePersonRef } from "@/platform/workforce/contracts/workforce-person-ref";

export interface M22RecruitmentRepository {
  listCandidates(): CandidateRef[];
  getCandidate(id: string): CandidateRef | null;
  upsertCandidate(candidate: CandidateRef): void;
  /**
   * Promote candidate → M04 person reference.
   * Implementations must be idempotent and call M04 via adapter/contracts — never edit M04 repo directly.
   */
  promoteToWorkforce(candidateId: string): {
    candidate: CandidateRef;
    person: WorkforcePersonRef;
  };
}

export type M22Repositories = {
  recruitment: M22RecruitmentRepository;
};

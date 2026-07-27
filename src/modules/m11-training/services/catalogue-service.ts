/** M11 catalogue service — create courses, publish immutable versions. */

import { assertM11Permission, type M11Actor } from "../permissions";
import * as store from "../repository/local-store";
import type { CatalogueCourse, CourseVersion } from "../types/domain";
import { publishM11TrainingEvent } from "./events";

const DEFAULT_ORG = "org_parent";

export function createCourse(
  actor: M11Actor,
  input: {
    courseCode: string;
    title: string;
    category?: string;
    organisationId?: string;
  }
): CatalogueCourse {
  assertM11Permission(actor, "training.manage_catalogue");
  const now = new Date().toISOString();
  const course: CatalogueCourse = {
    id: store.newCourseId(),
    organisationId: input.organisationId ?? DEFAULT_ORG,
    courseCode: input.courseCode.trim(),
    title: input.title.trim(),
    category: input.category,
    activeVersionId: null,
    versions: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  store.upsertCourse(course);
  publishM11TrainingEvent({
    eventType: "worker.status.changed",
    sourceRecordId: course.id,
    sourceRecordVersion: course.version,
    sourceRecordType: "training-course",
    sourceRecordTitle: course.title,
    organisationId: course.organisationId,
    actor: actor.userId,
    idempotencyKey: `m11::course-created::${course.id}::v${course.version}`,
    section: "catalogue",
    currentStatus: "draft",
  });
  return course;
}

export function publishVersion(
  actor: M11Actor,
  courseId: string,
  input: Omit<CourseVersion, "versionId" | "courseId" | "versionNumber" | "status" | "publishedAt" | "archivedAt" | "createdAt" | "createdBy">
): CatalogueCourse {
  assertM11Permission(actor, "training.manage_catalogue");
  const course = store.getCourse(courseId);
  if (!course) throw new Error(`Course not found: ${courseId}`);

  const now = new Date().toISOString();
  const versionNumber = (course.versions.length > 0
    ? Math.max(...course.versions.map((v) => v.versionNumber))
    : 0) + 1;

  // Prior active version becomes archived (immutable status update)
  const priorVersions = course.versions.map((v) => {
    if (v.versionId === course.activeVersionId && v.status === "published") {
      return { ...v, status: "archived" as const, archivedAt: now };
    }
    return v;
  });

  const newVersion: CourseVersion = {
    versionId: store.newCourseId(),
    courseId,
    versionNumber,
    title: input.title,
    description: input.description,
    durationMinutes: input.durationMinutes,
    format: input.format,
    status: "published",
    publishedAt: now,
    archivedAt: null,
    createdAt: now,
    createdBy: actor.userId,
  };

  const updated: CatalogueCourse = {
    ...course,
    versions: [...priorVersions, newVersion],
    activeVersionId: newVersion.versionId,
    updatedAt: now,
    version: course.version + 1,
  };
  store.upsertCourse(updated);
  publishM11TrainingEvent({
    eventType: "worker.status.changed",
    sourceRecordId: updated.id,
    sourceRecordVersion: updated.version,
    sourceRecordType: "training-course-version",
    sourceRecordTitle: `${updated.title} v${versionNumber}`,
    organisationId: updated.organisationId,
    actor: actor.userId,
    idempotencyKey: `m11::course-version::${updated.id}::v${updated.version}`,
    section: "catalogue",
    currentStatus: "published",
  });
  return updated;
}

export function listCourses(organisationId?: string): CatalogueCourse[] {
  return store.listCatalogue(organisationId);
}

export function getCourse(id: string): CatalogueCourse | null {
  return store.getCourse(id);
}

"use client";

import { Fragment, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useTraining } from "../context";
import { createCourse, listCourses, publishVersion } from "../services/catalogue-service";
import { hasM11Permission } from "../permissions";
import { EmptyState, ValidationErrorState, OfflineState } from "./ux-states";

export function CatalogueSection() {
  const { actor, bump, pushToast, refreshKey } = useTraining();
  void refreshKey;

  const [courseCode, setCourseCode] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const [publishingCourseId, setPublishingCourseId] = useState<string | null>(null);
  const [versionTitle, setVersionTitle] = useState("");
  const [versionFormat, setVersionFormat] = useState<"online" | "in-person" | "blended" | "self-directed">("online");
  const [versionDuration, setVersionDuration] = useState("");

  const canManage = hasM11Permission(actor, "training.manage_catalogue");
  const courses = listCourses();
  const [filter, setFilter] = useState("");
  const filteredCourses = filter.trim()
    ? courses.filter((c) => {
        const q = filter.trim().toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.courseCode.toLowerCase().includes(q) ||
          (c.category ?? "").toLowerCase().includes(q)
        );
      })
    : courses;

  const handleCreate = () => {
    const errs: string[] = [];
    if (!courseCode.trim()) errs.push("Course code is required.");
    if (!title.trim()) errs.push("Title is required.");
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    try {
      createCourse(actor, { courseCode: courseCode.trim(), title: title.trim(), category: category.trim() || undefined });
      setCourseCode("");
      setTitle("");
      setCategory("");
      bump();
      pushToast(`Course "${title}" created.`, "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Create failed", "danger");
    }
  };

  const handlePublishVersion = (courseId: string) => {
    const errs: string[] = [];
    if (!versionTitle.trim()) errs.push("Version title is required.");
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    try {
      publishVersion(actor, courseId, {
        title: versionTitle.trim(),
        format: versionFormat,
        durationMinutes: versionDuration ? Number(versionDuration) : undefined,
      });
      setVersionTitle("");
      setVersionDuration("");
      setPublishingCourseId(null);
      bump();
      pushToast("Version published.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Publish failed", "danger");
    }
  };

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Course Catalogue</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Manage versioned training courses. Prior versions are archived (immutable) when a new version is published.
        </p>
      </div>

      {canManage ? (
        <Panel>
          <PanelTitle>Create course</PanelTitle>
          <PanelSub>Requires training.manage_catalogue.</PanelSub>
          <ValidationErrorState errors={errors} onDismiss={() => setErrors([])} />
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Course code (e.g. CPR-BLS-01)"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              aria-label="Course code"
            />
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Course title"
            />
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              placeholder="Category (optional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Category"
            />
            <Button
              variant="teal"
              onClick={handleCreate}
              disabled={!courseCode.trim() || !title.trim()}
            >
              Create
            </Button>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelTitle>Search catalogue</PanelTitle>
        <input
          className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
          placeholder="Filter by code, title, or category"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter courses"
        />
      </Panel>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses in catalogue"
          description="Create a course or wait for demo seed to load."
        />
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          title="No courses match this filter"
          description="Clear the search to see all courses."
        />
      ) : (
        <Panel pad={false}>
          <Table>
            <THead>
              <Th>Code</Th>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th>Versions</Th>
              <Th>Status</Th>
              {canManage ? <Th>Actions</Th> : null}
            </THead>
            <tbody>
              {filteredCourses.map((c) => {
                const activeVer = c.versions.find((v) => v.versionId === c.activeVersionId);
                return (
                  <Fragment key={c.id}>
                    <tr key={c.id}>
                      <Td className="font-mono text-xs">{c.courseCode}</Td>
                      <Td className="font-semibold">{c.title}</Td>
                      <Td>{c.category ?? "—"}</Td>
                      <Td>{c.versions.length}</Td>
                      <Td>
                        {activeVer ? (
                          <Badge tone="success">v{activeVer.versionNumber} published</Badge>
                        ) : (
                          <Badge tone="warn">no published version</Badge>
                        )}
                      </Td>
                      {canManage ? (
                        <Td>
                          <Button
                            small
                            variant="line"
                            onClick={() =>
                              setPublishingCourseId(
                                publishingCourseId === c.id ? null : c.id
                              )
                            }
                          >
                            Publish version
                          </Button>
                        </Td>
                      ) : null}
                    </tr>
                    {publishingCourseId === c.id ? (
                      <tr key={`${c.id}-publish`}>
                        <td colSpan={canManage ? 6 : 5} className="bg-[#f8fafc]">
                          <div className="grid gap-2 p-2 md:grid-cols-4">
                            <input
                              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                              placeholder="Version title"
                              value={versionTitle}
                              onChange={(e) => setVersionTitle(e.target.value)}
                              aria-label="Version title"
                            />
                            <select
                              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                              value={versionFormat}
                              onChange={(e) =>
                                setVersionFormat(
                                  e.target.value as typeof versionFormat
                                )
                              }
                              aria-label="Format"
                            >
                              <option value="online">Online</option>
                              <option value="in-person">In-person</option>
                              <option value="blended">Blended</option>
                              <option value="self-directed">Self-directed</option>
                            </select>
                            <input
                              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                              placeholder="Duration (minutes)"
                              type="number"
                              min={1}
                              value={versionDuration}
                              onChange={(e) => setVersionDuration(e.target.value)}
                              aria-label="Duration in minutes"
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="teal"
                                small
                                onClick={() => handlePublishVersion(c.id)}
                                disabled={!versionTitle.trim()}
                              >
                                Publish
                              </Button>
                              <Button
                                variant="line"
                                small
                                onClick={() => setPublishingCourseId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                          <ValidationErrorState errors={errors} onDismiss={() => setErrors([])} />
                        </td>
                      </tr>
                    ) : null}
                    {c.versions.length > 0 ? (
                      <tr key={`${c.id}-versions`}>
                        <td colSpan={canManage ? 6 : 5} className="bg-[#f8fafc] py-1">
                          <div className="flex flex-wrap gap-2 px-2 py-1">
                            {c.versions.map((v) => (
                              <span
                                key={v.versionId}
                                className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-xs border border-[var(--line)]"
                              >
                                v{v.versionNumber}
                                <Badge
                                  tone={
                                    v.status === "published"
                                      ? "success"
                                      : v.status === "archived"
                                        ? "default"
                                        : "warn"
                                  }
                                >
                                  {v.status}
                                </Badge>
                                {v.format} · {v.durationMinutes ?? "?"}min
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </Table>
        </Panel>
      )}
    </div>
  );
}

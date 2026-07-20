"use client";

import { useMemo, useState } from "react";
import { locationShort, matchesLocation } from "@/lib/mock/data";
import { usePortal } from "@/lib/portal-context";
import { useCreateForm } from "@/components/forms/CreateFormProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Metric } from "@/components/ui/Metric";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import type { TaskItem } from "@/lib/types";

function statusTone(s: TaskItem["status"]) {
  if (s === "Done") return "success" as const;
  if (s === "Blocked") return "danger" as const;
  if (s === "In progress") return "info" as const;
  return "default" as const;
}

export function TasksWorkspace() {
  const { tasks, locations, activeLocationId } = usePortal();
  const { openCreate, openChecklistWizard } = useCreateForm();
  const [tab, setTab] = useState("tasks");

  const rows = useMemo(
    () => tasks.filter((t) => matchesLocation(t.locationId, activeLocationId)),
    [tasks, activeLocationId]
  );

  return (
    <div className="grid gap-[18px]">
      <div className="grid gap-3.5 md:grid-cols-4">
        <Metric label="Tasks" value={rows.length} icon="checklist" />
        <Metric
          label="Open"
          value={rows.filter((t) => t.status === "Open").length}
          icon="task"
          tone="info"
        />
        <Metric
          label="In progress"
          value={rows.filter((t) => t.status === "In progress").length}
          icon="chart"
        />
        <Metric
          label="Blocked"
          value={rows.filter((t) => t.status === "Blocked").length}
          icon="alert"
          tone="danger"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: "tasks", label: "Tasks & Checklists" },
            { id: "handover", label: "Handover" },
            { id: "meetings", label: "Meetings & Actions" },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="line" onClick={() => openCreate("tasks")}>
            + Create Task
          </Button>
          <Button variant="teal" onClick={openChecklistWizard}>
            + Create Checklist
          </Button>
        </div>
      </div>

      {tab === "tasks" ? (
        <Panel pad={false}>
          <div className="border-b border-[var(--line)] p-5">
            <PanelTitle>Operational tasks</PanelTitle>
            <PanelSub>
              Create Task uses the HTML openTaskForm wizard. Create Checklist uses the HTML
              wizard.
            </PanelSub>
          </div>
          <div className="p-5 pt-0">
            <Table>
              <THead>
                <Th>Task</Th>
                <Th>Type</Th>
                <Th>Assignee</Th>
                <Th>Clinic</Th>
                <Th>Priority</Th>
                <Th>Status</Th>
                <Th>Due</Th>
              </THead>
              <tbody>
                {rows.map((task) => (
                  <tr key={task.id}>
                    <Td>
                      <strong>{task.title}</strong>
                    </Td>
                    <Td>
                      <Badge tone="teal">{task.type}</Badge>
                    </Td>
                    <Td>{task.assignee}</Td>
                    <Td>{locationShort(task.locationId, locations)}</Td>
                    <Td>
                      <Badge
                        tone={
                          task.priority === "High"
                            ? "danger"
                            : task.priority === "Medium"
                              ? "warn"
                              : "default"
                        }
                      >
                        {task.priority}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(task.status)}>{task.status}</Badge>
                    </Td>
                    <Td>{task.due}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Panel>
      ) : null}

      {tab === "handover" ? (
        <Panel>
          <PanelTitle>Shift handover</PanelTitle>
          <PanelSub>
            Unfinished high-risk work remains visible in the handover and manager queue.
          </PanelSub>
        </Panel>
      ) : null}

      {tab === "meetings" ? (
        <Panel>
          <PanelTitle>Meetings and action register</PanelTitle>
          <PanelSub>
            Decisions become owned actions with due dates and automatically carry forward
            until closed.
          </PanelSub>
        </Panel>
      ) : null}
    </div>
  );
}

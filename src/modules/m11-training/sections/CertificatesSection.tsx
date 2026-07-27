"use client";

import { Fragment, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useTraining } from "../context";
import {
  issueCertificate,
  verifyCertificate,
  revokeCertificate,
  listCertificates,
} from "../services/certificate-service";
import { listCourses } from "../services/catalogue-service";
import { hasM11Permission } from "../permissions";
import type { CertificateStatus } from "../types/domain";
import { EmptyState, ValidationErrorState, RestrictedState, OfflineState } from "./ux-states";

const STATUS_TONES: Record<CertificateStatus, "success" | "danger" | "warn" | "default"> = {
  issued: "success",
  expired: "danger",
  revoked: "default",
};

export function CertificatesSection() {
  const { actor, bump, pushToast, refreshKey } = useTraining();
  void refreshKey;

  const canVerify = hasM11Permission(actor, "training.certificate.verify");

  const [personId, setPersonId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [requirementId, setRequirementId] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const certs = listCertificates();
  const courses = listCourses();
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));

  if (!canVerify) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Certificates</h2>
          <p className="m-0 mt-1 text-sm text-[#526479]">
            M11 training qualification certificates — not M04 workforce credentials.
          </p>
        </div>
        <RestrictedState permission="training.certificate.verify" />
      </div>
    );
  }

  const handleIssue = () => {
    const errs: string[] = [];
    if (!personId.trim()) errs.push("Person ID is required.");
    if (!courseId) errs.push("Course is required.");
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    try {
      issueCertificate(actor, {
        personId: personId.trim(),
        courseId,
        requirementId: requirementId.trim() || undefined,
        expiresOn: expiresOn || undefined,
      });
      setPersonId("");
      setCourseId("");
      setRequirementId("");
      setExpiresOn("");
      bump();
      pushToast("Certificate issued.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Issue failed", "danger");
    }
  };

  const handleVerify = (certId: string) => {
    try {
      verifyCertificate(actor, certId);
      bump();
      pushToast("Certificate verified.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Verify failed", "danger");
    }
  };

  const handleRevoke = (certId: string) => {
    if (!revokeReason.trim()) {
      pushToast("A revocation reason is required.", "warn");
      return;
    }
    try {
      revokeCertificate(actor, certId, revokeReason.trim());
      setRevokeId(null);
      setRevokeReason("");
      bump();
      pushToast("Certificate revoked.", "warn");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Revoke failed", "danger");
    }
  };

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Certificates</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          M11 training qualification certificates — these are M11-owned training outcomes and are{" "}
          <strong>not</strong> the same as M04 workforce credentials.
        </p>
      </div>

      <Panel>
        <PanelTitle>Issue certificate</PanelTitle>
        <PanelSub>Requires training.certificate.verify.</PanelSub>
        <ValidationErrorState errors={errors} onDismiss={() => setErrors([])} />
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="Person ID"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            aria-label="Person ID"
          />
          <select
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            aria-label="Course"
          >
            <option value="">— Select course —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode} — {c.title}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="Requirement ID (optional)"
            value={requirementId}
            onChange={(e) => setRequirementId(e.target.value)}
            aria-label="Requirement ID"
          />
          <input
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            type="date"
            placeholder="Expires on (optional)"
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
            aria-label="Expires on"
          />
        </div>
        <Button
          className="mt-3"
          variant="teal"
          onClick={handleIssue}
          disabled={!personId.trim() || !courseId}
        >
          Issue certificate
        </Button>
      </Panel>

      {certs.length === 0 ? (
        <EmptyState title="No certificates issued" description="Issue a certificate above." />
      ) : (
        <Panel pad={false}>
          <Table>
            <THead>
              <Th>Person</Th>
              <Th>Course</Th>
              <Th>Status</Th>
              <Th>Issued</Th>
              <Th>Expires</Th>
              <Th>Verified</Th>
              <Th>Actions</Th>
            </THead>
            <tbody>
              {certs.map((c) => (
                <Fragment key={c.id}>
                  <tr key={c.id}>
                    <Td className="font-mono text-xs">{c.personId}</Td>
                    <Td>{courseMap[c.courseId] ?? c.courseId}</Td>
                    <Td>
                      <Badge tone={STATUS_TONES[c.status]}>{c.status}</Badge>
                    </Td>
                    <Td className="text-xs">{c.issuedAt.slice(0, 10)}</Td>
                    <Td className="text-xs">{c.expiresOn ?? "—"}</Td>
                    <Td className="text-xs">
                      {c.verifiedAt ? (
                        <Badge tone="success">verified {c.verifiedAt.slice(0, 10)}</Badge>
                      ) : (
                        <span className="text-[#64748b]">—</span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {c.status === "issued" && !c.verifiedAt ? (
                          <Button small variant="teal" onClick={() => handleVerify(c.id)}>
                            Verify
                          </Button>
                        ) : null}
                        {c.status === "issued" ? (
                          <Button
                            small
                            variant="warn"
                            onClick={() => setRevokeId(revokeId === c.id ? null : c.id)}
                          >
                            Revoke
                          </Button>
                        ) : null}
                      </div>
                    </Td>
                  </tr>
                  {revokeId === c.id ? (
                    <tr key={`${c.id}-revoke`}>
                      <td colSpan={7} className="bg-[#fef2f2]">
                        <div className="flex gap-2 p-2">
                          <input
                            className="flex-1 rounded-lg border border-[#fca5a5] px-3 py-2 text-sm"
                            placeholder="Revocation reason (required)"
                            value={revokeReason}
                            onChange={(e) => setRevokeReason(e.target.value)}
                            aria-label="Revocation reason"
                          />
                          <Button
                            small
                            variant="warn"
                            onClick={() => handleRevoke(c.id)}
                            disabled={!revokeReason.trim()}
                          >
                            Confirm revoke
                          </Button>
                          <Button small variant="line" onClick={() => setRevokeId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </Table>
        </Panel>
      )}
    </div>
  );
}

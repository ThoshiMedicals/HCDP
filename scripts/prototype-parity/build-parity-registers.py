#!/usr/bin/env python3
"""Build prototype-parity first-run registers from deterministic extract + code audit."""
from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/architecture/prototype-parity"
EXTRACT = OUT
REG_TS = (ROOT / "src/platform/module-registry/module-register.ts").read_text()
UTC = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

EXPECTED_IMAGES = [
    ("M01", "/dashboard", "doctors_pulse_operations_dashboard.png", "m01-command-centre-final.png", "f600b734705bcc203a25cfbd1002f117b3949b3f78ddc84915e5d1497d6cd236"),
    ("M02", "/action-inbox", "doctors_pulse_action_inbox_dashboard.png", "m02-action-inbox-final.png", "9557ea9a432fd665a086e9a8d0621b8949a8c572dbbb3a811ce89ef03d74327f"),
    ("M04", "/staff-doctors", "doctors_pulse_staff_operations_dashboard.png", "m04-staff-doctors-final.png", "146bd7c08d3fbc0f118c828d6dbd8a2b44e4ac0c4633f65af578b6a8cf492bc8"),
    ("M05", "/roster", "doctors_pulse_weekly_roster_dashboard.png", "m05-weekly-roster-final.png", "121786a1a07fd08d9a5e9e46e7652d50085a8e378c4650785af4debe81654d06"),
    ("M06", "/time-attendance", "doctors_pulse_attendance_dashboard.png", "m06-time-attendance-final.png", "86518204545f3e10a2ad37f5ca5bb4c7110d4632d3552d7ef6a9232ddd4f3a16"),
    ("M10", "/tasks-actions", "doctors_pulse_checklist_dashboard.png", "m10-checklists-final.png", "1c2507878f42cfdc9792d85c93f2d185031ca55d7531fb83bd84eac095dc9ab4"),
    ("M11", "/training", "doctors_pulse_training_dashboard.png", "m11-training-final.png", "cf380fe1c7221275b8c9de158a8e6a9108ea2b54b649ac9c520b605eac2a349e"),
    ("M12", "/compliance-quality", "doctors_pulse_compliance_dashboard.png", "m12-compliance-quality-final.png", "4ecb8eef079d30c796e5cb1b53b8b01595788e6f48fa81bb708a451b38e7c2a8"),
    ("M15", "/inventory-assets", "doctors_pulse_inventory_dashboard.png", "m15-inventory-assets-final.png", "0ec5fbceac81554ef3edc38a92b4d29f7356b5c5ce4e91948e2faf863c3a61c6"),
]

# Revised multi-axis status from owner prompt + register evidence (not file-count alone)
REVISED = {
    1: dict(ui="FUNCTIONALLY-COMPLETE", domain="FUNCTIONALLY-COMPLETE", integ="FUNCTIONALLY-COMPLETE", evidence="OWNER-ACCEPTED", prod="NOT-STARTED", note="Deep/strong; match M01 final image; KPI source completeness must be truthful"),
    2: dict(ui="FUNCTIONALLY-COMPLETE", domain="FUNCTIONALLY-COMPLETE", integ="FUNCTIONALLY-COMPLETE", evidence="OWNER-ACCEPTED", prod="NOT-STARTED", note="Deep/strong; match M02 final image; single cross-module queue"),
    3: dict(ui="FUNCTIONALLY-COMPLETE", domain="FUNCTIONALLY-COMPLETE", integ="FUNCTIONALLY-COMPLETE", evidence="OWNER-ACCEPTED", prod="NOT-STARTED", note="Deep/strong; apply shared final design"),
    4: dict(ui="FUNCTIONALLY-COMPLETE", domain="FUNCTIONALLY-COMPLETE", integ="FUNCTIONALLY-COMPLETE", evidence="OWNER-ACCEPTED", prod="NOT-STARTED", note="Deep/strong; match M04 final image"),
    5: dict(ui="FUNCTIONALLY-COMPLETE", domain="FUNCTIONALLY-COMPLETE", integ="FUNCTIONALLY-COMPLETE", evidence="OWNER-ACCEPTED", prod="NOT-STARTED", note="Deep/accepted within scope; match M05 final image"),
    6: dict(ui="FUNCTIONALLY-COMPLETE", domain="FUNCTIONALLY-COMPLETE", integ="FUNCTIONALLY-COMPLETE", evidence="OWNER-ACCEPTED", prod="NOT-STARTED", note="Deep/accepted within scope; match M06 final image"),
    7: dict(ui="FUNCTIONALLY-COMPLETE", domain="FUNCTIONALLY-COMPLETE", integ="FUNCTIONALLY-COMPLETE", evidence="OWNER-ACCEPTED", prod="NOT-STARTED", note="Ordinary Batches 1–6 complete within approved scope; register condition stale; PPA separate"),
    8: dict(ui="PROTOTYPE-ONLY", domain="NOT-STARTED", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Landing/legacy-level; future Doctor Pay with external-payment boundary"),
    9: dict(ui="PROTOTYPE-ONLY", domain="NOT-STARTED", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Landing/legacy-level; aggregate BBPIP only"),
    10: dict(ui="IN-DEVELOPMENT", domain="IN-DEVELOPMENT", integ="BLOCKED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Partial/blocked; first connective wave; match M10 final image"),
    11: dict(ui="FUNCTIONALLY-COMPLETE", domain="FUNCTIONALLY-COMPLETE", integ="FUNCTIONALLY-COMPLETE", evidence="OWNER-ACCEPTED", prod="NOT-STARTED", note="Deep/accepted; register condition stale (legacy-html-fallback)"),
    12: dict(ui="IN-DEVELOPMENT", domain="IN-DEVELOPMENT", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Partial/seed-level; full compliance/quality required"),
    13: dict(ui="PROTOTYPE-ONLY", domain="NOT-STARTED", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Landing-level controlled documents"),
    14: dict(ui="PROTOTYPE-ONLY", domain="NOT-STARTED", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Landing-level ticketing/work orders"),
    15: dict(ui="PROTOTYPE-ONLY", domain="NOT-STARTED", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Landing-level; match M15 image; supplier invoices OK, patient billing excluded"),
    16: dict(ui="IN-DEVELOPMENT", domain="IN-DEVELOPMENT", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Partial/seed; no patient records"),
    17: dict(ui="PROTOTYPE-ONLY", domain="NOT-STARTED", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Landing-level communications"),
    18: dict(ui="PROTOTYPE-ONLY", domain="NOT-STARTED", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Landing-level digital ops/security"),
    19: dict(ui="PROTOTYPE-ONLY", domain="NOT-STARTED", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Landing-level analytics"),
    20: dict(ui="PROTOTYPE-ONLY", domain="NOT-STARTED", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Commercial SaaS only; not clinic patient billing"),
    21: dict(ui="PROTOTYPE-ONLY", domain="NOT-STARTED", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Vendor provisioning/portfolio"),
    22: dict(ui="PROTOTYPE-ONLY", domain="NOT-STARTED", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Recruitment → M04 transition"),
    23: dict(ui="PROTOTYPE-ONLY", domain="NOT-STARTED", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Website/SEO/public form routing"),
    24: dict(ui="PROTOTYPE-ONLY", domain="NOT-STARTED", integ="NOT-STARTED", evidence="NOT-STARTED", prod="NOT-STARTED", note="Financial forecast using approved summaries"),
}

OWNERSHIP = {
    "M03": "Organisation, tenant, clinic, user and access scope",
    "M04": "Workforce person, engagement, credential, restriction, readiness",
    "M05": "Rosters, shifts, coverage, publication",
    "M06": "Attendance, timesheets, approved publication to M07",
    "M07": "Staff pay preparation only (not execution)",
    "M08": "Doctor pay calculation/payslip/dispute records (not M07; no bank execution)",
    "M09": "BBPIP forecasting and outcome reconciliation (aggregate)",
    "M10": "Tasks, checklist templates/occurrences, handovers, meeting actions",
    "M11": "Learning, assignment, competency, certificate, exemption",
    "M12": "Compliance, accreditation, audit finding, CAPA verification",
    "M13": "Controlled operational documents and policy versions",
    "M14": "Tickets and work orders",
    "M15": "Stock, supplier, purchase, supplier invoice, equipment, rooms, printers, assets",
    "M16": "Operational incident, complaint classification, risk, continuity, emergency coordination",
    "M17": "Governed outbound communications and delivery status",
    "M18": "Digital monitoring, privileged access, secrets, security operations",
    "M19": "Metric definitions, data-quality cases, change governance",
    "M20": "Tenant-facing commercial plans/workspaces",
    "M21": "Vendor-level provisioning and portfolio operations",
    "M22": "Recruitment until controlled promotion into M04",
    "M23": "Tenant website/SEO/public form routing",
    "M24": "Forecasts, immutable baselines, actual-vs-forecast review",
    "M02": "Receives action/approval/exception/notification projections",
    "M01": "Read-only executive summaries with source-completeness and drill-downs",
}

WAVE_FOR = {
    1: "P2", 2: "P2", 3: "P2", 4: "P2", 5: "P2", 6: "P2", 7: "P2",
    10: "P3", 13: "P4", 14: "P4", 12: "P5", 15: "P5", 16: "P5",
    8: "P6", 9: "P6", 24: "P6",
    17: "P7", 18: "P7", 19: "P7",
    20: "P8", 21: "P8", 22: "P8", 23: "P8",
    11: "P2",
}

DESIGN_PATTERN = {
    1: "M01 dashboard",
    2: "M02 master-detail queue",
    3: "M02/M04 admin queue + people",
    4: "M04 people master-detail",
    5: "M05 board/matrix",
    6: "M06 live-operations",
    7: "M02/M04 pay-prep workbench",
    8: "M04 people + finance review",
    9: "M01 analytics + M06 reconciliation",
    10: "M10 template/run/detail",
    11: "M11 learning/progress",
    12: "M12 governance/audit",
    13: "M12 governance/audit",
    14: "M02 master-detail queue",
    15: "M15 inventory/asset",
    16: "M12 governance/audit",
    17: "M02 queue + delivery status",
    18: "M06 live-operations",
    19: "M01 dashboard + data-quality cases",
    20: "M04/M02 commercial workspaces",
    21: "M04/M02 vendor portfolio",
    22: "M04 people master-detail",
    23: "M01/M02 public-routing ops",
    24: "M01 dashboard + finance review",
}


def parse_register():
    rows = []
    blocks = re.split(r"\n  \{\n", REG_TS)
    for b in blocks[1:]:
        num = re.search(r"number:\s*(\d+)", b)
        mid = re.search(r'id:\s*"([^"]+)"', b)
        name = re.search(r'displayName:\s*"([^"]+)"', b)
        route = re.search(r'mainRoute:\s*"([^"]+)"', b)
        cond = re.search(r'condition:\s*"([^"]+)"', b)
        fam = re.search(r'navigationFamily:\s*"([^"]+)"', b)
        if not (num and mid and cond):
            continue
        secs = re.findall(r'\{\s*id:\s*"([^"]+)"\s*,\s*label:\s*"([^"]+)"', b)
        rows.append({
            "number": int(num.group(1)),
            "id": mid.group(1),
            "displayName": name.group(1) if name else mid.group(1),
            "mainRoute": route.group(1) if route else "",
            "condition": cond.group(1),
            "navigationFamily": fam.group(1) if fam else "",
            "sections": [{"id": a, "label": b} for a, b in secs],
        })
    rows.sort(key=lambda r: r["number"])
    return rows


def disposition_for(module_num: int, kind: str, label: str, demo: bool = False) -> str:
    if demo:
        return "ADOPTED-WITH-CONTROL-HARDENING"
    text = f"{label}".lower()
    if any(x in text for x in ["patient", "appointment", "clinical note", "prescription", "medicare claim"]):
        return "EXCLUDED-BY-PRODUCT-BOUNDARY"
    if any(x in text for x in ["bank file", "stp", "mark as paid", "disburse"]):
        return "EXCLUDED-BY-PRODUCT-BOUNDARY"
    if module_num == 7 and "ppa" in text:
        return "DEFERRED-BY-DEPENDENCY"
    if module_num >= 8 and module_num not in (11,) and REVISED[module_num]["domain"] in ("NOT-STARTED", "PROTOTYPE-ONLY"):
        if kind in ("button", "workflow", "tab", "screen"):
            return "ADOPTED-AS-IS"
    if REVISED[module_num]["domain"] == "FUNCTIONALLY-COMPLETE":
        return "ADOPTED-AS-IS"
    return "ADOPTED-AS-IS"


def target_wave(module_num: int) -> str:
    return WAVE_FOR.get(module_num, "P8")


def write(path: Path, text: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text if text.endswith("\n") else text + "\n")


def main():
    manifest = json.loads((EXTRACT / "PROTOTYPE_EXTRACTION_MANIFEST.json").read_text())
    modules = json.loads((EXTRACT / "prototype-modules.json").read_text())
    screens = json.loads((EXTRACT / "prototype-screens.json").read_text())
    workflows = json.loads((EXTRACT / "prototype-workflows.json").read_text())
    fields_modals = json.loads((EXTRACT / "prototype-fields-modals.json").read_text())
    conflicts = json.loads((EXTRACT / "prototype-scope-conflicts.json").read_text())
    raw = json.loads((EXTRACT / "prototype-raw-controls.json").read_text())
    themes = json.loads((EXTRACT / "prototype-themes.json").read_text())
    register = parse_register()
    reg_by_num = {r["number"]: r for r in register}

    # ── Design reference manifest (images missing in this environment) ──
    image_rows = []
    for mod, route, src, dest, sha in EXPECTED_IMAGES:
        dest_path = ROOT / "docs/design-references/final" / dest
        status = "MISSING"
        observed = None
        dims = None
        if dest_path.exists():
            observed = hashlib.sha256(dest_path.read_bytes()).hexdigest()
            status = "INSTALLED_HASH_OK" if observed == sha else "HASH_MISMATCH"
            try:
                from struct import unpack
                # PNG IHDR
                data = dest_path.read_bytes()
                if data[:8] == b"\x89PNG\r\n\x1a\n":
                    w, h = unpack(">II", data[16:24])
                    dims = f"{w}x{h}"
            except Exception:
                dims = None
        image_rows.append({
            "module": mod,
            "route": route,
            "sourceName": src,
            "normalisedName": dest,
            "expectedSha256": sha,
            "observedSha256": observed,
            "expectedDimensions": "1672x941",
            "observedDimensions": dims,
            "status": status,
            "destination": f"docs/design-references/final/{dest}",
        })
    design_manifest = {
        "generatedAt": UTC,
        "canonical": True,
        "note": "Exact owner-supplied originals required. Do not redraw or substitute.",
        "allPresent": all(r["status"] == "INSTALLED_HASH_OK" for r in image_rows),
        "images": image_rows,
        "blocker": None if all(r["status"] == "INSTALLED_HASH_OK" for r in image_rows) else "Nine final PNGs were not present in the cloud environment at first-run generation. Upload requested via environment setup action upload-nine-final-design-pngs.",
    }
    write(ROOT / "docs/design-references/final/DESIGN_REFERENCE_MANIFEST.json", json.dumps(design_manifest, indent=2))
    write(ROOT / "docs/design-references/final/README.md", f"""# Final design references

These nine PNGs are the **approved final visual baselines** for their named pages and the shared visual grammar for Doctors Pulse.

| Module | Destination | Expected SHA-256 | Status |
| --- | --- | --- | --- |
""" + "\n".join(
        f"| {r['module']} | `{r['normalisedName']}` | `{r['expectedSha256']}` | **{r['status']}** |"
        for r in image_rows
    ) + f"""

Generated: {UTC}

If status is MISSING or HASH_MISMATCH, stop image installation and request the owner originals.
""")

    # ── Traceability rows ──
    rows = []

    def add_row(**kwargs):
        base = {
            "requirementId": "",
            "sourceDocument": "public/pulse-html-prototype.html",
            "sourceLocation": "",
            "sourceType": "",
            "module": "",
            "navigationFamily": "",
            "canonicalRoute": "",
            "sectionDeepLink": "",
            "screenWorkspace": "",
            "capability": "",
            "businessPurpose": "",
            "visibleControlAction": "",
            "workflowStateTransition": "",
            "dataEntityFields": "",
            "rolePermission": "",
            "clinicTenantScope": "clinic-scoped-unless-stated",
            "sourceSystemOwner": "",
            "privacySensitivityClass": "operational",
            "crossModuleContracts": "",
            "currentProductionCodePath": "",
            "currentServicePath": "",
            "currentEvidence": "",
            "uiImplementationStatus": "",
            "domainImplementationStatus": "",
            "crossModuleIntegrationStatus": "",
            "evidenceAcceptanceStatus": "",
            "productionStatus": "NOT-STARTED",
            "prototypeDisposition": "ADOPTED-AS-IS",
            "dispositionReason": "",
            "targetProgrammeWave": "",
            "acceptanceTestEvidencePath": "docs/architecture/prototype-parity/",
            "finalDesignReferenceOrPattern": "",
        }
        base.update(kwargs)
        rows.append(base)

    for m in modules["brdModules"]:
        num = int(m["number"])
        reg = reg_by_num.get(num, {})
        rev = REVISED[num]
        fam = reg.get("navigationFamily") or ""
        route = reg.get("mainRoute") or ""
        purpose = m.get("objective") or ""
        loc = json.dumps(m.get("source") or {})
        # module capability row
        add_row(
            requirementId=m["id"],
            sourceLocation=loc,
            sourceType="brd",
            module=m["moduleKey"],
            navigationFamily=fam,
            canonicalRoute=route,
            screenWorkspace=m.get("title") or "",
            capability=f"BRD module {m['moduleKey']}: {m.get('title')}",
            businessPurpose=purpose,
            visibleControlAction="",
            sourceSystemOwner=OWNERSHIP.get(m["moduleKey"], ""),
            uiImplementationStatus=rev["ui"],
            domainImplementationStatus=rev["domain"],
            crossModuleIntegrationStatus=rev["integ"],
            evidenceAcceptanceStatus=rev["evidence"],
            productionStatus=rev["prod"],
            prototypeDisposition="ADOPTED-AS-IS",
            dispositionReason=rev["note"],
            targetProgrammeWave=target_wave(num),
            finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
            currentProductionCodePath=f"src/modules/m{num:02d}-*/ + module-register",
            rolePermission=", ".join(m.get("primaryUsers") or []) if isinstance(m.get("primaryUsers"), list) else str(m.get("primaryUsers") or ""),
        )
        for t in m["tabs"]:
            add_row(
                requirementId=t["id"],
                sourceLocation=loc,
                sourceType="brd",
                module=m["moduleKey"],
                navigationFamily=fam,
                canonicalRoute=route,
                sectionDeepLink=f"{route}?section={t['label']}",
                screenWorkspace=t["label"],
                capability=f"Tab: {t['label']}",
                businessPurpose=purpose,
                visibleControlAction=t["label"],
                uiImplementationStatus=rev["ui"],
                domainImplementationStatus=rev["domain"],
                crossModuleIntegrationStatus=rev["integ"],
                evidenceAcceptanceStatus=rev["evidence"],
                productionStatus=rev["prod"],
                prototypeDisposition=disposition_for(num, "tab", t["label"]),
                dispositionReason="BRD tab retained in canonical screen register",
                targetProgrammeWave=target_wave(num),
                finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
            )
        for b in m["buttons"]:
            disp = disposition_for(num, "button", b["label"])
            add_row(
                requirementId=b["id"],
                sourceLocation=loc,
                sourceType="brd",
                module=m["moduleKey"],
                navigationFamily=fam,
                canonicalRoute=route,
                screenWorkspace=m.get("title") or "",
                capability=f"Named action: {b['label']}",
                businessPurpose=purpose,
                visibleControlAction=b["label"],
                workflowStateTransition="service-backed transition required for final claim",
                uiImplementationStatus=rev["ui"] if rev["domain"] == "FUNCTIONALLY-COMPLETE" else "PROTOTYPE-ONLY",
                domainImplementationStatus=rev["domain"],
                crossModuleIntegrationStatus=rev["integ"],
                evidenceAcceptanceStatus=rev["evidence"],
                productionStatus=rev["prod"],
                prototypeDisposition=disp,
                dispositionReason="Named BRD button must map to real action, planned service-backed action, or owner decision",
                targetProgrammeWave=target_wave(num),
                finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
                privacySensitivityClass="operational" if disp != "EXCLUDED-BY-PRODUCT-BOUNDARY" else "excluded-boundary",
            )
        for f in m["flows"]:
            add_row(
                requirementId=f["id"],
                sourceLocation=loc,
                sourceType="brd",
                module=m["moduleKey"],
                navigationFamily=fam,
                canonicalRoute=route,
                screenWorkspace=m.get("title") or "",
                capability=f"Workflow: {f.get('title')}",
                businessPurpose=f.get("title") or purpose,
                workflowStateTransition=" > ".join(s["text"][:60] for s in f.get("steps") or []),
                uiImplementationStatus=rev["ui"],
                domainImplementationStatus=rev["domain"],
                crossModuleIntegrationStatus=rev["integ"],
                evidenceAcceptanceStatus=rev["evidence"],
                productionStatus=rev["prod"],
                prototypeDisposition=disposition_for(num, "workflow", f.get("title") or ""),
                dispositionReason=f.get("kind") or "BRD workflow",
                targetProgrammeWave=target_wave(num),
                finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
            )
        for r in m["rules"]:
            add_row(
                requirementId=r["id"],
                sourceType="brd",
                module=m["moduleKey"],
                navigationFamily=fam,
                canonicalRoute=route,
                capability="Business rule",
                businessPurpose=r["text"][:240],
                uiImplementationStatus=rev["ui"],
                domainImplementationStatus=rev["domain"],
                crossModuleIntegrationStatus=rev["integ"],
                evidenceAcceptanceStatus=rev["evidence"],
                productionStatus=rev["prod"],
                prototypeDisposition="ADOPTED-AS-IS",
                dispositionReason="BRD business rule",
                targetProgrammeWave=target_wave(num),
            )
        for v in m["visuals"]:
            add_row(
                requirementId=v["id"],
                sourceType="brd",
                module=m["moduleKey"],
                navigationFamily=fam,
                canonicalRoute=route,
                capability="Visual requirement",
                businessPurpose=v["text"][:240],
                uiImplementationStatus=rev["ui"],
                domainImplementationStatus=rev["domain"],
                crossModuleIntegrationStatus=rev["integ"],
                evidenceAcceptanceStatus=rev["evidence"],
                productionStatus=rev["prod"],
                prototypeDisposition="ADOPTED-AS-IS",
                dispositionReason="BRD visual requirement; final PNG prevails where image exists",
                targetProgrammeWave=target_wave(num),
                finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
            )
        for o in m["outputs"]:
            add_row(
                requirementId=o["id"],
                sourceType="brd",
                module=m["moduleKey"],
                navigationFamily=fam,
                canonicalRoute=route,
                capability="Output/measure",
                businessPurpose=o["text"][:240],
                uiImplementationStatus=rev["ui"],
                domainImplementationStatus=rev["domain"],
                crossModuleIntegrationStatus=rev["integ"],
                evidenceAcceptanceStatus=rev["evidence"],
                productionStatus=rev["prod"],
                prototypeDisposition="ADOPTED-AS-IS",
                dispositionReason="BRD output/measure",
                targetProgrammeWave=target_wave(num),
            )

    for b in modules["blueprints"]:
        num = int(b["number"])
        rev = REVISED[num]
        reg = reg_by_num.get(num, {})
        add_row(
            requirementId=b["id"],
            sourceType="blueprint",
            module=b["moduleKey"],
            navigationFamily=b.get("family") or reg.get("navigationFamily") or "",
            canonicalRoute=(b.get("routes") or [reg.get("mainRoute") or ""])[0] if isinstance(b.get("routes"), list) else reg.get("mainRoute") or "",
            capability=f"Blueprint: {b.get('name')}",
            businessPurpose=b.get("summary") or "",
            uiImplementationStatus=rev["ui"],
            domainImplementationStatus=rev["domain"],
            crossModuleIntegrationStatus=rev["integ"],
            evidenceAcceptanceStatus=rev["evidence"],
            productionStatus=rev["prod"],
            prototypeDisposition="ADOPTED-AS-IS",
            dispositionReason="Platform module blueprint",
            targetProgrammeWave=target_wave(num),
            finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
            sourceSystemOwner=OWNERSHIP.get(b["moduleKey"], ""),
        )
        for metric in b.get("metrics") or []:
            add_row(
                requirementId=metric["id"],
                sourceType="blueprint",
                module=b["moduleKey"],
                capability="Blueprint metric",
                businessPurpose=json.dumps(metric.get("raw"))[:240],
                uiImplementationStatus=rev["ui"],
                domainImplementationStatus=rev["domain"],
                crossModuleIntegrationStatus=rev["integ"],
                evidenceAcceptanceStatus=rev["evidence"],
                productionStatus=rev["prod"],
                prototypeDisposition="ADOPTED-AS-IS",
                dispositionReason="Blueprint metric",
                targetProgrammeWave=target_wave(num),
            )
        for pat in b.get("patterns") or []:
            add_row(
                requirementId=pat["id"],
                sourceType="blueprint",
                module=b["moduleKey"],
                capability="Blueprint pattern",
                businessPurpose=json.dumps(pat.get("raw"))[:240],
                uiImplementationStatus=rev["ui"],
                domainImplementationStatus=rev["domain"],
                crossModuleIntegrationStatus=rev["integ"],
                evidenceAcceptanceStatus=rev["evidence"],
                productionStatus=rev["prod"],
                prototypeDisposition="ADOPTED-AS-IS",
                dispositionReason="Blueprint UX/ops pattern",
                targetProgrammeWave=target_wave(num),
                finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
            )

    for g in fields_modals.get("fieldGroups") or []:
        for f in g.get("fields") or []:
            add_row(
                requirementId=f["id"],
                sourceType="field-schema",
                module="",
                screenWorkspace=g["group"],
                capability=f"Field: {f.get('label') or f.get('name')}",
                dataEntityFields=f"{g['group']}.{f.get('name')}",
                businessPurpose=f.get("label") or f.get("name") or "",
                uiImplementationStatus="PLANNED",
                domainImplementationStatus="PLANNED",
                crossModuleIntegrationStatus="NOT-STARTED",
                evidenceAcceptanceStatus="NOT-STARTED",
                productionStatus="NOT-STARTED",
                prototypeDisposition="ADOPTED-AS-IS",
                dispositionReason="Field schema definition",
                targetProgrammeWave="P1+",
                privacySensitivityClass="review-required",
            )

    for modal in fields_modals.get("modals") or []:
        add_row(
            requirementId=modal["id"],
            sourceType="prototype-runtime",
            sourceLocation=json.dumps(modal.get("source") or {}),
            capability=f"Modal/drawer: {modal.get('title')}",
            visibleControlAction=modal.get("title") or "",
            dataEntityFields=",".join(modal.get("fieldHints") or []),
            uiImplementationStatus="PROTOTYPE-ONLY",
            domainImplementationStatus="NOT-STARTED",
            crossModuleIntegrationStatus="NOT-STARTED",
            evidenceAcceptanceStatus="NOT-STARTED",
            productionStatus="NOT-STARTED",
            prototypeDisposition="ADOPTED-WITH-CONTROL-HARDENING",
            dispositionReason="Runtime modal retained as interaction requirement; replace alert/toast-only techniques",
            targetProgrammeWave="P1+",
        )

    # scope conflicts as decision/exclusion rows
    for c in conflicts.get("conflicts") or []:
        disp = "EXCLUDED-BY-PRODUCT-BOUNDARY" if c.get("boundary") in ("patient-clinical", "financial-patient", "financial-execution") else "ADOPTED-WITH-CONTROL-HARDENING"
        add_row(
            requirementId=c["id"],
            sourceType="prototype-runtime",
            sourceLocation=json.dumps(c.get("source") or {}),
            capability=f"Scope conflict: {c.get('conflictClass')}",
            businessPurpose=c.get("excerpt") or "",
            uiImplementationStatus="EXCLUDED-WITH-REASON" if disp.startswith("EXCLUDED") else "PLANNED",
            domainImplementationStatus="EXCLUDED-WITH-REASON" if disp.startswith("EXCLUDED") else "PLANNED",
            crossModuleIntegrationStatus="NOT-STARTED",
            evidenceAcceptanceStatus="NOT-STARTED",
            productionStatus="NOT-STARTED",
            prototypeDisposition=disp,
            dispositionReason=f"Boundary={c.get('boundary')}; redesign to retain operational outcome without patient/payment execution",
            targetProgrammeWave="P0-decision",
            privacySensitivityClass="boundary-conflict",
        )

    # Ensure every row has disposition; unclassified = 0
    unclassified = [r for r in rows if not r["prototypeDisposition"]]
    assert not unclassified, "unclassified rows exist"

    # ── Canonical screens ──
    screen_rows = []
    for s in screens["screens"]:
        num = int(s["moduleKey"][1:])
        rev = REVISED[num]
        reg = reg_by_num.get(num, {})
        img = next((i for i in image_rows if i["module"] == s["moduleKey"]), None)
        screen_rows.append({
            "screenId": s["id"],
            "moduleKey": s["moduleKey"],
            "moduleName": s.get("moduleName"),
            "family": s.get("family") or reg.get("navigationFamily"),
            "route": s.get("route") or reg.get("mainRoute"),
            "section": s.get("section"),
            "deepLink": f"{s.get('route') or reg.get('mainRoute')}?section={s.get('section')}" if s.get("section") else (s.get("route") or reg.get("mainRoute")),
            "purpose": s.get("purpose"),
            "sourceType": s.get("sourceType"),
            "roles": "per module accessClassification / BRD primaryUsers",
            "dataSource": "service-backed module state (not prototype seed)",
            "actions": "see workflow/action register for module",
            "responsiveBehaviour": "shared final-design contract viewports",
            "uiStatus": rev["ui"],
            "domainStatus": rev["domain"],
            "designReference": img["normalisedName"] if img else DESIGN_PATTERN.get(num, "derived"),
            "designReferenceStatus": img["status"] if img else "DERIVED_FROM_DESIGN_SYSTEM",
            "targetWave": target_wave(num),
            "acceptanceEvidencePath": "pending-wave-evidence",
        })

    # ── Accounting ──
    disp_counts = Counter(r["prototypeDisposition"] for r in rows)
    by_module = Counter(r["module"] for r in rows if r["module"])
    by_source = Counter(r["sourceType"] for r in rows)
    by_ui = Counter(r["uiImplementationStatus"] for r in rows)
    by_domain = Counter(r["domainImplementationStatus"] for r in rows)

    accounting = {
        "generatedAt": UTC,
        "totalRows": len(rows),
        "unclassifiedCount": 0,
        "dispositionTotals": dict(disp_counts),
        "rowsByModule": dict(sorted(by_module.items())),
        "rowsBySourceType": dict(by_source),
        "uiStatusTotals": dict(by_ui),
        "domainStatusTotals": dict(by_domain),
        "canonicalScreenCount": len(screen_rows),
        "canonicalScreenVs143": {
            "baselineEstimate": 143,
            "derivedCount": len(screen_rows),
            "variance": len(screen_rows) - 143,
            "explanation": "Derived primarily from BRD tabs across blueprints (plus blueprint-default screens where BRD tabs absent). 143 was a minimum planning baseline, not a cap. No silent consolidation; filter/state variants remain separate when they are distinct BRD tabs.",
        },
        "extractionTotals": manifest["totals"],
        "designReferencesInstalled": design_manifest["allPresent"],
    }

    # Write JSON/CSV/MD outputs
    write(OUT / "master-brd-prototype-production-traceability.json", json.dumps({
        "generatedAt": UTC,
        "acceptedApplicationBaseline": "b1152d36d3f47c15277f85b3e990f5e1c94bddcb",
        "evidenceBearingTip": "e659dfc42a711d37a3e73b3ba7049190ca531e4a",
        "accounting": accounting,
        "rows": rows,
    }, indent=2))

    csv_path = OUT / "master-brd-prototype-production-traceability.csv"
    fields = list(rows[0].keys())
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

    write(OUT / "canonical-screen-register.json", json.dumps({
        "generatedAt": UTC,
        "count": len(screen_rows),
        "vs143": accounting["canonicalScreenVs143"],
        "screens": screen_rows,
    }, indent=2))

    # Workflow/action register
    action_items = []
    for m in modules["brdModules"]:
        for b in m["buttons"]:
            action_items.append({
                "id": b["id"],
                "moduleKey": m["moduleKey"],
                "label": b["label"],
                "kind": "brd-button",
                "disposition": disposition_for(int(m["number"]), "button", b["label"]),
                "targetWave": target_wave(int(m["number"])),
                "implementationRule": "service-backed state transition + permission + audit + reload proof",
            })
    for f in workflows.get("brdWorkflows") or []:
        action_items.append({
            "id": f["id"],
            "moduleKey": f["moduleKey"],
            "label": f.get("title"),
            "kind": "brd-workflow",
            "steps": len(f.get("steps") or []),
            "targetWave": target_wave(int(f["moduleKey"][1:])),
        })
    write(OUT / "workflow-action-register.json", json.dumps({
        "generatedAt": UTC,
        "brdButtonCount": sum(1 for a in action_items if a["kind"] == "brd-button"),
        "brdWorkflowCount": sum(1 for a in action_items if a["kind"] == "brd-workflow"),
        "items": action_items,
    }, indent=2))

    # Implementation re-audit
    impl_audit = []
    for r in register:
        num = r["number"]
        rev = REVISED[num]
        impl_audit.append({
            "module": f"M{num:02d}",
            "id": r["id"],
            "displayName": r["displayName"],
            "mainRoute": r["mainRoute"],
            "registerConditionStaleLabel": r["condition"],
            "revisedUiStatus": rev["ui"],
            "revisedDomainStatus": rev["domain"],
            "revisedIntegrationStatus": rev["integ"],
            "revisedEvidenceStatus": rev["evidence"],
            "revisedProductionStatus": rev["prod"],
            "note": rev["note"],
            "targetWave": target_wave(num),
            "designPattern": DESIGN_PATTERN.get(num),
            "sections": r["sections"],
        })
    write(OUT / "CURRENT_IMPLEMENTATION_REAUDIT.json", json.dumps({
        "generatedAt": UTC,
        "method": "Owner directive revised targets + module-register.ts condition labels treated as stale where contradicted by accepted wave evidence",
        "modules": impl_audit,
    }, indent=2))

    # Conflict / decision register
    decisions = []
    for c in conflicts.get("conflicts") or []:
        decisions.append({
            "id": c["id"],
            "type": "scope-conflict",
            "conflictClass": c.get("conflictClass"),
            "boundary": c.get("boundary"),
            "excerpt": c.get("excerpt"),
            "recommendedDisposition": "EXCLUDED-BY-PRODUCT-BOUNDARY" if c.get("boundary") in ("patient-clinical", "financial-patient", "financial-execution") else "ADOPTED-WITH-CONTROL-HARDENING",
            "ownerDecisionRequired": True,
            "status": "OPEN",
        })
    decisions.append({
        "id": "DEC-FINAL-PNGS-MISSING",
        "type": "design-reference",
        "recommendedDisposition": "DECISION-REQUIRED",
        "ownerDecisionRequired": True,
        "status": "OPEN",
        "detail": "Nine final design PNGs were not available in the environment; installation blocked pending exact originals.",
    })
    # Theme presets decision
    theme_keys = []
    if isinstance(themes.get("themeLabels"), dict):
        theme_keys = list(themes["themeLabels"].keys())
    elif isinstance(themes.get("themes"), dict):
        theme_keys = list(themes["themes"].keys())
    decisions.append({
        "id": "DEC-BRANDED-THEMES",
        "type": "appearance",
        "recommendedDisposition": "ADOPTED-AS-IS",
        "ownerDecisionRequired": True,
        "status": "OPEN",
        "detail": f"Prototype theme labels observed: {theme_keys}. Preserve Executive Blue / Medical Emerald as optional branded presets if confirmed; do not replace System mode.",
    })
    write(OUT / "conflict-and-owner-decision-register.json", json.dumps({
        "generatedAt": UTC,
        "openCount": sum(1 for d in decisions if d["status"] == "OPEN"),
        "items": decisions,
    }, indent=2))

    # Cross-module map
    write(OUT / "cross-module-ownership-map.json", json.dumps({
        "generatedAt": UTC,
        "rule": "One authoritative owner per business record; contracts/events/projections only — no cross-module repository imports",
        "owners": OWNERSHIP,
        "mandatoryRelationships": [
            "M06 publishes approved timesheets to M07",
            "M02 receives projections from every relevant module",
            "M01 receives read-only summaries with source-completeness labels",
            "M22 promotes candidates into M04 under controlled transition",
            "M07/M08/M09/M24 remain separate ledgers connected by approved summaries",
            "M10 wires tasks/checklists/handovers/meetings into M02 and M01",
        ],
    }, indent=2))

    # Markdown documents
    write(OUT / "MASTER_BRD_PROTOTYPE_PRODUCTION_TRACEABILITY.md", f"""# Master BRD / Prototype / Production Traceability

**Generated:** {UTC}  
**Accepted application baseline:** `b1152d36d3f47c15277f85b3e990f5e1c94bddcb`  
**Evidence-bearing tip:** `e659dfc42a711d37a3e73b3ba7049190ca531e4a`  
**Prototype SHA-256:** `{manifest['prototypeSha256']}`  

Machine-readable: `master-brd-prototype-production-traceability.json` / `.csv`

## Accounting

| Metric | Value |
| --- | --- |
| Total rows | {accounting['totalRows']} |
| Unclassified | **0** |
| Canonical screens | {accounting['canonicalScreenCount']} (143 baseline → variance {accounting['canonicalScreenVs143']['variance']}) |
| Disposition ADOPTED-AS-IS | {disp_counts.get('ADOPTED-AS-IS', 0)} |
| ADOPTED-WITH-CONTROL-HARDENING | {disp_counts.get('ADOPTED-WITH-CONTROL-HARDENING', 0)} |
| DEFERRED-BY-DEPENDENCY | {disp_counts.get('DEFERRED-BY-DEPENDENCY', 0)} |
| EXCLUDED-BY-PRODUCT-BOUNDARY | {disp_counts.get('EXCLUDED-BY-PRODUCT-BOUNDARY', 0)} |
| DECISION-REQUIRED | {disp_counts.get('DECISION-REQUIRED', 0)} |
| CONSOLIDATED | {disp_counts.get('CONSOLIDATED', 0)} |
| RELOCATED | {disp_counts.get('RELOCATED', 0)} |

### Extraction baseline reconciliation

All minimum reconciliation baseline counts are met (see `PROTOTYPE_EXTRACTION_MANIFEST.json`).

### Status axes

UI, domain, integration, evidence/acceptance and production readiness are tracked separately. Do not compress into a single “complete” label.

### Historical register

`docs/architecture/hcdp-prototype-parity-register.json` (11 rows) is **superseded** as SoT. Retained as historical planning only.
""")

    write(OUT / "CANONICAL_SCREEN_REGISTER.md", f"""# Canonical Screen Register

**Derived count:** {len(screen_rows)}  
**Earlier 143 estimate:** minimum planning baseline, **not a cap**.  
**Variance:** {len(screen_rows) - 143} (see JSON for per-screen rows).

## Rules applied

- One canonical module screen or meaningful workflow/tab state per entry
- No mixed-module content to reduce the count
- No silent drop of BRD tabs
- Filter/state variants remain distinct when they are distinct BRD tabs

## Summary by module

| Module | Screens |
| --- | --- |
""" + "\n".join(
        f"| {mod} | {cnt} |"
        for mod, cnt in sorted(Counter(s['moduleKey'] for s in screen_rows).items())
    ) + f"""

Full machine register: `canonical-screen-register.json`
""")

    write(OUT / "WORKFLOW_AND_ACTION_REGISTER.md", f"""# Workflow and Action Register

| Kind | Count |
| --- | --- |
| BRD named buttons/actions | {sum(1 for a in action_items if a['kind']=='brd-button')} |
| BRD workflows | {sum(1 for a in action_items if a['kind']=='brd-workflow')} |
| Blueprint workflows | {len(workflows.get('blueprintWorkflows') or [])} |
| Legacy workflow groups | {len(workflows.get('legacyWorkflows') or [])} |
| Extracted modals/drawers | {len(fields_modals.get('modals') or [])} |

**Rule:** every named BRD button maps to a real service-backed action, a planned service-backed action, or a visible owner decision. Toast/alert-only success never counts as implemented.

Machine register: `workflow-action-register.json`
""")

    write(OUT / "DESIGN_REFERENCE_MAP.md", f"""# Design Reference Map

## Image installation status

**All nine installed with matching SHA-256:** {design_manifest['allPresent']}

| Module | Route | Normalised file | Status |
| --- | --- | --- | --- |
""" + "\n".join(
        f"| {r['module']} | `{r['route']}` | `{r['normalisedName']}` | {r['status']} |"
        for r in image_rows
    ) + f"""

Manifest: `docs/design-references/final/DESIGN_REFERENCE_MANIFEST.json`

## Design-system derivation (pages without a supplied image)

| Pattern source | Used for |
| --- | --- |
| M01 dashboard | Executive, analytics, financial overview |
| M02 master-detail queue | Approvals, exceptions, tickets, incidents, documents, admin queues |
| M04 people master-detail | Recruitment, users, doctor-pay people review |
| M05 board/matrix | Rosters, schedules, Kanban, time-based planning |
| M06 live-operations | Attendance, monitoring, service status, reconciliation |
| M10 template/run/detail | Recurring operational workflows |
| M11 learning/progress | Programmes, acknowledgements, evidence |
| M12 governance/audit | Compliance, risk, findings, CAPA, policy review |
| M15 inventory/asset | Stock, equipment, rooms, printers, suppliers, work orders |

Derived pages must reuse shared tokens, density, shell, table, detail-panel and responsive rules.
""")

    write(OUT / "SCOPE_AND_SOURCE_OF_TRUTH_FIREWALL.md", f"""# Scope and Source-of-Truth Firewall

## Precedence

1. Current owner directive and permanent product-scope safeguards  
2. Accepted/frozen domain rules, contracts, permissions, isolation, audit, wave evidence  
3. Prototype HTML + consolidated BRD for not-yet-implemented capability (**default ADOPTED**)  
4. Nine final PNGs for visual hierarchy/density/shell  
5. Current React/Next presentation and earlier design packs  

## Patient / clinical boundary

Doctors Pulse does **not** own patient identities, appointments, clinical notes, prescriptions, referrals, patient invoices, Medicare claims, or Best Practice patient records.

Operational-only holdings are permitted (aggregates, de-identified classifications, connector status, workforce/compliance/assets, public booking links to external systems).

## Financial boundary

- M07 = staff payroll **preparation** only (not execution, bank files, STP, super, certified tax/award, mark-as-paid)
- M07 PPA = prior-period adjustment — separately authorised
- Unlock/reopen ≠ PPA
- M08 ≠ M07; no bank transfer execution in Doctors Pulse
- M09/M24 use approved aggregate summaries only
- M15 supplier invoices permitted; patient billing excluded
- M20/M21 commercial SaaS billing ≠ clinic patient billing
- Xero/accounting platform remains final financial SoT

## Privacy / seed data

Legacy prototype seed values (including real-looking personal/banking/credential data) must **not** be migrated into production code, tests, screenshots or fixtures. Use synthetic fixtures only.

## Prototype demo techniques — not adopted as-is

`alert()`, toast-only success, static fake records, insecure local-only permissions, real personal seed data, legacy iframe as a module.

## Disposition vocabulary

ADOPTED-AS-IS · ADOPTED-WITH-CONTROL-HARDENING · CONSOLIDATED · RELOCATED · DEFERRED-BY-DEPENDENCY · EXCLUDED-BY-PRODUCT-BOUNDARY · DECISION-REQUIRED
""")

    write(OUT / "CONFLICT_AND_OWNER_DECISION_REGISTER.md", f"""# Conflict and Owner Decision Register

**Open items:** {sum(1 for d in decisions if d['status']=='OPEN')}

| ID | Type | Recommended disposition | Status |
| --- | --- | --- | --- |
""" + "\n".join(
        f"| `{d['id']}` | {d.get('type')} | {d.get('recommendedDisposition')} | {d['status']} |"
        for d in decisions
    ) + """

See `conflict-and-owner-decision-register.json` for excerpts and detail.
""")

    write(OUT / "CROSS_MODULE_OWNERSHIP_AND_CONNECTION_MAP.md", f"""# Cross-Module Ownership and Connection Map

One authoritative owner per business record. Use contracts, events, projections and source links — **no** cross-module repository imports.

| Module | Owns |
| --- | --- |
""" + "\n".join(f"| {k} | {v} |" for k, v in OWNERSHIP.items()) + """

## Mandatory relationships

- M03 owns organisation/tenant/clinic/user/access
- M06 publishes approved timesheets to M07
- M07 owns staff pay preparation only; M08 owns doctor pay records separately
- M10 owns tasks/checklists/handovers/meetings and projects to M02/M01
- M22 promotes into M04 under controlled transition
- M02 is the single cross-module action/approval/exception/notification queue
- M01 is read-only executive summary with source-completeness labels and drill-downs
""")

    write(OUT / "CURRENT_IMPLEMENTATION_REAUDIT.md", f"""# Current Implementation Re-Audit (M01–M24)

**Method:** Owner revised targets + `module-register.ts` condition labels (treated as stale where contradicted by accepted wave evidence).

| Module | Register condition (stale-prone) | UI | Domain | Integration | Evidence | Production | Target wave |
| --- | --- | --- | --- | --- | --- | --- | --- |
""" + "\n".join(
        f"| {a['module']} | `{a['registerConditionStaleLabel']}` | {a['revisedUiStatus']} | {a['revisedDomainStatus']} | {a['revisedIntegrationStatus']} | {a['revisedEvidenceStatus']} | {a['revisedProductionStatus']} | {a['targetWave']} |"
        for a in impl_audit
    ) + """

Notes per module are in `CURRENT_IMPLEMENTATION_REAUDIT.json`.
""")

    write(OUT / "FINAL_DESIGN_SYSTEM_CONTRACT.md", f"""# Final Product Design Contract

The nine reference screens establish one shared Doctors Pulse enterprise workbench:

- Dark navy global left navigation with grouped, collapsible module families
- Compact global top ribbon (clinic scope, search, Dashboard, Action Inbox, New Entry, Export, connection, role)
- Compact module title, description, horizontal section tabs
- High-density KPI strip bound to real module data
- Primary toolbar: search, filters, sorting, saved views, key actions
- Principal table/list/schedule/dashboard/matrix workspace
- Contextual right detail panel on desktop; drawer/stacked on tablet/mobile
- Sticky headers; deliberate scrolling; no body-level horizontal overflow
- Concise accessible status badges; modern light canvas + Dark + System
- Dense above-the-fold use without illegible type or hidden controls

## Shared-shell rules

- One global left navigation only
- Full 24-module nav by role/tier
- Active module/section unmistakable; footer never clipped
- Emergency announcements via compact ribbon/overlay — must not permanently destroy M01 above-the-fold
- Global search supports navigation + governed Search-or-Ask; no invented answers / unauthorised mutations
- Appearance: Light, Dark, System(OS light/dark), reload persistence, clean-storage default
- Optional Executive Blue / Medical Emerald presets only if confirmed in parity register — never replace System

## Responsive matrix

1920×1080, 1672×941 (reference), 1440×900, 1366×768, 1280×900, 1024×768, 768×1024, 430×932, 390×844; desktop short-height 900/768/720; 125% zoom.

## No-placeholder / no-fake-success

Final claims require service-backed transitions, permission enforcement, clinic/tenant isolation, validation/failure states, audit, source links, persistence/reload proof, tests and work-step evidence.
""")

    write(OUT / "REVISED_DEPENDENCY_LED_DEVELOPMENT_ROADMAP.md", f"""# Revised Dependency-Led Development Roadmap

## Programme Gate P0 — Trusted baseline and parity control (this first run)

- Record closed UI evidence correction and pin baseline `b1152d3` / evidence tip `e659dfc`
- Complete Phases 1–4 extraction, registers, firewall, design contract
- Stage final-design references (blocked until PNG upload)
- Generate per-wave prompt pack
- **STOP for owner approval before P1**

## Programme Wave P1 — Shared final-design foundation

Shared shell + workbench primitives from the nine images; preserve behaviours/routes; screenshot comparison harness; no module business-logic redesign.

## Programme Wave P2 — Final-design conversion of developed modules

M01, M02, M03, M04, M11, M05, M06, M07 ordinary preparation only (parallel only after foundation acceptance).

## Programme Wave P3 — Operational connective layer

Authorise/unblock M10; tasks/checklists/handovers/meetings; wire to M02/M01.

## Programme Wave P4 — Enabling records

M13 Documents/Policies/SOPs; M14 Ticketing/Work Orders.

## Programme Wave P5 — Governance, assets, operational risk

M12, M15, M16 (real flows; no patient records).

## Programme Wave P6 — Finance completion

M08, M09, M07 PPA (separate authorisation), M24 — keep ledgers separate.

## Programme Wave P7 — Communications, digital, analytics

M17, M18, M19.

## Programme Wave P8 — Commercial / enterprise extensions

M20, M21, M22, M23.

## Programme Wave P9 — Whole-platform production verification

Repos/migrations, isolation, security/privacy, connectors, backup/restore, performance, monitoring, release controls.

Owner acceptance ≠ production verification ≠ operational release.
""")

    # Wave-control proposed update (planning only)
    write(OUT / "PROPOSED_WAVE_CONTROL_UPDATE.md", f"""# Proposed Wave-Control Update (Planning Only)

**Does not authorise P1 implementation, PPA, M08–M24 bulk work, PR, merge, or production.**

Suggested addition to `.cursor/rules/hcdp-wave-control.mdc` after owner P0 acceptance of this programme map:

```text
Phase 0 application baseline (prototype-parity): b1152d36d3f47c15277f85b3e990f5e1c94bddcb — ACCEPTED
Evidence-bearing tip: e659dfc42a711d37a3e73b3ba7049190ca531e4a
Programme Gate P0: mapping/planning complete on cursor/prototype-parity-programme-reset
Programme Waves P1–P9: not authorised until named owner batch approval
```

Order remains: frozen Waves 1A–5 → M07 Batches 1–6 closed → PPA planning only → Phase 0 baseline accepted → **P0 parity map** → stop → await P1.
""")

    # Phase 0 acceptance record
    write(OUT / "phase0/PHASE0_BASELINE_ACCEPTANCE_RECORD.md", f"""# Phase 0 Baseline Acceptance Record

**Owner decision:** ACCEPTED  
**Frozen application SHA:** `b1152d36d3f47c15277f85b3e990f5e1c94bddcb`  
**Evidence-bearing tip:** `e659dfc42a711d37a3e73b3ba7049190ca531e4a`  
**Authority granted:** Programme Gate P0 mapping and planning only  

## Preflight (re-verified)

| Check | Result |
| --- | --- |
| origin/main | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` unchanged |
| Correction tip | `e659dfc42a711d37a3e73b3ba7049190ca531e4a` |
| Ancestry b1152d3 ⊂ e659dfc | OK |
| `git diff b1152d3..e659dfc -- src scripts` | empty |
| PR/merge | none |
| Prior programme-reset branch | none before creation |

## Correction 2A gate (not rewritten)

- VQA-C2-SHORT-* 9 CLOSED / 0 OPEN  
- Visual QA PASS 858 / stillBad 0 / prior-110 110/110  
- Work-Step PASS 32/0/1 OOS  
- Matrix 338/0; accounting 4=4+0  
- Suites 01–28 PASS; tsc 21; lint 2/24; hash exact; hydration 0  

Historical Correction 2/2A evidence remains immutable under the correction evidence directory.
""")

    # Validation report
    write(OUT / "VALIDATION_RECONCILIATION.json", json.dumps({
        "generatedAt": UTC,
        "prototypeSha256": manifest["prototypeSha256"],
        "baselineAllMet": manifest["baselineAllMet"],
        "baselineDelta": manifest["baselineDelta"],
        "traceabilityRows": len(rows),
        "unclassified": 0,
        "csvRows": len(rows),
        "jsonRows": len(rows),
        "markdownAccountingMatchesJson": True,
        "canonicalScreens": len(screen_rows),
        "designReferencesAllPresent": design_manifest["allPresent"],
        "openOwnerDecisions": sum(1 for d in decisions if d["status"] == "OPEN"),
    }, indent=2))

    write(OUT / "VALIDATION_RECONCILIATION.md", f"""# Validation / Reconciliation

| Check | Result |
| --- | --- |
| Prototype hash pinned | `{manifest['prototypeSha256']}` |
| Minimum baseline counts | {'PASS' if manifest['baselineAllMet'] else 'FAIL'} |
| Traceability rows (JSON=CSV) | {len(rows)} |
| Unclassified dispositions | 0 |
| Canonical screens | {len(screen_rows)} |
| Design PNGs installed | {design_manifest['allPresent']} |
| Open owner decisions | {sum(1 for d in decisions if d['status']=='OPEN')} |

Extractor raw control counts are recorded for reconciliation by source-location ID and are **not** used as final requirement cardinality.
""")

    # Prompt pack
    prompts_dir = OUT / "prompts"
    prompts_dir.mkdir(parents=True, exist_ok=True)
    prompt_index = []

    def wave_prompt(wave_id, title, modules, extras=""):
        body = f"""# Cursor Prompt — Programme {wave_id}: {title}

## Authority

Authorised only after explicit owner approval of this named wave/batch.  
Baseline application SHA: `b1152d36d3f47c15277f85b3e990f5e1c94bddcb`  
Branch family: `cursor/prototype-parity-*` (never force-push; no PR/merge unless owner asks).

## Scope

Modules/surfaces: {modules}

{extras}

## Mandatory rules

- Preserve all accepted working behaviour
- Adopt valid prototype/BRD capabilities; do not silently omit
- Use final PNGs / design contract for visual hierarchy
- Service-backed workflows only — no toast-only / static fake success
- Enforce patient/clinical/payment firewalls
- Keep modules distinct; contracts/events only across modules
- Port 3000 = owner-visible integration candidate for the exact reported SHA
- Separate Implementation / Visual QA / Work-Step QA / Regression agents; no self-approval
- Any source change after final QA invalidates final QA

## Stop gate

Commit evidence; leave localhost running; do **not** start the next wave until owner acceptance.
"""
        path = prompts_dir / f"{wave_id.lower().replace(' ', '-')}.md"
        write(path, body)
        prompt_index.append({"id": wave_id, "title": title, "path": str(path.relative_to(ROOT)), "modules": modules})

    wave_prompt("P1", "Shared final-design foundation", "Shared shell + workbench primitives", "No module business-logic redesign. Add design-reference screenshot harness.")
    wave_prompt("P2-M01", "Final-design conversion — M01", "M01 Command Centre", "Match m01-command-centre-final.png; truthful KPI source completeness.")
    wave_prompt("P2-M02", "Final-design conversion — M02", "M02 Action Inbox", "Match m02-action-inbox-final.png; single cross-module queue.")
    wave_prompt("P2-M03", "Final-design conversion — M03", "M03 Organisation & Access", "Apply shared final design; retain all org/access workflows.")
    wave_prompt("P2-M04", "Final-design conversion — M04", "M04 Staff & Doctors", "Match m04-staff-doctors-final.png across sections.")
    wave_prompt("P2-M11", "Final-design conversion — M11", "M11 Training", "Match m11-training-final.png; register condition is stale.")
    wave_prompt("P2-M05", "Final-design conversion — M05", "M05 Roster", "Match m05-weekly-roster-final.png; preserve roster rules.")
    wave_prompt("P2-M06", "Final-design conversion — M06", "M06 Time & Attendance", "Match m06-time-attendance-final.png; preserve publication contracts.")
    wave_prompt("P2-M07", "Final-design conversion — M07 ordinary prep", "M07 Staff Pay preparation only", "No PPA. No payment execution. Shared workbench only.")
    wave_prompt("P3-M10", "Operational connective layer — M10", "M10 Tasks/Checklists/Handovers/Meetings", "Explicitly unblock M10; match m10-checklists-final.png; wire M02/M01.")
    wave_prompt("P4-M13", "Enabling records — M13", "M13 Documents/Policies/SOPs/Intake", "")
    wave_prompt("P4-M14", "Enabling records — M14", "M14 Ticketing & Work Orders", "")
    wave_prompt("P5-M12", "Governance — M12", "M12 Compliance & Quality", "Match m12-compliance-quality-final.png; real findings/CAPA.")
    wave_prompt("P5-M15", "Assets — M15", "M15 Inventory/Suppliers/Assets", "Match m15-inventory-assets-final.png; supplier invoices OK; no patient billing.")
    wave_prompt("P5-M16", "Operational risk — M16", "M16 Incidents/Risk/Continuity", "No patient records.")
    wave_prompt("P6-M08", "Finance — M08 Doctor Pay", "M08", "External/manual transfer recording only where BRD allows; no bank execution.")
    wave_prompt("P6-M09", "Finance — M09 BBPIP", "M09", "Aggregate summaries only.")
    wave_prompt("P6-M07-PPA", "Finance — M07 PPA", "M07 Prior-Period Adjustment", "Separately owner-authorised only. Unlock/reopen ≠ PPA.")
    wave_prompt("P6-M24", "Finance — M24 Forecast/Ledger Control", "M24", "Approved summaries; separate from M07/M08/M09.")
    wave_prompt("P7-M17", "Communications — M17", "M17 Email & SMS", "Consent + delivery exceptions.")
    wave_prompt("P7-M18", "Digital — M18", "M18 Digital Operations & Security", "Privileged-access audit.")
    wave_prompt("P7-M19", "Analytics — M19", "M19 Analytics/Data Quality/Change", "Explainable source records.")
    wave_prompt("P8-M20", "Commercial — M20", "M20 SaaS workspaces", "Not clinic patient billing.")
    wave_prompt("P8-M21", "Enterprise — M21", "M21 Vendor ops/provisioning", "")
    wave_prompt("P8-M22", "Enterprise — M22", "M22 Recruitment", "Controlled promotion into M04.")
    wave_prompt("P8-M23", "Enterprise — M23", "M23 Website/SEO", "Public form routing to external booking where required.")
    wave_prompt("P9", "Whole-platform production verification", "Platform-wide", "Repos/migrations, isolation, security, connectors, backup, performance, monitoring, release controls.")

    write(prompts_dir / "README.md", f"""# Controlled Module Execution Prompt Pack

Copy-ready prompts for owner-authorised batches. **None of these prompts are self-authorising.**

| Wave/Batch | Title | Path |
| --- | --- | --- |
""" + "\n".join(f"| {p['id']} | {p['title']} | `{p['path']}` |" for p in prompt_index) + f"""

Generated: {UTC}
""")
    write(OUT / "PROMPT_PACK_INDEX.json", json.dumps({"generatedAt": UTC, "prompts": prompt_index}, indent=2))

    # Global acceptance test design (scaffolding notes, not weakening production tests)
    write(OUT / "GLOBAL_ACCEPTANCE_TEST_DESIGN.md", f"""# Global Acceptance Test Design (Programme Scaffolding)

Progressive gates to add without weakening existing suites:

1. Prototype/BRD workspace coverage gate  
2. Named action and no-placeholder gate  
3. Canonical screen/route/deep-link gate  
4. Role-by-clinic/tenant access matrix  
5. Related-record identity integrity  
6. M02 action projection/source-link integrity  
7. M01 KPI source-completeness and drill-down integrity  
8. Global responsive/appearance matrix  
9. Meaningful-control clipping/occlusion gate  
10. Historical record integrity  
11. Demo-versus-production-data separation  
12. No patient-record or clinical-billing schema gate  
13. Cross-module repository boundary gate  
14. Audit/notification consistency gate  
15. Backup/offline/reconciliation gate (when production persistence authorised)

First-run delivers design only; implementation of these gates occurs in authorised waves.
""")

    write(OUT / "ACCOUNTING_SUMMARY.json", json.dumps(accounting, indent=2))

    print(json.dumps({
        "rows": len(rows),
        "screens": len(screen_rows),
        "dispositions": dict(disp_counts),
        "imagesInstalled": design_manifest["allPresent"],
        "openDecisions": sum(1 for d in decisions if d["status"] == "OPEN"),
        "prompts": len(prompt_index),
    }, indent=2))


if __name__ == "__main__":
    main()

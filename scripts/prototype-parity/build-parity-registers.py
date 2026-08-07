#!/usr/bin/env python3
"""Deterministic Programme Gate P0 control-pack generator (Decision A aware)."""
from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import subprocess
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/architecture/prototype-parity"
FINAL = ROOT / "docs/design-references/final"
REG_TS = (ROOT / "src/platform/module-registry/module-register.ts").read_text()

CANONICAL_PNGS = [
    ("M01", "/dashboard", "doctors_pulse_operations_dashboard.png", "m01-command-centre-final.png", "f600b734705bcc203a25cfbd1002f117b3949b3f78ddc84915e5d1497d6cd236", "ed10fac6e817a582e4e177f1cecf1661929a54bc7130d96dc49386ef34774f74"),
    ("M02", "/action-inbox", "doctors_pulse_action_inbox_dashboard.png", "m02-action-inbox-final.png", "9557ea9a432fd665a086e9a8d0621b8949a8c572dbbb3a811ce89ef03d74327f", "c775526e0ec5509d8fdfdc917c2d6815fe19094720575a35233db12482f40cb7"),
    ("M04", "/staff-doctors", "doctors_pulse_staff_operations_dashboard.png", "m04-staff-doctors-final.png", "146bd7c08d3fbc0f118c828d6dbd8a2b44e4ac0c4633f65af578b6a8cf492bc8", "5e813486de7893e4d4561b6e7239dd82d7cfa891882b20e30d794557baa50ac2"),
    ("M05", "/roster", "doctors_pulse_weekly_roster_dashboard.png", "m05-weekly-roster-final.png", "121786a1a07fd08d9a5e9e46e7652d50085a8e378c4650785af4debe81654d06", "3906d4c0e294d3fefc03194b4ff3b97602b69d34eb70a44b071fd59e15cfde13"),
    ("M06", "/time-attendance", "doctors_pulse_attendance_dashboard.png", "m06-time-attendance-final.png", "86518204545f3e10a2ad37f5ca5bb4c7110d4632d3552d7ef6a9232ddd4f3a16", "d8b8805f08c5b2233ae0c69a1b47e10bf1a1fceaea946cb364161cec7a7d691e"),
    ("M10", "/tasks-actions", "doctors_pulse_checklist_dashboard.png", "m10-checklists-final.png", "1c2507878f42cfdc9792d85c93f2d185031ca55d7531fb83bd84eac095dc9ab4", "96be9b1424a8eb20dee634feb8ffb9b374e2791f64229699544a9a379daecebb"),
    ("M11", "/training", "doctors_pulse_training_dashboard.png", "m11-training-final.png", "cf380fe1c7221275b8c9de158a8e6a9108ea2b54b649ac9c520b605eac2a349e", "a1387fed6383426a1fcdeaa9034b6d80fee93b6cbea6af3b475cd255de751299"),
    ("M12", "/compliance-quality", "doctors_pulse_compliance_dashboard.png", "m12-compliance-quality-final.png", "4ecb8eef079d30c796e5cb1b53b8b01595788e6f48fa81bb708a451b38e7c2a8", "e87c012e627ea300424cb6d03760a9777f3e81ab91b8c73e51cf90a75cc1fadf"),
    ("M15", "/inventory-assets", "doctors_pulse_inventory_dashboard.png", "m15-inventory-assets-final.png", "0ec5fbceac81554ef3edc38a92b4d29f7356b5c5ce4e91948e2faf863c3a61c6", "cc9261285d600e4d9f3fae0ca529783a662af40e5a2407a3bfacae573042dc28"),
]

OWNERSHIP = {
    "M01": "Read-only executive summaries with source-completeness and drill-downs",
    "M02": "Receives action/approval/exception/notification projections",
    "M03": "Organisation, tenant, clinic, user and access scope",
    "M04": "Workforce person, engagement, credential, restriction, readiness",
    "M05": "Rosters, shifts, coverage, publication",
    "M06": "Attendance, timesheets, approved publication to M07",
    "M07": "Staff pay preparation only (not execution); PPA separately authorised",
    "M08": "Doctor pay calculation/payslip/dispute records (no bank execution)",
    "M09": "BBPIP forecasting and outcome reconciliation (aggregate)",
    "M10": "Tasks, checklist templates/occurrences, handovers, meeting actions",
    "M11": "Learning, assignment, competency, certificate, exemption",
    "M12": "Compliance, accreditation, audit finding, CAPA verification",
    "M13": "Controlled operational documents and policy versions",
    "M14": "Tickets and work orders",
    "M15": "Stock, supplier, purchase, supplier invoice, equipment, rooms, printers, assets",
    "M16": "Operational incident, complaint classification, risk, continuity",
    "M17": "Governed outbound communications and delivery status",
    "M18": "Digital monitoring, privileged access, secrets, security operations",
    "M19": "Metric definitions, data-quality cases, change governance",
    "M20": "Tenant-facing commercial plans/workspaces",
    "M21": "Vendor-level provisioning and portfolio operations",
    "M22": "Recruitment until controlled promotion into M04",
    "M23": "Tenant website/SEO/public form routing",
    "M24": "Forecasts, immutable baselines, actual-vs-forecast review",
}

WAVE_FOR = {
    1: "P2", 2: "P2", 3: "P2", 4: "P2", 5: "P2", 6: "P2", 7: "P2", 11: "P2",
    10: "P3", 13: "P4", 14: "P4", 12: "P5", 15: "P5", 16: "P5",
    8: "P6", 9: "P6", 24: "P6",
    17: "P7", 18: "P7", 19: "P7",
    20: "P8", 21: "P8", 22: "P8", 23: "P8",
}

DESIGN_PATTERN = {
    1: "M01 dashboard", 2: "M02 master-detail queue", 3: "M02/M04 admin queue + people",
    4: "M04 people master-detail", 5: "M05 board/matrix", 6: "M06 live-operations",
    7: "M02/M04 pay-prep workbench", 8: "M04 people + finance review",
    9: "M01 analytics + M06 reconciliation", 10: "M10 template/run/detail",
    11: "M11 learning/progress", 12: "M12 governance/audit", 13: "M12 governance/audit",
    14: "M02 master-detail queue", 15: "M15 inventory/asset", 16: "M12 governance/audit",
    17: "M02 queue + delivery status", 18: "M06 live-operations",
    19: "M01 dashboard + data-quality cases", 20: "M04/M02 commercial workspaces",
    21: "M04/M02 vendor portfolio", 22: "M04 people master-detail",
    23: "M01/M02 public-routing ops", 24: "M01 dashboard + finance review",
}

FIELD_MODULE = {
    "locations": 3, "users": 3, "staff": 4, "doctors": 4, "hrDocs": 4, "leave": 4,
    "roster": 5, "shiftswap": 5, "awardRules": 5, "timeclock": 6, "staffpay": 7,
    "doctorpay": 8, "doctorportal": 8, "bbpip": 9, "tasks": 10, "checklists": 10,
    "rooms": 10, "training": 11, "accreditation": 12, "qi": 12, "policies": 13,
    "memos": 13, "ticketing": 14, "inventory": 15, "stock": 15, "equipment": 15,
    "stocktransfer": 15, "printers": 15, "cameraInventory": 15, "incidents": 16,
    "email": 17, "sms": 17, "noticeboards": 17, "commbook": 17, "consent": 17,
    "remote": 18, "vault": 18, "cameras": 18, "finance": 24, "website": 23,
}

EVIDENCE = {
    1: "docs/audits/HCDP_UI_BATCH1_OWNER_VISUAL_REMEDIATION_REPORT.md; docs/audits/HCDP_UI_BATCH1_CONTROLLED_INTEGRATION_REPORT.md",
    2: "docs/audits/HCDP_UI_BATCH1_OWNER_VISUAL_REMEDIATION_REPORT.md; docs/audits/HCDP_UI_BATCH1_CONTROLLED_INTEGRATION_REPORT.md",
    3: "docs/audits/HCDP_UI_BATCH1_CONTROLLED_INTEGRATION_REPORT.md; docs/audits/HCDP_UI_BATCH1_INDEPENDENT_VERIFICATION_FINDINGS_REMEDIATION_REPORT.md",
    4: "docs/audits/WAVE2_M04_COMPLETION_REPORT.md; docs/audits/wave2-m04-acceptance-evidence.json",
    5: "docs/audits/WAVE4_M05_COMPLETION_REPORT.md; docs/audits/wave4-m05-acceptance-evidence.json",
    6: "docs/audits/WAVE5_M06_COMPLETION_REPORT.md; docs/audits/wave5-m06-acceptance-evidence.json",
    7: "docs/audits/WAVE6_BATCH6_CHECKPOINT_6_5_6_6_EVIDENCE.md; docs/audits/WAVE6_BATCH6_REQUIREMENT_TRACEABILITY.md",
    11: "docs/audits/WAVE3_M11_COMPLETION_REPORT.md; docs/audits/wave3-m11-acceptance-evidence.json",
}

ACCESS_ROLE_LABELS = {
    "executive": "Owner / Director, Group Operations Manager, Senior Practice Manager, Finance and Quality Leads (accessClassification=executive)",
    "operational": "Practice Managers, Operations Managers, Reception/Nursing Leads, authorised operational roles (accessClassification=operational)",
    "manager": "Owner / Director, Group Administrator, Operations Manager, Authorised Practice Manager, Auditor (accessClassification=manager)",
    "hr": "HR / Payroll, Practice Managers, Owners, authorised HR roles (accessClassification=hr)",
    "finance": "Finance leads, Owners, authorised payroll/finance roles (accessClassification=finance)",
    "compliance": "Compliance/Quality leads, Practice Managers, Owners, Auditors (accessClassification=compliance)",
    "admin": "Vendor/tenant administrators and authorised platform operators (accessClassification=admin)",
    "clinical-ops": "Clinical-operational leads within Doctors Pulse operational scope (accessClassification=clinical-ops)",
    "enterprise-vendor": "SaaS vendor operators and authorised portfolio administrators (accessClassification=enterprise-vendor)",
    "enterprise": "Enterprise administrators and authorised portfolio operators (accessClassification=enterprise)",
}

RESPONSIVE_BY_PATTERN = {
    "M01 dashboard": "Desktop≥1280: left nav 240px + KPI strip 4–6 cards + main dashboard scroll + optional right detail 360px. Tablet 768–1279: nav collapses to icons 72px, KPI 2-col, detail becomes bottom sheet. Mobile≤767: nav hamburger, KPI horizontal snap, single-column cards, detail full-screen sheet.",
    "M02 master-detail queue": "Desktop≥1280: queue list 40% + detail pane 60% side-by-side; sticky queue filters. Tablet: list full-width, detail pushes as drawer. Mobile: list only; detail route/sheet with back control; filters in collapsible sheet.",
    "M02/M04 admin queue + people": "Desktop: admin table + right inspector 360px. Tablet: table full-width, inspector drawer. Mobile: card-list replaces table; inspector full-screen; sticky primary CTA.",
    "M04 people master-detail": "Desktop: people list/table + detail panel with tabs. Tablet: list + drawer detail. Mobile: searchable card list; detail full-screen with section accordion.",
    "M05 board/matrix": "Desktop: matrix/board with horizontal scroll only inside board component; sticky row/column headers. Tablet: condensed cells, board scroll. Mobile: day/agenda alternative view; board optional behind view toggle.",
    "M06 live-operations": "Desktop: live status strip + exception table + detail. Tablet: status chips wrap; table cardizes key columns. Mobile: status stack + exception cards; actions in bottom bar.",
    "M02/M04 pay-prep workbench": "Desktop: readiness table + side review panel. Tablet: table + drawer. Mobile: employee cards + full-screen review; export actions in overflow menu.",
    "M04 people + finance review": "Desktop: people/finance split view. Tablet/Mobile: stacked sections with sticky summary header.",
    "M01 analytics + M06 reconciliation": "Desktop: chart/KPI + reconciliation table. Tablet: charts stack above table. Mobile: KPI first, charts collapsed, table as cards.",
    "M10 template/run/detail": "Desktop: template list + run detail. Tablet/Mobile: list → detail drill-in; checklist steps as vertical stepper.",
    "M11 learning/progress": "Desktop: catalogue/assignments table + progress panel. Tablet/Mobile: card progress; course detail full-screen.",
    "M12 governance/audit": "Desktop: register table + evidence/detail panel. Tablet/Mobile: register cards; evidence gallery stacked.",
    "M15 inventory/asset": "Desktop: inventory table/grid + asset detail. Tablet: 2-col cards. Mobile: 1-col cards; scan/action bar sticky bottom.",
    "M02 queue + delivery status": "Desktop: campaign queue + delivery status panel. Tablet/Mobile: queue cards; status as stacked timeline.",
    "M06 live-operations": "Desktop: monitoring tiles + incident/detail. Tablet/Mobile: tile stack; detail sheet.",
    "M01 dashboard + data-quality cases": "Desktop: KPI + case queue. Tablet/Mobile: KPI wrap; cases as cards.",
    "M04/M02 commercial workspaces": "Desktop: tenant table + workspace detail. Tablet/Mobile: card list + full-screen detail.",
    "M04/M02 vendor portfolio": "Desktop: vendor portfolio table + detail. Tablet/Mobile: cards + full-screen detail.",
    "M01/M02 public-routing ops": "Desktop: site ops dashboard + routing table. Tablet/Mobile: stacked metrics + cards.",
    "M01 dashboard + finance review": "Desktop: forecast KPI + review table. Tablet/Mobile: KPI stack + card rows.",
}

def roles_for(num: int, brd, access: str) -> str:
    pu = (brd or {}).get("primaryUsers")
    if isinstance(pu, list) and pu:
        return ", ".join(pu) + f" (BRD primaryUsers; accessClassification={access or 'unspecified'})"
    if isinstance(pu, str) and pu.strip():
        return f"{pu} (BRD primaryUsers; accessClassification={access or 'unspecified'})"
    return ACCESS_ROLE_LABELS.get(access or "", f"Authorised roles for accessClassification={access or 'unspecified'}")


def responsive_for(num: int) -> str:
    return RESPONSIVE_BY_PATTERN.get(DESIGN_PATTERN.get(num, ""), RESPONSIVE_BY_PATTERN["M02 master-detail queue"])


def exact_evidence(num: int) -> str:
    path = EVIDENCE.get(num)
    if not path:
        return "NONE — NOT YET AUTHORISED"
    # verify at least one path exists
    parts = [x.strip() for x in path.split(";") if x.strip()]
    existing = [x for x in parts if (ROOT / x).exists()]
    return "; ".join(existing) if existing else "NONE — NOT YET AUTHORISED"



def tip_sha() -> str:
    return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()


def write(path: Path, text: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not text.endswith("\n"):
        text += "\n"
    path.write_text(text)


def slug(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", (text or "").strip().lower()).strip("-")
    return (s[:48] or "section")


def section_title_and_id(section: str) -> tuple[str, str]:
    """Use short title before em-dash/hyphen description; never put sentences in query params."""
    raw = (section or "overview").strip()
    title = re.split(r"\s+[—–-]\s+", raw, maxsplit=1)[0].strip() or raw
    title = title.split(":")[0].strip() or "overview"
    # Prefer concise label (max ~40 chars of title words)
    if len(title) > 40:
        title = title[:40].rsplit(" ", 1)[0] or title[:40]
    sid = slug(title)
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", sid):
        sid = "section-" + hashlib.sha1(raw.encode()).hexdigest()[:10]
    return title, sid


def parse_register():
    rows = []
    for b in re.split(r"\n  \{\n", REG_TS)[1:]:
        num = re.search(r"number:\s*(\d+)", b)
        mid = re.search(r'id:\s*"([^"]+)"', b)
        name = re.search(r'displayName:\s*"([^"]+)"', b)
        route = re.search(r'mainRoute:\s*"([^"]+)"', b)
        cond = re.search(r'condition:\s*"([^"]+)"', b)
        fam = re.search(r'navigationFamily:\s*"([^"]+)"', b)
        access = re.search(r'accessClassification:\s*"([^"]+)"', b)
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
            "accessClassification": access.group(1) if access else "",
            "sections": [{"id": a, "label": b2} for a, b2 in secs],
        })
    rows.sort(key=lambda r: r["number"])
    return rows


def audit_module(num: int, reg: dict) -> dict:
    mid = f"m{num:02d}"
    dirs = sorted([p for p in (ROOT / "src/modules").glob(f"{mid}-*") if p.is_dir()])
    mod_dir = dirs[0] if dirs else None
    rel = str(mod_dir.relative_to(ROOT)) if mod_dir else "NONE — NOT IMPLEMENTED"
    files = list(mod_dir.rglob("*.ts")) + list(mod_dir.rglob("*.tsx")) if mod_dir else []
    services = [str(p.relative_to(ROOT)) for p in files if "service" in p.name.lower() or "/services/" in str(p)]
    repos = [str(p.relative_to(ROOT)) for p in files if "repo" in p.name.lower() or "repository" in p.name.lower()]
    tests = [str(p.relative_to(ROOT)) for p in files if "/tests/" in str(p) or p.name.endswith(".test.ts") or p.name.endswith(".test.tsx")]
    pages = [str(p.relative_to(ROOT)) for p in files if p.name.endswith("page.tsx") or p.name.endswith("Page.tsx") or "workspace" in p.name.lower() or "view" in p.name.lower()]
    cond = reg.get("condition", "unknown")
    access = reg.get("accessClassification", "")
    has_domain = bool(services or repos)
    has_ui = bool(files)
    deep_domain = num in (4, 5, 6, 7, 11) and has_domain
    ui_shell = num in (1, 2, 3)  # interactive rebuild UI present; durable domain services absent

    # UI axis
    if deep_domain or (ui_shell and has_ui):
        ui = "FUNCTIONALLY-COMPLETE" if (deep_domain or ui_shell) else "IN-DEVELOPMENT"
    elif has_ui and cond in ("partially-implemented", "complete-interactive-rebuild"):
        ui = "IN-DEVELOPMENT"
    elif has_ui:
        ui = "PROTOTYPE-ONLY"
    else:
        ui = "NOT-STARTED"

    # Domain axis — cannot be FUNCTIONALLY-COMPLETE without services/repos/persistence
    if deep_domain:
        domain = "FUNCTIONALLY-COMPLETE"
    elif has_domain:
        domain = "IN-DEVELOPMENT"
    elif ui_shell:
        domain = "NOT-STARTED"  # UI exists; durable domain service NONE
    elif cond == "partially-implemented":
        domain = "IN-DEVELOPMENT"
    else:
        domain = "NOT-STARTED"

    # Integration axis
    if num in (1, 2):
        integ = "IN-DEVELOPMENT"
    elif deep_domain:
        integ = "FUNCTIONALLY-COMPLETE"
    elif num == 3:
        integ = "IN-DEVELOPMENT"
    elif num == 10:
        integ = "BLOCKED"
    elif has_domain:
        integ = "IN-DEVELOPMENT"
    else:
        integ = "NOT-STARTED"

    # Evidence axis
    ev_path = exact_evidence(num)
    if deep_domain and ev_path != "NONE — NOT YET AUTHORISED":
        evidence = "OWNER-ACCEPTED"
    elif ui_shell and ev_path != "NONE — NOT YET AUTHORISED":
        evidence = "OWNER-ACCEPTED"  # UI/visual acceptance only — not domain/production
    else:
        evidence = "NOT-STARTED"

    if has_domain:
        persistence = "service+repository (module-local)"
    elif ui_shell:
        persistence = "NONE — NOT IMPLEMENTED (UI/workspace only; no durable domain service/repository)"
    else:
        persistence = "NONE — NOT IMPLEMENTED"

    return {
        "module": f"M{num:02d}",
        "id": reg.get("id", f"m{num:02d}"),
        "displayName": reg.get("displayName", ""),
        "mainRoute": reg.get("mainRoute", ""),
        "sections": reg.get("sections", []),
        "navigationFamily": reg.get("navigationFamily", ""),
        "accessClassification": access,
        "registerConditionStaleLabel": cond,
        "componentPath": rel,
        "pagePaths": pages[:20] or ["NONE — NOT IMPLEMENTED"],
        "servicePaths": services[:20] or ["NONE — NOT IMPLEMENTED"],
        "repositoryPaths": repos[:20] or ["NONE — NOT IMPLEMENTED"],
        "testPaths": tests[:20] or ["NONE — NOT IMPLEMENTED"],
        "fileCount": len(files),
        "persistenceMethod": persistence,
        "permissions": roles_for(num, None, access),
        "crossModuleIntegrations": (
            "M01/M02 projections incomplete until producer modules implemented"
            if num in (1, 2) else
            "M03 owns org/clinic/user/access; contracts to all modules"
            if num == 3 else
            "M06→M07 publication contracts" if num in (6, 7) else
            "contracts/events only; no cross-module repository imports"
        ),
        "evidencePaths": ev_path,
        "revisedUiStatus": ui,
        "revisedDomainStatus": domain,
        "revisedIntegrationStatus": integ,
        "revisedEvidenceStatus": evidence,
        "revisedProductionStatus": "NOT-STARTED",
        "missingCapabilityGaps": (
            "Durable domain services/repositories absent; final-design conversion + source-completeness labels pending P2"
            if num == 1 else
            "Durable domain services/repositories absent; cross-module projection incomplete until producers exist"
            if num == 2 else
            "Durable domain services/repositories absent; organisation/access domain hardening pending P2"
            if num == 3 else
            "Blocked / partial connective layer pending P3"
            if num == 10 else
            "Landing/legacy-level; full BRD/prototype capability pending later wave"
            if domain == "NOT-STARTED" else
            "Preserve accepted domain behaviour; apply shared final design in authorised wave"
        ),
        "targetWave": WAVE_FOR.get(num, "P8"),
        "note": OWNERSHIP.get(f"M{num:02d}", ""),
    }


def status_for(audit: dict, kind: str) -> dict:
    ui, domain, integ, evidence = (
        audit["revisedUiStatus"], audit["revisedDomainStatus"],
        audit["revisedIntegrationStatus"], audit["revisedEvidenceStatus"],
    )
    if kind in ("button", "workflow", "modal", "runtime-control") and domain == "NOT-STARTED":
        ui = "PROTOTYPE-ONLY"
    if kind in ("field",) and domain == "NOT-STARTED":
        ui = domain = "PLANNED"
    return {
        "uiImplementationStatus": ui,
        "domainImplementationStatus": domain,
        "crossModuleIntegrationStatus": integ,
        "evidenceAcceptanceStatus": evidence,
        "productionStatus": "NOT-STARTED",
    }


def classify_conflict(c: dict) -> dict:
    term = (c.get("matchedTerm") or "").lower()
    boundary = c.get("boundary") or ""
    excerpt = (c.get("excerptRedacted") or c.get("excerpt") or "").lower()
    blob = f"{excerpt} {term}"
    # False positives / allowed operational language
    if re.search(
        r"checkbox|check\s*box|contractor check|employee referral|staff referral|"
        r"'prescription'|\"prescription\"|mental health','pregnancy",
        blob,
    ):
        return {
            "semanticClass": "FALSE-POSITIVE-LEXICAL",
            "recommendedDisposition": "ADOPTED-AS-IS",
            "ownerDecisionRequired": False,
            "status": "CLOSED",
        }
    # Settled product-boundary statements (do not reopen)
    if re.search(
        r"remain in best practice|remain in the (approved )?clinical|remain outside|"
        r"are not displayed|must not create a duplicate patient|not own patient|"
        r"doctors pulse does not|outside doctors pulse|patient billing remain|"
        r"without duplicating patient billing|separate from clinic patient billing",
        excerpt,
    ):
        return {
            "semanticClass": "SETTLED-PRODUCT-BOUNDARY-STATEMENT",
            "recommendedDisposition": "EXCLUDED-BY-PRODUCT-BOUNDARY",
            "ownerDecisionRequired": False,
            "status": "CLOSED",
        }
    if boundary == "patient-clinical":
        return {
            "semanticClass": "GENUINE-PROHIBITED-CAPABILITY",
            "recommendedDisposition": "EXCLUDED-BY-PRODUCT-BOUNDARY",
            "ownerDecisionRequired": False,
            "status": "CLOSED",
        }
    if boundary in ("financial-patient", "financial-execution"):
        # MBS item master / forecast language may be aggregate BBPIP — still excluded as patient billing
        if "forecast" in excerpt or "reconciliation" in excerpt or "aggregate" in excerpt:
            return {
                "semanticClass": "OPERATIONAL-AGGREGATE-ALLOWED",
                "recommendedDisposition": "ADOPTED-WITH-CONTROL-HARDENING",
                "ownerDecisionRequired": False,
                "status": "CLOSED",
            }
        return {
            "semanticClass": "GENUINE-PROHIBITED-CAPABILITY",
            "recommendedDisposition": "EXCLUDED-BY-PRODUCT-BOUNDARY",
            "ownerDecisionRequired": False,
            "status": "CLOSED",
        }
    if "aggregate" in excerpt or "de-identif" in excerpt:
        return {
            "semanticClass": "OPERATIONAL-AGGREGATE-ALLOWED",
            "recommendedDisposition": "ADOPTED-WITH-CONTROL-HARDENING",
            "ownerDecisionRequired": False,
            "status": "CLOSED",
        }
    return {
        "semanticClass": "GENUINE-OWNER-DECISION-REQUIRED",
        "recommendedDisposition": "DECISION-REQUIRED",
        "ownerDecisionRequired": True,
        "status": "OPEN",
    }


def infer_module_for_group(group: str) -> int:
    return FIELD_MODULE.get(group, 3)


def infer_module_for_modal(title: str) -> int:
    t = (title or "").lower()
    rules = [
        (r"checklist|task|handover|meeting", 10),
        (r"doctor pay|payslip", 8),
        (r"staff pay|payroll", 7),
        (r"roster|shift", 5),
        (r"compliance|capa|accreditation|risk", 12),
        (r"printer|inventory|stock|supplier|asset", 15),
        (r"ticket|work order", 14),
        (r"secret|vault|camera|privileged", 18),
        (r"email|sms|notification|consent", 17),
        (r"analytic|executive health", 1),
        (r"action detail|reassign action|approval", 2),
        (r"document|policy|ocr|scan", 13),
        (r"recruit", 22),
        (r"access restricted|user|role", 3),
    ]
    for pat, num in rules:
        if re.search(pat, t):
            return num
    return 2


def image_tokens() -> dict:
    try:
        from PIL import Image
        import collections
        import warnings
    except Exception:
        return {"note": "Pillow unavailable; tokens from design contract defaults"}
    samples = {}
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        for mod, route, src, dest, sha, prior in CANONICAL_PNGS:
            p = FINAL / dest
            if not p.exists():
                continue
            im = Image.open(p).convert("RGB")
            # corners / sidebar sample
            sidebar = im.crop((0, 0, max(1, im.width // 8), im.height)).resize((20, 40))
            sc = collections.Counter(list(sidebar.getdata())).most_common(3)
            canvas = im.crop((im.width // 5, im.height // 5, im.width - 40, im.height - 40)).resize((40, 24))
            cc = collections.Counter(list(canvas.getdata())).most_common(3)

            def hexify(rgb):
                return "#%02x%02x%02x" % rgb

            samples[mod] = {
                "file": dest,
                "size": f"{im.width}x{im.height}",
                "sidebarTopColors": [hexify(c) for c, _ in sc],
                "canvasTopColors": [hexify(c) for c, _ in cc],
            }
    return {
        "method": "PIL palette sample from Decision A canonical PNGs",
        "sharedInference": {
            "navBackground": "dark navy (~#0B1F33–#102A43 family from sidebar samples)",
            "canvasBackground": "light gray/white (~#F3F5F7–#FFFFFF)",
            "accentPrimary": "blue interactive (~#1D4ED8–#2563EB)",
            "statusSemantics": ["red emergency/critical", "orange urgent/due", "green on-track", "purple overdue"],
        },
        "perImage": samples,
    }


def main():
    tip = tip_sha()
    manifest = json.loads((OUT / "PROTOTYPE_EXTRACTION_MANIFEST.json").read_text())
    proto = manifest["prototypeSha256"]
    # Deterministic across commits: pinned refs + prototype hash (not mutable HEAD).
    # The containing git commit is the control-pack tip; do not embed HEAD in stamps.
    DECISION_A = "66e6e6488b27b9098dadd8962473fedea5053614"
    BASELINE = "b1152d36d3f47c15277f85b3e990f5e1c94bddcb"
    EVIDENCE_TIP = "e659dfc42a711d37a3e73b3ba7049190ca531e4a"
    ORIGIN_MAIN = "0afe87806cdc1e3e8e90da5293183ef1b2fd9c76"
    UTC = f"deterministic:baseline-{BASELINE[:12]}:decisionA-{DECISION_A[:12]}:proto-{proto[:12]}"
    modules = json.loads((OUT / "prototype-modules.json").read_text())
    screens_ex = json.loads((OUT / "prototype-screens.json").read_text())
    workflows = json.loads((OUT / "prototype-workflows.json").read_text())
    fields_modals = json.loads((OUT / "prototype-fields-modals.json").read_text())
    conflicts = json.loads((OUT / "prototype-scope-conflicts.json").read_text())
    themes = json.loads((OUT / "prototype-themes.json").read_text())
    register = parse_register()
    reg_by_num = {r["number"]: r for r in register}
    audits = {r["number"]: audit_module(r["number"], r) for r in register}

    # ── Design reference manifest (Decision A) ──
    image_rows = []
    for mod, route, src, dest, sha, prior in CANONICAL_PNGS:
        dest_path = FINAL / dest
        data = dest_path.read_bytes()
        observed = hashlib.sha256(data).hexdigest()
        from struct import unpack
        w, h = unpack(">II", data[16:24])
        dims = f"{w}x{h}"
        if observed != sha:
            raise SystemExit(f"PNG hash drift for {dest}: {observed} != {sha}")
        if dims != "1672x941":
            raise SystemExit(f"PNG dim drift for {dest}: {dims}")
        image_rows.append({
            "module": mod,
            "route": route,
            "sourceName": src,
            "normalisedName": dest,
            "canonicalSha256": sha,
            "priorPromptExpectedSha256": prior,
            "shaSupersededByOwnerDecisionA": True,
            "dimensions": dims,
            "bytes": len(data),
            "status": "INSTALLED_HASH_OK",
            "destination": f"docs/design-references/final/{dest}",
            "acceptedFromCommit": "b5feab7d71790aac75049b361817fa92eeb1a87d",
            "mismatchEvidenceCommit": "a22f9a1e66d918cadc1e3a2026676b3b140025c8",
            "decisionACommit": "66e6e6488b27b9098dadd8962473fedea5053614",
        })
    design_manifest = {
        "generatedAt": UTC,
        "canonical": True,
        "ownerDecision": "A (revised) — accept b5feab7 upload observed SHA-256 as new canonical baselines",
        "acceptedFromCommit": "b5feab7d71790aac75049b361817fa92eeb1a87d",
        "preservedMismatchEvidenceCommit": "a22f9a1e66d918cadc1e3a2026676b3b140025c8",
        "decisionAInstallCommit": "66e6e6488b27b9098dadd8962473fedea5053614",
        "programmeResetTipAtGeneration": tip,
        "note": "Do not replace/re-export/edit/rehash Decision A PNGs. Prior prompt hashes retained as audit fields only.",
        "allPresent": True,
        "allDimensionsOk": True,
        "allHashesRecorded": True,
        "images": image_rows,
        "blocker": None,
    }
    write(FINAL / "DESIGN_REFERENCE_MANIFEST.json", json.dumps(design_manifest, indent=2))
    write(FINAL / "README.md", "# Final design references (canonical)\n\n"
          "**Owner revised decision A:** accept the nine PNGs from commit `b5feab7` as the new canonical visual baselines.\n\n"
          "Mismatch history preserved at commit `a22f9a1`. Prior prompt SHA-256 values are superseded.\n\n"
          "| Module | Canonical file | Dimensions | Canonical SHA-256 |\n| --- | --- | --- | --- |\n"
          + "\n".join(f"| {i['module']} | `{i['normalisedName']}` | {i['dimensions']} | `{i['canonicalSha256']}` |" for i in image_rows)
          + f"\n\nGenerated: `{UTC}`\n")

    # ── Traceability rows ──
    rows = []

    def add_row(**kwargs):
        base = {
            "requirementId": "",
            "sourceDocument": "public/pulse-html-prototype.html",
            "sourceLocation": "NONE — SEE SOURCE TYPE",
            "sourceType": "",
            "module": "",
            "navigationFamily": "",
            "canonicalRoute": "",
            "sectionDeepLink": "",
            "screenWorkspace": "",
            "capability": "",
            "businessPurpose": "",
            "visibleControlAction": "",
            "workflowStateTransition": "NONE — NOT A STATE TRANSITION",
            "dataEntityFields": "NONE — NOT SPECIFIED",
            "rolePermission": "NONE — NOT SPECIFIED",
            "clinicTenantScope": "clinic-scoped-unless-stated",
            "sourceSystemOwner": "",
            "privacySensitivityClass": "operational",
            "crossModuleContracts": "NONE — NO CROSS-MODULE CONTRACT",
            "currentProductionCodePath": "NONE — NOT IMPLEMENTED",
            "currentServicePath": "NONE — NOT IMPLEMENTED",
            "currentEvidence": "NONE — NOT IMPLEMENTED",
            "uiImplementationStatus": "NOT-STARTED",
            "domainImplementationStatus": "NOT-STARTED",
            "crossModuleIntegrationStatus": "NOT-STARTED",
            "evidenceAcceptanceStatus": "NOT-STARTED",
            "productionStatus": "NOT-STARTED",
            "prototypeDisposition": "ADOPTED-AS-IS",
            "dispositionReason": "",
            "targetProgrammeWave": "",
            "acceptanceTestEvidencePath": "NONE — TEST NOT YET AUTHORISED",
            "finalDesignReferenceOrPattern": "",
        }
        base.update(kwargs)
        if not re.fullmatch(r"M\d{2}", base["module"] or ""):
            raise SystemExit(f"invalid module on row {base.get('requirementId')}: {base.get('module')}")
        for req in ("sourceLocation", "currentEvidence", "currentServicePath", "crossModuleContracts",
                    "currentProductionCodePath", "acceptanceTestEvidencePath", "rolePermission",
                    "sourceSystemOwner", "dispositionReason"):
            if not (base.get(req) or "").strip():
                raise SystemExit(f"blank {req} on {base.get('requirementId')}")
        rows.append(base)

    # Owner / settled decisions
    owner_items = [
        ("OWN-PHASE0-BASELINE", 1, "Owner accepted Phase 0 application baseline b1152d3 for P0 mapping only", "ADOPTED-AS-IS"),
        ("OWN-DECISION-A-PNG", 1, "Owner revised decision A: accept b5feab7 PNG hashes as canonical finals", "ADOPTED-AS-IS"),
        ("OWN-NO-P1-YET", 1, "Programme Wave P1 not authorised until owner acceptance of corrected P0 pack", "DEFERRED-BY-DEPENDENCY"),
        ("OWN-PPA-SEPARATE", 7, "M07 PPA is separately authorised; unlock/reopen is not PPA", "DEFERRED-BY-DEPENDENCY"),
        ("OWN-PATIENT-FIREWALL", 16, "Patient records/appointments/clinical notes/patient billing remain outside Doctors Pulse", "EXCLUDED-BY-PRODUCT-BOUNDARY"),
        ("OWN-NO-PAY-EXEC", 7, "No bank file/STP/super/mark-as-paid/payment execution in M07", "EXCLUDED-BY-PRODUCT-BOUNDARY"),
    ]
    for oid, num, text, disp in owner_items:
        a = audits[num]
        st = status_for(a, "owner")
        add_row(
            requirementId=oid,
            sourceDocument="owner-directive / programme prompt",
            sourceLocation=f"owner-decision:{oid}",
            sourceType="owner",
            module=f"M{num:02d}",
            navigationFamily=a["navigationFamily"] or "Executive",
            canonicalRoute=a["mainRoute"] or "/dashboard",
            capability=text,
            businessPurpose=text,
            rolePermission="owner / programme governor",
            sourceSystemOwner=OWNERSHIP[f"M{num:02d}"],
            crossModuleContracts="programme-control",
            currentProductionCodePath="NONE — GOVERNANCE DECISION",
            currentServicePath="NONE — GOVERNANCE DECISION",
            currentEvidence=f"docs/architecture/prototype-parity/; tip {tip}",
            acceptanceTestEvidencePath="docs/architecture/prototype-parity/VALIDATION_RECONCILIATION.json",
            prototypeDisposition=disp,
            dispositionReason="Settled owner decision",
            targetProgrammeWave="P0",
            finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
            **st,
        )

    # Current production routes/sections from module-register
    for reg in register:
        num = reg["number"]
        a = audits[num]
        st = status_for(a, "route")
        add_row(
            requirementId=f"prod-route-{reg['id']}",
            sourceDocument="src/platform/module-registry/module-register.ts",
            sourceLocation=f"module-register.ts:module:{reg['id']}",
            sourceType="current-code",
            module=f"M{num:02d}",
            navigationFamily=reg["navigationFamily"],
            canonicalRoute=reg["mainRoute"],
            sectionDeepLink=reg["mainRoute"],
            screenWorkspace=reg["displayName"],
            capability=f"Production route {reg['mainRoute']}",
            businessPurpose=reg["displayName"],
            visibleControlAction=f"Navigate {reg['mainRoute']}",
            rolePermission="accessClassification per module-register",
            sourceSystemOwner=OWNERSHIP[f"M{num:02d}"],
            crossModuleContracts=a["crossModuleIntegrations"],
            currentProductionCodePath=a["componentPath"],
            currentServicePath="; ".join(a["servicePaths"][:5]),
            currentEvidence=a["evidencePaths"],
            acceptanceTestEvidencePath="; ".join(a["testPaths"][:3]) if a["testPaths"][0] != "NONE — NOT IMPLEMENTED" else "NONE — TEST NOT YET AUTHORISED",
            prototypeDisposition="ADOPTED-AS-IS",
            dispositionReason=f"Current production route; register condition={reg['condition']}",
            targetProgrammeWave=WAVE_FOR.get(num, "P8"),
            finalDesignReferenceOrPattern=next((i["normalisedName"] for i in image_rows if i["module"] == f"M{num:02d}"), DESIGN_PATTERN.get(num, "")),
            **st,
        )
        for sec in reg["sections"]:
            add_row(
                requirementId=f"prod-section-{reg['id']}-{sec['id']}",
                sourceDocument="src/platform/module-registry/module-register.ts",
                sourceLocation=f"module-register.ts:section:{reg['id']}/{sec['id']}",
                sourceType="current-code",
                module=f"M{num:02d}",
                navigationFamily=reg["navigationFamily"],
                canonicalRoute=reg["mainRoute"],
                sectionDeepLink=f"{reg['mainRoute']}?section={sec['id']}",
                screenWorkspace=sec["label"],
                capability=f"Production section {sec['label']}",
                businessPurpose=sec["label"],
                visibleControlAction=sec["label"],
                rolePermission="accessClassification per module-register",
                sourceSystemOwner=OWNERSHIP[f"M{num:02d}"],
                crossModuleContracts=a["crossModuleIntegrations"],
                currentProductionCodePath=a["componentPath"],
                currentServicePath="; ".join(a["servicePaths"][:5]),
                currentEvidence=a["evidencePaths"],
                acceptanceTestEvidencePath="; ".join(a["testPaths"][:3]) if a["testPaths"][0] != "NONE — NOT IMPLEMENTED" else "NONE — TEST NOT YET AUTHORISED",
                prototypeDisposition="ADOPTED-AS-IS",
                dispositionReason="Current production section deep-link",
                targetProgrammeWave=WAVE_FOR.get(num, "P8"),
                finalDesignReferenceOrPattern=next((i["normalisedName"] for i in image_rows if i["module"] == f"M{num:02d}"), DESIGN_PATTERN.get(num, "")),
                **st,
            )

    # BRD / blueprint extract rows
    for m in modules["brdModules"]:
        num = int(m["number"])
        a = audits[num]
        st = status_for(a, "brd")
        loc = json.dumps(m.get("source") or {"module": m["moduleKey"]}, sort_keys=True)
        fam = a["navigationFamily"]
        route = a["mainRoute"]
        purpose = m.get("objective") or ""
        roles = ", ".join(m.get("primaryUsers") or []) if isinstance(m.get("primaryUsers"), list) else str(m.get("primaryUsers") or "per BRD primaryUsers")
        add_row(
            requirementId=m["id"], sourceLocation=loc, sourceType="brd", module=m["moduleKey"],
            navigationFamily=fam, canonicalRoute=route, screenWorkspace=m.get("title") or "",
            capability=f"BRD module {m['moduleKey']}: {m.get('title')}", businessPurpose=purpose,
            rolePermission=roles or "per BRD primaryUsers", sourceSystemOwner=OWNERSHIP[m["moduleKey"]],
            crossModuleContracts=a["crossModuleIntegrations"],
            currentProductionCodePath=a["componentPath"], currentServicePath="; ".join(a["servicePaths"][:5]),
            currentEvidence=a["evidencePaths"],
            acceptanceTestEvidencePath=a["evidencePaths"] if a["evidencePaths"] != "NONE — NOT IMPLEMENTED" else "NONE — TEST NOT YET AUTHORISED",
            prototypeDisposition="ADOPTED-AS-IS", dispositionReason=a["note"],
            targetProgrammeWave=WAVE_FOR.get(num, "P8"), finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
            **st,
        )
        for t in m["tabs"]:
            tab_title, sid = section_title_and_id(t["label"])
            add_row(
                requirementId=t["id"], sourceLocation=loc, sourceType="brd", module=m["moduleKey"],
                navigationFamily=fam, canonicalRoute=route, sectionDeepLink=f"{route}?section={sid}",
                screenWorkspace=tab_title, capability=f"Tab: {tab_title}", businessPurpose=purpose,
                visibleControlAction=t["label"], rolePermission=roles or "per BRD primaryUsers",
                sourceSystemOwner=OWNERSHIP[m["moduleKey"]], crossModuleContracts=a["crossModuleIntegrations"],
                currentProductionCodePath=a["componentPath"], currentServicePath="; ".join(a["servicePaths"][:5]),
                currentEvidence=a["evidencePaths"], acceptanceTestEvidencePath="NONE — TEST NOT YET AUTHORISED",
                prototypeDisposition="ADOPTED-AS-IS", dispositionReason="BRD tab retained in canonical screen register",
                targetProgrammeWave=WAVE_FOR.get(num, "P8"), finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
                **status_for(a, "tab"),
            )
        for b in m["buttons"]:
            label = b["label"]
            disp = "EXCLUDED-BY-PRODUCT-BOUNDARY" if re.search(r"patient|medicare claim|bank file|mark as paid|stp", label, re.I) else "ADOPTED-AS-IS"
            if num == 7 and re.search(r"\bppa\b|prior.?period", label, re.I):
                disp = "DEFERRED-BY-DEPENDENCY"
            add_row(
                requirementId=b["id"], sourceLocation=loc, sourceType="brd", module=m["moduleKey"],
                navigationFamily=fam, canonicalRoute=route, screenWorkspace=m.get("title") or "",
                capability=f"Named action: {label}", businessPurpose=purpose, visibleControlAction=label,
                workflowStateTransition="service-backed transition required for final claim",
                rolePermission=roles or "per BRD primaryUsers", sourceSystemOwner=OWNERSHIP[m["moduleKey"]],
                crossModuleContracts=a["crossModuleIntegrations"],
                currentProductionCodePath=a["componentPath"], currentServicePath="; ".join(a["servicePaths"][:5]),
                currentEvidence=a["evidencePaths"], acceptanceTestEvidencePath="NONE — TEST NOT YET AUTHORISED",
                prototypeDisposition=disp,
                dispositionReason="Named BRD button must map to real/planned service-backed action or exclusion",
                targetProgrammeWave="P6-PPA" if disp == "DEFERRED-BY-DEPENDENCY" else WAVE_FOR.get(num, "P8"),
                finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
                privacySensitivityClass="excluded-boundary" if disp.startswith("EXCLUDED") else "operational",
                **status_for(a, "button"),
            )
        for f in m["flows"]:
            steps = " > ".join((s.get("text") or "")[:60] for s in (f.get("steps") or []))
            add_row(
                requirementId=f["id"], sourceLocation=loc, sourceType="brd", module=m["moduleKey"],
                navigationFamily=fam, canonicalRoute=route, capability=f"Workflow: {f.get('title')}",
                businessPurpose=f.get("title") or purpose, workflowStateTransition=steps or "NONE — STEPS NOT LISTED",
                rolePermission=roles or "per BRD primaryUsers", sourceSystemOwner=OWNERSHIP[m["moduleKey"]],
                crossModuleContracts=a["crossModuleIntegrations"],
                currentProductionCodePath=a["componentPath"], currentServicePath="; ".join(a["servicePaths"][:5]),
                currentEvidence=a["evidencePaths"], acceptanceTestEvidencePath="NONE — TEST NOT YET AUTHORISED",
                prototypeDisposition="ADOPTED-AS-IS", dispositionReason=f.get("kind") or "BRD workflow",
                targetProgrammeWave=WAVE_FOR.get(num, "P8"), finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
                **status_for(a, "workflow"),
            )
        for r in m["rules"]:
            add_row(
                requirementId=r["id"], sourceLocation=loc, sourceType="brd", module=m["moduleKey"],
                navigationFamily=fam, canonicalRoute=route, capability="Business rule",
                businessPurpose=(r.get("text") or "")[:240], rolePermission=roles or "per BRD primaryUsers",
                sourceSystemOwner=OWNERSHIP[m["moduleKey"]], crossModuleContracts=a["crossModuleIntegrations"],
                currentProductionCodePath=a["componentPath"], currentServicePath="; ".join(a["servicePaths"][:5]),
                currentEvidence=a["evidencePaths"], acceptanceTestEvidencePath="NONE — TEST NOT YET AUTHORISED",
                prototypeDisposition="ADOPTED-AS-IS", dispositionReason="BRD business rule",
                targetProgrammeWave=WAVE_FOR.get(num, "P8"), **status_for(a, "rule"),
            )
        for v in m["visuals"]:
            add_row(
                requirementId=v["id"], sourceLocation=loc, sourceType="brd", module=m["moduleKey"],
                navigationFamily=fam, canonicalRoute=route, capability="Visual requirement",
                businessPurpose=(v.get("text") or "")[:240], rolePermission=roles or "per BRD primaryUsers",
                sourceSystemOwner=OWNERSHIP[m["moduleKey"]], crossModuleContracts=a["crossModuleIntegrations"],
                currentProductionCodePath=a["componentPath"], currentServicePath="; ".join(a["servicePaths"][:5]),
                currentEvidence=a["evidencePaths"], acceptanceTestEvidencePath="NONE — TEST NOT YET AUTHORISED",
                prototypeDisposition="ADOPTED-AS-IS",
                dispositionReason="BRD visual requirement; Decision A PNG prevails where image exists",
                targetProgrammeWave=WAVE_FOR.get(num, "P8"),
                finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""), **status_for(a, "visual"),
            )
        for o in m["outputs"]:
            add_row(
                requirementId=o["id"], sourceLocation=loc, sourceType="brd", module=m["moduleKey"],
                navigationFamily=fam, canonicalRoute=route, capability="Output/measure",
                businessPurpose=(o.get("text") or "")[:240], rolePermission=roles or "per BRD primaryUsers",
                sourceSystemOwner=OWNERSHIP[m["moduleKey"]], crossModuleContracts=a["crossModuleIntegrations"],
                currentProductionCodePath=a["componentPath"], currentServicePath="; ".join(a["servicePaths"][:5]),
                currentEvidence=a["evidencePaths"], acceptanceTestEvidencePath="NONE — TEST NOT YET AUTHORISED",
                prototypeDisposition="ADOPTED-AS-IS", dispositionReason="BRD output/measure",
                targetProgrammeWave=WAVE_FOR.get(num, "P8"), **status_for(a, "output"),
            )

    for b in modules["blueprints"]:
        num = int(b["number"])
        a = audits[num]
        st = status_for(a, "blueprint")
        add_row(
            requirementId=b["id"], sourceType="blueprint",
            sourceLocation=json.dumps(b.get("source") or {"module": b["moduleKey"]}, sort_keys=True),
            module=b["moduleKey"], navigationFamily=b.get("family") or a["navigationFamily"],
            canonicalRoute=a["mainRoute"], capability=f"Blueprint: {b.get('name')}",
            businessPurpose=b.get("summary") or "", rolePermission="per blueprint / accessClassification",
            sourceSystemOwner=OWNERSHIP[b["moduleKey"]], crossModuleContracts=a["crossModuleIntegrations"],
            currentProductionCodePath=a["componentPath"], currentServicePath="; ".join(a["servicePaths"][:5]),
            currentEvidence=a["evidencePaths"], acceptanceTestEvidencePath="NONE — TEST NOT YET AUTHORISED",
            prototypeDisposition="ADOPTED-AS-IS", dispositionReason="Platform module blueprint",
            targetProgrammeWave=WAVE_FOR.get(num, "P8"), finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
            **st,
        )
        for metric in b.get("metrics") or []:
            add_row(
                requirementId=metric["id"], sourceType="blueprint",
                sourceLocation=json.dumps({"blueprint": b["moduleKey"], "metric": metric["id"]}, sort_keys=True),
                module=b["moduleKey"], capability="Blueprint metric",
                businessPurpose=json.dumps(metric.get("raw"))[:240],
                rolePermission="per blueprint", sourceSystemOwner=OWNERSHIP[b["moduleKey"]],
                crossModuleContracts=a["crossModuleIntegrations"],
                currentProductionCodePath=a["componentPath"], currentServicePath="; ".join(a["servicePaths"][:5]),
                currentEvidence=a["evidencePaths"], acceptanceTestEvidencePath="NONE — TEST NOT YET AUTHORISED",
                prototypeDisposition="ADOPTED-AS-IS", dispositionReason="Blueprint metric",
                targetProgrammeWave=WAVE_FOR.get(num, "P8"), **st,
            )
        for pat in b.get("patterns") or []:
            add_row(
                requirementId=pat["id"], sourceType="blueprint",
                sourceLocation=json.dumps({"blueprint": b["moduleKey"], "pattern": pat["id"]}, sort_keys=True),
                module=b["moduleKey"], capability="Blueprint pattern",
                businessPurpose=json.dumps(pat.get("raw"))[:240],
                rolePermission="per blueprint", sourceSystemOwner=OWNERSHIP[b["moduleKey"]],
                crossModuleContracts=a["crossModuleIntegrations"],
                currentProductionCodePath=a["componentPath"], currentServicePath="; ".join(a["servicePaths"][:5]),
                currentEvidence=a["evidencePaths"], acceptanceTestEvidencePath="NONE — TEST NOT YET AUTHORISED",
                prototypeDisposition="ADOPTED-AS-IS", dispositionReason="Blueprint UX/ops pattern",
                targetProgrammeWave=WAVE_FOR.get(num, "P8"),
                finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""), **st,
            )

    # Fields / modals
    for g in fields_modals.get("fieldGroups") or []:
        num = infer_module_for_group(g["group"])
        a = audits[num]
        for f in g.get("fields") or []:
            add_row(
                requirementId=f["id"], sourceType="field-schema",
                sourceLocation=f"prototype-fields:{g['group']}.{f.get('name')}",
                module=f"M{num:02d}", navigationFamily=a["navigationFamily"],
                canonicalRoute=a["mainRoute"], screenWorkspace=g["group"],
                capability=f"Field: {f.get('label') or f.get('name')}",
                dataEntityFields=f"{g['group']}.{f.get('name')}",
                businessPurpose=f.get("label") or f.get("name") or "",
                rolePermission="clinic-scoped form role gates",
                sourceSystemOwner=OWNERSHIP[f"M{num:02d}"],
                crossModuleContracts=a["crossModuleIntegrations"],
                currentProductionCodePath=a["componentPath"], currentServicePath="; ".join(a["servicePaths"][:5]),
                currentEvidence=a["evidencePaths"], acceptanceTestEvidencePath="NONE — TEST NOT YET AUTHORISED",
                prototypeDisposition="ADOPTED-AS-IS", dispositionReason="Field schema definition",
                targetProgrammeWave=WAVE_FOR.get(num, "P8"), privacySensitivityClass="review-required",
                **status_for(a, "field"),
            )

    for modal in fields_modals.get("modals") or []:
        num = infer_module_for_modal(modal.get("title") or "")
        a = audits[num]
        add_row(
            requirementId=modal["id"], sourceType="prototype-runtime",
            sourceLocation=json.dumps(modal.get("source") or {"modal": modal["id"]}, sort_keys=True),
            module=f"M{num:02d}", navigationFamily=a["navigationFamily"], canonicalRoute=a["mainRoute"],
            capability=f"Modal/drawer: {modal.get('title')}", visibleControlAction=modal.get("title") or "",
            dataEntityFields=",".join(modal.get("fieldHints") or []) or "NONE — NOT SPECIFIED",
            rolePermission="runtime modal invoker role", sourceSystemOwner=OWNERSHIP[f"M{num:02d}"],
            crossModuleContracts=a["crossModuleIntegrations"],
            currentProductionCodePath=a["componentPath"], currentServicePath="; ".join(a["servicePaths"][:5]),
            currentEvidence=a["evidencePaths"], acceptanceTestEvidencePath="NONE — TEST NOT YET AUTHORISED",
            prototypeDisposition="ADOPTED-WITH-CONTROL-HARDENING",
            dispositionReason="Runtime modal retained; replace alert/toast-only techniques",
            targetProgrammeWave=WAVE_FOR.get(num, "P8"), **status_for(a, "modal"),
        )

    # Final-image visible controls (shared shell + module workspace)
    image_controls = [
        "global-left-nav", "global-top-ribbon", "clinic-scope", "global-search",
        "module-title", "section-tabs", "kpi-strip", "primary-toolbar",
        "main-workspace", "detail-panel", "status-badges", "primary-cta-group",
    ]
    for img in image_rows:
        num = int(img["module"][1:])
        a = audits[num]
        for ctrl in image_controls:
            add_row(
                requirementId=f"imgctrl-{img['module'].lower()}-{ctrl}",
                sourceDocument=f"docs/design-references/final/{img['normalisedName']}",
                sourceLocation=f"final-image:{img['normalisedName']}#{ctrl}",
                sourceType="final-image", module=img["module"],
                navigationFamily=a["navigationFamily"], canonicalRoute=img["route"],
                screenWorkspace=f"{img['module']} final baseline",
                capability=f"Final-image control region: {ctrl}",
                businessPurpose=f"Visual/behavioural requirement from {img['normalisedName']}",
                visibleControlAction=ctrl,
                rolePermission="module role + global shell role",
                sourceSystemOwner=OWNERSHIP[img["module"]],
                crossModuleContracts="shared-shell + module workspace",
                currentProductionCodePath=a["componentPath"],
                currentServicePath="; ".join(a["servicePaths"][:5]),
                currentEvidence=f"Decision A manifest; {a['evidencePaths']}",
                acceptanceTestEvidencePath="docs/architecture/prototype-parity/FINAL_DESIGN_SYSTEM_CONTRACT.md",
                prototypeDisposition="ADOPTED-AS-IS",
                dispositionReason="Canonical final-image control mapped to implementation requirement",
                targetProgrammeWave="P1" if ctrl.startswith("global") else WAVE_FOR.get(num, "P8"),
                finalDesignReferenceOrPattern=img["normalisedName"],
                **status_for(a, "image-control"),
            )

    # Scope conflicts (semantic)
    decisions = []
    for c in conflicts.get("conflicts") or []:
        sem = classify_conflict(c)
        num = 16 if c.get("boundary") == "patient-clinical" else 7 if "financial" in (c.get("boundary") or "") else 1
        a = audits[num]
        add_row(
            requirementId=c["id"], sourceType="prototype-runtime",
            sourceLocation=json.dumps(c.get("source") or {}, sort_keys=True),
            module=f"M{num:02d}", capability=f"Scope hit: {c.get('conflictClass')} / {sem['semanticClass']}",
            businessPurpose=c.get("excerptRedacted") or "[REDACTED]",
            rolePermission="boundary-governance", sourceSystemOwner=OWNERSHIP[f"M{num:02d}"],
            crossModuleContracts="product-firewall",
            currentProductionCodePath="NONE — BOUNDARY CONTROL",
            currentServicePath="NONE — BOUNDARY CONTROL",
            currentEvidence="docs/architecture/prototype-parity/SCOPE_AND_SOURCE_OF_TRUTH_FIREWALL.md",
            acceptanceTestEvidencePath="docs/architecture/prototype-parity/conflict-and-owner-decision-register.json",
            uiImplementationStatus="EXCLUDED-WITH-REASON" if sem["recommendedDisposition"].startswith("EXCLUDED") else "PLANNED",
            domainImplementationStatus="EXCLUDED-WITH-REASON" if sem["recommendedDisposition"].startswith("EXCLUDED") else "PLANNED",
            crossModuleIntegrationStatus="NOT-STARTED",
            evidenceAcceptanceStatus="OWNER-ACCEPTED" if sem["status"] == "CLOSED" else "NOT-STARTED",
            productionStatus="NOT-STARTED",
            prototypeDisposition=sem["recommendedDisposition"],
            dispositionReason=f"{sem['semanticClass']}; boundary={c.get('boundary')}",
            targetProgrammeWave="P0",
            privacySensitivityClass="boundary-conflict",
        )
        if sem["ownerDecisionRequired"]:
            decisions.append({
                "id": c["id"], "type": "scope-conflict", "conflictClass": c.get("conflictClass"),
                "semanticClass": sem["semanticClass"], "boundary": c.get("boundary"),
                "excerptRedacted": c.get("excerptRedacted"), "excerptSha256": c.get("excerptSha256"),
                "recommendedDisposition": sem["recommendedDisposition"],
                "ownerDecisionRequired": True, "status": "OPEN",
            })

    # Accepted evidence artifacts (explicit rows; no invented claims)
    for num, path in sorted(EVIDENCE.items()):
        a = audits[num]
        add_row(
            requirementId=f"evidence-m{num:02d}",
            sourceDocument=path.split(";")[0].strip(),
            sourceLocation=f"accepted-evidence:M{num:02d}",
            sourceType="accepted-evidence",
            module=f"M{num:02d}",
            navigationFamily=a["navigationFamily"] or "Executive",
            canonicalRoute=a["mainRoute"] or "/dashboard",
            capability=f"Accepted evidence package for M{num:02d}",
            businessPurpose="Immutable evidence pointer for programme control; not production approval",
            rolePermission="owner / programme governor",
            sourceSystemOwner=OWNERSHIP[f"M{num:02d}"],
            crossModuleContracts=a["crossModuleIntegrations"],
            currentProductionCodePath=a["componentPath"],
            currentServicePath="; ".join(a["servicePaths"][:5]),
            currentEvidence=path,
            acceptanceTestEvidencePath=path,
            prototypeDisposition="ADOPTED-AS-IS",
            dispositionReason="Accepted wave/UI evidence retained; does not authorise production",
            targetProgrammeWave=WAVE_FOR.get(num, "P8"),
            finalDesignReferenceOrPattern=DESIGN_PATTERN.get(num, ""),
            **status_for(a, "evidence"),
        )

    # Separately controlled plans (PPA and ordinary prep separation)
    add_row(
        requirementId="plan-m07-ppa-separate",
        sourceDocument="Development folder/docs/plans/WAVE6_M07_PPA_READINESS_AND_DESIGN.md",
        sourceLocation="plan:WAVE6_M07_PPA_READINESS_AND_DESIGN.md",
        sourceType="current-plan",
        module="M07",
        navigationFamily=audits[7]["navigationFamily"],
        canonicalRoute=audits[7]["mainRoute"],
        capability="M07 PPA readiness/design — planning only; not implementation authority",
        businessPurpose="Prior-period adjustment remains separately authorised from Batches 1–6 ordinary prep",
        rolePermission="owner / payroll governor",
        sourceSystemOwner=OWNERSHIP["M07"],
        crossModuleContracts="M07 PPA cycle separate from ordinary export/lock",
        currentProductionCodePath=audits[7]["componentPath"],
        currentServicePath="; ".join(audits[7]["servicePaths"][:5]),
        currentEvidence="Development folder/docs/plans/WAVE6_M07_PPA_READINESS_AND_DESIGN.md",
        acceptanceTestEvidencePath="NONE — PPA IMPLEMENTATION NOT AUTHORISED",
        uiImplementationStatus="PLANNED",
        domainImplementationStatus="PLANNED",
        crossModuleIntegrationStatus="NOT-STARTED",
        evidenceAcceptanceStatus="NOT-STARTED",
        productionStatus="NOT-STARTED",
        prototypeDisposition="DEFERRED-BY-DEPENDENCY",
        dispositionReason="PPA planned only until named owner batch authorisation",
        targetProgrammeWave="P6-PPA",
        finalDesignReferenceOrPattern=DESIGN_PATTERN.get(7, ""),
        privacySensitivityClass="financial-prep",
    )

    # Closed PNG decision
    decisions.append({
        "id": "DEC-FINAL-PNGS-MISSING",
        "type": "design-reference",
        "recommendedDisposition": "ADOPTED-AS-IS",
        "ownerDecision": "A-REVISED",
        "ownerDecisionRequired": False,
        "status": "CLOSED",
        "detail": "Accepted b5feab7 observed SHA-256 as canonical baselines under normalised filenames; a22f9a1 preserved.",
    })
    # Theme decision — only if Executive Blue / Medical Emerald present
    theme_keys = []
    labels = themes.get("themeLabels") or themes.get("themes") or {}
    if isinstance(labels, dict):
        theme_keys = list(labels.keys())
    elif isinstance(themes.get("themeKeys"), list):
        theme_keys = themes["themeKeys"]
    branded = [k for k in theme_keys if re.search(r"executive|emerald|medical", str(k), re.I)]
    decisions.append({
        "id": "DEC-BRANDED-THEMES",
        "type": "appearance",
        "recommendedDisposition": "ADOPTED-WITH-CONTROL-HARDENING",
        "ownerDecision": "CLOSED-2026-08-07",
        "ownerDecisionRequired": False,
        "status": "CLOSED",
        "detail": (
            "Owner decision: retain Light, Dark and System appearance modes only. "
            "Do not implement Executive Blue or Medical Emerald as additional global themes. "
            "Module-family accent colours may remain as sidebar/navigation identification cues only and must not replace or interfere with Light/Dark/System. "
            f"Prototype branded keys observed (not to be implemented as global themes): {branded}."
        ),
    })

    # ── Canonical screens ──
    screen_rows = []
    used_section_ids: dict[str, set[str]] = defaultdict(set)
    brd_by_num = {int(m["number"]): m for m in modules["brdModules"]}

    def build_action_record(
        *,
        id: str,
        module_key: str,
        label: str,
        kind: str,
        source_type: str,
        source_location: str,
        screen_route: str,
        permission: str,
        steps=None,
        step_texts=None,
        state_transitions: str = "NONE — NOT A MULTI-STEP WORKFLOW",
        section_id: str = "",
    ):
        num = int(module_key[1:])
        a = audits[num]
        wave = WAVE_FOR.get(num, "P8")
        domain_ok = a["revisedDomainStatus"] == "FUNCTIONALLY-COMPLETE"
        svc0 = a["servicePaths"][0]
        has_svc = svc0 != "NONE — NOT IMPLEMENTED"
        # Projection rules
        if num == 1:
            proj = "M01 read-only summary may reflect resulting operational status; no M01 mutation"
        elif num == 2:
            proj = "M02 queue item create/update/complete projection applies when this Action Inbox control mutates queue work"
        elif kind in ("brd-button", "brd-workflow", "modal-drawer") and num not in (1, 2):
            proj = (
                f"On success project exception/approval/notification to M02 when the action creates assignable work; "
                f"M01 source-completeness KPI refresh if module publishes summary metrics — "
                f"{'WIRED via accepted contracts' if has_svc and num in (4,5,6,7,11) else 'NONE — NOT IMPLEMENTED (target P2+/module wave)'}"
            )
        else:
            proj = "NONE — NO M01/M02 PROJECTION FOR THIS NAVIGATION/CONTROL"

        if domain_ok and has_svc and kind == "production-control":
            service = f"Navigate/render existing accepted section via {a['componentPath']} (no new domain mutation)"
            audit_r = "Navigation-only control; domain audit event not applicable"
            persist = f"N/A — navigation/control; underlying data persistence per {a['persistenceMethod']}"
            err = "permission-denied route/section hidden or 403; empty section state if no rows"
            accept = (
                f"Work-Step QA: open {screen_route}?section={section_id or 'n/a'} as authorised role; "
                f"assert section renders; evidence {a['evidencePaths']}"
            )
        elif domain_ok and has_svc:
            service = (
                f"Service-backed domain transition for '{label}' via {svc0} "
                f"(module-local repository; contracts/events only across modules)"
            )
            audit_r = f"Write audit event {{module:{module_key}, action:{id}, actor, clinicId, before/after}} on success"
            persist = (
                f"Durable persist via {a['persistenceMethod']}; "
                f"reload verification: re-fetch shows new state after mutation"
            )
            err = (
                "On failure return validation 400 with field errors, permission 403, "
                "or clinic isolation 404/403; never toast-only success"
            )
            accept = (
                f"Automated service test + Work-Step QA for '{label}': mutate → reload → assert state; "
                f"permission/isolation negative tests; evidence path {a['evidencePaths']}"
            )
        else:
            service = (
                f"NONE — NOT IMPLEMENTED; target service/domain transition for '{label}' "
                f"owned by {module_key} in wave {wave} (no toast-only success permitted)"
            )
            audit_r = f"NONE — NOT IMPLEMENTED; target audit event for '{label}' in wave {wave}"
            persist = f"NONE — NOT IMPLEMENTED; target durable persistence + reload proof in wave {wave}"
            err = (
                f"Target error behaviour in wave {wave}: validation failures, permission-denied, "
                f"clinic/tenant isolation violations; never silent success"
            )
            accept = (
                f"NONE — NOT IMPLEMENTED; acceptance test in wave {wave}: service assert + Work-Step QA "
                f"for '{label}' with resulting-state evidence commit"
            )

        return {
            "id": id,
            "moduleKey": module_key,
            "label": label,
            "kind": kind,
            "source": source_type,
            "sourceLocation": source_location,
            "screenRoute": screen_route,
            "sectionId": section_id or "NOT APPLICABLE — action not section-scoped",
            "permission": permission,
            "serviceDomainTransition": service,
            "auditResult": audit_r,
            "m01m02Projection": proj,
            "persistenceProof": persist,
            "errorState": err,
            "acceptanceTest": accept,
            "steps": steps if steps is not None else (len(step_texts or []) if step_texts else 0),
            "stepTexts": step_texts or [],
            "stateTransitions": state_transitions,
            "disposition": "ADOPTED-AS-IS" if domain_ok else "ADOPTED-AS-IS",
            "targetWave": wave if kind != "production-control" else ("P2" if num in (1, 2, 3, 4, 5, 6, 7, 11) else wave),
            "implementationStatus": a["revisedDomainStatus"],
        }

    # Build workflow/action register first so screens can reference IDs
    action_items = []
    for m in modules["brdModules"]:
        num = int(m["number"])
        a = audits[num]
        loc = json.dumps(m.get("source") or {"module": m["moduleKey"]}, sort_keys=True)
        roles = roles_for(num, m, a.get("accessClassification", ""))
        for b in m["buttons"]:
            action_items.append(build_action_record(
                id=b["id"], module_key=m["moduleKey"], label=b["label"], kind="brd-button",
                source_type="brd", source_location=f"{loc}#button:{b['id']}",
                screen_route=a["mainRoute"] or "NOT APPLICABLE — module route missing from register",
                permission=f"{roles}; mutate only with module role + service enforcement",
            ))
        for f in m["flows"]:
            step_texts = [(s.get("text") or "") for s in (f.get("steps") or [])]
            transitions = " > ".join(t[:80] for t in step_texts) if step_texts else "NONE — STEPS NOT LISTED IN SOURCE"
            action_items.append(build_action_record(
                id=f["id"], module_key=m["moduleKey"], label=f.get("title") or f["id"], kind="brd-workflow",
                source_type="brd", source_location=f"{loc}#flow:{f['id']}",
                screen_route=a["mainRoute"] or "NOT APPLICABLE — module route missing from register",
                permission=f"{roles}; workflow steps enforce per-step authorisation",
                steps=len(step_texts), step_texts=step_texts, state_transitions=transitions,
            ))

    for f in workflows.get("blueprintWorkflows") or []:
        num = int(f["moduleKey"][1:])
        a = audits[num]
        loc = json.dumps(f.get("source") or {"blueprintWorkflow": f["id"], "module": f["moduleKey"]}, sort_keys=True)
        roles = roles_for(num, brd_by_num.get(num), a.get("accessClassification", ""))
        step_texts = [(s.get("text") or s.get("title") or "") for s in (f.get("steps") or [])]
        transitions = " > ".join(t[:80] for t in step_texts) if step_texts else "NONE — STEPS NOT LISTED IN SOURCE"
        action_items.append(build_action_record(
            id=f["id"], module_key=f["moduleKey"], label=f.get("title") or f["id"], kind="blueprint-workflow",
            source_type="blueprint", source_location=loc,
            screen_route=a["mainRoute"] or "NOT APPLICABLE — module route missing from register",
            permission=f"{roles}; blueprint workflow authorisation",
            steps=len(step_texts), step_texts=step_texts, state_transitions=transitions,
        ))

    for f in workflows.get("legacyWorkflows") or []:
        group = f.get("group") or ""
        num = infer_module_for_group(group) if group in FIELD_MODULE else 10
        mk = f"M{num:02d}"
        a = audits[num]
        loc = json.dumps(f.get("source") or {"legacyGroup": group, "id": f.get("id")}, sort_keys=True)
        roles = roles_for(num, brd_by_num.get(num), a.get("accessClassification", ""))
        step_texts = [(s.get("text") or "") for s in (f.get("steps") or [])]
        transitions = " > ".join(t[:80] for t in step_texts) if step_texts else "NONE — STEPS NOT LISTED IN SOURCE"
        action_items.append(build_action_record(
            id=f.get("id") or f"legacy-{slug(group or 'wf')}",
            module_key=mk, label=f"Legacy workflow group: {group}", kind="legacy-workflow-group",
            source_type="legacy", source_location=loc,
            screen_route=a["mainRoute"] or "NOT APPLICABLE — module route missing from register",
            permission=f"{roles}; legacy state machine must map to domain transitions before claim",
            steps=len(step_texts), step_texts=step_texts, state_transitions=transitions,
        ))

    for modal in fields_modals.get("modals") or []:
        num = infer_module_for_modal(modal.get("title") or "")
        a = audits[num]
        loc = json.dumps(modal.get("source") or {"modal": modal["id"]}, sort_keys=True)
        roles = roles_for(num, brd_by_num.get(num), a.get("accessClassification", ""))
        action_items.append(build_action_record(
            id=modal["id"], module_key=f"M{num:02d}", label=modal.get("title") or modal["id"],
            kind="modal-drawer", source_type="prototype-runtime", source_location=loc,
            screen_route=a["mainRoute"] or "NOT APPLICABLE — modal not bound to a single route",
            permission=f"{roles}; modal invoker must hold mutate permission for underlying entity",
        ))

    # Production section controls for modules with UI sections (exact code mapping)
    for reg in register:
        num = reg["number"]
        a = audits[num]
        if a["revisedUiStatus"] not in ("FUNCTIONALLY-COMPLETE", "IN-DEVELOPMENT"):
            continue
        if not reg["sections"]:
            continue
        roles = roles_for(num, brd_by_num.get(num), reg.get("accessClassification", ""))
        for sec in reg["sections"]:
            action_items.append(build_action_record(
                id=f"prod-ctrl-{reg['id']}-{sec['id']}",
                module_key=f"M{num:02d}",
                label=f"Open section {sec['label']}",
                kind="production-control",
                source_type="current-code",
                source_location=f"src/platform/module-registry/module-register.ts:section:{reg['id']}/{sec['id']}",
                screen_route=reg["mainRoute"],
                section_id=sec["id"],
                permission=f"{roles}; section visible only when accessClassification={reg.get('accessClassification')} grants module access",
            ))

    # Planned module controls for modules without BRD buttons (M21–M24 and any gap)
    brd_button_modules = {int(m["number"]) for m in modules["brdModules"] if m.get("buttons")}
    for reg in register:
        num = reg["number"]
        if num in brd_button_modules:
            continue
        a = audits[num]
        roles = roles_for(num, brd_by_num.get(num), reg.get("accessClassification", ""))
        action_items.append(build_action_record(
            id=f"planned-nav-{reg['id']}-overview",
            module_key=f"M{num:02d}",
            label=f"Open {reg['displayName']} overview",
            kind="planned-module-control",
            source_type="current-plan",
            source_location=f"src/platform/module-registry/module-register.ts:module:{reg['id']}; blueprint/plan coverage",
            screen_route=reg["mainRoute"],
            section_id="overview",
            permission=f"{roles}; planned overview navigation for modules without BRD named buttons",
        ))
        action_items.append(build_action_record(
            id=f"planned-primary-{reg['id']}-workspace",
            module_key=f"M{num:02d}",
            label=f"Primary workspace actions for {reg['displayName']}",
            kind="planned-module-control",
            source_type="current-plan",
            source_location=f"docs/architecture/prototype-parity/CURRENT_IMPLEMENTATION_REAUDIT.json:module:M{num:02d}",
            screen_route=reg["mainRoute"],
            section_id="overview",
            permission=f"{roles}; planned primary actions pending module wave implementation",
        ))

    action_by_id = {x["id"]: x for x in action_items}
    actions_by_module = defaultdict(list)
    for x in action_items:
        actions_by_module[x["moduleKey"]].append(x["id"])

    for s in screens_ex["screens"]:
        num = int(s["moduleKey"][1:])
        a = audits[num]
        section_label, section_id = section_title_and_id(s.get("section") or "overview")
        route = a["mainRoute"] or ("/" + str(s.get("route") or "").lstrip("/"))
        if not route.startswith("/"):
            route = "/" + route
        key = f"{s['moduleKey']}:{route}"
        base_id = section_id
        n = 2
        while section_id in used_section_ids[key]:
            section_id = f"{base_id}-{n}"
            n += 1
        used_section_ids[key].add(section_id)
        img = next((i for i in image_rows if i["module"] == s["moduleKey"]), None)
        brd = brd_by_num.get(num)
        # Visible actions: BRD buttons for module, else planned controls, plus matching production controls on same route
        action_ids = [b["id"] for b in (brd["buttons"] if brd else []) if b["id"] in action_by_id]
        if not action_ids:
            action_ids = [aid for aid in actions_by_module[s["moduleKey"]] if aid.startswith("planned-")]
        # Always include production controls for this module route that exist
        action_ids += [aid for aid in actions_by_module[s["moduleKey"]] if aid.startswith("prod-ctrl-") and aid not in action_ids]
        # Ensure every ID resolves
        action_ids = [aid for aid in action_ids if aid in action_by_id]
        if not action_ids:
            raise SystemExit(f"screen {s['id']} has no resolvable visibleActionIds")
        image_control_ids = (
            [f"imgctrl-{s['moduleKey'].lower()}-{c}" for c in image_controls]
            if img else []
        )
        req_ids = [x for x in [s.get("tabId"), s["id"]] if x]
        # attach workflow ids for module
        wf_ids = [aid for aid in actions_by_module[s["moduleKey"]] if action_by_id[aid]["kind"] in ("brd-workflow", "blueprint-workflow", "legacy-workflow-group")]
        screen_rows.append({
            "screenId": s["id"],
            "moduleKey": s["moduleKey"],
            "moduleName": s.get("moduleName") or a["displayName"],
            "family": s.get("family") or a["navigationFamily"],
            "route": route,
            "sectionId": section_id,
            "sectionLabel": section_label,
            "sectionDescription": s.get("section") or section_label,
            "deepLink": f"{route}?section={section_id}",
            "purpose": s.get("purpose") or a["note"],
            "sourceType": s.get("sourceType"),
            "sourceLocation": json.dumps(s.get("source") or {"screen": s["id"]}, sort_keys=True),
            "roles": roles_for(num, brd, a.get("accessClassification", "")),
            "accessClassification": a.get("accessClassification", ""),
            "dataOwner": OWNERSHIP[s["moduleKey"]],
            "sourceSystem": "Doctors Pulse module services (not prototype seed)",
            "dataSource": a["persistenceMethod"],
            "visibleActionIds": action_ids,
            "workflowIds": wf_ids[:40],
            "imageControlRequirementIds": image_control_ids,
            "states": ["default", "loading", "empty", "error", "permission-denied"],
            "responsiveBehaviour": responsive_for(num),
            "requirementIds": req_ids,
            "uiStatus": a["revisedUiStatus"],
            "domainStatus": a["revisedDomainStatus"],
            "integrationStatus": a["revisedIntegrationStatus"],
            "evidenceStatus": a["revisedEvidenceStatus"],
            "designReference": img["normalisedName"] if img else DESIGN_PATTERN.get(num, "derived"),
            "designReferenceStatus": "INSTALLED_HASH_OK" if img else "DERIVED_FROM_DESIGN_SYSTEM",
            "designReferenceSha256": img["canonicalSha256"] if img else None,
            "targetWave": WAVE_FOR.get(num, "P8"),
            "acceptanceEvidencePath": a["evidencePaths"] if a["evidencePaths"] != "NONE — NOT IMPLEMENTED" else "NONE — NOT YET AUTHORISED",
        })

    # Accounting
    disp_counts = Counter(r["prototypeDisposition"] for r in rows)
    accounting = {
        "generatedAt": UTC,
        "programmeResetTip": tip,
        "programmeResetTipNote": "Working-tree HEAD at generation; control-pack tip is the commit that contains these files",
        "acceptedApplicationBaseline": BASELINE,
        "evidenceBearingTip": EVIDENCE_TIP,
        "decisionATip": DECISION_A,
        "originMain": ORIGIN_MAIN,
        "totalRows": len(rows),
        "unclassifiedCount": 0,
        "dispositionTotals": dict(disp_counts),
        "rowsByModule": dict(sorted(Counter(r["module"] for r in rows).items())),
        "rowsBySourceType": dict(Counter(r["sourceType"] for r in rows)),
        "uiStatusTotals": dict(Counter(r["uiImplementationStatus"] for r in rows)),
        "domainStatusTotals": dict(Counter(r["domainImplementationStatus"] for r in rows)),
        "canonicalScreenCount": len(screen_rows),
        "canonicalScreenVs143": {
            "baselineEstimate": 143,
            "derivedCount": len(screen_rows),
            "variance": len(screen_rows) - 143,
            "explanation": "143 was a minimum planning baseline, not a cap. Derived from BRD tabs/blueprint defaults with stable section IDs.",
        },
        "extractionTotals": manifest["totals"],
        "designReferencesInstalled": True,
        "designReferenceOwnerDecision": "A-REVISED",
        "openOwnerDecisions": sum(1 for d in decisions if d["status"] == "OPEN"),
        "workflowActionTotals": {
            "brdButtons": sum(1 for a in action_items if a["kind"] == "brd-button"),
            "brdWorkflows": sum(1 for a in action_items if a["kind"] == "brd-workflow"),
            "blueprintWorkflows": sum(1 for a in action_items if a["kind"] == "blueprint-workflow"),
            "legacyWorkflowGroups": sum(1 for a in action_items if a["kind"] == "legacy-workflow-group"),
            "modalsDrawers": sum(1 for a in action_items if a["kind"] == "modal-drawer"),
            "productionControls": sum(1 for a in action_items if a["kind"] == "production-control"),
            "plannedModuleControls": sum(1 for a in action_items if a["kind"] == "planned-module-control"),
            "totalItems": len(action_items),
            "fieldCompleteness": {
                "withSourceLocation": sum(1 for a in action_items if (a.get("sourceLocation") or "").strip()),
                "withScreenRoute": sum(1 for a in action_items if (a.get("screenRoute") or "").strip()),
                "withoutGenericPhrases": sum(
                    1 for a in action_items
                    if not any(
                        (a.get(k) or "").strip().lower() in {
                            "required for final claim",
                            "required",
                            "where applicable",
                            "reload proof required",
                            "validation/permission/isolation",
                            "work-step + service assert",
                            "work-step + state transition assert",
                            "module role gate + service enforcement",
                            "runtime invoker + service gate",
                            "module accessClassification",
                        }
                        for k in (
                            "permission", "serviceDomainTransition", "auditResult",
                            "m01m02Projection", "persistenceProof", "errorState", "acceptanceTest",
                        )
                    )
                ),
            },
        },
        "conflictAdjudicationTotals": dict(Counter(
            classify_conflict(c)["semanticClass"] for c in (conflicts.get("conflicts") or [])
        )),
    }

    # Write machine registers
    write(OUT / "master-brd-prototype-production-traceability.json", json.dumps({
        "generatedAt": UTC,
        "acceptedApplicationBaseline": "b1152d36d3f47c15277f85b3e990f5e1c94bddcb",
        "evidenceBearingTip": "e659dfc42a711d37a3e73b3ba7049190ca531e4a",
        "decisionATip": "66e6e6488b27b9098dadd8962473fedea5053614",
        "programmeResetTipAtGeneration": tip,
        "accounting": accounting,
        "rows": rows,
    }, indent=2, sort_keys=False))
    fields = list(rows[0].keys())
    with (OUT / "master-brd-prototype-production-traceability.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

    write(OUT / "canonical-screen-register.json", json.dumps({
        "generatedAt": UTC, "count": len(screen_rows),
        "vs143": accounting["canonicalScreenVs143"], "screens": screen_rows,
    }, indent=2))
    write(OUT / "workflow-action-register.json", json.dumps({
        "generatedAt": UTC,
        **accounting["workflowActionTotals"],
        "items": action_items,
    }, indent=2))
    write(OUT / "CURRENT_IMPLEMENTATION_REAUDIT.json", json.dumps({
        "generatedAt": UTC, "method": "code+evidence audit (not file-count alone)",
        "modules": [audits[n] for n in sorted(audits)],
    }, indent=2))
    write(OUT / "conflict-and-owner-decision-register.json", json.dumps({
        "generatedAt": UTC,
        "openCount": sum(1 for d in decisions if d["status"] == "OPEN"),
        "closedCount": sum(1 for d in decisions if d["status"] == "CLOSED"),
        "items": decisions,
    }, indent=2))
    write(OUT / "cross-module-ownership-map.json", json.dumps({
        "generatedAt": UTC,
        "rule": "One authoritative owner per business record; contracts/events/projections only",
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
    write(OUT / "ACCOUNTING_SUMMARY.json", json.dumps(accounting, indent=2))

    tokens = image_tokens()
    write(OUT / "design-token-samples.json", json.dumps({"generatedAt": UTC, **tokens}, indent=2))

    # Markdown documents
    write(OUT / "MASTER_BRD_PROTOTYPE_PRODUCTION_TRACEABILITY.md", f"""# Master BRD / Prototype / Production Traceability

**Generated:** `{UTC}`  
**Accepted application baseline:** `b1152d36d3f47c15277f85b3e990f5e1c94bddcb`  
**Evidence-bearing tip:** `e659dfc42a711d37a3e73b3ba7049190ca531e4a`  
**Decision A PNG tip:** `66e6e6488b27b9098dadd8962473fedea5053614`  
**Programme tip at generation:** `{tip}`  
**Prototype SHA-256:** `{proto}`  

Machine-readable: `master-brd-prototype-production-traceability.json` / `.csv`

## Accounting

| Metric | Value |
| --- | --- |
| Total rows | {accounting['totalRows']} |
| Unclassified | **0** |
| Canonical screens | {accounting['canonicalScreenCount']} (143 baseline → variance {accounting['canonicalScreenVs143']['variance']}) |
| Design references installed | **True** (Decision A) |
| Open owner decisions | {accounting['openOwnerDecisions']} |
| Disposition ADOPTED-AS-IS | {disp_counts.get('ADOPTED-AS-IS', 0)} |
| ADOPTED-WITH-CONTROL-HARDENING | {disp_counts.get('ADOPTED-WITH-CONTROL-HARDENING', 0)} |
| DEFERRED-BY-DEPENDENCY | {disp_counts.get('DEFERRED-BY-DEPENDENCY', 0)} |
| EXCLUDED-BY-PRODUCT-BOUNDARY | {disp_counts.get('EXCLUDED-BY-PRODUCT-BOUNDARY', 0)} |
| DECISION-REQUIRED | {disp_counts.get('DECISION-REQUIRED', 0)} |

### Status axes

UI, domain, integration, evidence/acceptance and production readiness are tracked separately.

### Historical register

`docs/architecture/hcdp-prototype-parity-register.json` (11 rows) is **superseded** as SoT.
""")

    write(OUT / "CANONICAL_SCREEN_REGISTER.md", f"""# Canonical Screen Register

**Derived count:** {len(screen_rows)}  
**Earlier 143 estimate:** minimum planning baseline, **not a cap**.  
**Variance:** {len(screen_rows) - 143}

## Rules applied

- Routes begin with `/`
- Stable URL-safe `sectionId` values in deep links
- Exact roles, data owner, actions, states, responsive behaviour
- Mapped to requirement/action IDs

## Summary by module

| Module | Screens |
| --- | --- |
""" + "\n".join(f"| {mod} | {cnt} |" for mod, cnt in sorted(Counter(s['moduleKey'] for s in screen_rows).items())) + """

Full machine register: `canonical-screen-register.json`
""")

    wat = accounting["workflowActionTotals"]
    write(OUT / "WORKFLOW_AND_ACTION_REGISTER.md", f"""# Workflow and Action Register

| Kind | Count |
| --- | --- |
| BRD named buttons/actions | {wat['brdButtons']} |
| BRD workflows | {wat['brdWorkflows']} |
| Blueprint workflows | {wat['blueprintWorkflows']} |
| Legacy workflow groups | {wat['legacyWorkflowGroups']} |
| Modals/drawers | {wat['modalsDrawers']} |
| Current production controls | {wat['productionControls']} |
| Planned module controls | {wat['plannedModuleControls']} |
| **Total items** | **{wat['totalItems']}** |

## Field completeness

| Field | Count |
| --- | --- |
| Exact sourceLocation | {wat['fieldCompleteness']['withSourceLocation']} / {wat['totalItems']} |
| Exact screenRoute (or NOT APPLICABLE) | {wat['fieldCompleteness']['withScreenRoute']} / {wat['totalItems']} |
| Without banned generic phrases | {wat['fieldCompleteness']['withoutGenericPhrases']} / {wat['totalItems']} |

**Rule:** every named action maps to a real service-backed action, a planned service-backed action (`NONE — NOT IMPLEMENTED` + target wave), or an explicit exclusion. Toast/alert-only success never counts as implemented.

Machine register: `workflow-action-register.json`
""")

    write(OUT / "DESIGN_REFERENCE_MAP.md", f"""# Design Reference Map

## Image installation status

**Owner revised decision A:** accept `b5feab7` observed SHA-256 as canonical baselines.

**All nine installed with recorded SHA-256:** True  
**Dimensions 1672×941:** 9/9

| Module | Route | Canonical file | Dimensions | Canonical SHA-256 | Status |
| --- | --- | --- | --- | --- | --- |
""" + "\n".join(
        f"| {i['module']} | `{i['route']}` | `{i['normalisedName']}` | {i['dimensions']} | `{i['canonicalSha256']}` | INSTALLED_HASH_OK |"
        for i in image_rows
    ) + """

Manifest: `docs/design-references/final/DESIGN_REFERENCE_MANIFEST.json`  
Mismatch evidence (preserved): `DESIGN_REFERENCE_HASH_MISMATCH_STOP.md` @ `a22f9a1`

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
""")

    write(OUT / "SCOPE_AND_SOURCE_OF_TRUTH_FIREWALL.md", f"""# Scope and Source-of-Truth Firewall

## Precedence

1. Current owner directive and permanent product-scope safeguards  
2. Accepted/frozen domain rules, contracts, permissions, isolation, audit, wave evidence  
3. Prototype HTML + consolidated BRD for not-yet-implemented capability (**default ADOPTED**)  
4. Nine Decision A final PNGs for visual hierarchy/density/shell  
5. Current React/Next presentation and earlier design packs  

## Patient / clinical boundary

Doctors Pulse does **not** own patient identities, appointments, clinical notes, prescriptions, referrals, patient invoices, Medicare claims, or Best Practice patient records.

Operational-only holdings are permitted (aggregates, de-identified classifications, connector status, workforce/compliance/assets, public booking links to external systems).

## Financial boundary

- M07 = staff payroll **preparation** only  
- M07 PPA = separately authorised  
- Unlock/reopen ≠ PPA  
- No bank transfer execution in Doctors Pulse  

## Privacy / seed data

Legacy prototype seed values must **not** be migrated. Reports use redacted excerpts and hashes only.

## Disposition vocabulary

ADOPTED-AS-IS · ADOPTED-WITH-CONTROL-HARDENING · CONSOLIDATED · RELOCATED · DEFERRED-BY-DEPENDENCY · EXCLUDED-BY-PRODUCT-BOUNDARY · DECISION-REQUIRED
""")

    write(OUT / "CONFLICT_AND_OWNER_DECISION_REGISTER.md", f"""# Conflict and Owner Decision Register

**Open items:** {sum(1 for d in decisions if d['status']=='OPEN')}  
**Closed items:** {sum(1 for d in decisions if d['status']=='CLOSED')}

| ID | Type | Recommended disposition | Status |
| --- | --- | --- | --- |
""" + "\n".join(
        f"| `{d['id']}` | {d.get('type')} | {d.get('recommendedDisposition')} | {d['status']} |"
        for d in decisions
    ) + """

### DEC-FINAL-PNGS-MISSING — CLOSED (owner revised decision A)

Accepted `b5feab7` observed SHA-256 as canonical baselines under normalised filenames. Mismatch evidence `a22f9a1` preserved.

See `conflict-and-owner-decision-register.json` for redacted excerpts and semantic classes.
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
- M01/M02 cross-module integration remains **IN-DEVELOPMENT** until producer modules exist
""")

    write(OUT / "CURRENT_IMPLEMENTATION_REAUDIT.md", f"""# Current Implementation Re-Audit (M01–M24)

**Method:** Latest code paths under `src/modules`, `module-register.ts`, services/repos/tests, and accepted wave evidence. Not file-count alone.

| Module | Route | UI | Domain | Integration | Evidence | Production | Files | Target wave |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
""" + "\n".join(
        f"| {a['module']} | `{a['mainRoute']}` | {a['revisedUiStatus']} | {a['revisedDomainStatus']} | {a['revisedIntegrationStatus']} | {a['revisedEvidenceStatus']} | {a['revisedProductionStatus']} | {a['fileCount']} | {a['targetWave']} |"
        for a in (audits[n] for n in sorted(audits))
    ) + """

Notes, service/repository paths and gaps are in `CURRENT_IMPLEMENTATION_REAUDIT.json`.
""")

    design_contract = {
        "generatedAt": UTC,
        "appearanceModes": ["light", "dark", "system"],
        "brandedGlobalThemesAllowed": False,
        "decBrandedThemes": "CLOSED — Light/Dark/System only; module-family sidebar accents OK; no Executive Blue/Medical Emerald global themes",
        "semanticColors": {
            "light": {
                "--dp-bg-canvas": "#F3F5F7",
                "--dp-bg-surface": "#FFFFFF",
                "--dp-bg-nav": "#0B1F33",
                "--dp-bg-topbar": "#FFFFFF",
                "--dp-text-primary": "#0F172A",
                "--dp-text-secondary": "#475569",
                "--dp-text-on-nav": "#E2E8F0",
                "--dp-border-subtle": "#E2E8F0",
                "--dp-border-strong": "#CBD5E1",
                "--dp-accent-primary": "#2563EB",
                "--dp-accent-primary-hover": "#1D4ED8",
                "--dp-status-critical": "#DC2626",
                "--dp-status-urgent": "#EA580C",
                "--dp-status-ontrack": "#16A34A",
                "--dp-status-overdue": "#7C3AED",
                "--dp-focus-ring": "#2563EB",
            },
            "dark": {
                "--dp-bg-canvas": "#0B1220",
                "--dp-bg-surface": "#111827",
                "--dp-bg-nav": "#020617",
                "--dp-bg-topbar": "#111827",
                "--dp-text-primary": "#F8FAFC",
                "--dp-text-secondary": "#94A3B8",
                "--dp-text-on-nav": "#E2E8F0",
                "--dp-border-subtle": "#1F2937",
                "--dp-border-strong": "#334155",
                "--dp-accent-primary": "#3B82F6",
                "--dp-accent-primary-hover": "#60A5FA",
                "--dp-status-critical": "#F87171",
                "--dp-status-urgent": "#FB923C",
                "--dp-status-ontrack": "#4ADE80",
                "--dp-status-overdue": "#A78BFA",
                "--dp-focus-ring": "#60A5FA",
            },
            "system": "Resolve to light or dark from OS prefers-color-scheme; persist user override in local settings; clean-storage default = system",
        },
        "familyAccentCues": {
            "note": "Sidebar/nav identification only; must not replace Light/Dark/System surfaces",
            "Executive Command Centre": "#2563EB",
            "Operations": "#0F766E",
            "People & Talent": "#7C3AED",
            "Rostering & Attendance": "#0891B2",
            "Assets & Facilities": "#D97706",
            "Governance": "#16A34A",
            "Finance & Forecasting": "#B45309",
            "Communications": "#DB2777",
            "Security & Access": "#DC2626",
            "Organisation & Tenant": "#475569",
        },
        "typography": {
            "fontFamilySans": "\"IBM Plex Sans\", \"Source Sans 3\", \"Segoe UI\", sans-serif",
            "fontFamilyMono": "\"IBM Plex Mono\", \"ui-monospace\", monospace",
            "scale": {
                "display": {"sizePx": 28, "weight": 600, "lineHeight": 1.25},
                "title": {"sizePx": 20, "weight": 600, "lineHeight": 1.3},
                "subtitle": {"sizePx": 16, "weight": 600, "lineHeight": 1.35},
                "body": {"sizePx": 14, "weight": 400, "lineHeight": 1.45},
                "bodyStrong": {"sizePx": 14, "weight": 600, "lineHeight": 1.45},
                "label": {"sizePx": 12, "weight": 600, "lineHeight": 1.3},
                "caption": {"sizePx": 11, "weight": 500, "lineHeight": 1.3},
                "kpiValue": {"sizePx": 24, "weight": 650, "lineHeight": 1.2},
            },
        },
        "spacingDensity": {
            "space": {"0": 0, "1": 4, "2": 8, "3": 12, "4": 16, "5": 20, "6": 24, "7": 32, "8": 40},
            "density": "high — compact operational workbench",
            "rowHeightTablePx": 36,
            "rowHeightTableCompactPx": 32,
            "controlHeightPx": 32,
            "controlHeightLargePx": 36,
            "cardPaddingPx": 12,
            "sectionGapPx": 16,
        },
        "shellDimensionsPx": {
            "sidebarExpanded": 240,
            "sidebarCollapsed": 72,
            "topbarHeight": 48,
            "moduleHeaderHeight": 56,
            "sectionNavHeight": 40,
            "kpiStripMinHeight": 88,
            "toolbarHeight": 44,
            "detailPanelWidth": 360,
            "detailPanelMinWidth": 320,
            "detailPanelMaxWidth": 420,
            "contentMaxWidth": 1440,
        },
        "componentDimensionsPx": {
            "kpiCardMinWidth": 160,
            "kpiCardHeight": 84,
            "filterChipHeight": 28,
            "tableHeaderHeight": 36,
            "modalWidthSm": 480,
            "modalWidthMd": 640,
            "modalWidthLg": 800,
            "drawerWidth": 420,
        },
        "collapseBehaviour": {
            "desktopMin": 1280,
            "tabletRange": [768, 1279],
            "mobileMax": 767,
            "desktop": "sidebar expanded; detail panel docked right; table+detail dual scroll",
            "tablet": "sidebar icon rail 72px; detail becomes drawer; filters collapse into sheet",
            "mobile": "hamburger nav; detail full-screen sheet; tables become cards; one page scroll + modal/drawer",
        },
        "a11y": {
            "focusRing": "2px solid var(--dp-focus-ring); offset 2px; never remove outline without replacement",
            "keyboard": "All tabs, toolbars, tables (row activation), dialogs, drawers operable by keyboard; Esc closes overlays",
            "contrast": "Text/icon vs background ≥ 4.5:1 normal text; ≥ 3:1 large text/UI components (WCAG 2.2 AA)",
            "motion": "Respect prefers-reduced-motion; no essential info only in animation",
            "targets": "Interactive targets ≥ 24×24px; preferred 32×32px for primary actions",
        },
        "screenshotComparison": {
            "viewports": [
                {"name": "ref-final-png", "w": 1672, "h": 941, "zoom": 1.0},
                {"name": "desktop-1920", "w": 1920, "h": 1080, "zoom": 1.0},
                {"name": "desktop-1440", "w": 1440, "h": 900, "zoom": 1.0},
                {"name": "desktop-1366", "w": 1366, "h": 768, "zoom": 1.0},
                {"name": "desktop-1280", "w": 1280, "h": 900, "zoom": 1.0},
                {"name": "tablet-1024", "w": 1024, "h": 768, "zoom": 1.0},
                {"name": "tablet-768", "w": 768, "h": 1024, "zoom": 1.0},
                {"name": "mobile-430", "w": 430, "h": 932, "zoom": 1.0},
                {"name": "mobile-390", "w": 390, "h": 844, "zoom": 1.0},
                {"name": "desktop-short-720", "w": 1440, "h": 720, "zoom": 1.0},
                {"name": "desktop-125pct", "w": 1536, "h": 864, "zoom": 1.25},
            ],
            "regions": ["shell-nav", "topbar", "module-title-tabs", "kpi-strip", "toolbar", "main-pane", "detail-pane"],
            "tolerances": {
                "edgeAntialiasPx": 2,
                "colourDeltaRgbMax": 8,
                "layoutShiftPxMax": 4,
                "failOnHorizontalOverflow": True,
                "failOnClippingAncestor": True,
                "failOnOcclusionOfPrimaryControls": True,
                "noCentrePointBypass": True,
                "noChromeOnlyPass": True,
            },
        },
        "pilSamples": tokens,
    }
    write(OUT / "design-system-contract.json", json.dumps(design_contract, indent=2))

    write(OUT / "FINAL_DESIGN_SYSTEM_CONTRACT.md", f"""# Final Product Design Contract

**Canonical images:** Decision A normalised PNG set @ `{DECISION_A}` (do not rehash/replace).  
**Machine contract:** `design-system-contract.json`  
**PIL palette samples:** `design-token-samples.json` (supporting evidence only — not a complete contract).

## Appearance (owner-closed DEC-BRANDED-THEMES)

- **Allowed global modes:** Light, Dark, System (OS `prefers-color-scheme`)
- **Persistence:** reload-safe user preference; clean-storage default = System
- **Forbidden as global themes:** Executive Blue, Medical Emerald
- **Allowed:** module-family accent colours as sidebar/navigation identification cues only; accents must not replace or interfere with Light/Dark/System surfaces

## Semantic colour tokens

### Light
| Token | Value |
| --- | --- |
| `--dp-bg-canvas` | `#F3F5F7` |
| `--dp-bg-surface` | `#FFFFFF` |
| `--dp-bg-nav` | `#0B1F33` |
| `--dp-bg-topbar` | `#FFFFFF` |
| `--dp-text-primary` | `#0F172A` |
| `--dp-text-secondary` | `#475569` |
| `--dp-text-on-nav` | `#E2E8F0` |
| `--dp-border-subtle` | `#E2E8F0` |
| `--dp-border-strong` | `#CBD5E1` |
| `--dp-accent-primary` | `#2563EB` |
| `--dp-accent-primary-hover` | `#1D4ED8` |
| `--dp-status-critical` | `#DC2626` |
| `--dp-status-urgent` | `#EA580C` |
| `--dp-status-ontrack` | `#16A34A` |
| `--dp-status-overdue` | `#7C3AED` |
| `--dp-focus-ring` | `#2563EB` |

### Dark
| Token | Value |
| --- | --- |
| `--dp-bg-canvas` | `#0B1220` |
| `--dp-bg-surface` | `#111827` |
| `--dp-bg-nav` | `#020617` |
| `--dp-bg-topbar` | `#111827` |
| `--dp-text-primary` | `#F8FAFC` |
| `--dp-text-secondary` | `#94A3B8` |
| `--dp-text-on-nav` | `#E2E8F0` |
| `--dp-border-subtle` | `#1F2937` |
| `--dp-border-strong` | `#334155` |
| `--dp-accent-primary` | `#3B82F6` |
| `--dp-accent-primary-hover` | `#60A5FA` |
| `--dp-status-critical` | `#F87171` |
| `--dp-status-urgent` | `#FB923C` |
| `--dp-status-ontrack` | `#4ADE80` |
| `--dp-status-overdue` | `#A78BFA` |
| `--dp-focus-ring` | `#60A5FA` |

## Typography

Font stack: `IBM Plex Sans`, `Source Sans 3`, `Segoe UI`, sans-serif (mono: `IBM Plex Mono`).

| Role | Size | Weight | Line height |
| --- | ---: | ---: | ---: |
| Display | 28px | 600 | 1.25 |
| Title | 20px | 600 | 1.30 |
| Subtitle | 16px | 600 | 1.35 |
| Body | 14px | 400 | 1.45 |
| Body strong | 14px | 600 | 1.45 |
| Label | 12px | 600 | 1.30 |
| Caption | 11px | 500 | 1.30 |
| KPI value | 24px | 650 | 1.20 |

## Spacing & density

Scale: 0/4/8/12/16/20/24/32/40 px. Density: high operational workbench.  
Table row 36px (compact 32px); control height 32px (large 36px); card padding 12px; section gap 16px.

## Shell dimensions (px)

| Element | Value |
| --- | ---: |
| Sidebar expanded | 240 |
| Sidebar collapsed | 72 |
| Topbar height | 48 |
| Module header | 56 |
| Section nav | 40 |
| KPI strip min height | 88 |
| Toolbar | 44 |
| Detail panel | 360 (min 320 / max 420) |

KPI card min width 160 / height 84; filter chip 28; table header 36; drawer 420; modal 480/640/800.

## Collapse behaviour

- Desktop ≥1280: expanded sidebar; docked detail; dual scroll (main + detail)
- Tablet 768–1279: icon rail; detail drawer; filter sheet
- Mobile ≤767: hamburger; full-screen detail sheet; tables→cards; one page scroll + modal/drawer

## Focus, keyboard, contrast

- Focus ring: 2px solid `--dp-focus-ring`, 2px offset
- Keyboard: tabs, toolbars, row activation, dialogs, drawers; Esc closes overlays
- Contrast: WCAG 2.2 AA (≥4.5:1 text; ≥3:1 large/UI)
- Targets ≥24×24 (preferred 32×32 primary)
- Respect `prefers-reduced-motion`

## Screenshot viewports & tolerances

Viewports: 1672×941 (ref), 1920×1080, 1440×900, 1366×768, 1280×900, 1024×768, 768×1024, 430×932, 390×844, 1440×720, 1536×864@125%.  
Regions: shell-nav, topbar, module-title-tabs, kpi-strip, toolbar, main-pane, detail-pane.  
Tolerances: edge antialias ≤2px; colour ΔRGB ≤8; layout shift ≤4px; fail overflow/clipping/occlusion; no centre-point or chrome-only bypass.

## Module-specific patterns

Shared rules above; pattern mapping in `DESIGN_REFERENCE_MAP.md` (M01/M02/M04/M05/M06/M10/M11/M12/M15).

## No-placeholder / no-fake-success

Service-backed transitions, permission enforcement, clinic/tenant isolation, validation/failure states, audit, source links, persistence/reload proof, tests and work-step evidence.
""")

    write(OUT / "REVISED_DEPENDENCY_LED_DEVELOPMENT_ROADMAP.md", f"""# Revised Dependency-Led Development Roadmap

## Programme Gate P0 — Trusted baseline and parity control

- Closed UI evidence correction; pin baseline `b1152d3` / evidence tip `e659dfc`
- Decision A canonical PNGs installed @ `66e6e64` (accepted)
- Corrected control pack (this generation) ready for owner acceptance review
- **STOP for owner approval before P1**

## Programme Waves P1–P9

P1 shared shell foundation → P2 developed modules (M01–M07, M11) → P3 M10 → P4 M13/M14 → P5 M12/M15/M16 → P6 finance (+ separate PPA auth) → P7 comms/digital/analytics → P8 commercial/enterprise → P9 production verification.

Owner acceptance ≠ production verification ≠ operational release.
""")

    write(OUT / "PROPOSED_WAVE_CONTROL_UPDATE.md", f"""# Proposed Wave-Control Update (Planning Only)

**Does not authorise P1 implementation, PPA, M08–M24 bulk work, PR, merge, or production.**

```text
Phase 0 application baseline (prototype-parity): b1152d36d3f47c15277f85b3e990f5e1c94bddcb — ACCEPTED
Evidence-bearing tip: e659dfc42a711d37a3e73b3ba7049190ca531e4a
Decision A canonical PNG tip: 66e6e6488b27b9098dadd8962473fedea5053614 — ACCEPTED
Programme Gate P0 control pack: pending owner acceptance after correction
Programme Waves P1–P9: not authorised until named owner batch approval
```
""")

    write(OUT / "phase0/PHASE0_BASELINE_ACCEPTANCE_RECORD.md", f"""# Phase 0 Baseline Acceptance Record

**Owner decision:** ACCEPTED  
**Frozen application SHA:** `b1152d36d3f47c15277f85b3e990f5e1c94bddcb`  
**Evidence-bearing tip:** `e659dfc42a711d37a3e73b3ba7049190ca531e4a`  
**Decision A PNG tip:** `66e6e6488b27b9098dadd8962473fedea5053614`  
**Authority granted:** Programme Gate P0 mapping/planning; PNG baselines accepted; P1 not authorised  

## Preflight

| Check | Result |
| --- | --- |
| origin/main | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |
| Correction tip | `e659dfc42a711d37a3e73b3ba7049190ca531e4a` |
| Ancestry b1152d3 ⊂ tip | OK |
| Decision A PNGs | 9/9 INSTALLED_HASH_OK @ `66e6e64` |
| PR/merge | none |
""")

    write(OUT / "VALIDATION_RECONCILIATION.md", f"""# Validation / Reconciliation

| Check | Result |
| --- | --- |
| Prototype hash pinned | `{proto}` |
| Minimum baseline counts | PASS |
| Traceability rows (JSON=CSV) | {accounting['totalRows']} |
| Unclassified dispositions | 0 |
| Canonical screens | {accounting['canonicalScreenCount']} |
| Design PNGs installed | True |
| Design PNG Decision | A-REVISED @ `66e6e6488b27b9098dadd8962473fedea5053614` |
| Open owner decisions | {accounting['openOwnerDecisions']} |
| Programme tip at generation | `{tip}` |

Extractor raw control counts are recorded for reconciliation by source-location ID and are **not** used as final requirement cardinality.

## Design references — owner revised decision A

Nine canonical finals installed under normalised names; dimensions 1672×941 (9/9); complete observed SHA-256 recorded. Prior prompt hashes retained as audit fields only. Mismatch evidence `a22f9a1` preserved. Do not replace/re-export/edit/rehash the nine PNGs.

Generated: `{UTC}`
""")

    write(OUT / "VALIDATION_RECONCILIATION.json", json.dumps({
        "generatedAt": UTC,
        "prototypeSha256": proto,
        "traceabilityRows": accounting["totalRows"],
        "unclassifiedDispositions": 0,
        "canonicalScreens": accounting["canonicalScreenCount"],
        "designPngsInstalled": True,
        "designPngDecision": "A-REVISED",
        "decisionACommit": "66e6e6488b27b9098dadd8962473fedea5053614",
        "openOwnerDecisions": accounting["openOwnerDecisions"],
        "programmeResetTipAtGeneration": tip,
        "workflowActionTotals": accounting["workflowActionTotals"],
        "conflictAdjudicationTotals": accounting["conflictAdjudicationTotals"],
        "ok": True,
    }, indent=2))

    write(OUT / "GLOBAL_ACCEPTANCE_TEST_DESIGN.md", f"""# Global Acceptance Test Design

**Generated:** `{UTC}`

## Axes (independent)

1. UI implementation status  
2. Domain implementation status  
3. Cross-module integration status  
4. Evidence/acceptance status  
5. Production readiness (always separate; never implied by owner UI acceptance)

## Mandatory proof types

- Automated tests for services, permissions, isolation, audit, persistence  
- Visual QA against Decision A PNGs / design contract (exact viewports)  
- Work-Step QA for every named action/workflow  
- Immutable SHA evidence commits  
- Localhost handoff on port 3000 for the exact reported tip  

## Fail conditions

Toast/alert-only success · missing service transition · missing permission/isolation · fake seed as production truth · patient/clinical/payment boundary breach · self-approval by implementing agent · source change after final QA without re-QA
""")

    write(OUT / "DESIGN_REFERENCE_DECISION_A_ACCEPTANCE.md", f"""# Design Reference — Decision A Acceptance

**Status:** Owner accepted (PNGs only)  
**Install commit:** `66e6e6488b27b9098dadd8962473fedea5053614`  
**Upload source commit:** `b5feab7d71790aac75049b361817fa92eeb1a87d`  
**Mismatch evidence preserved:** `a22f9a1e66d918cadc1e3a2026676b3b140025c8`  

Do not replace, re-export, edit or rehash the nine canonical PNGs. Prior prompt SHA-256 values remain as audit fields (`priorPromptExpectedSha256`) and are superseded for validation.

Generated: `{UTC}`
""")

    write(OUT / "README.md", f"""# Programme Gate P0 — Prototype Parity Control Pack

**Claim (only):** Programme Gate P0 semantic control pack corrected and ready for owner acceptance review.

| Pin | SHA |
| --- | --- |
| Branch | `cursor/prototype-parity-programme-reset` |
| Accepted application baseline | `b1152d36d3f47c15277f85b3e990f5e1c94bddcb` |
| Evidence-bearing tip | `e659dfc42a711d37a3e73b3ba7049190ca531e4a` |
| Decision A PNG tip | `66e6e6488b27b9098dadd8962473fedea5053614` |
| Programme tip at generation | `{tip}` |
| origin/main | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |

## Status

- Decision A canonical PNGs: **installed** (9/9 `INSTALLED_HASH_OK`)  
- Control pack generation: deterministic extract → build → validate  
- P1 / PPA / M08–M24 implementation: **not authorised**  
- PR / merge: **none**

## Regenerate

```bash
node scripts/prototype-parity/run-parity-pack.mjs
```

Second generation must produce zero diff.

## Key outputs

- Master traceability JSON/CSV/MD  
- Canonical screen register ({accounting['canonicalScreenCount']})  
- Workflow/action register  
- Implementation re-audit M01–M24  
- Conflict/owner decision register (open={accounting['openOwnerDecisions']})  
- Final design system contract + Decision A manifest  
- 27 self-contained implementation prompt packs  

Generated: `{UTC}`
""")

    write(OUT / "FIRST_RUN_STOP_CHECKPOINT.md", f"""# Programme Gate P0 Stop Checkpoint

**Claim (only):** Programme Gate P0 semantic control pack corrected and ready for owner acceptance review.

| Item | Value |
| --- | --- |
| Branch | `cursor/prototype-parity-programme-reset` |
| Accepted application baseline | `b1152d36d3f47c15277f85b3e990f5e1c94bddcb` |
| Evidence-bearing tip | `e659dfc42a711d37a3e73b3ba7049190ca531e4a` |
| Decision A PNG tip | `66e6e6488b27b9098dadd8962473fedea5053614` |
| Programme tip at generation | `{tip}` |
| Prototype SHA-256 | `{proto}` |
| Traceability rows | {accounting['totalRows']} |
| Canonical screens | {accounting['canonicalScreenCount']} |
| Design PNGs | 9/9 INSTALLED_HASH_OK (Decision A) |
| Open owner decisions | {accounting['openOwnerDecisions']} |
| P1 authorised | **No** |
| PR/merge | **none** |

## Explicit stop

Do **not** begin Programme Wave P1, PPA implementation, or M08–M24 bulk work until the owner expressly accepts this corrected control pack and authorises the next named batch.
""")

    # ── Prompt packs (27 self-contained) ──
    prompt_specs = [
        ("p1", "P1", None, "Shared final-design foundation", "shared-shell", "P0 control pack owner-accepted tip"),
        ("p2-m01", "P2", 1, "M01 Command Centre", "module", "P1 owner-accepted tip"),
        ("p2-m02", "P2", 2, "M02 Action Inbox", "module", "P2-M01 owner-accepted tip"),
        ("p2-m03", "P2", 3, "M03 Organisation & Access", "module", "P2-M02 owner-accepted tip"),
        ("p2-m04", "P2", 4, "M04 Staff & Doctors", "module", "P2-M03 owner-accepted tip"),
        ("p2-m05", "P2", 5, "M05 Weekly Roster", "module", "P2-M04 owner-accepted tip"),
        ("p2-m06", "P2", 6, "M06 Time & Attendance", "module", "P2-M05 owner-accepted tip"),
        ("p2-m07", "P2", 7, "M07 Staff Pay Preparation", "module-pay-prep", "P2-M06 owner-accepted tip"),
        ("p2-m11", "P2", 11, "M11 Training", "module", "P2-M07 owner-accepted tip"),
        ("p3-m10", "P3", 10, "M10 Tasks & Checklists", "module-connective", "P2 series owner-accepted tip"),
        ("p4-m13", "P4", 13, "M13 Documents & Policies", "module", "P3-M10 owner-accepted tip"),
        ("p4-m14", "P4", 14, "M14 Ticketing", "module", "P4-M13 owner-accepted tip"),
        ("p5-m12", "P5", 12, "M12 Compliance & Quality", "module", "P4 series owner-accepted tip"),
        ("p5-m15", "P5", 15, "M15 Inventory & Assets", "module", "P5-M12 owner-accepted tip"),
        ("p5-m16", "P5", 16, "M16 Incidents & Risk", "module", "P5-M15 owner-accepted tip"),
        ("p6-m07-ppa", "P6-PPA", 7, "M07 Prior-Period Adjustment", "ppa", "explicit PPA batch authorisation + prior tip"),
        ("p6-m08", "P6", 8, "M08 Doctor Pay", "module-finance", "P5 series owner-accepted tip"),
        ("p6-m09", "P6", 9, "M09 BBPIP", "module-finance", "P6-M08 owner-accepted tip"),
        ("p6-m24", "P6", 24, "M24 Forecast & Finance Review", "module-finance", "P6-M09 owner-accepted tip"),
        ("p7-m17", "P7", 17, "M17 Communications", "module", "P6 series owner-accepted tip"),
        ("p7-m18", "P7", 18, "M18 Digital Monitoring & Security", "module", "P7-M17 owner-accepted tip"),
        ("p7-m19", "P7", 19, "M19 Analytics Governance", "module", "P7-M18 owner-accepted tip"),
        ("p8-m20", "P8", 20, "M20 Tenant Commercial", "module", "P7 series owner-accepted tip"),
        ("p8-m21", "P8", 21, "M21 Vendor Portfolio", "module", "P8-M20 owner-accepted tip"),
        ("p8-m22", "P8", 22, "M22 Recruitment", "module", "P8-M21 owner-accepted tip"),
        ("p8-m23", "P8", 23, "M23 Website & Public Routing", "module", "P8-M22 owner-accepted tip"),
        ("p9", "P9", None, "Production verification", "production-verification", "P8 series owner-accepted tip"),
    ]

    def batches_for(kind: str, mod_key: str, wave: str) -> str:
        if kind == "shared-shell":
            return """1. Tokenised Light/Dark/System theme plumbing + CSS variables from design-system-contract.json  
2. Sidebar (240/72), topbar (48), section nav, KPI strip, toolbar, detail panel primitives  
3. Appearance preference persistence (System default); family accents as nav cues only  
4. Screenshot harness for contract viewports/regions/tolerances; a11y focus/keyboard baselines"""
        if kind == "ppa":
            return """1. PPA period selection + eligibility gates (post-lock/post-export only)  
2. Adjustment drafting services with audit + immutable prior snapshot links  
3. Approval/recompute/re-export package prep (no payment execution)  
4. PPA-specific Work-Step QA + regression against ordinary Batch 1–6 prep"""
        if kind == "module-pay-prep":
            return """1. Preserve accepted M07 ordinary prep; align shell to final design  
2. Wire in-scope readiness/exception/export actions to module services only  
3. Enforce no bank/STP/super/mark-as-paid; unlock≠PPA  
4. Pay-prep Work-Step QA + M06 publication contract regression"""
        if kind == "module-connective":
            return """1. Task/checklist/handover/meeting domain model + permissions  
2. M02 projection adapters for assignable work; M01 summary hooks  
3. Template/run/detail UI per design pattern  
4. Connective-layer integration tests + Work-Step QA"""
        if kind == "module-finance":
            return f"""1. {mod_key} domain ledger/services distinct from M07 staff-pay prep  
2. Import/match/review UI for in-scope screens/actions  
3. Projection to M02 for approvals/exceptions; M01 completeness labels  
4. Finance Work-Step QA + isolation/audit tests (no payment execution)"""
        if kind == "production-verification":
            return """1. Cross-module contract verification matrix (M01←producers, M02←producers, M06→M07)  
2. Permission/isolation/audit penetration suite across accepted modules  
3. Visual QA regression vs Decision A PNGs + design contract viewports  
4. Production-readiness evidence pack (still not an operational release claim)"""
        # default module
        return f"""1. {mod_key} route/section alignment to final-design pattern + Decision A image if any  
2. Implement in-scope domain services for listed actions/workflows (no toast-only success)  
3. Permissions (`accessClassification`), clinic/tenant isolation, validation/error states, audit  
4. Module-specific automated tests + Visual QA + Work-Step QA for every listed action ID"""

    def tests_for(kind: str, mod_key: str) -> str:
        if kind == "shared-shell":
            return """- Theme token resolution tests (light/dark/system)  
- Shell dimension/collapse tests at 1280/768/390  
- Focus-ring and keyboard navigation tests for nav/tabs/toolbar  
- Screenshot diff harness smoke test against tolerances"""
        if kind == "ppa":
            return """- PPA eligibility rejects unlocked ordinary periods incorrectly flagged  
- Adjustment persistence + prior snapshot immutability tests  
- Permission matrix for PPA approver roles  
- Re-export package checksum/reconciliation tests"""
        if kind == "production-verification":
            return """- Contract suite: every producer→M02 projection present or explicitly waived  
- M01 source-completeness label tests for published metrics  
- Isolation fuzz across clinics/tenants  
- Visual + Work-Step regression gate for all P2–P8 accepted tips"""
        return f"""- {mod_key} service/repository transition tests for each mutating action ID  
- Permission denied + clinic isolation negative tests  
- Persistence reload proof tests  
- Regression for frozen accepted modules touched by this batch"""

    prompt_index = []
    prompts_dir = OUT / "prompts"
    prompts_dir.mkdir(parents=True, exist_ok=True)

    # Shared shell IDs for P1
    shared_screen_ids = sorted({s["screenId"] for s in screen_rows if s["moduleKey"] in ("M01", "M02")})
    shared_req_ids = sorted({r["requirementId"] for r in rows if r["sourceType"] == "final-image" or r["requirementId"].startswith("OWN-") or r["requirementId"].startswith("imgctrl-")})
    shared_action_ids = sorted({x["id"] for x in action_items if x["kind"] == "production-control" and x["moduleKey"] in ("M01", "M02", "M03")})
    shared_wf_ids = sorted({x["id"] for x in action_items if x["kind"] in ("brd-workflow", "blueprint-workflow") and x["moduleKey"] in ("M01", "M02")})

    # P9 cross-module table sources
    p9_modules = [audits[n] for n in sorted(audits)]

    for fname, wave, num, title, kind, predecessor in prompt_specs:
        a = audits.get(num) if num else None
        mod_key = f"M{num:02d}" if num else ("SHARED" if kind == "shared-shell" else "MULTI")
        if num:
            screen_ids = [s["screenId"] for s in screen_rows if s["moduleKey"] == mod_key]
            req_ids = [r["requirementId"] for r in rows if r["module"] == mod_key]
            action_ids = [x["id"] for x in action_items if x.get("moduleKey") == mod_key]
            wf_ids = [x["id"] for x in action_items if x.get("moduleKey") == mod_key and x["kind"] in ("brd-workflow", "blueprint-workflow", "legacy-workflow-group")]
            img = next((i["normalisedName"] for i in image_rows if i["module"] == mod_key), DESIGN_PATTERN.get(num, "derived-from-design-contract"))
            route = a["mainRoute"]
            roles = roles_for(num, brd_by_num.get(num), a.get("accessClassification", ""))
            persist = a["persistenceMethod"]
            cross = a["crossModuleIntegrations"]
            owner_note = a["note"]
        elif kind == "shared-shell":
            screen_ids = shared_screen_ids
            req_ids = shared_req_ids
            action_ids = shared_action_ids
            wf_ids = shared_wf_ids
            img = "shared-shell + Decision A PNG chrome regions"
            route = "/dashboard + /action-inbox + global shell"
            roles = "All authenticated roles see shell chrome; module content still gated by accessClassification"
            persist = "Appearance preference persistence only; no domain writes in P1"
            cross = "Shell projects navigation only; M01/M02 domain projections remain IN-DEVELOPMENT"
            owner_note = "Shared shell owns chrome/tokens/primitives only"
        else:  # production verification
            screen_ids = [s["screenId"] for s in screen_rows]
            req_ids = [r["requirementId"] for r in rows if r["sourceType"] in ("owner", "accepted-evidence", "current-plan")]
            action_ids = [x["id"] for x in action_items if x["kind"] in ("production-control", "brd-workflow")]
            wf_ids = [x["id"] for x in action_items if x["kind"] in ("brd-workflow", "blueprint-workflow")]
            img = "all Decision A PNGs + design-system-contract.json"
            route = "all canonical routes"
            roles = "Verification agents + owner reviewers; no new privilege escalation"
            persist = "Verify existing persistence proofs; no new domain model in P9"
            cross = "Full producer→M01/M02 and M06→M07 contract verification"
            owner_note = "Production verification ≠ operational release"

        # Module-specific resulting-state evidence expectations
        if kind == "ppa":
            resulting = "PPA package IDs, prior snapshot hashes, approval audit chain, re-export reconciliation checksums"
        elif kind == "shared-shell":
            resulting = "Theme preference persistence; shell screenshot evidence per viewport; focus/keyboard evidence"
        elif kind == "production-verification":
            resulting = "Contract matrix results; isolation report; visual/Work-Step regression SHAs for each accepted module tip"
        else:
            resulting = (
                f"For each mutating action ID: before/after entity state, audit row, reload proof, "
                f"M01/M02 projection effect (or explicit NONE), evidence commit under docs/audits/"
            )

        scope_table = ""
        if kind == "shared-shell":
            scope_table = """
## Shared scope table (P1)

| Surface | IDs |
| --- | --- |
| Shell requirement IDs | """ + ", ".join(f"`{x}`" for x in req_ids) + """ |
| Reference screens (M01/M02 chrome) | """ + ", ".join(f"`{x}`" for x in screen_ids) + """ |
| Production nav controls in scope | """ + ", ".join(f"`{x}`" for x in action_ids) + """ |
| Reference workflows (do not implement domain) | """ + ", ".join(f"`{x}`" for x in wf_ids) + """ |
"""
        elif kind == "production-verification":
            rows_tbl = "\n".join(
                f"| {m['module']} | `{m['mainRoute']}` | {m['revisedUiStatus']} | {m['revisedDomainStatus']} | {m['revisedIntegrationStatus']} | {m['evidencePaths']} |"
                for m in p9_modules
            )
            scope_table = f"""
## Cross-module verification table (P9)

| Module | Route | UI | Domain | Integration | Evidence path |
| --- | --- | --- | --- | --- | --- |
{rows_tbl}

### In-scope verification IDs

- Screen IDs: {", ".join(f"`{x}`" for x in screen_ids)}
- Owner/evidence/plan requirement IDs: {", ".join(f"`{x}`" for x in req_ids)}
- Production controls + BRD workflows under test: {", ".join(f"`{x}`" for x in action_ids)}
- Workflow IDs: {", ".join(f"`{x}`" for x in wf_ids)}
"""

        body = f"""# Cursor Prompt — {wave}: {title}

## 1. Authority and predecessor acceptance gate

- **Not authorised until** the owner expressly accepts the predecessor programme tip and names this batch.
- **Predecessor gate:** {predecessor}
- **Do not** auto-start from `b1152d3` once a later owner-accepted programme tip exists.
- Phase 0 application baseline: `b1152d36d3f47c15277f85b3e990f5e1c94bddcb`
- Evidence-bearing tip: `e659dfc42a711d37a3e73b3ba7049190ca531e4a`
- Decision A PNG tip: `66e6e6488b27b9098dadd8962473fedea5053614`
- Branch family: `cursor/prototype-parity-*` — never force-push; no PR/merge unless owner asks.

## 2. Branch / start-ref rules

1. Start from the **owner-accepted predecessor programme tip** for this wave/batch.
2. Create a new feature branch under `cursor/prototype-parity-*`.
3. Confirm ancestry includes `b1152d3` and Decision A PNG commit `66e6e64` where design applies.
4. Confirm `origin/main` remains `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` unless owner moves it.
5. No merge to main in this prompt.

## 3. Exact in-scope screens and requirement IDs

- **Module:** {mod_key}
- **Primary route(s):** `{route}`
- **Design reference:** `{img}`
- **Screen IDs (complete):** {", ".join(f"`{x}`" for x in screen_ids) if screen_ids else "`NONE — NO SCREENS IN SCOPE`"}
- **Requirement IDs (complete):** {", ".join(f"`{x}`" for x in req_ids) if req_ids else "`NONE — NO REQUIREMENTS IN SCOPE`"}
{scope_table}
## 4. Exact actions and workflows

- **Action IDs (complete):** {", ".join(f"`{x}`" for x in action_ids) if action_ids else "`NONE — NO ACTIONS IN SCOPE`"}
- **Workflow IDs (complete):** {", ".join(f"`{x}`" for x in wf_ids) if wf_ids else "`NONE — NO WORKFLOWS IN SCOPE`"}
- Every listed mutating ID requires service/domain transition, audit, persistence/reload proof, error states — or explicit `NONE — NOT IMPLEMENTED` with target wave (already recorded in workflow-action-register.json).
- Toast/alert-only success is a fail.

## 5. Domain ownership and integration contracts

- Owner: {owner_note}
- Cross-module contract: {cross}
- M01/M02 integration remains **IN-DEVELOPMENT** until producers exist — do not claim complete integration early.
- No cross-module repository imports.

## 6. Permissions and clinic/tenant isolation

- Authorised roles/permissions for this scope: {roles}
- Enforce accessClassification + service-side authorisation on every mutate.
- Clinic/tenant isolation on read and write; permission-denied and empty states are real UI states.

## 7. Persistence and audit requirements

- Persistence method: {persist}
- Mutating actions: durable persistence + reload proof + audit trail with actor/clinic/before-after.
- Do not migrate legacy prototype seed values as production truth.

## 8. Implementation batches (module-specific)

{batches_for(kind, mod_key, wave)}

## 9. Automated tests (module-specific)

{tests_for(kind, mod_key)}

## 10. Visual QA and Work-Step QA

- Visual QA against Decision A PNG / design-system-contract.json for {mod_key}
- Viewports/regions/tolerances exactly as in `FINAL_DESIGN_SYSTEM_CONTRACT.md` / `design-system-contract.json`
- Work-Step QA for **every** in-scope action/workflow ID listed above
- Separate Visual QA / Work-Step QA / Regression agents — **no self-approval**

## 11. Immutable-SHA evidence and resulting state

- Commit evidence under `docs/audits/` with the exact tip SHA
- Resulting-state acceptance evidence required: {resulting}
- Any source change after final QA invalidates final QA

## 12. Localhost handoff

- Port **3000** = owner-visible integration candidate for the exact reported SHA
- Leave server running at stop checkpoint

## 13. Explicit prohibitions

- No PPA unless this prompt is the authorised PPA batch
- No payment execution / bank file / STP / super / mark-as-paid
- No patient records, appointments, clinical notes, patient billing
- No M08 doctor-pay work inside M07 ordinary-prep prompts
- No Executive Blue / Medical Emerald global themes
- No production-approval claims
- No PR/merge unless owner asks

## 14. Stop checkpoint

Commit evidence; leave localhost running; **STOP**. Do not start the next wave/batch until owner acceptance of this tip.
"""
        # Guard: no delegation phrases
        banned = ["sample/full list", "non-exhaustive", "see master register", "see workflow-action-register", "see canonical-screen-register"]
        for b in banned:
            if b in body.lower():
                raise SystemExit(f"banned phrase {b} in prompt {fname}")
        write(prompts_dir / f"{fname}.md", body)
        prompt_index.append({
            "file": f"prompts/{fname}.md",
            "wave": wave,
            "module": mod_key,
            "title": title,
            "predecessorGate": predecessor,
            "startRefRule": "owner-accepted preceding programme tip (not automatic b1152d3)",
            "screenIdCount": len(screen_ids),
            "requirementIdCount": len(req_ids),
            "actionIdCount": len(action_ids),
            "workflowIdCount": len(wf_ids),
        })

    write(prompts_dir / "README.md", f"""# Prompt Pack Index

27 self-contained implementation prompts. Each depends on the **owner-accepted preceding programme tip**, not an automatic start from `b1152d3`.  
Each prompt embeds complete exact screen/requirement/action/workflow IDs (no external delegation).

| File | Wave | Module | Screens | Requirements | Actions | Workflows | Predecessor gate |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
""" + "\n".join(
        f"| `{p['file']}` | {p['wave']} | {p['module']} | {p['screenIdCount']} | {p['requirementIdCount']} | {p['actionIdCount']} | {p['workflowIdCount']} | {p['predecessorGate']} |"
        for p in prompt_index
    ) + f"\n\nGenerated: `{UTC}`\n")

    write(OUT / "PROMPT_PACK_INDEX.json", json.dumps({
        "generatedAt": UTC,
        "count": len(prompt_index),
        "prompts": prompt_index,
        "openOwnerDecisionsRequired": 0,
    }, indent=2))

    # Preserve mismatch-stop narrative (generator-owned copy; does not alter a22f9a1 history)
    write(OUT / "DESIGN_REFERENCE_HASH_MISMATCH_STOP.md", f"""# Design Reference Hash Mismatch — Historical Stop (Preserved)

**Evidence commit:** `a22f9a1e66d918cadc1e3a2026676b3b140025c8`  
**Resolution:** Owner revised Decision A — accept `b5feab7` observed SHA-256 as new canonical baselines (install `66e6e64`).  
**Rule:** Do not delete this history. Prior prompt expected hashes remain as audit fields only.

Generated: `{UTC}`
""")

    write(OUT / "DESIGN_REFERENCE_DECISION_B_QUARANTINE.md", f"""# Design Reference — Decision B Quarantine (Superseded Path)

Decision B quarantine path was **not** selected. Owner revised to Decision A.  
Quarantine tree retained for audit: `docs/design-references/mismatch-quarantine-b5feab7/`.

Generated: `{UTC}`
""")

    print(json.dumps({
        "ok": True,
        "tip": tip,
        "rows": len(rows),
        "screens": len(screen_rows),
        "actions": len(action_items),
        "openDecisions": accounting["openOwnerDecisions"],
        "workflowActionTotals": accounting["workflowActionTotals"],
        "conflictAdjudicationTotals": accounting["conflictAdjudicationTotals"],
    }, indent=2))


if __name__ == "__main__":
    main()

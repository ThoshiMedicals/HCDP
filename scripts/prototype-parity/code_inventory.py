"""Deterministic current-code inventory for Programme Gate P0."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

WORKSPACE_CHAIN = {
    1: [
        "src/modules/m01-command-centre/CommandCentreModule.tsx",
        "src/components/workspaces/DashboardWorkspace.tsx",
        "src/modules/m01-command-centre/adapters/platform.ts",
    ],
    2: [
        "src/modules/m02-action-inbox/ActionInboxModule.tsx",
        "src/components/workspaces/ActionInboxWorkspace.tsx",
        "src/modules/m02-action-inbox/adapters/platform.ts",
    ],
    3: [
        "src/modules/m03-organisation-access/OrganisationAccessModule.tsx",
        "src/components/workspaces/OrganisationWorkspace.tsx",
        "src/modules/m03-organisation-access/adapters/index.ts",
        "src/modules/m03-organisation-access/adapters/org-inbox-sync.ts",
    ],
}

LABEL_SERVICE_HINTS = [
    (r"\bleave\b|\baway\b", ("leave-service", "requestLeave|approveLeave|listLeave|addAvailability")),
    (r"\bcredential|\bahpra\b|\bcertificate\b", ("credential-service", "createCredential|verifyCredential|listCredentials")),
    (r"\bonboard", ("lifecycle-service", "startOnboarding|completeOnboarding|listOnboarding")),
    (r"\boffboard", ("lifecycle-service", "startOffboarding|completeOffboarding|listOffboarding")),
    (r"\brestriction|\brestricted\b", ("lifecycle-service", "createRestriction|listRestrictionsForActor")),
    (r"\bengagement|\bcontract\b|\bemployment\b", ("engagement-service", "createEngagement|updateEngagement")),
    (r"\bstaff\b|\bperson\b|\bpeople\b|\bdoctor\b|\badd staff\b|\badd doctor\b", ("person-service", "createPerson|updatePerson|listPeople|getPerson")),
    (r"\breadiness\b", ("readiness-service", "calculateReadiness|getEffectiveReadiness")),
    (r"\bswap\b|\brelease shift\b", ("swap-service", "requestSwap|approveSwap|rejectSwap|withdrawSwap")),
    (r"\bpublish|\bpublication\b", ("publication-service", "publishPeriod|previewPublication|listPublicationsForActor")),
    (r"\bcoverage\b|\bgap\b", ("coverage-service", "evaluateCoverage|escalateCoverageGap")),
    (r"\bassign\b|\broster\b|\bshift\b", ("assignment-service", "assignPerson|cancelAssignment")),
    (r"\bcost\b|\bforecast\b", ("cost-forecast-service", "buildCostForecast|listCostForecastsForActor")),
    (r"\bconflict\b", ("conflict-service", "evaluateConflicts")),
    (r"\bbulk\b", ("bulk-operation-service", "previewBulk|submitBulk")),
    (r"\backnowledg", ("acknowledgement-service", "acknowledgePublication")),
    (r"\bbreak\b", ("break-service", "startBreak|endBreak")),
    (r"\bclock\b|\battendance\b", ("clock-service|attendance", "clockIn|clockOut|list")),
    (r"\btimesheet\b", ("timesheet", "submit|approve|list")),
    (r"\bexport\b", ("export", "export|buildExport|validateExport")),
    (r"\bdeduction\b|\ballowance\b", ("deduction|allowance", "prepare|list|upsert")),
    (r"\bvariance\b|\bexception\b", ("variance|exception", "list|raise|resolve")),
    (r"\btraining\b|\bcourse\b|\blearning\b|\bcompetenc", ("training|assignment|evidence|competency", "assign|complete|list")),
]


def sorted_paths(paths):
    return sorted({str(p) for p in paths})


def list_module_files(mod_dir: Path):
    if not mod_dir or not mod_dir.is_dir():
        return [], [], [], []
    ts = sorted(mod_dir.rglob("*.ts"), key=lambda p: str(p).replace("\\", "/"))
    tsx = sorted(mod_dir.rglob("*.tsx"), key=lambda p: str(p).replace("\\", "/"))
    files = [p for p in ts + tsx]
    services = [p for p in files if "service" in p.name.lower() or "/services/" in str(p).replace("\\", "/")]
    repos = [p for p in files if "repo" in p.name.lower() or "repository" in p.name.lower()]
    tests = [p for p in files if "/tests/" in str(p).replace("\\", "/") or p.name.endswith(".test.ts") or p.name.endswith(".test.tsx")]
    return files, services, repos, tests


def parse_exports(file_path: Path):
    if not file_path.exists():
        return []
    text = file_path.read_text(encoding="utf-8", errors="replace")
    out = []
    for m in re.finditer(r"export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)", text):
        out.append({"symbol": m.group(1), "kind": "function", "line": text.count("\n", 0, m.start()) + 1})
    for m in re.finditer(r"export\s+const\s+([A-Za-z0-9_]+)\s*=", text):
        out.append({"symbol": m.group(1), "kind": "const", "line": text.count("\n", 0, m.start()) + 1})
    return out


def inventory_module(num: int, mod_dir: Path | None):
    files, services, repos, tests = list_module_files(mod_dir) if mod_dir else ([], [], [], [])
    rel = lambda p: str(p.relative_to(ROOT)).replace("\\", "/")
    service_index = []
    for sp in services:
        for ex in parse_exports(sp):
            service_index.append({
                "path": rel(sp),
                "symbol": ex["symbol"],
                "line": ex["line"],
                "key": f"{rel(sp)}::{ex['symbol']}",
            })
    service_index.sort(key=lambda x: x["key"])
    page_paths = []
    for p in WORKSPACE_CHAIN.get(num, []):
        if (ROOT / p).exists():
            page_paths.append(p)
    # Also include module entry tsx
    if mod_dir:
        for p in sorted(mod_dir.glob("*.tsx"), key=lambda x: str(x)):
            rp = rel(p)
            if rp not in page_paths:
                page_paths.append(rp)
    page_paths = sorted(set(page_paths))
    # Scan workspaces for interactive controls (deterministic)
    working_controls = []
    for pp in page_paths:
        text = (ROOT / pp).read_text(encoding="utf-8", errors="replace")
        # button-like labels in JSX text nodes / aria-label / title
        for m in re.finditer(r"(?:aria-label|title)=[\"']([^\"']{2,80})[\"']", text):
            working_controls.append({
                "componentPath": pp,
                "symbol": m.group(1),
                "line": text.count("\n", 0, m.start()) + 1,
                "kind": "labelled-control",
            })
        for m in re.finditer(r">\s*([A-Z][A-Za-z0-9 /&-]{2,40})\s*<", text):
            label = m.group(1).strip()
            if label.lower() in {"div", "span", "button", "section"}:
                continue
            working_controls.append({
                "componentPath": pp,
                "symbol": label,
                "line": text.count("\n", 0, m.start()) + 1,
                "kind": "jsx-text-control",
            })
        for m in re.finditer(r"\b(on[A-Z][A-Za-z0-9]*)\s*=\s*\{([^}]{1,80})\}", text):
            working_controls.append({
                "componentPath": pp,
                "symbol": m.group(1),
                "handler": m.group(2).strip()[:80],
                "line": text.count("\n", 0, m.start()) + 1,
                "kind": "handler",
            })
    # dedupe deterministically
    seen = set()
    uniq = []
    for c in sorted(working_controls, key=lambda x: (x["componentPath"], x["line"], x["symbol"])):
        key = (c["componentPath"], c["line"], c["symbol"], c.get("handler", ""))
        if key in seen:
            continue
        seen.add(key)
        uniq.append(c)
    return {
        "files": [rel(p) for p in files],
        "services": [rel(p) for p in services],
        "repos": [rel(p) for p in repos],
        "tests": [rel(p) for p in tests],
        "pagePaths": page_paths or ["NONE — NOT IMPLEMENTED"],
        "serviceIndex": service_index,
        "workingControls": uniq[:200],
    }


def classify_control(label: str, kind: str) -> str:
    l = (label or "").lower()
    if kind in ("production-control", "navigation-control") or l.startswith("open section"):
        return "navigation"
    if kind in ("brd-workflow", "blueprint-workflow", "legacy-workflow-group"):
        return "multi-step-workflow"
    if kind == "modal-drawer":
        return "modal"
    if re.search(r"\b(export|download|print|generate report|management pack)\b", l):
        return "export"
    if re.search(r"\b(filter|search|sort|view|open|show|compare|switch clinic|refresh)\b", l):
        return "read-filter"
    if re.search(r"\b(add|create|save|submit|approve|reject|publish|assign|delete|remove|update|edit|clock|request|complete|verify|escalate)\b", l):
        return "command-mutation"
    return "command-mutation" if kind == "brd-button" else "read-filter"


def match_service(label: str, service_index: list[dict], classification: str):
    if classification in ("navigation", "read-filter") and not re.search(r"\b(save|submit|approve|publish|assign|create|add)\b", (label or ""), re.I):
        return {
            "servicePath": "NOT APPLICABLE — navigation/read control (no domain mutation)",
            "serviceMethod": "NOT APPLICABLE — no service method",
            "repositoryPath": "NOT APPLICABLE — no persistence for navigation/read",
            "matchConfidence": "n/a",
        }
    if not service_index:
        return {
            "servicePath": "NONE — NOT IMPLEMENTED",
            "serviceMethod": "NONE — NOT IMPLEMENTED",
            "repositoryPath": "NONE — NOT IMPLEMENTED",
            "matchConfidence": "none",
        }
    l = (label or "").lower()
    tokens = [t for t in re.split(r"[^a-z0-9]+", l) if len(t) >= 3]

    best = None
    best_score = -1
    for entry in service_index:
        sym = entry["symbol"]
        path = entry["path"]
        score = 0
        sym_l = sym.lower()
        path_l = path.lower()
        for t in tokens:
            if t in sym_l:
                score += 5
            if t in path_l:
                score += 2
        for pat, (path_hint, sym_hint) in LABEL_SERVICE_HINTS:
            if re.search(pat, l):
                if re.search(path_hint, path_l):
                    score += 8
                if re.search(sym_hint, sym, re.I):
                    score += 10
        if score > best_score:
            best_score = score
            best = entry
    if not best or best_score < 5:
        return {
            "servicePath": "NONE — NOT IMPLEMENTED",
            "serviceMethod": "NONE — NOT IMPLEMENTED",
            "repositoryPath": "NONE — NOT IMPLEMENTED",
            "matchConfidence": f"unmatched:{best_score}",
        }
    # repository: prefer module repo files mentioning similar tokens
    return {
        "servicePath": best["path"],
        "serviceMethod": f"{best['symbol']} (line {best['line']})",
        "repositoryPath": "module-local repository via service (see service file imports)",
        "matchConfidence": f"scored:{best_score}",
        "componentHandler": f"{best['path']}::{best['symbol']}",
    }


def score_section(label: str, section_label: str) -> int:
    a = set(t for t in re.split(r"[^a-z0-9]+", (label or "").lower()) if len(t) >= 3)
    b = set(t for t in re.split(r"[^a-z0-9]+", (section_label or "").lower()) if len(t) >= 3)
    if not a or not b:
        return 0
    return len(a & b) * 3 + (2 if any(x in (section_label or "").lower() for x in a) else 0)

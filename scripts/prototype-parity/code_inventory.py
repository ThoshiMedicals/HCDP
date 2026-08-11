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

# Static / display-only labels that must never be counted as production controls
STATIC_LABEL_RE = re.compile(
    r"^(?:Module\s+\d+|You are offline|No .+ yet|Acting as|Demo controls|"
    r"Notifications|Training Management(?: sections)?|"
    r"Organisation\s*&\s*Access|Healthcare Doctors Pulse\b.*|"
    r"Internal sections|Legacy features identified|Rebuild pending|"
    r"Interactive rebuild|Inbox events not wired yet|Can create Action Inbox items)$",
    re.I,
)

HEADING_ONLY_RE = re.compile(r"^Module\s+\d+$", re.I)

INTERACTIVE_OPEN_RE = re.compile(
    r"<(?P<tag>button|a|input|select|textarea|option|summary|"
    r"Button|Link|NavLink|Menu\.Item|MenuItem|DropdownMenuItem|"
    r"SelectTrigger|TabsTrigger|Checkbox|Switch|RadioGroup\.Item)\b",
    re.I,
)

HANDLER_RE = re.compile(
    r"\b(?P<handler>on(?:Click|Change|Submit|Navigate|Refresh|Close|Select|Toggle|KeyDown|Input))\s*=\s*\{(?P<body>[^}]{1,160})\}"
)

ARIA_OR_TITLE_RE = re.compile(r"""(?:aria-label|title)=["']([^"']{2,80})["']""")

CHILDREN_TEXT_RE = re.compile(r">\s*([^<{][^<]{0,60}?)\s*<")


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


def _line_at(text: str, idx: int) -> int:
    return text.count("\n", 0, idx) + 1


def _window_before(text: str, idx: int, chars: int = 240) -> str:
    return text[max(0, idx - chars) : idx]


def _window_after(text: str, idx: int, chars: int = 220) -> str:
    return text[idx : idx + chars]


def _is_static_label(label: str) -> bool:
    lab = (label or "").strip()
    if not lab:
        return True
    if STATIC_LABEL_RE.match(lab):
        return True
    if HEADING_ONLY_RE.match(lab):
        return True
    # Prop names alone are not visible controls
    if lab in {"onClick", "onChange", "onSubmit", "onNavigate", "onRefresh", "onClose", "onSelect"}:
        return True
    return False


def _detect_placeholder_shell(text: str, page_path: str) -> dict:
    """Distinguish ModuleLanding / heading-only shells from interactive workspaces."""
    uses_landing = "ModuleLanding" in text
    has_h1_module = bool(re.search(r"<h1[^>]*>\s*Module\s+\d+\s*</h1>", text, re.I))
    interactive_hits = len(list(HANDLER_RE.finditer(text))) + len(list(INTERACTIVE_OPEN_RE.finditer(text)))
    # Entry files that only mount ModuleLanding (or missing-register heading) are placeholder shells
    is_entry_module = bool(re.search(r"m\d{2}-.*/.*Module\.tsx$", page_path.replace("\\", "/")))
    placeholder = False
    if uses_landing and interactive_hits <= 1 and is_entry_module:
        placeholder = True
    elif has_h1_module and interactive_hits == 0:
        placeholder = True
    elif uses_landing and is_entry_module and not re.search(r"\bonClick\b|\bonChange\b|<Button\b|<button\b", text):
        placeholder = True
    return {
        "placeholderShell": placeholder,
        "usesModuleLanding": uses_landing,
        "headingOnlyFallback": has_h1_module,
        "interactiveSignalCount": interactive_hits,
    }


def extract_working_controls(text: str, page_path: str) -> list[dict]:
    """
    Production controls require interaction evidence:
    button/link/input/select/menu, event handler, routed navigation, form submit,
    or callable command/workflow trigger.
    Static headings, card titles, module names, paragraphs, badges, display-only labels
    are excluded.
    """
    controls: list[dict] = []
    shell = _detect_placeholder_shell(text, page_path)
    if shell["placeholderShell"]:
        # Placeholder shells contribute zero production controls (nav lives in registry).
        return []

    for m in HANDLER_RE.finditer(text):
        handler_name = m.group("handler")
        handler_body = m.group("body").strip()
        start = m.start()
        before = _window_before(text, start)
        after = _window_after(text, m.end())
        open_m = None
        for om in INTERACTIVE_OPEN_RE.finditer(before):
            open_m = om
        # JSX prop forwarding onto child components (onNavigate={...}) still counts
        element_type = open_m.group("tag") if open_m else f"handler-prop:{handler_name}"
        label = None
        aria = ARIA_OR_TITLE_RE.search(before[open_m.start() :] if open_m else before[-120:])
        if not aria:
            aria = ARIA_OR_TITLE_RE.search(after[:160])
        if aria:
            label = aria.group(1).strip()
        if not label:
            child = CHILDREN_TEXT_RE.search(after[:180])
            if child:
                label = child.group(1).strip()
        if not label:
            # Derive a readable label from the handler body when children are expressions
            compact = re.sub(r"\s+", " ", handler_body)[:60]
            label = f"{handler_name} -> {compact}"
        if _is_static_label(label) and handler_name not in {"onClick", "onChange", "onSubmit", "onNavigate", "onRefresh"}:
            continue
        if HEADING_ONLY_RE.match(label or ""):
            continue
        # Navigation target / behaviour
        nav_target = None
        nav_m = re.search(
            r"""(?:navigate|setSection|onNavigate|href|router\.push)\s*\(\s*['"`]([^'"`]+)['"`]""",
            handler_body,
        )
        if not nav_m:
            nav_m = re.search(r"""href=\{?['"`]([^'"`]+)['"`]\}?""", before + after)
        if nav_m:
            nav_target = nav_m.group(1)
        behaviour = f"invoke {handler_name} -> {re.sub(r'\\s+', ' ', handler_body)[:100]}"
        if nav_target:
            behaviour = f"navigate/set section -> {nav_target}"
        controls.append({
            "componentPath": page_path,
            "symbol": label,
            "visibleLabel": label,
            "elementType": element_type,
            "handler": f"{handler_name}={{{handler_body[:80]}}}",
            "handlerName": handler_name,
            "navigationTarget": nav_target or "",
            "behaviour": behaviour,
            "line": _line_at(text, start),
            "kind": "interactive-control",
            "implementationStatus": "implemented-interactive",
            "placeholderShell": False,
        })

    # Standalone Link/anchor with href and visible label (no onClick required)
    for m in re.finditer(
        r"""<(?:Link|a)\b([^>]*?)>([^<]{1,60})</(?:Link|a)>""",
        text,
        re.I | re.S,
    ):
        attrs, child = m.group(1), m.group(2).strip()
        href_m = re.search(r"""href=\{?['"`]([^'"`]+)['"`]\}?""", attrs)
        if not href_m:
            href_m = re.search(r"""href=\{`([^`]+)`\}""", attrs)
        if not href_m:
            continue
        label = child.strip()
        if _is_static_label(label) or HEADING_ONLY_RE.match(label):
            continue
        # Skip if already captured via nearby handler at same line
        line = _line_at(text, m.start())
        if any(c["line"] == line and c["componentPath"] == page_path for c in controls):
            continue
        controls.append({
            "componentPath": page_path,
            "symbol": label,
            "visibleLabel": label,
            "elementType": "Link" if m.group(0).lstrip().startswith("<Link") else "a",
            "handler": f"href={href_m.group(1)}",
            "handlerName": "href",
            "navigationTarget": href_m.group(1),
            "behaviour": f"routed navigation -> {href_m.group(1)}",
            "line": line,
            "kind": "interactive-control",
            "implementationStatus": "implemented-interactive",
            "placeholderShell": False,
        })

    # Deduplicate by path/line/handler
    seen = set()
    uniq = []
    for c in sorted(controls, key=lambda x: (x["componentPath"], x["line"], x["symbol"])):
        key = (c["componentPath"], c["line"], c.get("handlerName", ""), c.get("handler", ""))
        if key in seen:
            continue
        seen.add(key)
        uniq.append(c)
    return uniq[:200]


def inventory_module(num: int, mod_dir: Path | None):
    mod_dir = mod_dir.resolve() if mod_dir else None
    files, services, repos, tests = list_module_files(mod_dir) if mod_dir else ([], [], [], [])
    def rel(p: Path) -> str:
        p = p if p.is_absolute() else (ROOT / p)
        return str(p.resolve().relative_to(ROOT.resolve())).replace("\\", "/")
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
    if mod_dir:
        for p in sorted(mod_dir.glob("*.tsx"), key=lambda x: str(x)):
            rp = rel(p)
            if rp not in page_paths:
                page_paths.append(rp)
        # Prefer *Workspace.tsx when present
        for p in sorted(mod_dir.rglob("*Workspace.tsx"), key=lambda x: str(x)):
            rp = rel(p)
            if rp not in page_paths:
                page_paths.append(rp)
    page_paths = sorted(set(page_paths))

    working_controls = []
    shell_meta = {
        "placeholderShell": False,
        "usesModuleLanding": False,
        "headingOnlyFallback": False,
        "interactiveSignalCount": 0,
        "shellStatus": "interactive-or-partial",
    }
    for pp in page_paths:
        text = (ROOT / pp).read_text(encoding="utf-8", errors="replace")
        meta = _detect_placeholder_shell(text, pp)
        if meta["placeholderShell"]:
            shell_meta["placeholderShell"] = True
            shell_meta["shellStatus"] = "placeholder-shell"
        if meta["usesModuleLanding"]:
            shell_meta["usesModuleLanding"] = True
        if meta["headingOnlyFallback"]:
            shell_meta["headingOnlyFallback"] = True
        shell_meta["interactiveSignalCount"] += meta["interactiveSignalCount"]
        working_controls.extend(extract_working_controls(text, pp))

    # If every scanned page is a ModuleLanding entry with no workspace, force zero controls
    if shell_meta["placeholderShell"] and not any("Workspace" in p for p in page_paths):
        working_controls = []
        shell_meta["shellStatus"] = "placeholder-shell"

    # Deduplicate across files
    seen = set()
    uniq = []
    for c in sorted(working_controls, key=lambda x: (x["componentPath"], x["line"], x["symbol"])):
        key = (c["componentPath"], c["line"], c.get("handler", ""), c["symbol"])
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
        "shellMeta": shell_meta,
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

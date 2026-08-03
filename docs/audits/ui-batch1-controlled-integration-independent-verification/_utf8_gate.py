from pathlib import Path
import re
import subprocess

ev = Path("docs/audits/ui-batch1-controlled-integration-independent-verification")
ev.mkdir(parents=True, exist_ok=True)
lines = []

r = subprocess.check_output(
    [
        "git",
        "diff",
        "--name-status",
        "a15d325a5e6dd13a6da216e929aaef38440b8361",
        "e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8",
    ],
    text=True,
)
lines.append("=== a15d325...e5e41a0 name-status ===")
lines.append(r.strip() or "(empty)")

chk = subprocess.run(
    [
        "git",
        "diff",
        "--check",
        "a15d325a5e6dd13a6da216e929aaef38440b8361",
        "e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8",
    ],
    capture_output=True,
    text=True,
)
lines.append("=== git diff --check ===")
lines.append(chk.stdout.strip() or chk.stderr.strip() or "(clean)")

path = Path("docs/audits/HCDP_UI_BATCH1_CONTROLLED_INTEGRATION_REPORT.md")
raw = path.read_bytes()
bom = raw.startswith(b"\xef\xbb\xbf")
text = raw.decode("utf-8-sig")
lines.append(f"BOM={bom}")
expected_prefix = "# HCDP \u2014"
lines.append(f"starts_with_exact={text.startswith(expected_prefix)}")
lines.append(f"first_20={text[:20]!r}")

# Mojibake sequences when UTF-8 was misread as Windows-1252/Latin-1
corrupted = {
    "emdash_mojibake": "â€”",
    "arrow_mojibake": "â†’",
    "ellipsis_mojibake": "â€¦",
    "apos_mojibake": "â€™",
    "bom_mojibake": "ï»¿",
}
for label, seq in corrupted.items():
    lines.append(f"corrupted_{label}_present={seq in text}")

lines.append(f"contains_real_emdash={chr(0x2014) in text}")
lines.append(f"contains_real_arrow={chr(0x2192) in text}")

prod = subprocess.check_output(
    [
        "git",
        "diff",
        "--name-only",
        "a15d325a5e6dd13a6da216e929aaef38440b8361",
        "e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8",
        "--",
        ".",
        ":(exclude)docs",
    ],
    text=True,
)
lines.append(f"non_docs_diff_empty={not prod.strip()}")

for m in [
    "25de6f1",
    "def2c69",
    "a15d325",
    "22348",
    "localhost:3000",
    "7c14854a",
    "PASS",
    "QUALIFIED",
    "FAIL",
    "residual",
]:
    lines.append(f"marker_{m}={m in text}")

rows = [
    ln
    for ln in text.splitlines()
    if re.search(r"\|\s*(PASS|QUALIFIED|FAIL|BLOCKED)\s*\|", ln)
]
lines.append(f"verdict_table_rows={len(rows)}")
for ln in rows:
    lines.append("VERDICT_ROW: " + ln.strip())

out = ev / "utf8-correction-gate.txt"
out.write_text("\n".join(lines), encoding="utf-8")
print(out.read_text(encoding="utf-8"))

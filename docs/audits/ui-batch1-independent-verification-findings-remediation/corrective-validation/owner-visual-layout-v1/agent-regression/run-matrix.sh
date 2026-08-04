#!/usr/bin/env bash
set -u
WT=/tmp/hcdp-fix/ui-batch1-reg-3493
EV=/tmp/hcdp-fix/ui-batch1-vf-fixes/docs/audits/ui-batch1-independent-verification-findings-remediation/corrective-validation/owner-visual-layout-v1/agent-regression
LOG="$EV/logs/29-prod-matrix.log"
cd "$WT"
START=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "START=$START" > "$LOG"
export HCDP_BASE_URL=http://127.0.0.1:3493
export HCDP_OUT_DIR=_agent_regression_out/prod-matrix
export HCDP_MODE=production
export HCDP_PROFILE=full-matrix
export HCDP_APP_SHA=d822dfd4a80ed0c98635a0ff8631f9e39fe781f0
node scripts/ui-batch1-iv-findings-remediation-validate.mjs >> "$LOG" 2>&1
EC=$?
FINISH=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "EXIT=$EC START=$START FINISH=$FINISH" >> "$LOG"
echo "MATRIX_DONE EC=$EC"
exit $EC

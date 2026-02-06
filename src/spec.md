# Specification

## Summary
**Goal:** Fix the production publish/deployment flow so the latest draft can be deployed successfully, with clearer diagnostics and a pre-publish verification step.

**Planned changes:**
- Identify and fix the root cause of the production publish/deployment failure so the standard deploy flow completes without errors.
- Improve deploy failure diagnostics to surface the underlying tool/command error and clearly indicate which step failed (frontend build, canister build, deploy).
- Add a pre-publish verification step that can be run locally/CI to fail fast on common deployment blockers (e.g., frontend build issues, missing artifacts, misconfigured deploy/canister settings).

**User-visible outcome:** Publishing the latest draft to production succeeds and the deployed app loads and renders the main experience UI (lock screen → intro → hero/memories), with clearer English error output if deployment fails.

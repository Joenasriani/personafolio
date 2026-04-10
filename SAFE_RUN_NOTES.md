Use /run-safe as the active sparse-source-safe runner.

Current state:
- /run still uses the older strict pipeline route.
- /run-safe uses /api/jobs-live/[jobId]/run-safe.
- /api/jobs-live/[jobId]/generate-fallback can build generation input from fallback signals when extracted_facts is empty.

Recommended next cleanup:
1. Update the main /run page to call /run-safe backend logic.
2. Replace the old strict /run endpoint implementation with the safe route logic.
3. Remove duplicate/mock pages once the safe flow is verified.

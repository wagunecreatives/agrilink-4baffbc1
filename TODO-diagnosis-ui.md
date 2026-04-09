# Diagnosis UI Fields Fix

## Issue:
Edge returns perfect JSON but client `normalizeDiagnosis` shows "Unknown"

## Root Cause:
`src/lib/diagnosis.ts` `toText()` mangles JSON fields

## Plan:
1. **src/lib/diagnosis.ts**: Fix `normalizeDiagnosis` to use raw data
2. **CropDiagnosis.tsx**: Debug `data.diagnosis` logging
3. Test: Cabbage → "Cabbage" (not Unknown)

**Priority**: High - UI shows wrong data


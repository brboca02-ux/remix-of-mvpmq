I will fix the 172-record limit in GLeads CSV imports by addressing the line-splitting logic, optimizing the import process for large volumes, and fixing race conditions in progress tracking.

### Technical Details
- **Line Splitting**: Update `leads-parser.ts` and `csv-smart-parser.ts` to handle all common line endings (`\n`, `\r\n`, and `\r`).
- **Progress Tracking**: Fix the race condition in `processImportJobChunk` where parallel chunk processing was overwriting the `processed_rows` counter.
- **Import Capacity**: Increase chunk sizes and ensure the frontend correctly handles large file reads without truncation.
- **Encoding**: Standardize file decoding to handle Latin-1 (common in Brazilian Excel exports) consistently across validation and import.

### Steps
1. Update `src/lib/leads-parser.ts` and `src/lib/csv-smart-parser.ts` to use a more robust line-splitting regex.
2. Refactor `processImportJobChunk` in `src/lib/leads-import.functions.ts` to use a more reliable progress update logic.
3. Update `ImportLeadsDialog.tsx` to ensure consistent file reading and larger batch processing.
4. Verify the fix by reviewing the logic for 2000+ records.

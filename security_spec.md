# Security Specification - Khamar Bondhu

## 1. Data Invariants
- **User Profiles**: Every user must have a profile. A user can only read/write their own profile.
- **Batches**: Only users with `role == 'admin'` in their profile can create or update batches.
- **Daily Logs**: Workers and Admins can create logs. Logs must be linked to a valid batch.
- **Expenses/Sales**: Only Admins can see/manage financial data.
- **Immutable Fields**: `id`, `createdAt`, `ownerId` (if applicable) must be immutable.

## 2. The "Dirty Dozen" Payloads (Targets for PERMISSION_DENIED)

1. **Identity Spoofing**: Attempt to create a user profile with a different `id` than `request.auth.uid`.
2. **Privilege Escalation**: Attempt to update own profile to set `role: 'admin'`.
3. **Orphaned Log**: Create a `dailyLog` referencing a non-existent `batchId`.
4. **Unauthorized Batch Creation**: A worker attempting to create a new `batch`.
5. **Unauthorized Sales Access**: A worker attempting to read the `sales` collection.
6. **Shadow Field Injection**: Adding a `bonus: true` field to a `batch` update.
7. **Terminal State Bypass**: Attempting to edit a `batch` that is already `closed`.
8. **Malicious ID**: Using a 2KB string as a `batchId`.
9. **Timestamp Manipulation**: Sending a client-side `createdAt` date instead of `serverTimestamp()`.
10. **PII Leak**: A user attempting to read another user's private profile.
11. **Negative Amount**: Creating an `expense` with `amount: -500`.
12. **Mass Batch Update**: Attempting to update `initialChicks` on an existing batch (only status or name should be editable).

## 3. Test Runner Concept
The tests will verify that all write operations use `isValid[Entity]` and that non-admin users cannot access restricted collections.

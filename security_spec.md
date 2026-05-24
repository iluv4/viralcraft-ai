# ViralCraft AI Security Specification

## Data Invariants
1. A Project must belong to a specific user (userId).
2. Users can only read, create, update, or delete their own projects.
3. User profiles can only be managed by the authenticating user.
4. Timestamps (createdAt) must be set on the server.
5. project IDs and owner IDs are immutable after creation.

## The Dirty Dozen (Attack Payloads)
1. **Identity Spoofing**: Attempt to create a project with a `userId` different from `request.auth.uid`.
2. **Project Hijacking**: Attempt to read a project that belongs to another user.
3. **Malicious Update**: Attempt to change the `userId` of an existing project.
4. **Shadow Field Injection**: Attempt to create a project with undocumented fields like `isAdmin: true`.
5. **PII Leak**: Attempt to read another user's profile metadata.
6. **Resource Exhaustion**: Attempt to create a document with a 2MB string ID.
7. **Type Poisoning**: Attempt to update `viralScore` with a string instead of an integer.
8. **Bypassing CTA**: Attempt to update a project's CTA field without being the owner.
9. **Timestamp Manipulation**: Attempt to set a custom `createdAt` date in the past.
10. **State Corruption**: Attempt to update immutable fields like `originalLink`.
11. **Orphaned Writes**: Attempt to create a project without a valid user document (using exists check).
12. **Dirty Read**: Attempt to list projects and filter them on the client side without rule-level enforcement.

## Firestore Rules Draft
(Rules will be implemented in firestore.rules)

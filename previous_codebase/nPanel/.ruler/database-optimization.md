
    Prisma ORM Development Guidelines
    You are a senior TypeScript/JavaScript programmer with expertise in Prisma ORM, clean code principles, and modern backend development.

    Generate code, corrections, and refactorings that comply with the following guidelines:

    TypeScript General Guidelines

    Basic Principles

    - Use English for all code and documentation.
    - Always declare explicit types for variables and functions.
      - Avoid using "any".
      - Create precise, descriptive types.
    - Use JSDoc to document public classes and methods.
    - Maintain a single export per file.
    - Write self-documenting, intention-revealing code.

    Nomenclature

    - Use PascalCase for classes and interfaces.
    - Use camelCase for variables, functions, methods.
    - Use kebab-case for file and directory names.
    - Use UPPERCASE for environment variables and constants.
    - Start function names with a verb.
    - Use verb-based names for boolean variables:
      - isLoading, hasError, canDelete
    - Use complete words, avoiding unnecessary abbreviations.
      - Exceptions: standard abbreviations like API, URL
      - Accepted short forms: 
        - i, j for loop indices
        - err for errors
        - ctx for contexts

    Functions

    - Write concise, single-purpose functions.
      - Aim for less than 20 lines of code.
    - Name functions descriptively with a verb.
    - Minimize function complexity:
      - Use early returns.
      - Extract complex logic to utility functions.
    - Leverage functional programming techniques:
      - Prefer map, filter, reduce.
      - Use arrow functions for simple operations.
      - Use named functions for complex logic.
    - Use object parameters for multiple arguments.
    - Maintain a single level of abstraction.

    Data Handling

    - Encapsulate data in composite types.
    - Prefer immutability.
      - Use readonly for unchanging data.
      - Use as const for literal values.
    - Validate data at the boundaries.

    Error Handling

    - Use specific, descriptive error types.
    - Provide context in error messages.
    - Use global error handling where appropriate.
    - Log errors with sufficient context.

    Prisma-Specific Guidelines

    Schema Design

    - Use meaningful, domain-driven model names.
    - Leverage Prisma schema features:
      - Use @id for primary keys.
      - Use @unique for natural unique identifiers.
      - Utilize @relation for explicit relationship definitions.
    - Keep schemas normalized and DRY.
    - Use meaningful field names and types.
    - Implement soft delete with deletedAt timestamp.
    - Use Prisma's native type decorators.

    Prisma Client Usage

    - Always use type-safe Prisma client operations.
    - Prefer transactions for complex, multi-step operations.
    - Use Prisma middleware for cross-cutting concerns:
      - Logging
      - Soft delete
      - Auditing
    - Handle optional relations explicitly.
    - Use Prisma's filtering and pagination capabilities.

    Database Migrations

    - Create migrations for schema changes.
    - Use descriptive migration names.
    - Review migrations before applying.
    - Never modify existing migrations.
    - Keep migrations idempotent.

    Error Handling with Prisma

    - Catch and handle Prisma-specific errors:
      - PrismaClientKnownRequestError
      - PrismaClientUnknownRequestError
      - PrismaClientValidationError
    - Provide user-friendly error messages.
    - Log detailed error information for debugging.

    Testing Prisma Code

    - Use in-memory database for unit tests.
    - Mock Prisma client for isolated testing.
    - Test different scenarios:
      - Successful operations
      - Error cases
      - Edge conditions
    - Use factory methods for test data generation.
    - Implement integration tests with actual database.

    Performance Considerations

    - Use select and include judiciously.
    - Avoid N+1 query problems.
    - Use findMany with take and skip for pagination.
    - Leverage Prisma's distinct for unique results.
    - Profile and optimize database queries.

    Security Best Practices

    - Never expose raw Prisma client in APIs.
    - Use input validation before database operations.
    - Implement row-level security.
    - Sanitize and validate all user inputs.
    - Use Prisma's built-in protections against SQL injection.

    Coding Style

    - Keep Prisma-related code in dedicated repositories/modules.
    - Separate data access logic from business logic.
    - Create repository patterns for complex queries.
    - Use dependency injection for Prisma services.

    Code Quality

    - Follow SOLID principles.
    - Prefer composition over inheritance.
    - Write clean, readable, and maintainable code.
    - Continuously refactor and improve code structure.

    Development Workflow

    - Use version control (Git).
    - Implement comprehensive test coverage.
    - Use continuous integration.
    - Perform regular code reviews.
    - Keep dependencies up to date.
    
    
# Database Query Optimization Rules

This document defines the database query optimization patterns and rules that MUST be followed when writing new code or modifying existing code in this project. These rules are critical for preventing database connection exhaustion and ensuring optimal performance.

## Core Principles

1. **Minimize Connection Usage**: Every database query consumes a connection from the pool. Batch related operations to reduce connection usage.
2. **Use Transactions for Related Operations**: Group related database operations in transactions to ensure atomicity and reduce connection usage.
3. **Leverage Session Data**: Use session data (like user role) instead of querying the database when available.
4. **Parallelize Independent Queries**: Use `Promise.all()` for queries that don't depend on each other.

## Rule 1: Transaction Batching for Related Operations

**ALWAYS** batch related database operations in a single transaction when they:
- Are part of the same logical operation
- Need to be atomic (all succeed or all fail)
- Are executed sequentially

### ✅ CORRECT - Batched in Transaction

```typescript
// Update user and log activity in a single transaction
await prisma.$transaction(async (tx) => {
  const updated = await tx.user.update({
    where: { id: userId },
    data: { name: newName },
  });

  await tx.userActivityLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: updated.id,
      action: "PROFILE_UPDATED",
      // ...
    },
  });

  return updated;
});
```

### ❌ INCORRECT - Sequential Queries

```typescript
// DON'T DO THIS - Uses 2 separate connections
const updated = await prisma.user.update({
  where: { id: userId },
  data: { name: newName },
});

await prisma.userActivityLog.create({
  data: {
    id: crypto.randomUUID(),
    userId: updated.id,
    action: "PROFILE_UPDATED",
    // ...
  },
});
```

## Rule 2: Use Session Data Instead of Querying

**ALWAYS** check if data is available in the session before querying the database.

### ✅ CORRECT - Use Session Role

```typescript
async function getAuthenticatedUser(ctx: Context) {
  const user = ctx.session?.user;
  if (!user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Use role from session if available (set by auth hooks)
  const sessionRole = (user as { role?: string })?.role;
  
  if (sessionRole) {
    // Role is in session, no need to query database
    return { id: user.id, role: sessionRole };
  }

  // Fallback: Query database only if role not in session
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true },
  });

  return { id: dbUser.id, role: dbUser.role };
}
```

### ❌ INCORRECT - Always Querying Database

```typescript
// DON'T DO THIS - Unnecessary database query
async function getAuthenticatedUser(ctx: Context) {
  const user = ctx.session?.user;
  if (!user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Always queries database even if role is in session
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true },
  });

  return { id: dbUser.id, role: dbUser.role };
}
```

## Rule 3: Parallelize Independent Queries

**ALWAYS** use `Promise.all()` for queries that don't depend on each other's results.

### ✅ CORRECT - Parallel Queries

```typescript
// Check user membership and pending invites in parallel
const [existingMember, existingInvite] = await Promise.all([
  prisma.user.findUnique({
    where: { email: input.email },
    include: {
      teamMemberships: {
        where: { teamId: input.teamId },
      },
    },
  }),
  prisma.teamInvite.findFirst({
    where: {
      teamId: input.teamId,
      email: input.email,
      status: "PENDING",
    },
  }),
]);
```

### ❌ INCORRECT - Sequential Independent Queries

```typescript
// DON'T DO THIS - Sequential queries that could be parallel
const existingMember = await prisma.user.findUnique({
  where: { email: input.email },
  include: {
    teamMemberships: {
      where: { teamId: input.teamId },
    },
  },
});

const existingInvite = await prisma.teamInvite.findFirst({
  where: {
    teamId: input.teamId,
    email: input.email,
    status: "PENDING",
  },
});
```

## Rule 4: Batch Activity Logging

**ALWAYS** batch multiple activity log entries in a transaction when logging multiple events.

### ✅ CORRECT - Batched Activity Logs

```typescript
// Batch all activity logs in a single transaction
const activityLogs = results
  .map((result) => {
    // ... create log data
    return logData;
  })
  .filter((log): log is NonNullable<typeof log> => log !== null);

if (activityLogs.length > 0) {
  await prisma.$transaction(
    activityLogs.map((log) =>
      prisma.userActivityLog.create({ data: log })
    )
  );
}
```

### ❌ INCORRECT - Sequential Activity Logs

```typescript
// DON'T DO THIS - Each log uses a separate connection
for (const result of results) {
  await prisma.userActivityLog.create({
    data: {
      // ... log data
    },
  });
}
```

## Rule 5: Combine Membership Checks with Updates

**ALWAYS** combine membership verification and updates in a single transaction when possible.

### ✅ CORRECT - Combined in Transaction

```typescript
// Verify membership and update lastAccessedTeamId in a single transaction
await prisma.$transaction(async (tx) => {
  const membership = await tx.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: input.teamId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this team");
  }

  await tx.user.update({
    where: { id: userId },
    data: { lastAccessedTeamId: input.teamId },
  });
});
```

### ❌ INCORRECT - Sequential Check and Update

```typescript
// DON'T DO THIS - Uses 2 separate connections
const membership = await prisma.teamMember.findUnique({
  where: {
    teamId_userId: {
      teamId: input.teamId,
      userId,
    },
  },
});

if (!membership) {
  throw new Error("You are not a member of this team");
}

await prisma.user.update({
  where: { id: userId },
  data: { lastAccessedTeamId: input.teamId },
});
```

## Rule 6: Optimize User Creation/Update Flows

**ALWAYS** minimize queries when creating or updating users.

### ✅ CORRECT - Optimized User Creation

```typescript
// Get user, update role if needed, return updated user (1-2 queries instead of 3)
let updatedUser = await prisma.user.findUnique({
  where: { email: input.email },
});

if (!updatedUser) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "User was created but could not be retrieved",
  });
}

// Update user role if needed
if (input.role && input.role !== updatedUser.role) {
  updatedUser = await prisma.user.update({
    where: { id: updatedUser.id },
    data: { role: input.role },
  });
}
```

### ❌ INCORRECT - Multiple Sequential Queries

```typescript
// DON'T DO THIS - 3 separate queries
const user = await prisma.user.findUnique({
  where: { email: input.email },
});

await prisma.user.update({
  where: { id: user.id },
  data: { role: input.role },
});

const updatedUser = await prisma.user.findUnique({
  where: { id: user.id },
});
```

## Rule 7: Batch Profile Updates

**ALWAYS** batch user and profile updates in a transaction.

### ✅ CORRECT - Batched Profile Update

```typescript
await prisma.$transaction(async (tx) => {
  // Update user name if provided
  if (name) {
    await tx.user.update({
      where: { id: userId },
      data: { name, updatedAt: new Date() },
    });
  }

  // Update or create profile
  if (existingProfile) {
    await tx.userProfile.update({
      where: { userId },
      data: profileData,
    });
  } else {
    await tx.userProfile.create({
      data: { id: crypto.randomUUID(), userId, ...profileData },
    });
  }

  // Log activity
  await tx.userActivityLog.create({
    data: { /* ... */ },
  });
});
```

### ❌ INCORRECT - Sequential Profile Updates

```typescript
// DON'T DO THIS - Multiple separate connections
if (name) {
  await prisma.user.update({ /* ... */ });
}

if (existingProfile) {
  await prisma.userProfile.update({ /* ... */ });
} else {
  await prisma.userProfile.create({ /* ... */ });
}

await prisma.userActivityLog.create({ /* ... */ });
```

## Rule 8: Optimize Helper Functions

**ALWAYS** optimize helper functions that are called frequently (like `getUserRole`, `getAuthenticatedUser`).

### ✅ CORRECT - Optimized Helper

```typescript
/**
 * Get user role - optimized to use session role when available
 */
async function getUserRole(userId: string, sessionUser?: { role?: string }): Promise<string> {
  // Use role from session if available
  if (sessionUser?.role) {
    return sessionUser.role;
  }

  // Fallback: Query database only if role not in session
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return dbUser.role;
}

// Usage: Pass session user to avoid query
const userRole = await getUserRole(session.user.id, session.user as { role?: string });
```

### ❌ INCORRECT - Always Querying

```typescript
// DON'T DO THIS - Always queries database
async function getUserRole(userId: string): Promise<string> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return dbUser.role;
}
```

## Rule 9: Batch Integration Operations

**ALWAYS** batch integration creation with related activity logs.

### ✅ CORRECT - Batched Integration Creation

```typescript
const integration = await prisma.$transaction(async (tx) => {
  const integration = await tx.customerIntegration.create({
    data: { /* ... */ },
  });

  // Log activities in parallel
  await Promise.all([
    tx.customerIntegrationActivityLog.create({
      data: { /* ... */ },
    }),
    tx.userActivityLog.create({
      data: { /* ... */ },
    }),
  ]);

  return integration;
});
```

### ❌ INCORRECT - Sequential Integration Operations

```typescript
// DON'T DO THIS - Multiple separate connections
const integration = await prisma.customerIntegration.create({
  data: { /* ... */ },
});

await prisma.customerIntegrationActivityLog.create({
  data: { /* ... */ },
});

await prisma.userActivityLog.create({
  data: { /* ... */ },
});
```

## Rule 10: Combine Lookups with Updates

**ALWAYS** combine lookups and updates in transactions when the lookup is only for validation.

### ✅ CORRECT - Combined Lookup and Update

```typescript
await prisma.$transaction(async (tx) => {
  // Check if user is already a member (inside transaction)
  const existingMembership = await tx.teamMember.findFirst({
    where: { teamId: invite.team.id, userId },
  });

  if (existingMembership) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You are already a member of this team",
    });
  }

  // Add user as team member
  await tx.teamMember.create({ /* ... */ });

  // Update invite status
  await tx.teamInvite.update({ /* ... */ });

  // Update user's lastAccessedTeamId
  await tx.user.update({ /* ... */ });

  // Log activity
  await tx.userActivityLog.create({ /* ... */ });
});
```

### ❌ INCORRECT - Separate Lookup and Update

```typescript
// DON'T DO THIS - Lookup uses separate connection
const existingMembership = await prisma.teamMember.findFirst({
  where: { teamId: invite.team.id, userId },
});

if (existingMembership) {
  throw new TRPCError({ /* ... */ });
}

// Then update in transaction
await prisma.$transaction(async (tx) => {
  await tx.teamMember.create({ /* ... */ });
  // ...
});
```

## Common Patterns Summary

### When to Use Transactions

- ✅ Multiple related database operations
- ✅ Operations that need to be atomic
- ✅ Updates followed by activity logging
- ✅ Creating related records (user + profile, team + membership, etc.)

### When to Use Promise.all()

- ✅ Independent queries that don't depend on each other
- ✅ Checking multiple conditions in parallel
- ✅ Fetching multiple unrelated records
- ✅ Validating multiple constraints simultaneously

### When to Use Session Data

- ✅ User role checks (if available in session)
- ✅ User ID (always in session)
- ✅ Any data that auth hooks populate in session

### When NOT to Batch

- ❌ Queries that need the result of a previous query
- ❌ Operations that should fail independently
- ❌ Very large batches (consider pagination or chunking)

## Enforcement

These rules MUST be followed for:
- All new code
- Code modifications in existing routers
- Helper functions that make database queries
- Any code that interacts with Prisma

## References

- See `docs/database-connection-issues-analysis.md` for detailed analysis
- See `docs/database-optimization-implemented.md` for implemented fixes
- See `packages/db/CONNECTION_POOL_CONFIG.md` for connection pool configuration

<!--
Sync Impact Report:
Version: 1.1.0 (added API Security principle)
Previous Version: 1.0.0 → 1.1.0
Modified: 2025-11-06
Modified Principles: None
Added Sections: VI. API Security (OWASP Best Practices)
Removed Sections: None
Templates Requiring Updates:
  - ⚠ .specify/templates/plan-template.md (add security checklist)
  - ⚠ .specify/templates/spec-template.md (add security requirements section)
  - ⚠ .specify/templates/tasks-template.md (add security audit task type)
Follow-up TODOs: 
  - Create security audit checklist based on OWASP API Security Top 10
  - Add pre-commit hook for credential scanning
  - Configure SAST tool for API endpoint analysis
-->

# Agent Doctor Live Constitution

## Core Principles

### I. Code Minimalism (NON-NEGOTIABLE)

Write the minimum code necessary to solve the problem. Delete code aggressively. One function, one responsibility. No duplication allowed - extract shared logic immediately. Dead code MUST be removed, not commented out. Complexity requires explicit justification in code review.

**Rationale**: Less code = fewer bugs, easier maintenance, faster comprehension. Every line is a liability.

### II. Data Source Agnosticism (NON-NEGOTIABLE)

All data access MUST be abstracted behind interfaces. Database calls and API calls MUST be interchangeable without modifying business logic. Use dependency injection for all data sources. Business logic MUST remain independent of data layer implementation.

**Rationale**: Enables easy migration between storage solutions, simplifies testing, supports architectural evolution without rewrites.

**Example Pattern**:
```typescript
interface UserRepository {
  findById(id: string): Promise<User>;
}
// Implementations: DatabaseUserRepository, ApiUserRepository
```

### III. Test-Driven Quality (NON-NEGOTIABLE)

Test behavior, not implementation. Coverage requirements: Critical paths 100%, Business logic 90%+, Utilities 80%+. Tests MUST run in under 5 seconds locally. Use AAA pattern (Arrange-Act-Assert). Mock external dependencies only. Prefer integration tests over unit tests when practical.

**Rationale**: Fast feedback loops prevent bugs reaching production. Behavior tests survive refactoring.

### IV. Developer Experience First

Consistency across all modules: same patterns, unified error handling, standard logging format, common configuration approach. Setup MUST complete in under 5 minutes. Hot reload in development. Pre-commit hooks enforce quality. Error messages MUST include context and suggest solutions. Docker compose with all external dependencies of the application. Commands to start all services (agent, meeting-server, room, secretary) with a single command in debug mode for development.

**Rationale**: Fast iteration cycles increase productivity. Consistent patterns reduce cognitive load. Good DX attracts and retains talent.

### V. Performance by Design

API endpoints MUST respond in < 200ms p95. Real-time events MUST process in < 50ms. Database queries MUST complete in < 100ms. External API calls MUST timeout at 5s. Stateless services when possible. Cache expensive computations. Use async/await for all I/O. Clean up resources explicitly.

**Rationale**: Performance impacts user experience directly. Designing for performance from start prevents costly rewrites.

### VI. API Security (OWASP Best Practices) (NON-NEGOTIABLE)

All APIs MUST follow OWASP API Security Top 10 guidelines. Authentication required for all endpoints except public health checks. Authorization validated on every request - never trust client claims. Input validation at API boundaries using schema validators. Rate limiting enforced per endpoint and per user. Sensitive data MUST NOT appear in logs, URLs, or error messages. HTTPS only - no HTTP allowed. API keys rotated quarterly minimum. Secrets MUST use environment variables or secret managers - never hardcoded.

**Rationale**: API vulnerabilities are the #1 attack vector. Prevention is cheaper than incident response.

**Required Controls**:
- Authentication: JWT with RS256 or OAuth 2.0 + PKCE
- Authorization: Role-based access control (RBAC) or attribute-based (ABAC)
- Input Validation: JSON Schema or Zod for all request bodies
- Rate Limiting: 100 req/min per user, 1000 req/min per IP
- Encryption: TLS 1.3 minimum, HSTS headers enabled
- Audit Logging: Track authentication, authorization failures, data access
- Dependency Scanning: Automated CVE checks in CI/CD
- API Versioning: Deprecation notices 90 days before removal

**Forbidden**:
- ❌ Credentials in source code or environment files committed to git
- ❌ Exposing stack traces or internal errors to clients
- ❌ Using weak algorithms (MD5, SHA1, DES)
- ❌ Trusting client-side validation only
- ❌ Mass assignment without allowlists
- ❌ Unbounded pagination or queries

## Performance Standards

All components MUST meet these non-negotiable performance targets:

- **Memory**: No leaks, monitor with profiling tools, reuse connections
- **Response Times**: p50 < 100ms, p95 < 200ms, p99 < 500ms for API endpoints
- **Throughput**: Support 1000 concurrent connections minimum
- **Real-time**: WebSocket/LiveKit events < 50ms end-to-end latency
- **Startup**: Service initialization < 3 seconds

Performance regressions block merges. Load testing required for critical paths.

## Quality Gates

Code MUST NOT be merged unless:

- ✅ All tests pass (no exceptions)
- ✅ Coverage thresholds met per Principle III
- ✅ Linting passes with zero warnings
- ✅ Build succeeds in CI/CD
- ✅ No console.log or debug statements
- ✅ Peer review approved
- ✅ Documentation updated if public API changed
- ✅ Performance benchmarks pass
- ✅ No new dependencies without justification

## Development Workflow

**File Organization**:
```
module/
  ├── index.ts          # Public API only
  ├── types.ts          # Type definitions
  ├── constants.ts      # Static values (no magic numbers)
  ├── *.service.ts      # Business logic
  └── __tests__/        # Co-located tests
```

**Naming Conventions**:
- Files: `kebab-case.ts`
- Classes/Interfaces: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

**Import Order** (enforced by linter):
1. External packages
2. Internal modules (absolute paths with @/)
3. Relative imports
4. Types (import type)

**TypeScript Strictness** (non-negotiable):
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

No `any` without explicit `// eslint-disable-next-line` and justification comment.

## Governance

This constitution supersedes all other practices. Amendments require:
1. Documented proposal with rationale
2. Team review and approval
3. Migration plan for existing code
4. Update to this document with version bump

All pull requests MUST be reviewed for constitutional compliance. Reviewers MUST verify:
- No duplication (Principle I)
- Data access properly abstracted (Principle II)
- Tests meet coverage requirements (Principle III)
- Follows standard patterns (Principle IV)
- Performance targets met (Principle V)
- Security controls implemented (Principle VI)

Violations require either:
- Fix before merge, OR
- Explicit exception approval with technical debt ticket

**Version Semantics**:
- MAJOR: Backward incompatible principle removals/redefinitions
- MINOR: New principles or materially expanded guidance
- PATCH: Clarifications, typos, non-semantic refinements

Use `.github/copilot-instructions.md` for runtime AI coding guidance.

**Version**: 1.1.0 | **Ratified**: 2025-11-06 | **Last Amended**: 2025-11-06

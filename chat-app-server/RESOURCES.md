# Realtime Chat Backend Resources

## Knowledge

- [Spring Data JPA: JPA Query Methods](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)
  Official reference for custom queries, fetch graphs, pagination, and keyset scrolling. Use for repository design and avoiding N+1.
- [Spring Data: Repository Core Concepts](https://docs.spring.io/spring-data/jpa/reference/repositories/core-concepts.html)
  Official overview of `Page`, `Slice`, and scrolling. Use when deciding what pagination abstraction an endpoint needs.
- [Spring Framework: Using `@Transactional`](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)
  Official transaction semantics and proxy limitations. Use when mapping lazy data or saving messages atomically.
- [RFC 9700: OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/rfc9700/)
  Primary security guidance for refresh-token rotation, replay detection, sender constraints, and limiting access-token privileges.
- [Spring Security: Servlet Architecture](https://docs.spring.io/spring-security/reference/servlet/architecture.html)
  Official explanation of the filter chain, `AuthenticationEntryPoint`, and `AccessDeniedHandler`; use for consistent REST 401/403 responses.
- [Spring Security: CSRF for JavaScript Applications](https://docs.spring.io/spring-security/reference/7.0/servlet/exploits/csrf.html)
  Official reference when deciding whether refresh tokens are transported in HttpOnly cookies.
- [PostgreSQL: Multicolumn Indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html)
  Primary reference for matching B-tree column order to equality, range, and sorting predicates.
- [PostgreSQL: Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
  Primary reference for unique, check, primary-key, and foreign-key guarantees, including which indexes PostgreSQL creates automatically.
- [Flyway: Validate](https://documentation.red-gate.com/flyway/reference/commands/validate)
  Official description of migration checksums and validation failures; use when evolving an already-migrated schema.

## Wisdom (Communities)

- [Spring Stack Overflow tag](https://stackoverflow.com/questions/tagged/spring)
  Search for narrow, reproducible framework issues after consulting the official reference; validate answers against the version in this project.

## Gaps

- Add the official Spring WebSocket/STOMP references when the REST and message-service stages are complete.

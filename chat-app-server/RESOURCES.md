# Realtime Chat Backend Resources

## Knowledge

- [Spring Data JPA: JPA Query Methods](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)
  Official reference for custom queries, fetch graphs, pagination, and keyset scrolling. Use for repository design and avoiding N+1.
- [Spring Data: Repository Core Concepts](https://docs.spring.io/spring-data/jpa/reference/repositories/core-concepts.html)
  Official overview of `Page`, `Slice`, and scrolling. Use when deciding what pagination abstraction an endpoint needs.
- [Spring Framework: Using `@Transactional`](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)
  Official transaction semantics and proxy limitations. Use when mapping lazy data or saving messages atomically.

## Wisdom (Communities)

- [Spring Stack Overflow tag](https://stackoverflow.com/questions/tagged/spring)
  Search for narrow, reproducible framework issues after consulting the official reference; validate answers against the version in this project.

## Gaps

- Add the official Spring WebSocket/STOMP references when the REST and message-service stages are complete.

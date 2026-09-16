# Mission: Build a realtime chat backend by understanding each layer

## Why
Build a Messenger-style learning project that can be explained, debugged, and extended independently—not merely assembled from copied snippets. Complete a reliable REST foundation first so WebSocket later adds realtime delivery instead of carrying unrelated business logic.

## Success looks like
- Design and implement chat-list, chat-detail, and message-history APIs with membership authorization.
- Explain and implement cursor pagination without duplicates caused by newly inserted rows.
- Persist messages idempotently and update chat ordering correctly.
- Add WebSocket authentication and realtime delivery on top of the same service layer.

## Constraints
- The learner writes the application code; Codex guides, reviews, and explains incrementally.
- Use the existing Spring Boot, Spring Data JPA, PostgreSQL, JWT, Flyway, MapStruct, and Git Flow conventions.
- Prefer concrete request/data examples before framework terminology.

## Out of scope
- Redis and multi-instance realtime scaling until the single-instance flow works.
- Group chats, media uploads, presence, typing indicators, and read receipts until core direct messaging is complete.

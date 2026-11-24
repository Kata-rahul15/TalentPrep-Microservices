# Interview Service – Hybrid REST + STOMP WebSocket Contract

## Architecture

- REST remains the interface for setup, session creation and reads, transcript/report retrieval, multipart audio upload, and code execution/submission.
- STOMP over WebSocket is the primary interface for live interview lifecycle commands and real-time events.
- The frontend connects only through the API Gateway, never directly to port 8083.
- The browser's HttpOnly `AccessToken` cookie authenticates the Gateway WebSocket handshake. The Gateway forwards the validated JWT expiry, and the Interview Service closes the socket when that access token expires; reconnect after refreshing the cookie. The Gateway strips client identity headers and injects validated identity headers. The Interview Service's `GatewayIdentityFilter` validates the UUID and stores the authenticated identity; the WebSocket handshake interceptor uses that request attribute to establish the STOMP Principal.
- Every command calls the existing application services, which continue checking session ownership. The user ID is never accepted from the command JSON.

## Connection

- Gateway URL: `wss://<gateway-host>/ws/interviews` in production.
- Local URL: `ws://localhost:8080/ws/interviews`.
- STOMP application prefix: `/app`.
- Subscribe to: `/user/queue/interviews/events`.
- Send commands to: `/app/interviews/{sessionId}/commands`.

## CSRF and origin requirements

Before opening the WebSocket:

1. Call `GET /api/csrf` on the Gateway with credentials included.
2. Read the returned `token` value (the Gateway also sets the `XSRF-TOKEN` cookie).
3. Open the STOMP connection with `connectHeaders: { 'X-XSRF-TOKEN': token }`.
4. The browser must send both `AccessToken` and `XSRF-TOKEN` cookies during the handshake.

The Interview Service checks the exact frontend origin and requires the STOMP CONNECT token to match the handshake cookie. Configure `INTERVIEW_WEBSOCKET_ALLOWED_ORIGINS` with exact origins, comma-separated. Do not use `*` with cookie authentication.

## Example STOMP client

```javascript
import { Client } from '@stomp/stompjs';

const csrfResponse = await fetch(`${API_BASE_URL}/api/csrf`, {
  method: 'GET',
  credentials: 'include'
});
if (!csrfResponse.ok) throw new Error('Unable to obtain CSRF token');
const { token } = await csrfResponse.json();

const client = new Client({
  brokerURL: `${WS_BASE_URL}/ws/interviews`,
  connectHeaders: { 'X-XSRF-TOKEN': token },
  reconnectDelay: 3000,
  heartbeatIncoming: 10000,
  heartbeatOutgoing: 10000,
  onConnect: () => {
    client.subscribe('/user/queue/interviews/events', frame => {
      const event = JSON.parse(frame.body);
      handleInterviewEvent(event);
    });
  },
  onStompError: frame => console.error('STOMP error', frame.headers, frame.body)
});
client.activate();
```

The browser WebSocket API sends eligible cookies automatically. Do not attempt to set a `Cookie` header manually.

## Command envelope

```json
{
  "commandId": "client-generated-uuid",
  "type": "START_INTERVIEW",
  "questionId": null,
  "answerText": null,
  "timeTakenSeconds": null
}
```

`commandId` is a correlation ID. This version does not provide durable exactly-once command processing; clients should not blindly replay a non-idempotent command after a disconnect. Reconnect, fetch the session state over REST, and decide whether to issue a new command.

## Supported commands

| Command | Required fields | Result events |
|---|---|---|
| `START_INTERVIEW` | none | `COMMAND_ACKNOWLEDGED`, `INTERVIEW_STARTED` |
| `NEXT_QUESTION` | none | `COMMAND_ACKNOWLEDGED`, `QUESTION_GENERATED` or `NO_MORE_QUESTIONS` |
| `SUBMIT_ANSWER` | `questionId`, optionally `answerText`, `timeTakenSeconds` | `EVALUATION_STARTED`, `EVALUATION_COMPLETED`, optionally `ROUND_COMPLETED` / `INTERVIEW_COMPLETED` |
| `PAUSE_INTERVIEW` | none | `INTERVIEW_PAUSED` |
| `RESUME_INTERVIEW` | none | `INTERVIEW_RESUMED` |
| `SKIP_QUESTION` | `questionId` | `QUESTION_SKIPPED` |
| `END_INTERVIEW` | none | `INTERVIEW_COMPLETED` with report payload |

## Event envelope

```json
{
  "eventId": "server-generated-uuid",
  "commandId": "matching-client-command-id",
  "type": "QUESTION_GENERATED",
  "sessionId": "interview-session-uuid",
  "timestamp": "2026-11-12T00:00:00Z",
  "payload": {},
  "errorCode": null,
  "message": null
}
```

Errors are sent as `COMMAND_FAILED` with a stable `errorCode` and a safe message. Do not rely on exception text from the server.

## REST endpoints retained

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/interviews/setup` | Setup details and resume context |
| POST | `/api/interviews` | Create session and reserve quota |
| GET | `/api/interviews/{id}` | Read current session state after reconnect |
| GET | `/api/interviews/{id}/transcript` | Transcript |
| GET | `/api/interviews/{id}/report` | Final report |
| POST | `/api/interviews/{id}/voice-answer` | Multipart audio upload and evaluation |
| POST | `/api/interviews/{id}/code/run` | Code-run status (no sandbox is configured in this ZIP) |
| POST | `/api/interviews/{id}/code/submit` | Code submission for AI review |

The existing REST live-operation routes remain available for backward compatibility, but the frontend should use STOMP commands for the live lifecycle. They are not a second source of business logic; both interfaces call the same services.

## Reliability and limitations

- `COMMAND_ACKNOWLEDGED` means the server accepted the command for processing, not that the AI operation completed.
- AI processing runs on a bounded executor so the inbound STOMP channel is not held while the model runs.
- After reconnect, call `GET /api/interviews/{id}` and then fetch the transcript/report if needed. PostgreSQL remains the source of truth.
- Existing service-level ownership checks remain mandatory for every operation.
- The simple STOMP broker is in-process. For multi-instance deployment, use a broker relay/shared messaging infrastructure and sticky routing or a shared broker.
- `commandId` is correlation only in this version; persistent idempotency storage is a future enhancement.

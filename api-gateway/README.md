# 🌐 TalentPrep API Gateway

A centralized API Gateway for the TalentPrep microservices platform, built with **Java, Spring Boot, Spring Cloud Gateway, Spring Security WebFlux, JWT, Redis, and WebClient**.

The gateway provides a single entry point for frontend requests, routes traffic to the Authentication and Resume-RAG services, validates JWT access tokens, forwards trusted user identity headers, applies CORS configuration, and exposes health/readiness endpoints for service availability checks.

---

# 🚀 Features

## Routing

- Centralized entry point for backend services
- Authentication-Service routing
- Resume-RAG-Service routing
- Job-description API routing
- Environment-based service URLs
- Local and deployed service configuration

### Configured Routes

| Route ID | Path | Destination |
|---|---|---|
| `auth-service` | `/api/auth/**` | `${AUTH_SERVICE_URL}` (default `http://localhost:8081`) |
| `resume-service` | `/api/resumes/**` | `${RESUME_SERVICE_URL}` (default `http://localhost:8082`) |
| `job-description-service` | `/api/job-descriptions/**` | `${RESUME_SERVICE_URL}` (default `http://localhost:8082`) |

The gateway listens on port `8080` by default.

---

## 🔐 JWT Authentication

- Custom reactive JWT authentication filter
- Access token extraction from cookies
- Supports `AccessToken` and `accessToken` cookie names
- JWT signature and expiry validation through Spring Security's reactive JWT decoder
- Redis-backed token blacklist lookup when Redis is available
- Consistent `401 Unauthorized` responses for missing or invalid tokens
- Stateless request processing

Protected requests must include a valid access-token cookie.

---

## 👤 Trusted User Identity Forwarding

After successful JWT validation, the gateway extracts the user email from the JWT subject and the user ID from the `userId` claim.

It removes client-supplied identity headers and forwards identity derived from the validated token:

- `X-Authenticated-User-Id`
- `X-Authenticated-User-Email`
- `X-User-Id`
- `X-User-Email`

This allows downstream services, including Resume-RAG-Service, to identify the authenticated user without trusting identity values supplied directly by the browser.

For public routes, the gateway strips these identity headers rather than forwarding untrusted values.

---

## ❤️ Health and Readiness

The gateway exposes health endpoints for deployment checks and service warm-up workflows.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Basic gateway health response |
| `GET` | `/health/ready` | Checks readiness of Authentication-Service and Resume-RAG-Service |
| `GET` | `/actuator/health` | Spring Boot Actuator health endpoint, if enabled |

### Readiness Flow

```text
Frontend / Deployment
        |
        v
GET /health/ready
        |
        +--------------------------+
        |                          |
        v                          v
Authentication-Service      Resume-RAG-Service
/api/auth/health             /health
        |                          |
        v                          v
  Check HTTP response         Check HTTP response
        |                          |
        +------------+-------------+
                     |
                     v
              Combine Results
                     |
          +----------+----------+
          |                     |
          v                     v
        READY                STARTING
   Both services UP       One or both unavailable
```

Example response when both services respond successfully:

```json
{
  "status": "READY",
  "authService": "UP",
  "resumeService": "UP",
  "ready": true
}
```

If either check fails or times out, the gateway reports `STARTING` and sets `ready` to `false`.

The readiness checker uses WebClient and allows up to 30 seconds for each service check. It checks availability when `/health/ready` is requested; it does not continuously poll services in the background.

---

# 🏗️ Architecture

```text
                    TALENTPREP FRONTEND
                            |
                            v
                   API GATEWAY (:8080)
                            |
          +-----------------+------------------+
          |                 |                  |
          v                 v                  v
   JWT AUTHENTICATION   ROUTE HANDLING     HEALTH / READY
          |                 |                  |
          v                 v                  v
    Access Token       Spring Cloud       WebClient Health
    Cookie Validation  Gateway Routes     Checks
          |                 |                  |
          v          +------+-------+          |
    JWT Validation   |              |          |
          |          v              v          |
          v       AUTH SERVICE   RESUME SERVICE |
    Trusted User     (:8081)       (:8082)      |
    Identity Headers     |             |        |
          |              v             v        |
          +---------> User APIs     Resume APIs |
                                               |
                                               v
                                      READY / STARTING
```

### Request Flow

1. The frontend sends a request to the gateway.
2. The gateway identifies the matching route.
3. Public paths bypass JWT validation but have client-supplied identity headers removed.
4. Protected requests must provide an access token in a supported cookie.
5. The gateway validates the token and checks the Redis blacklist when Redis is available.
6. The gateway removes any incoming identity headers and injects identity derived from the validated JWT.
7. Spring Cloud Gateway forwards the request to the configured downstream service.
8. The logging filter records the HTTP method, request path, route target, status, and duration.

---

# 🔒 Security Features

- Spring Security WebFlux
- Reactive JWT validation
- HS256 signing algorithm
- Access-token cookie support
- Redis token blacklist lookup
- Identity-header anti-spoofing
- CORS configuration with credential support
- Stateless gateway security configuration
- JSON `401 Unauthorized` responses
- Request and response logging

### Important Security Note

The supplied `SecurityConfig` currently configures `.anyExchange().permitAll()`. The custom `JwtAuthenticationFilter` still rejects protected requests that lack a valid token, but the authorization configuration itself does not provide an additional route-level access-control layer. Review and explicitly configure route authorization before production use.

The JWT blacklist check currently fails open if Redis is unavailable or a Redis lookup errors. If immediate token revocation is a production requirement, consider failing closed for protected requests when blacklist verification cannot be completed.

The configured public-path rules include `/api/auth/**`, `/health`, and Actuator paths. Review which Actuator endpoints should be externally reachable before deploying.

---

# 🧰 Technology Stack

- Java
- Spring Boot
- Spring Cloud Gateway
- Spring Security WebFlux
- Spring Security OAuth2 JOSE / Reactive JWT
- Spring WebFlux
- WebClient
- Spring Data Redis Reactive
- Redis
- Maven
- Reactor

---

# ⚙️ Configuration

The supplied `application.yml` configures the gateway on port `8080`.

| Environment variable | Purpose | Default |
|---|---|---|
| `AUTH_SERVICE_URL` | Authentication-Service base URL | `http://localhost:8081` |
| `RESUME_SERVICE_URL` | Resume-RAG-Service base URL | `http://localhost:8082` |
| `JWT_SECRET_KEY` / `jwt_secret_key` | HS256 JWT signing secret shared with the issuer | No default secret |
| `FRONTEND_URL` | Allowed frontend origin(s), comma-separated | `http://localhost:5173` |
| `redis_host` | Redis hostname | `localhost` |
| `redis_port` | Redis port | `6379` |
| `redis_username` | Redis username, if required | Configuration-dependent |
| `redis_password` | Redis password, if required | Configuration-dependent |

Use the exact property names expected by your deployment environment and YAML configuration. Never commit real secrets.

### Local Example

```text
AUTH_SERVICE_URL=http://localhost:8081
RESUME_SERVICE_URL=http://localhost:8082
FRONTEND_URL=http://localhost:5173
JWT_SECRET_KEY=<same secret used by the authentication service>
redis_host=localhost
redis_port=6379
```

The JWT secret must match the authentication service's signing configuration and must be stored securely. Do not use a sample or test secret in production.

---

# 🧪 Tests

The supplied source includes tests for:

- Spring application context loading
- JWT filter behavior for public paths
- Missing access-token handling
- Invalid and blacklisted token handling
- Trusted identity header injection
- JWT blacklist lookup behavior


# 📁 Project Structure

```text
src
├── main
│   ├── java/com/example/api_gateway
│   │   ├── ApiGatewayApplication.java
│   │   ├── config
│   │   │   ├── RedisConfig.java
│   │   │   ├── SecurityConfig.java
│   │   │   └── WebClientConfig.java
│   │   ├── controller
│   │   │   ├── HealthController.java
│   │   │   └── ServiceHealthService.java
│   │   ├── filter
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   └── LoggingFilter.java
│   │   └── security
│   │       └── JwtUtil.java
│   └── resources
│       └── application.yml
└── test
    └── java/com/example/api_gateway
        ├── ApiGatewayApplicationTests.java
        ├── filter
        │   └── JwtAuthenticationFilterTest.java
        └── security
            └── JwtUtilTest.java
```

---

# 🔭 Future Improvements

- Explicit route-level authorization rules
- Circuit breakers and controlled retries for downstream services
- Rate limiting
- OpenAPI aggregation
- Distributed tracing and correlation IDs
- Metrics and dashboards with Prometheus and Grafana
- Docker and container orchestration
- CI/CD with automated tests
- Stronger Redis outage handling for token revocation
- More detailed readiness diagnostics and health-check tests

---

# 💡 What This Project Demonstrates

- Microservice API Gateway Design
- Centralized Request Routing
- Reactive Spring Security
- JWT Validation
- Trusted Identity Propagation
- Redis Integration
- CORS Configuration
- Service Health and Readiness Checks
- Reactive HTTP Calls with WebClient
- Request Logging and Diagnostics
- Automated Security Tests

---

## ⭐ If you find TalentPrep useful, consider giving the repository a star!

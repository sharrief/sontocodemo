---
phase: 02-zrok-public-access
reviewed: 2026-04-18T00:00:00Z
depth: quick
files_reviewed: 2
files_reviewed_list:
  - docker-compose.yml
  - .env.example
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-18
**Depth:** quick
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed Docker Compose configuration and environment variable template for the zrok public access phase. One critical security issue identified: plaintext credentials exposed in healthcheck command. One warning related to database port exposure on all interfaces.

## Critical Issues

### CR-01: Plaintext Database Password in Healthcheck Command

**File:** `docker-compose.yml:43`

**Issue:** The MySQL healthcheck exposes the database password as a plaintext environment variable in the command. This string is visible in `docker inspect` output, Docker logs, and process listings. The command line is recorded in the container's metadata and accessible to any process running on the host or any container on the same network.

**Fix:**
```yaml
# Instead of:
test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "${DB_USER}", "--password=${DB_PASSWORD}"]

# Use a wrapper script that reads from a file or environment-isolated approach:
test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "${DB_USER}"]
# And authenticate via .my.cnf or MYSQL_PWD (less visible but still exposed)

# Better: Use socket-based authentication or read-only credential file
test: ["CMD", "mysql", "-h", "localhost", "-u", "root", "-pchangeme", "-e", "SELECT 1"]
# But realistically, use a healthcheck wrapper script:
# Create docker-healthcheck.sh with restricted permissions and reference that
```

**Context:** Database credentials should never appear in command-line arguments in Docker. Use environment variables passed separately or credential files with restricted access (mode 0600).

## Warnings

### WR-01: MySQL Port Exposed on All Interfaces

**File:** `docker-compose.yml:32`

**Issue:** The MySQL database port `3306` is exposed to `0.0.0.0:3306` via `ports: - "3306:3306"`. In a production setup with zrok public access, this means the MySQL port is accessible to the host machine and could be exposed if the host firewall is misconfigured. For a containerized application exposing to the public internet via zrok, database ports should not be exposed on `0.0.0.0`.

**Fix:**
```yaml
# Instead of:
ports:
  - "3306:3306"

# Restrict to localhost only (if external access from host is truly needed):
ports:
  - "127.0.0.1:3306:3306"

# Or remove ports entirely if database is only accessed by the web service via Docker DNS:
# No ports section — db service is accessed internally via network 'sontoco-network'
```

**Context:** In the current setup, the web service already communicates with the database service via the Docker network (`sontoco-network`). Exposing port 3306 on `0.0.0.0` is unnecessary and increases the attack surface when combined with zrok public access.

---

_Reviewed: 2026-04-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: quick_

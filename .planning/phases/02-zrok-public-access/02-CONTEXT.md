# Phase 2: zrok Public Access - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Install and configure Cloudflare Tunnel (`cloudflared`) on the host machine to expose the Docker app container at `https://sontocodemo.sharrief.com`. Update `SITE_URL` in `.env.example` to the tunnel domain. This is host-side tooling — no changes to the app container or docker-compose configuration.

**Scope note:** The phase is named "zrok Public Access" in the roadmap but the tool decision has changed to Cloudflare Tunnel. Requirements ZROK-01 through ZROK-04 map to Cloudflare Tunnel equivalents — the planner should rename/reframe them accordingly.

</domain>

<decisions>
## Implementation Decisions

### Tunnel Tool
- **D-01:** Use Cloudflare Tunnel (`cloudflared`), NOT zrok. User evaluated both and chose Cloudflare Tunnel for: stable custom domain, valid TLS, no nameserver-independent CNAME needed (domain is now on Cloudflare DNS), free tier.

### Installation Method
- **D-02:** Install `cloudflared` via Cloudflare's official apt repository on Debian:
  ```
  # Add GPG key
  sudo mkdir -p --mode=0755 /usr/share/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
  # Add repo
  echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
  # Install
  sudo apt-get update && sudo apt-get install cloudflared
  ```

### Tunnel Registration
- **D-03:** Register the tunnel as a systemd service via `sudo cloudflared service install <token>`. Token is obtained from the Cloudflare Zero Trust dashboard at tunnel creation time. Service starts on boot and runs persistently — no manual start required after initial setup.
- **D-04:** The confirmation requirement (formerly ZROK-03) is satisfied by the one-time `cloudflared service install` step. There is no runtime prompt — the user confirms intent by running the install command. The plan should document this clearly as the confirmation gate.

### Subdomain
- **D-05:** Tunnel exposes the app at `https://sontocodemo.sharrief.com`. This subdomain is already configured in Cloudflare DNS and proxied through Cloudflare (orange cloud enabled). The tunnel backend points to `localhost:8901` (the host-side port). The Docker web container's internal port is 8080; docker-compose must be updated to map `8901:8080` (host:container) so the tunnel reaches the app.

### SITE_URL
- **D-06:** Update `SITE_URL` in `.env.example` to `https://sontocodemo.sharrief.com`. User's `.env` should be updated to match so that email links and self-referential redirects resolve correctly through the tunnel.

### Claude's Discretion
- Cloudflare tunnel config file location (`~/.cloudflared/` vs `/etc/cloudflared/`) — use whatever `cloudflared service install` sets up by default
- Whether to add a verification step (`curl https://sontocodemo.sharrief.com`) to the plan — include it

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements
- `.planning/REQUIREMENTS.md` — ZROK-01 through ZROK-04 need to be reframed for Cloudflare Tunnel; planner should note the tool substitution
- `.planning/PROJECT.md` — Core value, constraints, out-of-scope items

### Phase 1 Output (prerequisite)
- `.planning/phases/01-docker-containerization/01-01-SUMMARY.md` — Confirms `.env.example` structure, `DB_HOST=db`, `SITE_URL` location
- `.planning/phases/01-docker-containerization/01-02-SUMMARY.md` — Confirms docker-compose port exposure (8080:8080)

### Environment
- `.env.example` — SITE_URL must be updated here as part of this phase

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.env.example` — Already established in Phase 1; SITE_URL entry exists and needs updating from `http://localhost:8080` to `https://sontocodemo.sharrief.com`
- `docker-compose.yml` — Currently exposes port 8080 on the host via `ports: - "8080:8080"`; must be updated to `"8901:8080"` so the Cloudflare Tunnel (which routes to `localhost:8901`) reaches the app container

### Established Patterns
- Phase 1 established the pattern of documenting setup steps as plan tasks with explicit verification commands (grep checks, curl checks). Follow the same pattern here.

### Integration Points
- `cloudflared` runs on the host, connects outbound to Cloudflare edge, routes to `localhost:8080` → Docker web container. No changes inside Docker needed.
- `SITE_URL` is read by the server at runtime via `src/server/lib/env.ts` — updating `.env` is sufficient.

</code_context>

<specifics>
## Specific Ideas

- The README already references `https://sontocodemo.sharrief.com` as the demo URL — this phase makes that URL real and functional again via Cloudflare Tunnel.
- User is on Debian (apt-based Linux). Installation instructions are Debian-specific.
- The tunnel token is a sensitive credential. The plan should instruct the user to obtain it from the Cloudflare dashboard at runtime — it must NOT be committed to the repo or added to `.env.example`.

</specifics>

<deferred>
## Deferred Ideas

- Automated tunnel health monitoring (verify tunnel is up and alert if it drops) — v2 scope
- Cloudflare Access policies (authentication layer in front of the app at the Cloudflare edge) — separate phase if needed
- Making cloudflared part of docker-compose as a sidecar — considered but not needed since systemd service handles it cleanly

None of the zrok-specific requirements (ZROK-01 through ZROK-04) are deferred — they are all covered by the Cloudflare Tunnel equivalents.

</deferred>

---

*Phase: 02-zrok-public-access*
*Context gathered: 2026-04-18*

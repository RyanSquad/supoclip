# GungleClips rebrand migration

SupoClip identifiers were renamed to **GungleClips** / gungleclips. Use this when upgrading an existing Docker install.

## Canonical product URLs

- App: https://clips.gungle.ai
- Configure https://gungle.ai/clips → https://clips.gungle.ai on the root Gungle.ai site (outside this repo)
- Set NEXT_PUBLIC_APP_URL=https://clips.gungle.ai and rebuild the frontend image

## Docker / Postgres

Compose containers, network, and default DB credentials are now gungleclips / gungleclips_password.

**Greenfield:** docker compose down -v then docker compose up -d --build with a fresh .env.

**Keep data from a pre-rebrand volume** (Postgres user/db supoclip, password supoclip_password):

1. Dump while the old stack is still running:

`ash
docker compose exec postgres pg_dump -U supoclip -d supoclip > backup.sql
`

2. Stop the old stack, pull/rebuild with the rebranded compose file, start Postgres.
3. Restore into the new database (user/db gungleclips):

`ash
docker compose exec -T postgres psql -U gungleclips -d gungleclips < backup.sql
`

4. Verify login and tasks, then remove old volumes.

Redis ARQ queues (gungleclips_tasks, gungleclips_ai, gungleclips_fast) do not migrate; drain jobs or accept loss of in-flight work.

## Auth headers

The API accepts both x-gungleclips-* and legacy x-supoclip-* for one release. The web app only sends the new headers. Remove legacy acceptance after clients have upgraded.

## MCP

- Package / CLI: gungleclips-mcp
- Env: GUNGLECLIPS_API_URL, GUNGLECLIPS_API_KEY, …
- Tools: gungleclips_* (was supoclip_*)

Update MCP client configs accordingly.

## Browser storage

localStorage keys were renamed (gungleclips-editor:, gungleclips:attribution:*, etc.). The app migrates legacy supoclip* keys on first read.

## External cutover checklist

- DNS + TLS for clips.gungle.ai
- Root redirect on gungle.ai
- SES From domain / DKIM for gungle.ai
- Stripe success/portal URLs
- OAuth callback URLs on clips.gungle.ai
- PostHog / DataFast / Axiom dataset gungleclips-prod

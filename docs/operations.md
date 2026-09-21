# Operations

## Backups and recovery

Use Supabase's managed backups and verify restore procedures against staging. Record the migration version and Vercel deployment identifier for every release. Restore into a separate database before changing Production.

## Secrets

Rotate JWT, CSRF, cookie, database, and seed credentials independently. Deploy a new Vercel revision after environment changes because existing function instances do not receive changed environment values automatically. Seed passwords are development/staging-only.

## Monitoring

Monitor Vercel function errors, duration, database connection exhaustion, authentication rate limits, and failed migrations. Request IDs from RFC 7807 responses are the correlation key for application logs and support reports.

## Incident response

For an application regression, promote the last known-good Vercel deployment. For a schema issue, stop incompatible deployments, preserve the database, and apply a forward migration after review. Never reset or reseed a production database as an incident response.

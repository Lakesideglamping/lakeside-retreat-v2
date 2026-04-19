# Prisma Migrations

## Current state

`render.yaml` runs `prisma migrate deploy` on every deploy. Prior to this
folder existing, that command was a silent no-op — schema changes were
applied manually via `prisma db push` or hand-written SQL. That is the
"drift bomb" the audit flagged.

With `0_init/migration.sql` in place, `migrate deploy` is now the
authoritative path for schema changes going forward.

## One-time prod baseline (REQUIRED before first deploy with this folder)

The init migration describes the schema that **already exists** on prod.
Running `migrate deploy` without baselining would try to re-create every
table and fail.

Run ONCE, from the Render shell (or any psql connected to prod):

```bash
npx prisma migrate resolve --applied 0_init
```

This tells Prisma "treat 0_init as already applied" and writes a row to
the `_prisma_migrations` table. After that, future `migrate deploy`
calls in CI will only apply NEW migrations.

Verify with:

```bash
npx prisma migrate status
```

Expect: `Database schema is up to date!`

## Day-to-day workflow

1. Edit `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name short_description_of_change`.
   Prisma writes a timestamped folder under `prisma/migrations/` and
   applies it to your local DB.
3. Commit the schema + the new migration folder together.
4. On deploy, Render runs `prisma migrate deploy` which applies the new
   migration to prod.

## Regression guard

`npm run check:schema` fails if `prisma/schema.prisma` has changes that
aren't reflected in any migration file. Wire it into CI (or a pre-push
hook) to prevent schema drift from ever reaching `main` again.

## What would have to break for drift to return

1. Someone edits `schema.prisma` without running `migrate dev` AND
   `check:schema` isn't run before the PR merges. → Mitigation: the
   drift-check script exits non-zero; wire it into CI.
2. Someone runs `prisma db push` against prod. → Mitigation: only
   `migrate deploy` is in `render.yaml`; `db push` has to be deliberate.
3. Someone hand-edits prod with psql. → Mitigation: discouraged in docs,
   not enforceable in code. The `manual-migrations/` folder is the only
   sanctioned path for that, with a numbered + documented pattern.

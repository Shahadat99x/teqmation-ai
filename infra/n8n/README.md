# ClientFlow AI - n8n Workflows

This folder contains workflow scaffolds for the first operational automation layer.

Phase 04 adds:

- `follow-up-due-reminder.workflow.json`
- `daily-follow-up-summary.workflow.json`

Both workflows are intentionally scaffolded exports rather than fully live integrations.
They assume n8n will run with server-side secrets only and use either:

- Supabase RPC access with a service role key
- or app-owned endpoints once the backend automation surface is expanded later

These workflows should not move core reminder rules out of the app or database.

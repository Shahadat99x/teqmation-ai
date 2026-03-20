# ClientFlow AI - n8n Workflows

This folder contains workflow scaffolds for the first operational automation layer.

Current workflow scaffolds:

- `follow-up-due-reminder.workflow.json`
- `daily-follow-up-summary.workflow.json`
- `stage-changed.workflow.json`
- `document-request-email.workflow.json`
- `missing-document-reminder.workflow.json`
- `invoice-send.workflow.json`
- `invoice-overdue-reminder.workflow.json`

Both workflows are intentionally scaffolded exports rather than fully live integrations.
They assume n8n will run with server-side secrets only and use either:

- Supabase RPC access with a service role key
- or app-owned endpoints once the backend automation surface is expanded later

These workflows should not move core reminder rules out of the app or database.
Stage changes are also kept DB-backed: n8n should react to the stage-change queue rather than owning stage truth.
Document request and missing-document reminder workflows should react to DB-backed request/link queues and never become the source of file or checklist truth.
Invoice send and overdue reminder workflows should react to DB-backed invoice queues and never become the source of billing status truth.
The daily summary scaffold now includes both due follow-ups and overdue invoice visibility.

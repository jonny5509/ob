# Obedience Tracker for Chastify

A server-backed Chastify extension inspired by habit/task tracker workflows.

## Current milestone

This repository contains the first UI prototype:
- Today's tasks
- Daily progress
- Points
- Recurring-task metadata
- Proof-required flag
- Simple task creation
- Chastify iframe bridge bootstrap
- Chastify setup iframe prototype

The browser currently uses localStorage as a temporary demo store. It is **not** the production data layer.

## Chastify architecture

The production version will use:

- Chastify iframe for the wearer/keyholder UI
- A trusted backend for privileged Chastify API calls
- Server-side persistence for habits, task runs, points, rewards and history
- Chastify's app-scoped Developer API key only on the backend

Never put the Chastify Developer API key into browser code.

## Next milestones

1. Add a real backend and database
2. Validate the Chastify launch token server-side
3. Implement task assignment/completion through Chastify
4. Add recurring requirements and missed-window handling
5. Add keyholder setup/configuration
6. Add proof uploads
7. Add rewards/consequences
8. Add history and statistics
9. Add deployment configuration

See the official Chastify Developer API documentation for the current extension API.

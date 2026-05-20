# Beads SDK Migration

This app is migrating away from shelling out to the `bd` CLI and toward
`@herbcaudill/beads-sdk`.

## Current State

- The Nuxt/server API path uses `@herbcaudill/beads-sdk` through
  `server/utils/bd-executor.ts`.
- The Tauri desktop command layer in `src-tauri/src/lib.rs` still shells out to
  the configured `bd` or `br` binary.

## SDK Capability Boundary

`@herbcaudill/beads-sdk` currently supports two transports:

- Daemon socket: newline-delimited JSON over `.beads/bd.sock`.
- JSONL fallback: read-only operations from `.beads/issues.jsonl`.

The current Dolt-backed beads workspaces used by this app may have neither
`.beads/bd.sock` nor `.beads/issues.jsonl`. In that state, the SDK cannot serve
desktop reads or writes without additional SDK support.

## Desktop Commands That Can Move Once SDK Supports The Backend

These Tauri commands map directly to SDK concepts and should move first once a
Dolt-capable SDK transport exists:

- `bd_list`
- `bd_count`
- `bd_ready`
- `bd_status`
- `bd_show`
- `bd_create`
- `bd_update`
- `bd_close`
- `bd_search`
- `bd_label_add`
- `bd_label_remove`
- `bd_delete`
- `bd_comments_add`
- `bd_dep_add`
- `bd_dep_remove`
- `bd_dep_add_relation`
- `bd_dep_remove_relation`

## Commands That Should Stay CLI-Backed For Now

These commands perform lifecycle, compatibility, repair, migration, or host
integration work that is not exposed by the SDK today:

- `bd_sync`
- `bd_repair_database`
- `bd_check_needs_migration`
- `bd_migrate_to_dolt`
- `bd_cleanup_stale_locks`
- `get_bd_version`
- `check_bd_compatibility`
- CLI binary configuration and update checks
- Probe launching and other host-process helpers

Keeping these CLI-backed is intentional until the SDK owns equivalent lifecycle
APIs.

## Next Required SDK Work

To finish replacing desktop CLI issue operations, `beads-sdk` needs one of:

- A Dolt-backed transport that can read and write the current `.beads/dolt/*`
  layout directly.
- A supported local service/socket for current Dolt workspaces.
- A stable Node bridge contract that the packaged Tauri app can run without
  depending on a developer-installed global `node`.

Until then, replacing the Tauri command layer globally would regress current
Dolt workspaces.

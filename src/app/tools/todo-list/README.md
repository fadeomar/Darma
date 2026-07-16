# Darma Tasks — Data Safety Studio

Darma Tasks is a browser-local task workspace with List, Table, Board, Week, Checklist, and Print views. Phase 40 adds a production-grade data-safety layer without changing the existing tool ID, route, templates, storage key, or daily workflow.

## Phase 40 additions

- Four-card workspace health summary.
- Severity-based relationship, overdue, consistency, size, and privacy checks.
- Complete backups now include archived lists.
- Versioned `darma-tasks` JSON backups with strict validation.
- Duplicate list/task/column ID detection.
- Parent-task existence, same-list, and cycle validation.
- 2 MB import limit and empty-file handling.
- Atomic IndexedDB replace and merge transactions.
- Production ZIP with JSON, Markdown audit, safe CSV, and README.
- CSV formula-injection escaping for spreadsheet handoff.

## Production ZIP

The ZIP contains:

- `darma-tasks-backup.json`
- `workspace-audit.md`
- `tasks.csv`
- `README.md`

The JSON file is the restorable source of truth. CSV is a review snapshot and does not replace JSON because it cannot preserve subtasks, board columns, descriptions, or all metadata.

## Privacy

Everything is generated locally. Backups may contain task titles, notes, tags, names, and due dates, so exported files should be stored securely.

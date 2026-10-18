"""Read complete Git path batches without a large process environment value."""
from __future__ import annotations

import os
from pathlib import Path


def read_changed_files() -> list[str]:
    path = os.environ.get("CHANGED_FILES_FILE", "")
    if path:
        raw = Path(path).read_bytes()
        if raw and not raw.endswith(b"\0"):
            raise ValueError("CHANGED_FILES_FILE must contain NUL-terminated Git paths")
        return [item for item in raw.decode("utf-8").split("\0") if item]

    # Existing callers retain their newline-separated environment contract.
    raw = os.environ.get("CHANGED_FILES", "")
    return [line.strip() for line in raw.splitlines() if line.strip()]

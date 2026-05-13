#!/usr/bin/env python3
"""
Build release-body.md for softprops/action-gh-release from docs/project-changelog.md.

Avoids generate_release_notes in CI: re-running the workflow on the same tag can stack
duplicate "What's Changed" blocks. This script produces a single deterministic body.
"""

from __future__ import annotations

import argparse
import os
import re
import sys


def _read(path: str) -> str:
    with open(path, encoding="utf-8") as f:
        return f.read()


def extract_unreleased(text: str) -> str | None:
    """Content under ## [Unreleased] until the next ## [AnyVersion] — header."""
    m = re.search(
        r"(?ms)^## \[Unreleased\][^\n]*\n(.*?)(?=^## \[[^\]]+\]\s*—)",
        text,
    )
    return m.group(1).strip() if m else None


def extract_version(text: str, tag: str) -> str | None:
    """Main ## [tag] section, stopping before the code-review divider or next version."""
    esc = re.escape(tag)
    m = re.search(
        rf"(?ms)^## \[{esc}\][^\n]*\n(.*?)(?=^---\s*\r?\n\r?\n^## Version\b|^## \[[^\]]+\]\s*—)",
        text,
    )
    return m.group(1).strip() if m else None


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--tag", default=os.environ.get("GITHUB_REF_NAME", ""))
    p.add_argument(
        "--changelog",
        default="docs/project-changelog.md",
        help="Path to Keep a Changelog–style file",
    )
    p.add_argument(
        "-o",
        "--output",
        default="release-body.md",
        help="Markdown file written for action-gh-release body_path",
    )
    args = p.parse_args()
    if not args.tag:
        print("error: pass --tag or set GITHUB_REF_NAME", file=sys.stderr)
        return 2

    text = _read(args.changelog)
    unreleased = extract_unreleased(text)
    version_block = extract_version(text, args.tag)
    if version_block is None:
        print(
            f"error: no section '## [{args.tag}]' (or terminator) in {args.changelog}",
            file=sys.stderr,
        )
        return 1

    parts: list[str] = [
        f"# Meeting Realtime Translator {args.tag}",
        "",
        "Release artifacts: Windows NSIS installer (`.exe`) and Linux AppImage (`.AppImage`) are attached under **Assets**.",
        "",
    ]
    if unreleased:
        parts += [
            "## Desktop app and other changes since last versioned section",
            "",
            "The following items come from the **Unreleased** section of `docs/project-changelog.md` and are included in this build:",
            "",
            unreleased,
            "",
            "---",
            "",
        ]
    parts += [
        f"## {args.tag} — versioned changelog",
        "",
        version_block,
        "",
        "---",
        "",
    ]
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    if repo:
        parts.append(
            f"**Compare:** [`{args.tag}` on GitHub](https://github.com/{repo}/commits/{args.tag})"
        )
    else:
        parts.append(
            f"**Compare:** open the repository on GitHub and browse commits for tag `{args.tag}`."
        )
    parts.append("")

    out = "\n".join(parts).rstrip() + "\n"
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"wrote {args.output} ({len(out)} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

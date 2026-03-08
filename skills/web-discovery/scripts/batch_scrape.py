#!/usr/bin/env python3
"""Batch scrape URLs using skills/web-scraping/scripts/auto_scrape.py.

Input: newline-delimited URLs
Output: JSONL (one object per URL)
"""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


def normalize(url: str) -> str:
    return url.strip()


def load_urls(path: Path, limit: int) -> list[str]:
    seen = set()
    out = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        u = normalize(raw)
        if not u or u.startswith("#"):
            continue
        if not (u.startswith("http://") or u.startswith("https://")):
            continue
        if u in seen:
            continue
        seen.add(u)
        out.append(u)
        if len(out) >= limit:
            break
    return out


def scrape_one(auto_scrape: Path, url: str, timeout: int, tier: int) -> dict:
    cmd = [
        "python3",
        str(auto_scrape),
        url,
        "--json",
        "--timeout",
        str(timeout),
        "--tier",
        str(tier),
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode == 0:
        try:
            return json.loads(p.stdout)
        except Exception:
            return {"success": False, "url": url, "error": "invalid-json", "raw": p.stdout[:1000]}
    return {
        "success": False,
        "url": url,
        "error": (p.stderr or p.stdout or "failed").strip()[:1000],
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Batch scrape URL list")
    ap.add_argument("--input", required=True, help="Path to newline URL file")
    ap.add_argument("--output", required=True, help="Output JSONL path")
    ap.add_argument("--limit", type=int, default=12)
    ap.add_argument("--timeout", type=int, default=20)
    ap.add_argument("--tier", type=int, default=3, choices=[1, 2, 3])
    args = ap.parse_args()

    in_path = Path(args.input).expanduser().resolve()
    out_path = Path(args.output).expanduser().resolve()

    base = Path(__file__).resolve().parents[2]  # .../workspace/skills
    auto_scrape = base / "web-scraping" / "scripts" / "auto_scrape.py"
    if not auto_scrape.exists():
        raise SystemExit(f"auto_scrape not found: {auto_scrape}")

    urls = load_urls(in_path, args.limit)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with out_path.open("w", encoding="utf-8") as f:
        for u in urls:
            row = scrape_one(auto_scrape, u, args.timeout, args.tier)
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(json.dumps({"ok": True, "count": len(urls), "output": str(out_path)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

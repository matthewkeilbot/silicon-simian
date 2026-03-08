#!/usr/bin/env python3
"""Auto-tiered scraper: curl_cffi -> DynamicFetcher -> Camoufox.

Designed for concise output by default.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse


CF_HINTS = [
    "checking your browser",
    "just a moment...",
    "cf-browser-verification",
    "challenges.cloudflare.com",
    "_cf_chl_opt",
]

SCRIPT_DIR = Path(__file__).resolve().parent
PROFILE_PATH = SCRIPT_DIR.parent / "data" / "site_profiles.csv"
METHOD_TO_TIER = {"urllib": 0, "curl_cffi": 1, "dynamicfetcher": 2, "camoufox": 3}


@dataclass
class Result:
    success: bool
    method: str | None = None
    tier: int | None = None
    seconds: float | None = None
    html: str | None = None
    error: str | None = None


def _cf_blocked(html: str) -> bool:
    h = (html or "").lower()
    return any(x in h for x in CF_HINTS)


def _spa_shell(html: str) -> bool:
    if not html:
        return True
    short = len(html) < 7000
    markers = ["<div id=\"root\"></div>", "<div id=\"app\"></div>", "<div id=\"__next\"></div>"]
    return short and any(m in html for m in markers)


def _tier0(url: str, timeout: int) -> Result:
    t0 = time.time()
    try:
        from urllib.request import Request, urlopen

        req = Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
        )
        with urlopen(req, timeout=timeout) as r:
            code = getattr(r, "status", 200)
            body = r.read()
        html = body.decode("utf-8", errors="ignore")
        if code != 200:
            return Result(False, error=f"tier0 http {code}")
        if _cf_blocked(html) or _spa_shell(html):
            return Result(False, error="tier0 blocked-or-spa")
        return Result(True, "urllib", 0, time.time() - t0, html)
    except Exception as e:
        return Result(False, error=f"tier0 {e}")


def _tier1(url: str, timeout: int) -> Result:
    t0 = time.time()
    try:
        from curl_cffi import requests as cffi_requests

        r = cffi_requests.get(
            url,
            impersonate="chrome131",
            timeout=timeout,
            headers={
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
        )
        html = r.text or ""
        if r.status_code != 200:
            return Result(False, error=f"tier1 http {r.status_code}")
        if _cf_blocked(html) or _spa_shell(html):
            return Result(False, error="tier1 blocked-or-spa")
        return Result(True, "curl_cffi", 1, time.time() - t0, html)
    except Exception as e:
        return Result(False, error=f"tier1 {e}")


def _tier2(url: str, timeout_ms: int) -> Result:
    t0 = time.time()
    try:
        from scrapling import DynamicFetcher

        fetcher = DynamicFetcher()
        resp = fetcher.fetch(url, headless=True, network_idle=True, timeout=timeout_ms)
        html = getattr(resp, "html_content", None) or ""
        if not html or _cf_blocked(html):
            return Result(False, error="tier2 blocked-or-empty")
        return Result(True, "dynamicfetcher", 2, time.time() - t0, html)
    except Exception as e:
        return Result(False, error=f"tier2 {e}")


def _tier3(url: str, timeout_ms: int) -> Result:
    t0 = time.time()
    try:
        from camoufox.sync_api import Camoufox

        with Camoufox(headless=True, humanize=True, geoip=True) as browser:
            page = browser.new_page()
            page.goto(url, timeout=timeout_ms, wait_until="networkidle")
            time.sleep(1.5)
            html = page.content() or ""
        if not html or _cf_blocked(html):
            return Result(False, error="tier3 blocked-or-empty")
        return Result(True, "camoufox", 3, time.time() - t0, html)
    except Exception as e:
        return Result(False, error=f"tier3 {e}")


def _extract_text(html: str, url: str) -> str:
    try:
        import trafilatura

        txt = trafilatura.extract(
            html,
            url=url,
            include_links=True,
            include_tables=True,
            favor_precision=True,
        )
        if txt and len(txt.strip()) > 80:
            return txt
        txt = trafilatura.extract(html, url=url, favor_recall=True)
        if txt:
            return txt
    except Exception:
        pass
    return html[:50000]


def _extract_selector_text(html: str, selector: str, limit: int) -> list[str]:
    try:
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")
        items = [x.get_text(" ", strip=True) for x in soup.select(selector)]
        return [x for x in items if x][:limit]
    except Exception:
        # Fallback: super-light tag extraction for simple selectors like 'h1' or 'article h2'
        tag = selector.split()[-1].replace("#", "").replace(".", "")
        if re.fullmatch(r"[a-zA-Z0-9_-]+", tag):
            hits = re.findall(rf"<{tag}[^>]*>(.*?)</{tag}>", html, flags=re.I | re.S)
            return [re.sub(r"<[^>]+>", "", h).strip() for h in hits if h.strip()][:limit]
        return []


def _domain_for(url: str) -> str:
    return (urlparse(url).hostname or "").lower()


def _load_profiles() -> dict[str, str]:
    profiles: dict[str, str] = {}
    if not PROFILE_PATH.exists():
        return profiles
    try:
        for raw in PROFILE_PATH.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            parts = [p.strip() for p in line.split(",", 1)]
            if len(parts) != 2:
                continue
            domain, method = parts
            if domain and method in METHOD_TO_TIER:
                profiles[domain.lower()] = method
    except Exception:
        pass
    return profiles


def _save_profiles(profiles: dict[str, str]) -> None:
    PROFILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    lines = ["# domain,method"]
    for domain in sorted(profiles):
        lines.append(f"{domain},{profiles[domain]}")
    PROFILE_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _profile_tier(profiles: dict[str, str], domain: str) -> int | None:
    return METHOD_TO_TIER.get(profiles.get(domain, ""))


def _update_profile_if_changed(profiles: dict[str, str], domain: str, method: str) -> bool:
    current = profiles.get(domain)
    if current == method:
        return False
    profiles[domain] = method
    _save_profiles(profiles)
    return True


def scrape(url: str, max_tier: int, timeout: int) -> Result:
    profiles = _load_profiles()
    domain = _domain_for(url)
    attempts = []

    # 1) Try saved method for this domain first (if any)
    preferred_tier = _profile_tier(profiles, domain) if domain else None
    if preferred_tier is not None and preferred_tier <= max_tier:
        fn = {0: _tier0, 1: _tier1, 2: _tier2, 3: _tier3}[preferred_tier]
        res = fn(url, timeout if preferred_tier in (0, 1) else timeout * 1000)
        if res.success:
            return res
        attempts.append(res.error or f"preferred tier{preferred_tier} failed")

    # 2) Escalate normally, skipping already-tried preferred tier
    for tier, fn in [(0, _tier0), (1, _tier1), (2, _tier2), (3, _tier3)]:
        if tier > max_tier:
            break
        if preferred_tier is not None and tier == preferred_tier:
            continue
        res = fn(url, timeout if tier in (0, 1) else timeout * 1000)
        if res.success:
            if domain and res.method:
                _update_profile_if_changed(profiles, domain, res.method)
            return res
        attempts.append(res.error or f"tier{tier} failed")

    return Result(False, error="; ".join(attempts) if attempts else "no attempts")


def main() -> int:
    ap = argparse.ArgumentParser(description="Auto-tier web scraper")
    ap.add_argument("url")
    ap.add_argument("--tier", type=int, default=3, choices=[1, 2, 3])
    ap.add_argument("--timeout", type=int, default=20, help="seconds")
    ap.add_argument("--raw", action="store_true")
    ap.add_argument("--json", action="store_true", dest="as_json")
    ap.add_argument("--selector", help="CSS selector for targeted extraction")
    ap.add_argument("--limit", type=int, default=20)
    args = ap.parse_args()

    res = scrape(args.url, args.tier, args.timeout)
    if not res.success:
        payload = {"success": False, "url": args.url, "error": res.error}
        print(json.dumps(payload, indent=2) if args.as_json else f"FAILED: {res.error}", file=sys.stderr)
        return 1

    html = res.html or ""
    if args.selector:
        content = _extract_selector_text(html, args.selector, args.limit)
    elif args.raw:
        content = html[:100000]
    else:
        content = _extract_text(html, args.url)

    payload = {
        "success": True,
        "url": args.url,
        "method": res.method,
        "tier": res.tier,
        "seconds": round(res.seconds or 0, 2),
        "content": content,
    }
    if args.as_json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        if isinstance(content, list):
            print("\n".join(content))
        else:
            print(content)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

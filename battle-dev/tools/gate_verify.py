#!/usr/bin/env python3
"""Verify a serial gate log mechanically (S03-U490).

The gate's signals are the exit code, the FAIL lines, the Python tracebacks and
the PASS total.  astra_harness already turns a block that throws into exit code 2,
and check.py starts every test with check=True, so that class of miss ends up in
the exit code.  What no exit code carries is a block that stops calling ok()
without throwing: the gate still exits 0 with no FAIL line and simply emits fewer
PASS lines.  The only signal is a PASS label that disappeared, so this compares
the normalised label multiset against the previous gate log and refuses a
disappearance that was not declared.

Usage:
  python tools/gate_verify.py GATE_LOG [--prev PREV_LOG]
                              [--expect-new N] [--allow-removed N]
                              [--allow-typeerror N]
"""
from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from pathlib import Path

# A removed PASS label is often Japanese, and a redirected stdout on Windows is cp932.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

LAST_PASS_LINE = "PASS no duplicate top-level function declarations"
HARD_WORDS = ("Traceback (most recent call last)", "ReferenceError", "SyntaxError")
DIGITS = re.compile("[0-9]+")


def normalise(label: str) -> str:
    """Drop the per-run detail and the numbers inside a PASS label."""
    for sep in (" :: ", " \u2014 "):
        head = label.split(sep)[0]
        label = head
    return DIGITS.sub("#", label).strip()


def read_lines(path: Path) -> list[str]:
    """A gate log written by a redirect on Windows is cp932, not UTF-8."""
    raw = path.read_bytes()
    for enc in ("utf-8", "cp932"):
        try:
            return raw.decode(enc).splitlines()
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace").splitlines()


def pass_labels(lines: list[str]) -> Counter:
    return Counter(normalise(ln[5:]) for ln in lines if ln.startswith("PASS "))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("log", type=Path)
    ap.add_argument("--prev", type=Path, default=None,
                    help="the previous gate log, for the PASS label comparison")
    ap.add_argument("--expect-new", type=int, default=None,
                    help="the net new PASS count this unit is supposed to add")
    ap.add_argument("--allow-removed", type=int, default=0,
                    help="how many PASS labels this unit is allowed to remove")
    ap.add_argument("--allow-typeerror", type=int, default=1,
                    help="known TypeError lines (test_auto_cycle32 has one at the base)")
    a = ap.parse_args()

    lines = read_lines(a.log)
    problems: list[str] = []

    exits = [ln for ln in lines if ln.startswith("GATE_EXIT=")]
    if not exits:
        problems.append("no GATE_EXIT= line: the log does not record the gate exit code")
    else:
        code = exits[-1].split("=", 1)[1].strip()
        print("GATE_EXIT            %s" % code)
        if code != "0":
            problems.append("GATE_EXIT=%s (the gate failed)" % code)

    fails = [ln for ln in lines if ln.startswith("FAIL")]
    print("FAIL lines           %d" % len(fails))
    for ln in fails[:20]:
        print("   %s" % ln[:200])
    if fails:
        problems.append("%d FAIL line(s)" % len(fails))

    for word in HARD_WORDS:
        n = sum(1 for ln in lines if word in ln)
        print("%-20s %d" % (word.split(" ")[0], n))
        if n:
            problems.append("%d line(s) containing %s" % (n, word))

    n_type = sum(1 for ln in lines if "TypeError" in ln)
    print("TypeError            %d (allowed %d)" % (n_type, a.allow_typeerror))
    if n_type > a.allow_typeerror:
        problems.append("%d TypeError line(s), more than the allowed %d" % (n_type, a.allow_typeerror))

    body = [ln for ln in lines if ln.strip() and not ln.startswith("GATE_EXIT=")]
    tail = body[-1] if body else ""
    print("last gate line       %s" % tail[:120])
    if tail != LAST_PASS_LINE:
        problems.append("the last gate line is not %r" % LAST_PASS_LINE)

    cur = pass_labels(lines)
    total = sum(cur.values())
    print("PASS total           %d" % total)

    if a.prev is not None:
        prev = pass_labels(read_lines(a.prev))
        prev_total = sum(prev.values())
        added = cur - prev
        removed = prev - cur
        n_added, n_removed = sum(added.values()), sum(removed.values())
        print("previous PASS total  %d" % prev_total)
        print("labels added         %d" % n_added)
        print("labels removed       %d (allowed %d)" % (n_removed, a.allow_removed))
        for label, n in removed.most_common(40):
            print("   -%d %s" % (n, label[:160]))
        if n_removed > a.allow_removed:
            problems.append(
                "%d PASS label(s) disappeared, more than the allowed %d "
                "(a block that stopped calling ok() looks exactly like this)" % (n_removed, a.allow_removed))
        if a.expect_new is not None:
            delta = total - prev_total
            print("net new PASS         %d (expected %d)" % (delta, a.expect_new))
            if delta != a.expect_new:
                problems.append("net new PASS is %d, not the expected %d" % (delta, a.expect_new))
    elif a.expect_new is not None:
        problems.append("--expect-new needs --prev")

    if problems:
        print("")
        for p in problems:
            print("GATE_VERIFY NG  %s" % p)
        return 1
    print("")
    print("GATE_VERIFY OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Select the next deterministic Codex implementation batch from coverage data."""
from __future__ import annotations
import argparse, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COVERAGE = ROOT / "data" / "script_coverage.json"
TEST_DECKS = ROOT / "data" / "80_test_decks.js"
OUT_JSON = ROOT / "data" / "next_script_batch.json"
OUT_MD = ROOT / "docs" / "NEXT_SCRIPT_BATCH.md"


def load_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def test_deck_names():
    if not TEST_DECKS.exists(): return set()
    text = TEST_DECKS.read_text(encoding="utf-8", errors="replace")
    return set(m.group(1) for m in re.finditer(r"\{\s*n\s*:\s*['\"]([^'\"]+)['\"]", text))


def priority(card, deck_names):
    # Lower is better. Prefer cards already present in project test decks, then
    # shorter effects / lower static complexity. Keep stable DB order as tie-break.
    deck_penalty = 0 if card["name"] in deck_names else 1000
    extra_penalty = 60 if card.get("extra") else 0
    kind_penalty = {"spell": 0, "trap": 5, "monster": 10}.get(card.get("kind"), 20)
    return (deck_penalty + card.get("complexity_score", 999) * 10 + extra_penalty + kind_penalty, card.get("index", 0))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--size", type=int, default=40)
    ap.add_argument("--max-complexity", type=int, default=45)
    ap.add_argument("--include-partial", action="store_true")
    args = ap.parse_args()

    cov = load_json(COVERAGE)
    decks = test_deck_names()
    allowed = {"NOT_STARTED"}
    if args.include_partial: allowed.add("PARTIAL")
    candidates = [c for c in cov["cards"] if c["status"] in allowed and c.get("complexity_score", 999) <= args.max_complexity]
    candidates.sort(key=lambda c: priority(c, decks))
    chosen = candidates[: max(1, args.size)]

    batch = {
        "schema_version": 1,
        "requested_size": args.size,
        "max_complexity": args.max_complexity,
        "selected_count": len(chosen),
        "selection_rule": "prefer test-deck cards, then lower static complexity; Codex must re-evaluate correctness before implementation",
        "cards": [
            {
                "code": c.get("code"), "name": c["name"], "kind": c.get("kind"), "date": c.get("date"),
                "extra": c.get("extra"), "status": c["status"], "complexity_score": c.get("complexity_score"),
                "in_test_decks": c["name"] in decks,
            } for c in chosen
        ],
    }
    OUT_JSON.write_text(json.dumps(batch, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    md = ["# Next Script Batch", "", f"Selected: **{len(chosen)}**", "", "Codex must inspect each card's historical 1103 behavior before implementing. If current engine primitives cannot model it accurately, move it to `ENGINE_GAP` instead of faking it.", "", "| # | Card | Kind | Complexity | Test deck |", "|---:|---|---|---:|:---:|"]
    for i,c in enumerate(batch["cards"],1):
        md.append(f"| {i} | {c['name'].replace('|','&#124;')} | {c['kind']} | {c['complexity_score']} | {'yes' if c['in_test_decks'] else ''} |")
    OUT_MD.write_text("\n".join(md)+"\n", encoding="utf-8")
    print(f"selected {len(chosen)} cards -> {OUT_JSON.relative_to(ROOT)}")

if __name__ == "__main__": main()

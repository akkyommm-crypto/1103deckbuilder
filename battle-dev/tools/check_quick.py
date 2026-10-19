"""Fast pre-push gate for a development checkpoint.

This is intentionally not a release gate.  It performs the build, coverage/status
audits, generated-JavaScript syntax check, and the explicitly supplied focused
tests.  GitHub CI still runs the complete authoritative gate for the pushed SHA.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import subprocess
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[1]


def run(command: list[str]) -> None:
    subprocess.run(command, check=True, cwd=ROOT)


def focused_test_path(raw: str) -> Path:
    candidate = Path(raw)
    if not candidate.is_absolute():
        candidate = ROOT / candidate
    candidate = candidate.resolve()
    try:
        candidate.relative_to(ROOT)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"test is outside battle-dev: {raw}") from exc
    if not candidate.is_file() or candidate.suffix.lower() != ".js":
        raise argparse.ArgumentTypeError(f"focused Node test not found: {raw}")
    if not candidate.name.startswith("test_"):
        raise argparse.ArgumentTypeError(f"focused test must start with test_: {raw}")
    return candidate


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the fast development checkpoint gate.")
    parser.add_argument(
        "--test",
        action="append",
        default=[],
        type=focused_test_path,
        help="focused Node test relative to battle-dev; repeat as needed",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    run([sys.executable, str(ROOT / "tools" / "build.py")])
    run([sys.executable, str(ROOT / "tools" / "script_coverage.py")])
    run(
        [
            sys.executable,
            str(ROOT / "tools" / "astra01_status_audit.py"),
            "--coverage",
            str(ROOT / "data" / "astra02_baseline_coverage.json"),
        ]
    )
    run(
        [
            sys.executable,
            str(ROOT / "tools" / "astra02_status_audit.py"),
            "--coverage",
            str(ROOT / "data" / "system02_final_coverage.json"),
        ]
    )
    run([sys.executable, str(ROOT / "tools" / "s03_status_audit.py")])

    html = (ROOT / "dist" / "battle.html").read_text(encoding="utf-8")
    javascript = html[html.index("<script>") + 8 : html.rindex("</script>")]
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            "w", suffix=".js", delete=False, encoding="utf-8"
        ) as temp_file:
            temp_file.write(javascript)
            temp_path = Path(temp_file.name)
        run(["node", "--check", str(temp_path)])
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)

    for test in args.test:
        run(["node", str(test)])

    print(f"QUICK_GATE_DONE focused_tests={len(args.test)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

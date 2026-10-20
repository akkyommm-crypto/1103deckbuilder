"""Run the existing full gate while parallelizing only its Node test commands.

The authoritative command list remains tools/check.py.  This wrapper executes the
Python build/audit work and the final inline assertions exactly as check.py does,
but queues Node invocations and runs them in isolated subprocesses.  Output is
replayed in the original command order so existing PASS/FAIL accounting remains
stable.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import os
from pathlib import Path
import runpy
import subprocess
import sys
import tempfile
import time


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CHECK = ROOT / "tools" / "check.py"
REAL_RUN = subprocess.run


def parse_args() -> argparse.Namespace:
    cpu_count = os.cpu_count() or 2
    parser = argparse.ArgumentParser(
        description="Run tools/check.py with its Node commands in parallel."
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=max(2, min(4, cpu_count // 2 or 1)),
        help="maximum simultaneous Node processes (default: 2-4 based on CPU count)",
    )
    parser.add_argument(
        "--check-file",
        type=Path,
        default=DEFAULT_CHECK,
        help=argparse.SUPPRESS,
    )
    return parser.parse_args()


def is_node_command(command: object) -> bool:
    if not isinstance(command, (list, tuple)) or not command:
        return False
    executable = Path(os.fspath(command[0])).name.lower()
    return executable in {"node", "node.exe"}


def replay_bytes(path: Path) -> None:
    data = path.read_bytes()
    stream = getattr(sys.stdout, "buffer", None)
    if stream is not None:
        stream.write(data)
        stream.flush()
    else:
        sys.stdout.write(data.decode(errors="replace"))
        sys.stdout.flush()


def run_queued(
    item: tuple[int, list[str], dict[str, object]], log_dir: Path
) -> tuple[int, list[str], int, Path, float]:
    index, command, kwargs = item
    log_path = log_dir / f"{index:04d}.log"
    call_kwargs = dict(kwargs)
    call_kwargs.pop("check", None)
    call_kwargs.pop("capture_output", None)
    call_kwargs.pop("stdout", None)
    call_kwargs.pop("stderr", None)
    isolated_temp = log_dir / f"{index:04d}_temp"
    isolated_temp.mkdir()
    environment = dict(os.environ)
    supplied_environment = call_kwargs.pop("env", None)
    if supplied_environment is not None:
        environment.update(supplied_environment)
    # Several real-duel tests use fixed names below TEMP/R1_OUT.  Give every
    # command a private directory so otherwise independent tests cannot race.
    environment["TEMP"] = str(isolated_temp)
    environment["TMP"] = str(isolated_temp)
    environment["R1_OUT"] = str(isolated_temp / "r1")
    Path(environment["R1_OUT"]).mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    with log_path.open("wb") as output:
        result = REAL_RUN(
            command,
            stdout=output,
            stderr=subprocess.STDOUT,
            env=environment,
            **call_kwargs,
        )
    return index, command, result.returncode, log_path, time.monotonic() - started


def main() -> int:
    args = parse_args()
    if args.workers < 1:
        raise SystemExit("--workers must be at least 1")

    check_file = args.check_file.resolve()
    if not check_file.is_file():
        raise SystemExit(f"check file not found: {check_file}")

    queued: list[tuple[int, list[str], dict[str, object]]] = []

    def collect_node(command: object, *positional: object, **kwargs: object):
        if not is_node_command(command):
            return REAL_RUN(command, *positional, **kwargs)
        if positional:
            raise RuntimeError(
                f"parallel gate cannot preserve positional subprocess options: {command!r}"
            )
        normalized = [os.fspath(part) for part in command]
        queued.append((len(queued), normalized, dict(kwargs)))
        return subprocess.CompletedProcess(normalized, 0)

    started = time.monotonic()
    subprocess.run = collect_node
    try:
        runpy.run_path(str(check_file), run_name="__main__")
    finally:
        subprocess.run = REAL_RUN

    if not queued:
        raise SystemExit("parallel gate found no Node commands in the authoritative check file")

    print(f"PARALLEL_NODE_START commands={len(queued)} workers={args.workers}")
    failures: list[tuple[int, list[str], int]] = []
    with tempfile.TemporaryDirectory(prefix="1103_parallel_gate_") as temp_dir:
        log_dir = Path(temp_dir)
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = [pool.submit(run_queued, item, log_dir) for item in queued]
            results = [future.result() for future in futures]

        results.sort(key=lambda item: item[0])
        for index, command, returncode, log_path, _duration in results:
            replay_bytes(log_path)
            if returncode:
                failures.append((index, command, returncode))

    elapsed = time.monotonic() - started
    if failures:
        for index, command, returncode in failures:
            print(
                f"PARALLEL_NODE_ERROR index={index} exit={returncode} "
                f"command={subprocess.list2cmdline(command)}",
                file=sys.stderr,
            )
        print(
            f"PARALLEL_NODE_DONE commands={len(queued)} errors={len(failures)} "
            f"seconds={elapsed:.1f}",
            file=sys.stderr,
        )
        return 1

    print(
        f"PARALLEL_NODE_DONE commands={len(queued)} errors=0 seconds={elapsed:.1f}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

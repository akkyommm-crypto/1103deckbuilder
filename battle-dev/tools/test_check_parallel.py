from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import tempfile
import textwrap


TOOLS = Path(__file__).resolve().parent
RUNNER = TOOLS / "check_parallel.py"


def run_fixture(body: str, workers: int = 2) -> subprocess.CompletedProcess[str]:
    with tempfile.TemporaryDirectory(prefix="1103_parallel_runner_test_") as temp_dir:
        fixture = Path(temp_dir) / "check_fixture.py"
        fixture.write_text(textwrap.dedent(body), encoding="utf-8")
        return subprocess.run(
            [
                sys.executable,
                str(RUNNER),
                "--workers",
                str(workers),
                "--check-file",
                str(fixture),
            ],
            text=True,
            capture_output=True,
        )


ok = run_fixture(
    """
    import subprocess, sys
    subprocess.run([sys.executable, '-c', 'print("PRECHECK_OK")'], check=True)
    subprocess.run(['node', '-e', 'setTimeout(() => console.log("NODE_FIRST"), 80)'], check=True)
    subprocess.run(['node', '-e', 'console.log("NODE_SECOND")'], check=True)
    print('INLINE_OK')
    """
)
assert ok.returncode == 0, (ok.stdout, ok.stderr)
assert "PRECHECK_OK" in ok.stdout
assert "INLINE_OK" in ok.stdout
assert ok.stdout.index("NODE_FIRST") < ok.stdout.index("NODE_SECOND"), ok.stdout
assert "PARALLEL_NODE_DONE commands=2 errors=0" in ok.stdout

bad = run_fixture(
    """
    import subprocess
    subprocess.run(['node', '-e', 'console.log("NODE_OK")'], check=True)
    subprocess.run(['node', '-e', 'console.error("EXPECTED_ERROR"); process.exit(7)'], check=True)
    """
)
assert bad.returncode != 0, (bad.stdout, bad.stderr)
assert "NODE_OK" in bad.stdout
assert "EXPECTED_ERROR" in bad.stdout
assert "PARALLEL_NODE_ERROR" in bad.stderr

print("PASS parallel gate runner preserves order and succeeds")
print("PASS parallel gate runner propagates Node failures")

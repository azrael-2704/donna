"""Lockfile guard for GHSA-mrhx-c7xc-m3w5 (zod).

The repository does not import zod directly; it enters the graph transitively as a
dev-only dependency of ``eslint-plugin-react-hooks`` (via ``eslint-config-next``).
Its version is therefore controlled by ``package-lock.json``, so the behaviour this
test guards is the pinned zod version recorded in that lockfile: it must be at least
the release that fixes the advisory, and it must stay inside the range every
dependent declares, otherwise a fresh install would either re-resolve to a
vulnerable build or fail to resolve at all.

Run with the repository's own test command, e.g.::

    pytest tests/test_zod_lockfile_pin.py

It can also be executed directly (``python3 tests/test_zod_lockfile_pin.py``), which
runs the same assertions without pytest being configured for parallel runs.
"""

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
LOCKFILE = REPO_ROOT / "package-lock.json"

# GHSA-mrhx-c7xc-m3w5 is fixed in zod 4.6.6.
FIXED_ZOD_VERSION = (4, 6, 6)


def _lockfile_packages():
    """Return the ``packages`` map of the committed npm lockfile."""
    with LOCKFILE.open(encoding="utf-8") as handle:
        return json.load(handle)["packages"]


def _zod_nodes(packages):
    """Every installed zod node in the lockfile (top level or nested)."""
    nodes = {}
    for path, entry in packages.items():
        if path == "node_modules/zod" or path.endswith("/node_modules/zod"):
            nodes[path] = entry
    return nodes


def _dependents(packages):
    """Lockfile nodes that ask for zod, as ``(path, requested_range)`` pairs."""
    found = []
    for path, entry in packages.items():
        if not path.startswith("node_modules/"):
            continue
        for key in ("dependencies", "peerDependencies"):
            requested = (entry.get(key) or {}).get("zod")
            if requested:
                found.append((path, key, requested))
    return found


def _core_version(raw):
    """Digits of a release version as a comparable tuple, ignoring any pre-release."""
    core = str(raw).strip().lstrip("v").split("-")[0].split("+")[0]
    parts = []
    for chunk in core.split("."):
        parts.append(int(chunk) if chunk.isdigit() else 0)
    while len(parts) < 3:
        parts.append(0)
    return tuple(parts[:3])


def _satisfies(version, requested_range):
    """Minimal semver check for the ``^x.y.z`` / ``>=x.y.z`` / exact ranges used here."""
    parsed = _core_version(version)
    for term in str(requested_range).split("||"):
        term = term.strip()
        if not term or term == "*":
            return True
        if term.startswith("^"):
            base = _core_version(term[1:])
            if parsed[0] != base[0]:
                continue
            if parsed >= base:
                return True
        elif term.startswith(">="):
            if parsed >= _core_version(term[2:]):
                return True
        else:
            if parsed == _core_version(term):
                return True
    return False


def test_lockfile_records_a_zod_pin():
    """Guard: zod is a real (transitive) dependency, so it has a lockfile entry."""
    nodes = _zod_nodes(_lockfile_packages())
    assert nodes, "expected package-lock.json to pin a zod version"


def test_zod_pin_is_not_the_vulnerable_release():
    """Fix check: the locked zod meets the version that closes GHSA-mrhx-c7xc-m3w5."""
    nodes = _zod_nodes(_lockfile_packages())
    vulnerable = {
        path: entry["version"]
        for path, entry in nodes.items()
        if _core_version(entry["version"]) < FIXED_ZOD_VERSION
    }
    assert not vulnerable, (
        "zod pinned at "
        + ", ".join(f"{path}={version}" for path, version in sorted(vulnerable.items()))
        + f" is affected by GHSA-mrhx-c7xc-m3w5; lockfile must pin >= {'.'.join(map(str, FIXED_ZOD_VERSION))}"
    )


def test_zod_pin_metadata_matches_the_pinned_version():
    """The resolved tarball and integrity must describe the pinned version."""
    for path, entry in sorted(_zod_nodes(_lockfile_packages()).items()):
        resolved = entry.get("resolved", "")
        assert f"/zod-{entry['version']}.tgz" in resolved, (
            f"{path}: resolved tarball {resolved!r} does not match version {entry['version']}"
        )
        integrity = entry.get("integrity", "")
        assert integrity.startswith("sha512-") and len(integrity) > 60, (
            f"{path}: missing or truncated sha-512 integrity for zod {entry['version']}"
        )


def test_zod_pin_stays_within_every_dependents_range():
    """Bumping zod must not break what pulls it in: dependents' ranges still fit."""
    packages = _lockfile_packages()
    dependents = _dependents(packages)
    assert dependents, "expected at least one package in the graph to require zod"
    for path, key, requested in dependents:
        # The node npm would install for that dependent: the single top-level zod.
        for zod_path, entry in sorted(_zod_nodes(packages).items()):
            assert _satisfies(entry["version"], requested), (
                f"{path} ({key}) requests zod {requested!r}, but the lockfile pins "
                f"{entry['version']} at {zod_path}"
            )


def _checks():
    """The guards above, in order, for a plain ``python3`` run as well as pytest."""
    return (
        test_lockfile_records_a_zod_pin,
        test_zod_pin_is_not_the_vulnerable_release,
        test_zod_pin_metadata_matches_the_pinned_version,
        test_zod_pin_stays_within_every_dependents_range,
    )


if __name__ == "__main__":
    failed = 0
    for check in _checks():
        try:
            check()
        except AssertionError as error:
            failed += 1
            print(f"FAIL {check.__name__}: {error}")
        else:
            print(f"PASS {check.__name__}")
    raise SystemExit(1 if failed else 0)

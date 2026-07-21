#!/usr/bin/env python3
"""
Verifies the migration + seed SQL and the query shapes the Hono routes issue.

This exercises the SQL layer against a real SQLite engine (D1 is SQLite), so
schema mistakes, seed-data quoting bugs and bad filter predicates surface here
rather than after deploy. Run:  python3 scripts/verify_sql.py
"""
import json
import pathlib
import sqlite3
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FAILURES = []


def check(label, got, want):
    ok = got == want
    print(f"{'PASS' if ok else 'FAIL'}  {label}: got={got!r} want={want!r}")
    if not ok:
        FAILURES.append(label)


def main():
    con = sqlite3.connect(":memory:")
    con.row_factory = sqlite3.Row

    migration = (ROOT / "drizzle" / "0000_init.sql").read_text()
    for stmt in migration.split("--> statement-breakpoint"):
        if stmt.strip():
            con.execute(stmt)
    print("migration applied")

    con.executescript((ROOT / "scripts" / "seed.sql").read_text())
    print("seed applied\n")

    # --- shape -------------------------------------------------------------
    total = con.execute("SELECT count(*) c FROM boats").fetchone()["c"]
    check("seeded rows", total, 5)

    row = con.execute("SELECT * FROM boats WHERE id='solstice'").fetchone()
    check("solstice name", row["name"], "Solstice")
    check("solstice featured", row["featured"], 1)
    check("solstice gallery len", len(json.loads(row["gallery"])), 2)
    check("solstice amenities len", len(json.loads(row["amenities"])), 5)
    check("solstice pet", row["pet"], "Pip, a sea-loving terrier")

    # apostrophe escaping in seed data
    grenada = con.execute("SELECT location, home, gallery FROM boats WHERE id='blue-hour'").fetchone()
    check("apostrophe in location", grenada["location"], "St. George's, Grenada")
    check("apostrophe in home", grenada["home"].startswith("Owner's hull"), True)
    check("empty gallery", json.loads(grenada["gallery"]), [])

    # --- filters (mirrors routes/boats.ts) ---------------------------------
    q = "SELECT count(*) c FROM boats WHERE published=1 AND region=?"
    check("filter region=Caribbean", con.execute(q, ("Caribbean",)).fetchone()["c"], 1)
    check("filter region=Northern Europe", con.execute(q, ("Northern Europe",)).fetchone()["c"], 2)

    check(
        "filter featured=true",
        con.execute("SELECT count(*) c FROM boats WHERE published=1 AND featured=1").fetchone()["c"],
        2,
    )
    check(
        "filter minRating>=4.8",
        con.execute("SELECT count(*) c FROM boats WHERE published=1 AND rating>=4.8").fetchone()["c"],
        3,
    )
    check(
        "filter availableFrom 2026-11-01",
        con.execute(
            "SELECT count(*) c FROM boats WHERE published=1 AND date_start>=?", ("2026-11-01",)
        ).fetchone()["c"],
        4,
    )
    check(
        "filter window 2026-09-01..2026-12-31",
        con.execute(
            "SELECT count(*) c FROM boats WHERE published=1 AND date_start>=? AND date_start<=?",
            ("2026-09-01", "2026-12-31"),
        ).fetchone()["c"],
        2,
    )

    # --- search ------------------------------------------------------------
    search_sql = """
        SELECT id FROM boats
        WHERE published=1 AND (
            lower(name) LIKE :n OR lower(location) LIKE :n
            OR lower(country) LIKE :n OR lower(description) LIKE :n
        ) ORDER BY date_start
    """
    check(
        "search 'catamaran' (description hit)",
        [r["id"] for r in con.execute(search_sql, {"n": "%catamaran%"})],
        ["blue-hour"],
    )
    check(
        "search 'GREECE' case-insensitive",
        [r["id"] for r in con.execute(search_sql, {"n": "%greece%"})],
        ["solstice"],
    )
    check(
        "search 'norway' (country hit)",
        [r["id"] for r in con.execute(search_sql, {"n": "%norway%"})],
        ["northern-light"],
    )

    # --- sort + pagination -------------------------------------------------
    page1 = [r["id"] for r in con.execute("SELECT id FROM boats WHERE published=1 ORDER BY date_start LIMIT 2 OFFSET 0")]
    page2 = [r["id"] for r in con.execute("SELECT id FROM boats WHERE published=1 ORDER BY date_start LIMIT 2 OFFSET 2")]
    check("sort dateStart page 1", page1, ["solstice", "blue-hour"])
    check("sort dateStart page 2", page2, ["northern-light", "kingfisher"])
    check(
        "sort -rating first",
        con.execute("SELECT id FROM boats WHERE published=1 ORDER BY rating DESC LIMIT 1").fetchone()["id"],
        "blue-hour",
    )

    # --- facets ------------------------------------------------------------
    facets = {
        r["value"]: r["count"]
        for r in con.execute(
            "SELECT region value, count(*) count FROM boats WHERE published=1 GROUP BY region ORDER BY region"
        )
    }
    check(
        "region facets",
        facets,
        {"Caribbean": 1, "Mediterranean": 1, "Northern Europe": 2, "South Pacific": 1},
    )

    # --- unpublished rows are hidden ---------------------------------------
    con.execute("UPDATE boats SET published=0 WHERE id='saltwood'")
    check(
        "unpublished excluded",
        con.execute("SELECT count(*) c FROM boats WHERE published=1").fetchone()["c"],
        4,
    )

    print()
    if FAILURES:
        print(f"{len(FAILURES)} FAILED: {', '.join(FAILURES)}")
        sys.exit(1)
    print("All SQL checks passed.")


if __name__ == "__main__":
    main()

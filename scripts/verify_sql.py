#!/usr/bin/env python3
"""
Verifies migrations + seed and the query shapes the routes issue, against a real
SQLite engine (D1 is SQLite). Run: python3 scripts/verify_sql.py
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


def apply_sql(con, text):
    for stmt in text.split("--> statement-breakpoint"):
        s = stmt.strip()
        if s:
            con.executescript(s)


def main():
    con = sqlite3.connect(":memory:")
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")

    # Apply migrations in order.
    for mig in sorted((ROOT / "drizzle").glob("*.sql")):
        apply_sql(con, mig.read_text())
    print("migrations applied")

    con.executescript((ROOT / "scripts" / "seed.sql").read_text())
    print("seed applied\n")

    # --- counts ------------------------------------------------------------
    check("vessels", con.execute("SELECT count(*) c FROM vessels").fetchone()["c"], 5)
    check("sits", con.execute("SELECT count(*) c FROM sits").fetchone()["c"], 5)
    check("applications", con.execute("SELECT count(*) c FROM applications").fetchone()["c"], 2)
    check(
        "application_messages",
        con.execute("SELECT count(*) c FROM application_messages").fetchone()["c"],
        3,
    )

    # --- the boats join (vessel ⋈ sit) -------------------------------------
    join_sql = """
        SELECT s.id AS sit_id, v.id AS vessel_id, v.name, s.location, s.country,
               v.engine_type, v.amenities, s.responsibilities, s.pet, s.featured
        FROM sits s JOIN vessels v ON s.vessel_id = v.id
        WHERE s.published = 1
    """
    joined = {r["sit_id"]: r for r in con.execute(join_sql)}
    check("joined listings", len(joined), 5)

    sol = joined["solstice"]
    check("solstice vessel id", sol["vessel_id"], "solstice-boat")
    check("solstice name", sol["name"], "Solstice")
    check("solstice location stripped", sol["location"], "Lefkada")
    check("solstice country", sol["country"], "Greece")
    check("solstice engine (from vessel)", sol["engine_type"], "Inboard diesel")
    check("solstice amenities len", len(json.loads(sol["amenities"])), 8)
    check("solstice responsibilities len", len(json.loads(sol["responsibilities"])), 4)
    check("solstice pet", sol["pet"], "Pip, a sea-loving terrier")
    check("solstice featured", sol["featured"], 1)

    # apostrophe survived the generated seed
    bh = joined["blue-hour"]
    check("apostrophe in location", bh["location"], "St. George's")

    # --- FK integrity ------------------------------------------------------
    orphans = con.execute(
        "SELECT count(*) c FROM sits WHERE vessel_id NOT IN (SELECT id FROM vessels)"
    ).fetchone()["c"]
    check("no orphan sits", orphans, 0)

    # cascade: deleting a vessel with no sits is fine; with sits it cascades
    con.execute("DELETE FROM sits WHERE id='saltwood'")
    con.execute("DELETE FROM vessels WHERE id='saltwood-boat'")
    check(
        "vessel delete removed",
        con.execute("SELECT count(*) c FROM vessels WHERE id='saltwood-boat'").fetchone()["c"],
        0,
    )

    # --- applications nest messages ----------------------------------------
    alex = con.execute(
        "SELECT * FROM applications WHERE id='application-alex-solstice'"
    ).fetchone()
    check("alex sit", alex["sit_id"], "solstice")
    check("alex applicant_name", alex["applicant_name"], "Alex Morgan")
    check("alex applicant json name", json.loads(alex["applicant"])["name"], "Alex Morgan")
    check("alex status", alex["status"], "shortlisted")
    msgs = con.execute(
        "SELECT * FROM application_messages WHERE application_id=? ORDER BY created_at",
        ("application-alex-solstice",),
    ).fetchall()
    check("alex message count", len(msgs), 2)
    check("alex first sender", msgs[0]["sender_name"], "Alex Morgan")

    # applications for a sit (route: GET ?sitId=)
    for_sit = con.execute(
        "SELECT count(*) c FROM applications WHERE sit_id='solstice'"
    ).fetchone()["c"]
    check("applications for solstice", for_sit, 2)

    # applications for a user (route: GET ?user=), owner or applicant
    for_owner = con.execute(
        "SELECT count(*) c FROM applications WHERE owner_name=? OR applicant_name=?",
        ("Maya & Finn", "Maya & Finn"),
    ).fetchone()["c"]
    check("applications for owner Maya & Finn", for_owner, 2)
    for_applicant = con.execute(
        "SELECT count(*) c FROM applications WHERE owner_name=? OR applicant_name=?",
        ("Alex Morgan", "Alex Morgan"),
    ).fetchone()["c"]
    check("applications for applicant Alex", for_applicant, 1)

    print()
    if FAILURES:
        print(f"{len(FAILURES)} FAILED: {', '.join(FAILURES)}")
        sys.exit(1)
    print("All SQL checks passed.")


if __name__ == "__main__":
    main()

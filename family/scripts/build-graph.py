#!/usr/bin/env python3
"""Build graph-living.json and the redacted public graphs.

Sources (no invented people, no invented register numbers):

1. VIC historical death registers purchased 4 Sep 2026
   (Southern Cross / Yangery district pages) — SOLID.
2. Ethan Greene, "Biography Christopher Peter Greene" (family memoir) — SOFT.
3. Compiled "Descendants of Augustine HOY" at hoykin.tripod.com/id101.html
   (submitter contact on that page) — SOFT. People without a death date who
   could still be living are marked living and redacted in the public graph.

Does not invent a blood link between the 1909–1912 Yangery Green register
and the living Greene household. Those sit as separate components until a
record joins them.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOY_SRC = ROOT / "sources" / "hoykin-augustine-hoy.txt"

LIVING_YEAR_CUTOFF = 1916  # no death + born after this → treat as living


def slug(parts: list[str]) -> str:
    raw = "-".join(p for p in parts if p)
    raw = raw.lower()
    raw = re.sub(r"[^a-z0-9]+", "-", raw).strip("-")
    return raw[:80] or "person"


def parse_year(text: str | None) -> int | None:
    if not text:
        return None
    m = re.search(r"\b(1[6-9]\d{2}|20\d{2})\b", text)
    return int(m.group(1)) if m else None


def split_name(full: str) -> tuple[str, str]:
    full = re.sub(r"\s+", " ", full).strip(" ,.")
    full = re.sub(r"\d+$", "", full).strip()
    # Drop trailing generation digits glued to given names (Augustine1)
    full = re.sub(r"(\D)\d+\b", r"\1", full).strip()
    bits = full.split()
    if not bits:
        return "", ""
    if len(bits) == 1:
        return bits[0], ""
    # Last token that is ALLCAPS-ish is surname
    if bits[-1].isupper() and len(bits[-1]) > 1:
        return " ".join(bits[:-1]).title(), bits[-1].title()
    return " ".join(bits[:-1]), bits[-1]


def clean_place(text: str | None) -> str | None:
    if not text:
        return None
    text = re.sub(r"\s+", " ", text).strip(" .;,")
    text = text.replace('"', "")
    if len(text) < 2 or text.lower() in {"victoria", "vic"}:
        return text or None
    return text[:80]


class Graph:
    def __init__(self):
        self.people: dict[str, dict] = {}
        self.unions: dict[str, dict] = {}
        self.edges: list[dict] = []
        self._edge_keys: set[tuple] = set()

    def add_person(self, **kw) -> str:
        given = kw.get("given") or ""
        surname = kw.get("surname") or ""
        birth_year = kw.get("birth_year")
        death_year = kw.get("death_year")
        pid = kw.get("id") or slug(
            [surname or "unk", given or "person", str(birth_year or death_year or "x")]
        )
        n = 2
        base = pid
        while pid in self.people and (
            self.people[pid].get("given") != given
            or self.people[pid].get("surname") != surname
        ):
            pid = f"{base}-{n}"
            n += 1
        if pid in self.people:
            # merge missing fields
            p = self.people[pid]
            for k, v in kw.items():
                if k == "id":
                    continue
                if v and not p.get(k):
                    p[k] = v
            return pid
        living = kw.get("living")
        if living is None:
            if death_year or kw.get("death"):
                living = False
            elif birth_year and birth_year <= LIVING_YEAR_CUTOFF:
                living = False
            elif birth_year:
                living = True
            else:
                living = True
        person = {
            "id": pid,
            "given": given,
            "surname": surname,
            "display": kw.get("display") or " ".join(x for x in (given, surname) if x),
            "aka": kw.get("aka") or [],
            "sex": kw.get("sex"),
            "living": bool(living),
            "birth": kw.get("birth"),
            "birth_year": birth_year,
            "birth_place": kw.get("birth_place"),
            "death": kw.get("death"),
            "death_year": death_year,
            "death_place": kw.get("death_place"),
            "burial": kw.get("burial"),
            "evidence": kw.get("evidence") or "soft",
            "line": kw.get("line") or "other",
            "notes": kw.get("notes") or "",
            "sources": kw.get("sources") or [],
        }
        self.people[pid] = person
        return pid

    def add_union(self, a: str, b: str | None, **kw) -> str:
        partners = [x for x in (a, b) if x]
        partners_sorted = tuple(sorted(partners))
        uid = kw.get("id") or "u-" + "-".join(partners_sorted)
        if uid not in self.unions:
            self.unions[uid] = {
                "id": uid,
                "partners": list(partners_sorted),
                "type": kw.get("type") or "union",
                "evidence": kw.get("evidence") or "soft",
                "when": kw.get("when"),
                "place": kw.get("place"),
                "notes": kw.get("notes") or "",
            }
        return uid

    def add_edge(self, kind: str, src: str, dst: str, evidence: str = "soft"):
        key = (kind, src, dst)
        if key in self._edge_keys:
            return
        self._edge_keys.add(key)
        self.edges.append(
            {"type": kind, "from": src, "to": dst, "evidence": evidence}
        )

    def child_of_union(self, uid: str, child: str, evidence: str = "soft"):
        self.add_edge("child", uid, child, evidence)
        u = self.unions.get(uid)
        if not u:
            return
        for p in u["partners"]:
            self.add_edge("parent", p, child, evidence)


def parse_vital_chunk(chunk: str) -> dict:
    """Parse 'born DATE in PLACE; died DATE in PLACE' style tails."""
    out: dict = {}
    born = re.search(
        r"born\s+(?:Abt\.\s+)?([^.;]+?)(?:\s+in\s+([^.;]+?))?(?=\s+(?:and\s+)?died|\s*;|$)",
        chunk,
        re.I,
    )
    if born:
        out["birth"] = born.group(1).strip()
        out["birth_year"] = parse_year(born.group(1))
        out["birth_place"] = clean_place(born.group(2))
    died = re.search(
        r"died\s+(?:Abt\.\s+|Bef\.\s+|Bet\.\s+)?([^.;]+?)(?:\s+in\s+([^.;]+?))?(?=\s*;|$|\.|\s+He\s|\s+She\s)",
        chunk,
        re.I,
    )
    if died:
        out["death"] = died.group(1).strip()
        out["death_year"] = parse_year(died.group(1)) or parse_year(died.group(2) or "")
        # 'Bet. 1857 - 1895' has two years — keep the phrase, no single year
        if re.search(r"\bBet\.", chunk):
            out["death_year"] = None
            out["death"] = re.search(r"died\s+(Bet\.\s+[^.;]+)", chunk, re.I)
            out["death"] = out["death"].group(1) if out["death"] else died.group(0)
        out["death_place"] = clean_place(died.group(2))
    return out


def parse_spouse_name(head: str) -> tuple[str, str]:
    """Pull a person name out of 'Francis Patrick GREENE 1926 in Victoria'."""
    head = re.sub(r"^\(\d+\)\s+", "", head).strip()
    head = re.sub(r"\s+", " ", head)
    # Drop marriage date / place glued to the name
    head = re.sub(
        r"\s+(?:\d{1,2}\s+\w+\s+)?(?:Abt\.\s+)?\d{4}(?:\s+in\s+.*)?$",
        "",
        head,
    )
    head = re.sub(r"\s+in\s+Victoria\b.*$", "", head, flags=re.I)
    head = head.strip(" ,;")
    # Given names + ALLCAPS surname
    m = re.match(
        r"^((?:[A-Z][a-z''().-]+\s+)+)([A-Z]{2,}[A-Z''-]*)$",
        head,
    )
    if m:
        return m.group(1).strip(), m.group(2).title()
    return split_name(head)


def parse_spouse_clause(clause: str, default_evidence: str, line: str, g: Graph) -> str | None:
    clause = clause.strip()
    if not clause:
        return None
    given, surname = parse_spouse_name(clause.split(";")[0])
    if not given and not surname:
        return None
    if surname.lower() in {"born", "died", "mar", "jul", "feb", "apr", "dec", "oct", "nov"}:
        surname = ""
    if given.lower() in {"born", "died"}:
        return None
    vitals = parse_vital_chunk(clause)
    sex = None
    if re.search(r"\bdaughter of\b", clause, re.I):
        sex = "F"
    elif re.search(r"\bson of\b", clause, re.I):
        sex = "M"
    pid = g.add_person(
        given=given.title() if given else given,
        surname=surname,
        sex=sex,
        evidence=default_evidence,
        line=line,
        sources=["hoykin.tripod.com/id101.html"],
        **vitals,
    )
    # parent of spouse if "daughter of X and Y"
    par = re.search(r"(?:daughter|son) of ([A-Z][A-Za-z .'-]+?) and ([A-Z][A-Za-z .'-]+)", clause)
    if par:
        fg, fs = split_name(par.group(1).strip())
        mg, ms = split_name(par.group(2).strip())
        # mother often maiden-only
        if not ms and fs:
            ms = fs
        fid = g.add_person(
            given=fg,
            surname=fs,
            sex="M",
            evidence="soft",
            line=line,
            sources=["hoykin.tripod.com/id101.html"],
            living=False if (fg or fs) else True,
        )
        mid = g.add_person(
            given=mg,
            surname=ms,
            sex="F",
            evidence="soft",
            line=line,
            sources=["hoykin.tripod.com/id101.html"],
            living=False,
        )
        uid = g.add_union(fid, mid, evidence="soft")
        g.child_of_union(uid, pid, "soft")
    return pid


def ingest_hoy(g: Graph, text: str) -> None:
    # Drop HTML/header before the report
    start = text.find("Descendants of Augustine HOY")
    if start >= 0:
        text = text[start:]
    text = text.replace("\r", "")
    # Collapse wrapped lines inside a person block lightly
    lines = text.split("\n")

    current_union = None
    current_parents = None
    buf = []

    def flush_person_line(line: str):
        nonlocal current_union
        line = re.sub(r"^\+\s+", "", line).strip()
        m = re.match(
            r"^(?:(\d+)\.\s+)?(?:(\d+)\s+[ivxlc]+\.\s+)?(.+)$",
            line,
            re.I,
        )
        if not m:
            return
        body = m.group(3).strip()
        # Must look like a person sentence
        if not re.search(r"\b(born|died|married)\b", body, re.I):
            return
        # Split name from vitals
        name_m = re.match(
            r"^((?:[A-Z][A-Za-z''().-]+\s+)+?[A-Z][A-Z''().-]+)\s*(?:,| was |$)",
            body,
        )
        if not name_m:
            # try "Given GEN SURNAME was born"
            name_m = re.match(
                r"^(.+?)(\d+)\s+([A-Z][A-Z ''()-]+)\s+was\s+",
                body,
            )
            if name_m:
                given = re.sub(r"\d+", "", name_m.group(1)).strip()
                surname = name_m.group(3).title()
                rest = body[name_m.end() - 4 :]  # keep 'was ...'
            else:
                return
        else:
            raw_name = name_m.group(1).strip()
            raw_name = re.sub(r"(\D)\d+\b", r"\1", raw_name)
            given, surname = split_name(raw_name)
            rest = body[name_m.end() :].lstrip(" ,")

        vitals = parse_vital_chunk(body)
        sex = None
        if re.search(r"\bHe married\b", body):
            sex = "M"
        elif re.search(r"\bShe married\b", body):
            sex = "F"

        pid = g.add_person(
            given=given.title() if given else given,
            surname=surname,
            sex=sex,
            evidence="soft",
            line="hoy",
            sources=["hoykin.tripod.com/id101.html"],
            **vitals,
        )

        if current_union:
            g.child_of_union(current_union, pid, "soft")

        # marriages
        for sm in re.finditer(
            r"(?:He|She) married(?:\s+\(\d+\))?\s+(.+?)(?=(?:He|She) married|$)",
            body,
        ):
            spouse_id = parse_spouse_clause(sm.group(1), "soft", "hoy", g)
            if spouse_id:
                when_m = re.search(
                    r"(\d{1,2}\s+\w+\s+\d{4}|\d{4})", sm.group(1)
                )
                place_m = re.search(r"\bin\s+([^.;]+)", sm.group(1))
                uid = g.add_union(
                    pid,
                    spouse_id,
                    evidence="soft",
                    when=when_m.group(1) if when_m else None,
                    place=clean_place(place_m.group(1)) if place_m else None,
                )
                # If this is a primary "N. Name was born" block, remember union
                # for following "Children of X and Y"
                current_union  # kept by children header

        return pid

    i = 0
    while i < len(lines):
        raw = lines[i].strip()
        if raw.startswith("Children of ") and raw.endswith(" are:"):
            names = raw[len("Children of ") : -len(" are:")]
            parts = re.split(r"\s+and\s+", names, maxsplit=1)
            if len(parts) == 2:
                ga, sa = split_name(parts[0])
                gb, sb = split_name(parts[1])
                # find existing people
                def find(given, surname):
                    given_l = (given or "").lower()
                    sur_l = (surname or "").lower()
                    for p in g.people.values():
                        if p["surname"].lower() == sur_l and (
                            not given_l or given_l.split()[0] in p["given"].lower()
                        ):
                            return p["id"]
                    return g.add_person(
                        given=given,
                        surname=surname,
                        evidence="soft",
                        line="hoy",
                        sources=["hoykin.tripod.com/id101.html"],
                        living=False,
                    )

                a = find(ga, sa)
                b = find(gb, sb)
                current_union = g.add_union(a, b, evidence="soft")
            i += 1
            continue

        if re.match(r"^(?:\+\s+)?\d+\.\s+", raw) or re.match(
            r"^(?:\+\s+)?\d+\s+[ivxlc]+\.\s+", raw, re.I
        ):
            # gather continuation lines until blank or next record
            chunk = raw
            j = i + 1
            while j < len(lines):
                nxt = lines[j].strip()
                if not nxt:
                    break
                if nxt.startswith("More About") or nxt.startswith("Children of"):
                    break
                if re.match(r"^(?:\+\s+)?\d+\.\s+", nxt) or re.match(
                    r"^(?:\+\s+)?\d+\s+[ivxlc]+\.\s+", nxt, re.I
                ):
                    break
                if nxt.startswith("Generation No"):
                    break
                if nxt.startswith("Click Here"):
                    break
                chunk += " " + nxt
                j += 1
            flush_person_line(chunk)
            i = j
            continue
        i += 1


def scrub_parsed(g: Graph) -> None:
    """Drop leftover parser debris so we never publish invented tokens as people."""
    junk_surnames = {"born", "died", "mar", "jul", "feb", "apr", "dec", "oct", "nov", "x"}
    drop = []
    for pid, p in g.people.items():
        sur = (p.get("surname") or "").lower()
        given = (p.get("given") or "").strip()
        if sur in junk_surnames:
            drop.append(pid)
            continue
        if re.search(r"\b(born|died|;)\b", p.get("display") or "", re.I):
            # try to salvage
            given2, sur2 = parse_spouse_name(re.split(r"[;]", p["display"])[0])
            if given2 and sur2 and sur2.lower() not in junk_surnames:
                p["given"] = given2
                p["surname"] = sur2
                p["display"] = f"{given2} {sur2}".strip()
            else:
                drop.append(pid)
                continue
        if not given and not p.get("surname"):
            drop.append(pid)
    for pid in drop:
        g.people.pop(pid, None)
    g.unions = {
        uid: u
        for uid, u in g.unions.items()
        if all(x in g.people for x in u["partners"])
    }
    g.edges = [
        e
        for e in g.edges
        if (e["type"] in ("child",) and e["from"] in g.unions and e["to"] in g.people)
        or (e["type"] != "child" and e["from"] in g.people and e["to"] in g.people)
    ]
    g._edge_keys = {(e["type"], e["from"], e["to"]) for e in g.edges}


def add_bdm_green(g: Graph) -> None:
    src_jane = (
        "VIC historical death register, District of Southern Cross / Yangery, "
        "1909, entry 186 (Jane Green). Register page purchased 4 Sep 2026."
    )
    src_mic = (
        "VIC historical death register, District of Southern Cross / Yangery, "
        "1912, entry 198 (Michael Green). Register page purchased 4 Sep 2026. "
        "Informant: Arthur Greene, son, Yangery."
    )

    frank = g.add_person(
        id="green-frank-jane-father",
        given="Frank",
        surname="Green",
        sex="M",
        living=False,
        evidence="solid",
        line="green-yangery",
        notes="Named as father (farmer) on Jane Green's 1909 death register.",
        sources=[src_jane],
    )
    jane_parer = g.add_person(
        id="green-jane-parer",
        given="Jane",
        surname="Parer",
        sex="F",
        living=False,
        evidence="solid",
        line="green-yangery",
        notes="Named as mother (housewife) on Jane Green's 1909 death register.",
        sources=[src_jane],
    )
    u_jane_par = g.add_union(frank, jane_parer, evidence="solid")

    george = g.add_person(
        id="green-george-michael-father",
        given="George",
        surname="Green",
        sex="M",
        living=False,
        evidence="solid",
        line="green-yangery",
        notes="Named as father (farmer) on Michael Green's 1912 death register.",
        sources=[src_mic],
    )
    catherine_w = g.add_person(
        id="green-catherine-williams",
        given="Catherine",
        surname="Williams",
        aka=["Catherine Green"],
        sex="F",
        living=False,
        evidence="solid",
        line="green-yangery",
        notes="Maiden name Williams, as stated on Michael Green's 1912 death register.",
        sources=[src_mic],
    )
    u_mic_par = g.add_union(george, catherine_w, evidence="solid")

    michael = g.add_person(
        id="green-michael-c1831",
        given="Michael",
        surname="Green",
        aka=["Michael Greene"],
        sex="M",
        living=False,
        birth_year=1831,
        birth="about 1831",
        birth_place="County Clare, Ireland",
        death="18 July 1912",
        death_year=1912,
        death_place="Yangery, Shire of Warrnambool, Victoria",
        burial="20 July 1912, Tower Hill Cemetery (Roman Catholic)",
        evidence="solid",
        line="green-yangery",
        notes=(
            "Farmer. 57 years in Victoria. Age 81 on the 1912 register. "
            "Own register states marriage in Victoria at age 30 to Jane Green. "
            "Wife's register states marriage at Port Fairy at her age 21 — "
            "the two statements do not resolve to one year; both are kept."
        ),
        sources=[src_mic, src_jane],
    )
    jane = g.add_person(
        id="green-jane-c1834",
        given="Jane",
        surname="Green",
        sex="F",
        living=False,
        birth_year=1834,
        birth="about 1834",
        birth_place="County Clare, Ireland",
        death="25 April 1909",
        death_year=1909,
        death_place="Yangery, Shire of Warrnambool, Victoria",
        burial="27 April 1909, Tower Hill Cemetery (Roman Catholic)",
        evidence="solid",
        line="green-yangery",
        notes=(
            "Housewife. 53 years in Victoria. Age 75 on the 1909 register. "
            "Parents recorded as Frank Green and Jane Parer — so her birth "
            "surname is Green. Informant: son-in-law, Killarney."
        ),
        sources=[src_jane, src_mic],
    )
    g.child_of_union(u_jane_par, jane, "solid")
    g.child_of_union(u_mic_par, michael, "solid")
    u_mj = g.add_union(
        michael,
        jane,
        evidence="solid",
        when="as stated on each spouse's death register (unreconciled)",
        place="Port Fairy / Victoria",
        notes=(
            "Jane's register: married Port Fairy, age 21, to Michael Green. "
            "Michael's register: married Victoria, age 30, to Jane Green."
        ),
    )

    # Children named on one or both registers. Consistent names = solid.
    # Names on only one register = soft (the pages disagree).
    children = [
        ("Jane", "F", 1859, "both", 50, 53),
        ("Catherine", "F", 1860, "both", 49, 51),
        ("George", "M", 1863, "both", 46, 49),
        ("Francis", "M", 1865, "both", 44, 47),
        ("Arthur", "M", 1869, "both", 40, 43),
        ("Rachael", "F", 1871, "both", 38, 41),
        ("William", "M", None, "both-deceased", None, None),
        ("Bridget", "F", 1867, "jane-only", 42, None),
        ("Nora", "F", 1873, "jane-only", 36, None),
        ("James", "M", 1879, "jane-only", 30, None),
        ("Michael", "M", 1867, "michael-only", None, 45),
        ("Maria", "F", 1873, "michael-only", None, 39),
    ]
    for given, sex, byear, flag, age_j, age_m in children:
        ev = "solid" if flag in ("both", "both-deceased") else "soft"
        notes = []
        if flag == "both":
            notes.append(
                f"Named on both death registers (ages {age_j} in 1909, {age_m} in 1912)."
            )
        elif flag == "both-deceased":
            notes.append("Named as deceased on both death registers.")
        elif flag == "jane-only":
            notes.append(
                f"Named only on Jane Green's 1909 register (age {age_j}). "
                "Not listed on Michael's 1912 issue column."
            )
        else:
            notes.append(
                f"Named only on Michael Green's 1912 register (age {age_m}). "
                "Not listed on Jane's 1909 issue column."
            )
        if given == "Arthur":
            notes.append("Spelled Greene when he informed Michael's 1912 registration.")
        pid = g.add_person(
            id=slug(["green-child", given, str(byear or flag)]),
            given=given,
            surname="Green",
            aka=["Arthur Greene"] if given == "Arthur" else [],
            sex=sex,
            living=False,
            birth_year=byear,
            birth=f"about {byear}" if byear else None,
            death="before 1909" if flag == "both-deceased" else None,
            death_year=1908 if flag == "both-deceased" else None,
            evidence=ev,
            line="green-yangery",
            notes=" ".join(notes),
            sources=[src_jane] + ([src_mic] if flag != "jane-only" else []),
        )
        g.child_of_union(u_mj, pid, ev)


def add_memoir_greene(g: Graph) -> None:
    src = (
        "Ethan Greene, 'Biography Christopher Peter Greene' (family memoir). "
        "FAMILY section names the household; the printed family-tree panel "
        "in that PDF is an image and was not transcribed."
    )
    src_name = (
        "Mahda's own public bio: birth name Christopher Greene; after marriage "
        "Mahda Christopher Greene-Moon."
    )

    peter = g.add_person(
        id="greene-peter",
        given="Peter",
        surname="Greene",
        sex="M",
        living=True,
        evidence="soft",
        line="greene-now",
        notes="Named as Christopher's father in the memoir.",
        sources=[src],
    )
    elizabeth = g.add_person(
        id="greene-elizabeth",
        given="Elizabeth",
        surname="Greene",
        sex="F",
        living=True,
        evidence="soft",
        line="greene-now",
        notes=(
            "Named as Christopher's mother in the memoir. Maiden name is not "
            "stated in that source — not assumed to be Hoy."
        ),
        sources=[src],
    )
    u_par = g.add_union(peter, elizabeth, evidence="soft")

    chris = g.add_person(
        id="greene-christopher-1979",
        given="Mahda Christopher",
        surname="Greene",
        aka=["Christopher Peter Greene", "Mahda Christopher Greene-Moon"],
        sex="M",
        living=True,
        birth_year=1979,
        birth="1979",
        birth_place="Victoria, Australia",
        evidence="soft",
        line="greene-now",
        notes="Focus person of this public tree. Birth year from his own records.",
        sources=[src, src_name],
    )
    steve = g.add_person(
        id="greene-steve",
        given="Steve",
        surname="Greene",
        sex="M",
        living=True,
        evidence="soft",
        line="greene-now",
        notes="Brother of Christopher, per the memoir.",
        sources=[src],
    )
    g.child_of_union(u_par, chris, "soft")
    g.child_of_union(u_par, steve, "soft")

    jess = g.add_person(
        id="greene-jess",
        given="Jess",
        surname="",
        sex="F",
        living=True,
        evidence="soft",
        line="greene-now",
        notes="Step-sister of Christopher. Surname not given in the memoir.",
        sources=[src],
    )
    deborah = g.add_person(
        id="greene-deborah",
        given="Deborah",
        surname="",
        sex="F",
        living=True,
        evidence="soft",
        line="greene-now",
        notes="Step-sister of Christopher. Surname not given in the memoir.",
        sources=[src],
    )
    # Step link to Peter only — do not invent the other parent.
    g.add_edge("step-parent", peter, jess, "soft")
    g.add_edge("step-parent", peter, deborah, "soft")

    andrea = g.add_person(
        id="greene-andrea",
        given="Andrea",
        surname="Moon",
        sex="F",
        living=True,
        evidence="soft",
        line="greene-now",
        notes=(
            "Named as Christopher's wife and the children's mother in the memoir. "
            "Surname Moon is inferred from his married name Greene-Moon, not from "
            "a certificate."
        ),
        sources=[src, src_name],
    )
    u_mar = g.add_union(
        chris,
        andrea,
        type="marriage",
        evidence="soft",
        notes="Memoir: married; two children named.",
    )
    melody = g.add_person(
        id="greene-melody-2002",
        given="Melody",
        surname="Greene",
        sex="F",
        living=True,
        birth_year=2002,
        birth="2002",
        evidence="soft",
        line="greene-now",
        sources=[src],
    )
    ethan = g.add_person(
        id="greene-ethan-2005",
        given="Ethan",
        surname="Greene",
        sex="M",
        living=True,
        birth_year=2005,
        birth="2005",
        evidence="soft",
        line="greene-now",
        notes="Author of the memoir used as the source for this household.",
        sources=[src],
    )
    g.child_of_union(u_mar, melody, "soft")
    g.child_of_union(u_mar, ethan, "soft")


def redact_person(p: dict) -> dict:
    q = dict(p)
    if p.get("living"):
        q["display"] = "Living"
        q["given"] = "Living"
        q["surname"] = ""
        q["aka"] = []
        q["birth"] = None
        q["birth_year"] = None
        q["birth_place"] = None
        q["notes"] = "Living person — name withheld until unlock."
        q["redacted"] = True
    else:
        q["redacted"] = False
    return q


def to_payload(g: Graph, redacted: bool) -> dict:
    people = []
    for p in g.people.values():
        people.append(redact_person(p) if redacted else dict(p, redacted=False))
    people.sort(key=lambda x: (x.get("line") or "", x.get("birth_year") or 9999, x["display"]))
    living_n = sum(1 for p in g.people.values() if p["living"])
    dead_n = len(g.people) - living_n
    solid_n = sum(1 for p in g.people.values() if p["evidence"] == "solid")
    return {
        "meta": {
            "title": "Greene–Hoy family tree",
            "updated": "2026-09-08",
            "people": len(g.people),
            "living": living_n,
            "deceased": dead_n,
            "solid": solid_n,
            "soft": len(g.people) - solid_n,
            "unions": len(g.unions),
            "edges": len(g.edges),
            "redacted": redacted,
            "focus": "greene-christopher-1979",
            "lines": [
                {
                    "id": "greene-now",
                    "label": "Contemporary Greene",
                    "evidence": "soft",
                    "note": "Household named in Ethan Greene's memoir.",
                },
                {
                    "id": "green-yangery",
                    "label": "Yangery Green, 1909–1912",
                    "evidence": "solid",
                    "note": "Taken from purchased VIC death-register pages. Not joined to the living household.",
                },
                {
                    "id": "hoy",
                    "label": "Hoy kin (compiled)",
                    "evidence": "soft",
                    "note": "From the public Augustine Hoy descendant report, including Ellen Hoy × Francis Patrick Greene (1926).",
                },
            ],
            "unlock": {
                "needed": True,
                "hint": "Family passphrase unlocks living names for this browser session.",
            },
        },
        "people": people,
        "unions": list(g.unions.values()),
        "edges": g.edges,
    }


def main() -> int:
    g = Graph()
    if HOY_SRC.exists():
        ingest_hoy(g, HOY_SRC.read_text(encoding="utf-8", errors="replace"))
        scrub_parsed(g)
    else:
        print("Hoy source dump missing; Hoy cluster will be empty.", file=sys.stderr)
    add_bdm_green(g)
    add_memoir_greene(g)

    living = to_payload(g, redacted=False)
    public = to_payload(g, redacted=True)

    (ROOT / "graph-living.json").write_text(
        json.dumps(living, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    public_txt = json.dumps(public, indent=2, ensure_ascii=False) + "\n"
    (ROOT / "graph.public.json").write_text(public_txt, encoding="utf-8")
    (ROOT / "graph.json").write_text(public_txt, encoding="utf-8")
    print(
        f"people={len(g.people)} living={living['meta']['living']} "
        f"solid={living['meta']['solid']} unions={len(g.unions)} edges={len(g.edges)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

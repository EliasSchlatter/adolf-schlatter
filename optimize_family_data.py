import json

# ---- 1. deinen Personen-Datensatz laden ----
with open("familie_schlatter_personen.json", "r", encoding="utf-8") as f:
    people = json.load(f)

nodes = []
edges = []
id_to_gen = {}

# ---- 2. alle Personen als nodes übernehmen ----
for p in people:
    node = {
        "id": p["id"],
        "name": p["name"],
        "birth_year": p.get("birth_year"),
        "death_year": p.get("death_year"),
        "occupation": p.get("occupation"),
        "notes": p.get("notes", ""),
        "generation_depth": None,
        "lineage_hint": "",
        "source_page": p.get("source_page", "")
    }
    nodes.append(node)

# ---- 3. Eltern- und Kinderbeziehungen in edges übersetzen ----
for p in people:
    for c in p.get("children_ids", []):
        edges.append({
            "source": p["id"],
            "target": c,
            "type": "PARENT_OF"
        })
    for par in p.get("parent_ids", []):
        if par:
            edges.append({
                "source": par,
                "target": p["id"],
                "type": "PARENT_OF"
            })
    for s in p.get("spouse_ids", []):
        edges.append({
            "source": p["id"],
            "target": s,
            "type": "MARRIED"
        })

# ---- 4. Sibling-Relationen ergänzen ----
# Eltern → Kinder-Mapping
from collections import defaultdict
siblings = defaultdict(list)
for p in people:
    parents = tuple(sorted([pid for pid in p.get("parent_ids", []) if pid]))
    if parents:
        siblings[parents].append(p["id"])

for sib_group in siblings.values():
    for a in sib_group:
        for b in sib_group:
            if a != b:
                edges.append({"source": a, "target": b, "type": "SIBLING_OF"})

# ---- 5. Generationenstufe berechnen ----
# Start: alle ohne Eltern = depth 1
roots = [p["id"] for p in people if not p.get("parent_ids")]
depths = {rid: 1 for rid in roots}

changed = True
while changed:
    changed = False
    for p in people:
        if p["id"] in depths:
            continue
        parents = [pid for pid in p.get("parent_ids", []) if pid]
        if parents and all(par in depths for par in parents):
            depths[p["id"]] = max(depths[par] for par in parents) + 1
            changed = True

for n in nodes:
    if n["id"] in depths:
        n["generation_depth"] = depths[n["id"]]

# ---- 6. Graph speichern ----
graph = {"graph": {"nodes": nodes, "edges": edges}}
with open("familie_schlatter_graph.json", "w", encoding="utf-8") as f:
    json.dump(graph, f, ensure_ascii=False, indent=2)

print("Optimierung abgeschlossen!")
print(f"{len(nodes)} Personen verarbeitet")
print(f"{len(edges)} Beziehungen erstellt")
print(f"Graph gespeichert in: familie_schlatter_graph.json")

# ---- 7. Statistiken anzeigen ----
print("\nGenerationen-Verteilung:")
gen_counts = {}
for n in nodes:
    if n["generation_depth"]:
        gen_counts[n["generation_depth"]] = gen_counts.get(n["generation_depth"], 0) + 1

for gen in sorted(gen_counts.keys()):
    print(f"  Generation {gen}: {gen_counts[gen]} Personen")

print("\nWichtigste Personen (mit Generation):")
important_people = ["P1", "P5", "P10", "P12", "P14", "P25"]
for person_id in important_people:
    for n in nodes:
        if n["id"] == person_id:
            print(f"  {n['name']} ({person_id}): Generation {n['generation_depth']}")
            break

"""Coverage audit: every Phase 1 inventory item (ch25/docs/inventory.md) must appear in the built site.
Each section belongs to a module; sections of built modules must reach 100%.
Usage: python3 ch25/site/tools/audit.py   (exit 1 if a built module misses anything)
"""
import sys, html, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
raw = (ROOT / "dist" / "index.html").read_text()
text = re.sub(r"\s+", " ", html.unescape(raw)).lower()
built = set(re.findall(r"CONTENT\.(m\d+) = \{", raw))

# (module, section) -> terms, in inventory order. Terms are short exact phrases from the files.
INVENTORY = {
    ("m1", "1 Introduction (A2–A3)"): [
        "the study of blood", "involved in health and disease", "red blood cells (rbcs)", "white blood cells (wbcs)", "platelets",
        "other proteins", "bleeding and clotting cascades", "hematopoietic system", "production of blood components",
        "bone marrow", "spleen", "lymph nodes", "any disorder of the blood", "hemolytic disorders", "breakdown of rbcs",
        "hemostatic disorders", "bleeding and clotting abnormalities"],
    ("m1", "2.1 Blood basics (A4)"): ["connective tissue", "cells and cell fragments suspended in plasma", "8%", "5 to 6 l"],
    ("m1", "2.2 Eight functions (A5)"): [
        "supply oxygen and nutrients", "transport carbon dioxide and waste", "nitrogenous wastes", "lungs and kidneys", "carry hormones",
        "endocrine glands to the target tissues", "regulate body temperature", "regulate ph", "buffering components",
        "balance fluid and electrolytes", "sodium and plasma proteins", "regulate the immune system", "wbcs and antibodies",
        "form clots", "action of platelets"],
    ("m1", "2.3 Two components (A6)"): [
        "92%", "8% various solutes", "proteins, electrolytes, clotting factors, glucose", "55%", "formed elements", "45%",
        "erythrocytes", "leukocytes", "thrombocytes", "99%"],
    ("m1", "2.4 Figure: blood composition (A7)"): [
        "blood: 8% of total body weight", "plasma: 55%", "water: 92%", "solutes: 8%", "leukocytes and thrombocytes (platelets)",
        "formed elements: 45%", "9 percent"],
    ("m1", "2.6 RBC production (A8)"): [
        "stem cells", "cells that develop into other types of cells", "erythropoietin", "secreted by the kidneys", "circulatory need",
        "5 days", "4 months", "120 days", "iron-rich hemoglobin", "oxygen attached to hemoglobin gives blood its red color",
        "bohr effect", "higher concentrations of carbon dioxide", "more acidotic", "oxygen is released"],
    ("m1", "2.7 Three lab tests (A9)"): [
        "rbc count", "number of rbcs in a blood sample", "hemoglobin level", "amount of hemoglobin found within the rbcs",
        "hematocrit", "overall proportion of rbcs in the blood", "balanced", "hemoglobin level is one-third the hematocrit level",
        "rbc count is one-third the hemoglobin level"],
    ("m1", "2.8 Table 25-1 (A10)"): [
        "table 25-1", "rbc and platelet counts", "× 10⁶/mcl", "4.5–6 in adults", "3.3–5.5 in children",
        "anemia, hemorrhage, certain leukemias, overhydration, chronic infections", "polycythemia, cardiovascular disease, hemoconcentration, dehydration",
        "hemoglobin (g/dl)", "12–16 in females", "14–18 in males", "10.7–17.1 in children",
        "anemia, hyperthyroidism, liver disease, hemorrhage, hemolytic reactions", "copd, hf, polycythemia, high-altitude sickness",
        "hematocrit (%)", "35–45 in females", "40–50 in males", "32–55 in children",
        "same as for rbcs and hemoglobin, including leukemia, lupus, endocarditis, rheumatic fever, nutritional disorders",
        "polycythemia and usually anything that produces severe dehydration", "thrombocytes (platelets)", "150,000–400,000 cells/mcl",
        "thrombocytopenia, certain cancers, certain leukemias, sickle cell disease, systemic lupus erythematosus",
        "pulmonary embolism, polycythemia, acute hemorrhage, metastatic cancer, surgical stress",
        "not intended to be definitive", "each laboratory determines its own values", "method dependent",
        "chronic obstructive pulmonary disease", "heart failure", "red blood cell"],
}

total = found = 0
fail = False
print(f"Coverage audit · built modules: {', '.join(sorted(built)) or 'none'}")
for (mid, sec), terms in INVENTORY.items():
    miss = [t for t in terms if t.lower() not in text]
    total += len(terms); found += len(terms) - len(miss)
    state = "built" if mid in built else "pending"
    mark = "OK " if not miss else ("MISS" if mid in built else "....")
    print(f"  [{mark}] {mid} {sec}: {len(terms) - len(miss)}/{len(terms)} ({state})")
    if miss and mid in built:
        fail = True
        for t in miss:
            print(f"         missing: {t}")
print(f"Total: {found}/{total} inventory items found")
sys.exit(1 if fail else 0)

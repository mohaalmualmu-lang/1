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
    ("m2", "2.5 Figure: development of blood cells (A7)"): [
        "hemocytoblast", "proerythroblast", "polychromatic erythroblast", "myeloblast", "progranulocyte", "basophil", "eosinophil",
        "neutrophil", "lymphoblast", "lymphocyte", "monoblast", "monocyte", "megakaryoblast", "megakaryocyte", "thrombocytes",
        "granulocytes", "agranulocytes", "leukocytes"],
    ("m2", "2.9 White blood cells (A11)"): [
        "larger than rbcs", "immunity against foreign invaders", "derived from stem cells", "several types", "neutropenia",
        "abnormally low number of neutrophils", "majority of the circulating wbcs", "humoral", "cell-mediated", "immunoglobulins",
        "recognize a specific antigen", "macrophages and t cells"],
    ("m2", "2.10 Table 25-2 (A12)"): [
        "table 25-2", "wbc count and differential", "4,500–10,000 cells/mm³ in adults", "4,500–15,500 cells/mm³ in children", "9,400–34,000 cells/mm³ in infants",
        "viral infections, bone marrow diseases or disorders, leukemia, radiation, late-stage aids",
        "viral and bacterial infections, hemorrhage, traumatic tissue injuries, leukemia, cigarette smoking",
        "neutrophils (segmented and unsegmented)", "50%–60%", "2,500–8,000 cells/mm³", "leukemia, infections, rheumatoid arthritis, vitamin b",
        "deficiency, enlarged spleen", "bacterial infections, tissue breakdown, hemolytic reactions, tumors, mi, surgical stress, cancer",
        "basophils (also known as mast cells)", "0.5%–1%", "25–100 cells/mm³", "allergic reactions, hyperthyroidism, mi, bleeding ulcers, stress",
        "certain leukemias, inflammations, allergy, polycythemia, hemolytic anemia", "1%–4%", "50–500 cells/mm³", "mononucleosis, hf, cushing disease",
        "addison disease, tumors, skin infections, allergies", "20%–40%", "1,000–4,000 cells/mm³",
        "hodgkin disease, burns, trauma, lupus, cushing disease, immunodeficiency states",
        "numerous bacterial and viral infections, hepatitis, leukemia, toxoplasmosis, graves disease", "2%–6%", "100–700 cells/mm³",
        "corticosteroid use, infections, rheumatoid arthritis, hiv", "numerous bacterial and parasitic infections, recovery from acute infections, tb, hematologic disorders",
        "percentage of the total wbc count", "neutrophils should account for 2,500 to 3,000", "acquired immunodeficiency syndrome",
        "human immunodeficiency virus", "myocardial infarction", "tuberculosis", "white blood cell"],
    ("m2", "2.11 Platelets and hemostasis (A13)"): [
        "smallest formed element", "two-thirds", "stored in the spleen", "initial plug", "toughen and complete", "thrombocytosis", "too many platelets",
        "thrombosis", "stop bleeding", "vascular spasm", "coagulation", "platelet plugging", "clots are made of fibrin",
        "thrombin converts fibrinogen to fibrin", "calcium acts as a binding agent", "clotting factors work together"],
    ("m2", "2.12 Clotting cascade (A14)"): [
        "coagulation cascade", "intrinsic", "extrinsic", "common pathway", "surface contact", "prekallikrein", "kallikrein", "kinins", "inflammation",
        "tissue thromboplastin (iii)", "released from damaged tissue", "tissue lipid", "platelet lipid", "viii (ahf)", "insoluble fibrin",
        "coagulopathy", "activation or continuation of the clotting cascade", "heavy or prolonged bleeding", "von willebrand disease"],
    ("m2", "3 Blood-forming organs (A15–A16)"): [
        "primary site for cell production", "long bones and the pelvis, skull and vertebrae", "produces the clotting factors", "filters the blood",
        "removes toxins", "essential to normal metabolism and homeostasis", "breaks down old rbcs into bile", "highly vascular", "stores blood",
        "also vascular", "filters and breaks down rbcs", "lymphocyte production", "homeostasis and infection control", "stores one-third of the platelets"],
    ("m3", "4.1–4.2 Overview, scene size-up (A17–A18)"): [
        "life-threatening signs or symptoms", "unusual bleeding", "underlying pathology", "sample", "last oral intake", "events leading to injury or illness",
        "safe for entry", "mechanism of injury", "number of patients", "hazards", "need for additional help", "gloves, mask, and eye protection",
        "standard minimum precautions"],
    ("m3", "4.3 Primary survey (A19–A21)"): [
        "cervical spine stabilization", "don’t dismiss a pain complaint of the spine", "abcdes", "rapid (full-body) scan", "loc",
        "inadequate breathing or altered mental status", "avoid causing bleeding", "suctioning", "signs of shock", "rapid pulse rate and low blood pressure",
        "signs of acute blood loss", "bleeding of unknown origin", "signs of hypoxia", "avoid washing out clots", "provide transport"],
    ("m3", "4.4 History taking (A22–A25)"): [
        "seem unrelated", "pneumonia in a patient with sickle cell disease", "abdominal pain in a patient with polycythemia", "changes in loc", "vertigo",
        "feelings of fatigue", "syncope", "dyspnea", "chest pain", "changes in pulse rate and rhythm", "coughing up blood", "visual disturbances", "muscle pain",
        "stiffness", "larger disease process", "isolated or felt throughout the entire body", "skin changes", "pain for unknown reasons", "genitourinary",
        "gastrointestinal"],
    ("m3", "4.5 Secondary assessment + Table 25-3 (A26)"): [
        "on scene, en route, or not at all", "baseline", "table 25-3", "common findings with blood disorders",
        "excitability, agitation, and combativeness to unresponsiveness", "uncontrolled bleeding, easy bruising, petechiae, itching, pallor",
        "yellow appearance usually indicates liver problems", "leg ulcers (may be seen with sickle cell disease)", "epistaxis (bloody nose)", "bleeding gums",
        "blurred vision", "diplopia (double vision)", "complete or partial vision loss", "seeing black or gray spots", "retinal hemorrhage", "tinnitus",
        "palpitations", "hemoptysis (coughing up blood)", "sternal tenderness (may be seen with leukemia, myeloma, or lymphoma)",
        "chronic joint or bone pain or rigidity, edema", "melena (blood in the stool)", "liver failure (causes jaundice)", "hematuria, menorrhagia, chronic or recurring infections"],
    ("m3", "4.6–5 Reassessment, emergency care (A27–A28)"): [
        "reassess frequently", "patient history", "present situation", "assessment findings", "interventions and results", "thoroughly document",
        "oxygen", "fluids", "ecg", "transport", "comfort", "pharmacology", "psychological support"],
    ("m4", "7 Sickle cell crisis (A29–A34)"): [
        "most common inherited blood disorder", "african american, puerto rican, and european", "2016", "100,000", "42 years", "48 years",
        "adult-type hemoglobin (hba)", "hbss", "hbs", "high probability offspring will have the disease or carry the mutation", "oblong shape",
        "poor oxygen carrier", "hypoxia", "much shorter life span", "anemia", "lodge in small blood vessels", "thrombosis",
        "aplastic crisis", "temporarily stops rbc production", "easily tired, anemic, pale, and short of breath", "hemolytic crisis",
        "acute rbc destruction leading to jaundice", "vasoocclusive crisis", "blood flow to an organ becomes restricted", "pain, ischemia, and often organ damage",
        "5–7 days", "narrow vessels", "removing damaged rbcs", "acute chest syndrome", "pneumonia", "and pe", "chest pain, fever, and cough",
        "vasoocclusion in the brain may result in stroke", "splenic sequestration crisis", "block blood from leaving the spleen",
        "painful, acute enlargement of the spleen", "hard, bloated, painful abdomen", "infants or toddlers", "acute splenic sequestration syndrome",
        "dramatic fall in hemoglobin", "sudden weakness, pallor, tachypnea, and tachycardia", "rapidly progress to shock",
        "life-threatening crisis", "shortness of breath", "signs of pneumonia", "inadequate perfusion of the skin accompanied by hypotension",
        "signs of jaundice", "icteric sclera", "mild dehydration", "significant pain", "hands and feet", "back and proximal extremity",
        "position of comfort", "maintain body temperature", "cold can contribute to sickling of cells", "supplemental oxygen", "iv fluid therapy",
        "analgesics per local protocol", "high pain threshold", "higher level of analgesia", "recommend that the patient rest", "micrograph"],
    ("m5", "8 Anemia (A35–A39)"): [
        "lower than normal", "underlying disease", "blood loss, acute or chronic", "decreased production or increased destruction of erythrocytes",
        "hemolytic disorder", "iron-deficiency anemia", "most common type", "gastrointestinal blood loss", "menstrual bleeding",
        "frequent blood donations or diagnostic tests", "premature birth or low birth weight", "thalassemia", "rigid and deformed membranes",
        "glucose-6-phosphate dehydrogenase", "enzyme protection of rbcs during infections", "most common in african americans",
        "problems with blood vessel linings or blood clots", "autoimmune disorders", "microorganisms", "high altitude", "partial pressure of oxygen",
        "difficulty breathing", "feeling worn down", "no energy", "overexerted", "unable to catch their breath", "anginal-type chest pain",
        "reduced oxygen supply to the heart", "skin color changes", "leukopenia", "thrombocytopenia", "cutaneous bleeding (including petechiae)",
        "bleeding from mucous membranes", "nosebleeds and rectal bleeding", "airway and breathing", "vital signs frequently", "cardiac monitor",
        "12-lead ecg", "manage blood pressure and replace fluids", "rapid transport", "abrupt change in mental status", "hypotension", "other significant changes"],
    ("m5", "11 Polycythemia (A51–A54)"): [
        "overabundance or overproduction of rbcs", "increased blood viscosity and volume", "congestion of tissues and organs", "hyperviscosity",
        "thrombus formation", "single stem cell", "heart failure or hypotension", "high-altitude areas for long periods", "strokes",
        "transient ischemic attacks", "deep vein thrombosis", "pulmonary embolism", "myocardial infarction", "headaches", "enlarged spleen",
        "phlebotomy", "less than 45%", "less than 42%", "cancer-type therapy", "altered levels of consciousness", "respiratory distress",
        "changes in peripheral pulses, pulse rate, and skin color", "tachycardia", "extent and duration of dyspnea", "pruritus",
        "changes in skin temperature", "thorough medical history", "chief complaint", "different medical emergency", "supportive care and transport",
        "oxygen as needed", "iv access"],
    ("m6", "9 Leukemia (A40–A44)"): [
        "cancer (that develops) in the lymphoid system", "immature and/or abnormal blood cells", "leukocytosis", "chemotherapy",
        "frequent bleeding, bruising, infections, and fever", "acute leukemia", "abnormal lymphoblasts", "chronic leukemia", "65 years or older",
        "bone marrow, lymph nodes, spleen, and peripheral blood", "found by chance during routine blood tests", "stage at which the disease is detected",
        "underlying medical condition", "response to treatment", "chemotherapy and radiation", "remission", "acute lymphoblastic leukemia",
        "5-year survival rate of more than 90%", "gloves and mask", "immunocompromised", "stage of leukemia", "current treatment", "headaches",
        "signs of neurologic defects", "fever", "bone pain", "diaphoresis", "feeling full", "soreness in the midpart of the chest", "unexplained bleeding",
        "hypotension and tachycardia", "airway support", "oxygen therapy", "analgesics", "emotional support", "loved ones are uncertain about what to do",
        "medical control", "document all findings", "refusal and/or release form", "could go into arrest", "patient’s and family’s wishes"],
    ("m6", "10 Lymphomas (A45–A50)"): [
        "group of malignant diseases", "non-hodgkin", "hodgkin", "any age", "hereditary", "indolent (very slow)", "may never leave the lymphoid system",
        "aggressive (fast-growing)", "highly aggressive (very fast-growing)", "multiple organs in a short period",
        "painless, progressive enlargement of the lymphoid glands", "spleen and lymph nodes", "rare", "hereditary components", "10 and 35 years",
        "late life", "no symptoms for years", "night sweats", "chills", "persistent cough", "swelling of (various) lymph nodes", "loss of appetite",
        "weight loss", "itching", "fatigue", "cure is possible", "chemotherapy or radiation", "stage and classification",
        "which type of cancer do you have", "which type of treatment are you receiving", "pallor", "congestion in lower lung fields",
        "feeling hot and then cold or both", "inadequate perfusion", "low blood pressure", "abnormal ecg rhythms", "high-dose analgesic regimen",
        "fluid therapy, supplemental oxygen", "abnormal heart rhythms", "does not improve", "be supportive", "explain options to the patient and family"],
    ("m6", "14 Multiple myeloma (A62–A65)"): [
        "plasma cells in the bone marrow increases abnormally", "tumors in the bone", "impairs normal bone marrow function",
        "rbc, wbc, and platelet formation", "susceptibility to infection", "accelerate protein development in the bloodstream", "organ failure",
        "older than 40", "weakness in the bones", "spontaneous fractures", "pain in the bones and back", "stem cell transplant, chemotherapy, and radiotherapy",
        "mask and gloves", "fatigue or mild pain", "unexplained hemorrhage", "significant weight loss", "frequent bone fractures", "pain in various locations",
        "iv fluid therapy", "pain management", "supportive care", "definitive care"],
    ("m7", "13 Hemophilia (A58–A61)"): [
        "clotting does not occur or occurs insufficiently", "x-linked recessive", "primarily found in males", "factor viii",
        "antihemophilic globulin and antihemophilic factor", "factor ix", "plasma thromboplastin component", "christmas factor",
        "levels of factors viii and ix determine the severity", "the same in both types", "acute and chronic bleeding", "spontaneous intracranial bleeding",
        "hospitalization for transfusion", "infusion of factors viii and ix", "manage the abcs", "oxygen if appropriate", "note ecg findings",
        "symptomatic dysrhythmias", "iv therapy", "cover patients to maintain body temperature", "immediate follow-up"],
    ("m7", "12 DIC (A55–A57)"): [
        "disseminated intravascular coagulation", "number of life-threatening conditions", "two stages", "free thrombin and fibrin deposits in the blood increase",
        "platelets begin to aggregate", "defibrination", "breakdown of the fibrin clots", "uncontrolled hemorrhage", "reduction in clotting factors",
        "mortality rate is hard to determine", "additional conditions", "uncontrolled bleeding, hypotension, and shock", "progression toward it",
        "respiratory difficulty", "cold and clammy", "purpura", "chest and abdomen", "maintain an airway", "treat for shock", "be optimistic but honest"],
    ("m8", "15 Transfusion reactions (A66–A70)"): [
        "0.2% to 10%", "blood type different than their own", "anaphylactic", "occurs rapidly", "circulatory collapse", "first 30 to 60 minutes",
        "table 25-4", "abo rh type and preferred and alternative donor types", "a−, o+, o−", "ab−, a+, a−, b+, b−, o+, o−", "a−, b−, o−", "b−, o+, o−",
        "none", "applegate", "anatomy and physiology learning system", "unresponsive or intubated", "rapid onset", "back pain", "vomiting",
        "delayed up to 7 days", "hemolytic reaction", "greatest threat", "incompatibility", "destroying new rbcs", "febrile reaction", "most common",
        "usually benign", "antipyretic and observation", "allergic reaction", "preservatives or other agents", "first few minutes",
        "transfusion-related lung injury", "noncardiogenic pulmonary edema", "increased capillary permeability", "circulatory overload",
        "cardiomyopathy or ventricular dysfunction", "diuresis", "oxygen, nitrates, and morphine", "bacterial infection",
        "poor blood product handling or contamination", "sepsis", "amount of blood volume transfused", "immediately stopping the transfusion",
        "rechecking the donor blood", "wrong blood was given", "contacting medical control", "counteract shock", "replacing the existing iv tubing and bag",
        "normal saline", "retaining blood products and tubing"],
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

/* ===== module catalogue ===== */
const MODULES = [
  { id: 'm1', n: 1, title: 'Blood & Its Lab Values', ar: 'الدم وقيمه المخبرية', blurb: 'What blood is made of, what it does, how RBCs are made, and Table 25-1' },
  { id: 'm2', n: 2, title: 'WBCs, Platelets & Clotting', ar: 'الكريات البيضاء والصفائح والتخثر', blurb: 'Table 25-2, hemostasis, the clotting cascade and the blood-forming organs' },
  { id: 'm3', n: 3, title: 'Assessment & General Care', ar: 'التقييم والرعاية العامة', blurb: 'Scene to reassessment, what to look for, Table 25-3 and the 7 parts of care' },
  { id: 'm4', n: 4, title: 'Sickle Cell Crisis', ar: 'أزمة الخلايا المنجلية', blurb: 'Five crises, child vs adult pain, and why cold makes it worse' },
  { id: 'm5', n: 5, title: 'Anemia vs Polycythemia', ar: 'فقر الدم مقابل كثرة الحمر', blurb: 'Too few red cells against too many: causes, signs, phlebotomy targets' },
  { id: 'm6', n: 6, title: 'Blood Cancers', ar: 'سرطانات الدم', blurb: 'Leukemia, Hodgkin and non-Hodgkin lymphoma, and multiple myeloma' },
  { id: 'm7', n: 7, title: 'Bleeding Disorders', ar: 'اضطرابات النزف', blurb: 'Hemophilia A and B, and the two stages of DIC' },
  { id: 'm8', n: 8, title: 'Transfusion Reactions', ar: 'تفاعلات نقل الدم', blurb: 'Six complications, the first 30–60 minutes and Table 25-4' },
];
const CONTENT = {};

/* ---------- visual blocks used inside cards ---------- */
const VIZ = {
  comp4: () => `<div class="viz"><div class="jobs">
    <div class="job"><svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="15" ry="11" fill="#e5484d"/><ellipse cx="20" cy="20" rx="7" ry="4.5" fill="#b8282d"/></svg><b>Red blood cells</b><span>RBCs · erythrocytes</span></div>
    <div class="job"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="#d8e2ff" stroke="#8ea2d8" stroke-width="1.5"/><path d="M13 18c3-6 9-6 12-1s-1 9-5 8-5 2-8-1" fill="#7b5fc7"/></svg><b>White blood cells</b><span>WBCs · leukocytes</span></div>
    <div class="job"><svg viewBox="0 0 40 40"><g fill="#f3b746"><ellipse cx="12" cy="14" rx="5" ry="3"/><ellipse cx="26" cy="12" rx="4" ry="2.4"/><ellipse cx="18" cy="26" rx="5" ry="3"/><ellipse cx="30" cy="27" rx="4" ry="2.6"/></g></svg><b>Platelets</b><span>thrombocytes</span></div>
    <div class="job"><svg viewBox="0 0 40 40" fill="none" stroke="var(--cyan)" stroke-width="2" stroke-linecap="round"><path d="M6 28c4-10 8-10 12 0s8 10 12 0"/><path d="M8 14h24"/><circle cx="12" cy="9" r="2" fill="var(--cyan)"/><circle cx="20" cy="9" r="2" fill="var(--cyan)"/><circle cx="28" cy="9" r="2" fill="var(--cyan)"/></svg><b>Other proteins</b><span>bleeding &amp; clotting cascades</span></div>
  </div></div>`,
  weight: () => `<div class="viz"><div class="statrow">
    <div class="stat"><b>8%</b><span>of total body weight is blood</span></div>
    <div class="stat"><b>5–6 L</b><span>approximate blood volume</span></div>
    <div class="stat"><b>CT</b><span>blood is a connective tissue</span></div></div></div>`,
  jobs8: () => `<div class="viz"><ol class="jobs8">
    <li><b>O₂ + nutrients</b><span>to the cells</span></li>
    <li><b>CO₂ + waste</b><span>to lungs &amp; kidneys</span></li>
    <li><b>Hormones</b><span>endocrine glands → target tissues</span></li>
    <li><b>Temperature</b><span>regulates body temperature</span></li>
    <li><b>pH</b><span>through buffering components</span></li>
    <li><b>Fluid &amp; electrolytes</b><span>through sodium &amp; plasma proteins</span></li>
    <li><b>Immune system</b><span>through WBCs &amp; antibodies</span></li>
    <li><b>Clots</b><span>through platelets</span></li></ol></div>`,
  split: () => `<div class="viz"><div class="splitbar" role="img" aria-label="Blood is 55 percent plasma and 45 percent formed elements; plasma is 92 percent water and 8 percent solutes; formed elements are 99 percent red blood cells">
    <div class="sb"><span style="flex:55" class="pl">Plasma 55%</span><span style="flex:45" class="fe">Formed elements 45%</span></div>
    <div class="sb sub"><span style="flex:92" class="w">Water 92%</span><span style="flex:8;min-width:96px" class="so">Solutes 8%</span></div>
    <p class="muted" style="font-size:13px;margin-top:6px">Plasma solutes: proteins, electrolytes, clotting factors, glucose. Formed elements: <b>99%</b> are RBCs, plus WBCs and platelets.</p></div></div>`,
  life: () => `<div class="viz"><div class="timeline">
    <div><b>Kidneys</b><span>secrete erythropoietin in response to circulatory need</span></div>
    <div><b>Stem cells</b><span>produce the RBC</span></div>
    <div><b>≤ 5 days</b><span>to mature</span></div>
    <div><b>≈ 120 days</b><span>average life (≈ 4 months)</span></div></div></div>`,
  thirds: () => `<div class="viz"><div class="thirds">
    <div class="t3"><small>RBC count</small><b>5</b></div><span class="op">× 3 ≈</span>
    <div class="t3"><small>Hemoglobin</small><b>15</b></div><span class="op">× 3 ≈</span>
    <div class="t3"><small>Hematocrit</small><b>45</b></div></div>
    <p class="muted" style="font-size:13px;margin-top:6px">Read it backwards: Hb is one-third of Hct; RBC count is one-third of Hb. (The example numbers are illustrative, not from your notes.)</p></div>`,
};

/* ---------- Table 25-1, verbatim (A10 · B11); used by cards, the analyzer, drills and the cheat sheet ---------- */
const T251 = [
  { id: 'rbc', name: 'RBC count', unit: '× 10⁶/mcL', head: 'RBC count (× 10⁶/mcL)', normal: '4.5–6 in adults; 3.3–5.5 in children',
    ranges: { F: [4.5, 6], M: [4.5, 6], child: [3.3, 5.5] }, txt: { F: '4.5–6 × 10⁶/mcL (adults)', M: '4.5–6 × 10⁶/mcL (adults)', child: '3.3–5.5 × 10⁶/mcL' },
    low: 'Anemia, hemorrhage, certain leukemias, overhydration, chronic infections', high: 'Polycythemia, cardiovascular disease, hemoconcentration, dehydration' },
  { id: 'hb', name: 'Hemoglobin', unit: 'g/dL', head: 'Hemoglobin (g/dL)', normal: '12–16 in females; 14–18 in males; 10.7–17.1 in children',
    ranges: { F: [12, 16], M: [14, 18], child: [10.7, 17.1] }, txt: { F: '12–16 g/dL', M: '14–18 g/dL', child: '10.7–17.1 g/dL' },
    low: 'Anemia, hyperthyroidism, liver disease, hemorrhage, hemolytic reactions', high: 'COPD, HF, polycythemia, high-altitude sickness' },
  { id: 'hct', name: 'Hematocrit', unit: '%', head: 'Hematocrit (%)', normal: '35–45 in females; 40–50 in males; 32–55 in children',
    ranges: { F: [35, 45], M: [40, 50], child: [32, 55] }, txt: { F: '35–45%', M: '40–50%', child: '32–55%' },
    low: 'Same as for RBCs and hemoglobin, including leukemia, lupus, endocarditis, rheumatic fever, nutritional disorders', high: 'Polycythemia and usually anything that produces severe dehydration' },
  { id: 'plt', name: 'Thrombocytes (platelets)', unit: 'cells/mcL', head: 'Thrombocytes (platelets)', normal: '150,000–400,000 cells/mcL',
    ranges: { F: [150000, 400000], M: [150000, 400000], child: [150000, 400000] }, txt: { F: '150,000–400,000 cells/mcL', M: '150,000–400,000 cells/mcL', child: '150,000–400,000 cells/mcL' },
    low: 'Thrombocytopenia, certain cancers, certain leukemias, sickle cell disease, systemic lupus erythematosus', high: 'Pulmonary embolism, polycythemia, acute hemorrhage, metastatic cancer, surgical stress' },
];
const T251_NOTE = '<sup>a</sup> The normal ranges provided are not intended to be definitive. Each laboratory determines its own values, and normal ranges are method dependent. Abbreviations: COPD, chronic obstructive pulmonary disease; HF, heart failure; RBC, red blood cell.';
function t251(ids) {
  const rows = T251.filter(r => !ids || ids.includes(r.id));
  return `<div class="tblwrap"><table class="t"><caption><span>TABLE 25-1</span>RBC and Platelet Counts</caption>
    <thead><tr><th>Name</th><th>Normal Values<sup>a</sup></th><th>Examples of Conditions Associated With Low Readings</th><th>Examples of Conditions Associated With High Readings</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td>${r.head}</td><td class="num" data-l="Normal values">${r.normal.replace(/; /g, ';<br>')}</td><td data-l="Low readings">${r.low}</td><td data-l="High readings">${r.high}</td></tr>`).join('')}</tbody></table></div>
    <p class="tnote">${T251_NOTE} Source: A10 · B11.</p>`;
}

/* ---------- Table 25-2, verbatim (A12 · B13) ---------- */
const T252 = [
  { id: 'wbc', name: 'WBC count', normal: '4,500–10,000 cells/mm³ in adults; 4,500–15,500 cells/mm³ in children; 9,400–34,000 cells/mm³ in infants', low: 'Viral infections, bone marrow diseases or disorders, leukemia, radiation, late-stage AIDS', high: 'Viral and bacterial infections, hemorrhage, traumatic tissue injuries, leukemia, cigarette smoking' },
  { id: 'neut', name: 'Neutrophils (segmented and unsegmented)', normal: '50%–60%<sup>b</sup>; 2,500–8,000 cells/mm³', low: 'Leukemia, infections, rheumatoid arthritis, vitamin B<sub>12</sub> deficiency, enlarged spleen', high: 'Bacterial infections, tissue breakdown, hemolytic reactions, tumors, MI, surgical stress, cancer' },
  { id: 'baso', name: 'Basophils (also known as mast cells)', normal: '0.5%–1%<sup>a</sup>; 25–100 cells/mm³', low: 'Allergic reactions, hyperthyroidism, MI, bleeding ulcers, stress', high: 'Certain leukemias, inflammations, allergy, polycythemia, hemolytic anemia' },
  { id: 'eos', name: 'Eosinophils', normal: '1%–4%<sup>a</sup>; 50–500 cells/mm³', low: 'Mononucleosis, HF, Cushing disease', high: 'Addison disease, tumors, skin infections, allergies' },
  { id: 'lym', name: 'Lymphocytes', normal: '20%–40%<sup>a</sup>; 1,000–4,000 cells/mm³', low: 'Hodgkin disease, burns, trauma, lupus, Cushing disease, immunodeficiency states', high: 'Numerous bacterial and viral infections, hepatitis, leukemia, toxoplasmosis, Graves disease' },
  { id: 'mono', name: 'Monocytes', normal: '2%–6%<sup>a</sup>; 100–700 cells/mm³', low: 'Corticosteroid use, infections, rheumatoid arthritis, HIV', high: 'Numerous bacterial and parasitic infections, recovery from acute infections, TB, hematologic disorders' },
];
const T252_NOTE = '<sup>a</sup> The normal ranges provided are not intended to be definitive. Each laboratory determines its own values, and normal ranges are method dependent. <sup>b</sup> Percentage of the total WBC count. Example: If the WBC is 5,000, then neutrophils should account for 2,500 to 3,000 of this count. Abbreviations: AIDS, acquired immunodeficiency syndrome; HF, heart failure; HIV, human immunodeficiency virus; MI, myocardial infarction; TB, tuberculosis; WBC, white blood cell.';
function t252(ids) {
  const rows = T252.filter(r => !ids || ids.includes(r.id));
  return `<div class="tblwrap"><table class="t"><caption><span>TABLE 25-2</span>WBC Count and Differential</caption>
    <thead><tr><th>Name</th><th>Normal Values<sup>a</sup></th><th>Examples of Conditions Associated With Low Readings</th><th>Examples of Conditions Associated With High Readings</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td>${r.name}</td><td class="num" data-l="Normal values">${r.normal.replace(/; /g, ';<br>')}</td><td data-l="Low readings">${r.low}</td><td data-l="High readings">${r.high}</td></tr>`).join('')}</tbody></table></div>
    <p class="tnote">${T252_NOTE} Source: A12 · B13.</p>`;
}

/* ---------- Table 25-3, verbatim (A26 · B31) ---------- */
const T253 = [
  { id: 'loc', sys: 'Level of consciousness', f: 'Alterations may range from excitability, agitation, and combativeness to unresponsiveness' },
  { id: 'skin', sys: 'Skin', f: 'Uncontrolled bleeding, easy bruising, petechiae, itching, pallor, jaundice (yellow appearance usually indicates liver problems), leg ulcers (may be seen with sickle cell disease)' },
  { id: 'hn', sys: 'Head and neck', f: 'Epistaxis (bloody nose), bleeding gums, blurred vision, diplopia (double vision), complete or partial vision loss, seeing black or gray spots, retinal hemorrhage, vertigo, tinnitus' },
  { id: 'chest', sys: 'Chest', f: 'Dyspnea, tachycardia, palpitations, chest pain, hemoptysis (coughing up blood), sternal tenderness (may be seen with leukemia, myeloma, or lymphoma)' },
  { id: 'back', sys: 'Back and extremities', f: 'Chronic joint or bone pain or rigidity, edema' },
  { id: 'gi', sys: 'Gastrointestinal', f: 'Ulcers, melena (blood in the stool), liver failure (causes jaundice), abdominal pain' },
  { id: 'gu', sys: 'Genitourinary', f: 'Hematuria, menorrhagia, chronic or recurring infections' },
];
function t253() {
  return `<div class="tblwrap"><table class="t"><caption><span>TABLE 25-3</span>Common Findings With Blood Disorders</caption>
    <thead><tr><th>System</th><th>Examples of Common Findings</th></tr></thead>
    <tbody>${T253.map(r => `<tr><td>${r.sys}</td><td data-l="Common findings">${r.f}</td></tr>`).join('')}</tbody></table></div><p class="tnote">Source: A26 · B31.</p>`;
}

/* ---------- Table 25-4, verbatim (A67 · B85) ---------- */
const T254 = [
  { r: 'A+', p: 'A+', add: ['A−', 'O+', 'O−'] }, { r: 'A−', p: 'A−', add: ['O−'] },
  { r: 'AB+', p: 'AB+', add: ['AB−', 'A+', 'A−', 'B+', 'B−', 'O+', 'O−'] }, { r: 'AB−', p: 'AB−', add: ['A−', 'B−', 'O−'] },
  { r: 'B+', p: 'B+', add: ['B−', 'O+', 'O−'] }, { r: 'B−', p: 'B−', add: ['O−'] },
  { r: 'O+', p: 'O+', add: ['O−'] }, { r: 'O−', p: 'O−', add: [] },
];
function t254() {
  return `<div class="tblwrap"><table class="t t3c"><caption><span>TABLE 25-4</span>ABO Rh Type and Preferred and Alternative Donor Types</caption>
    <thead><tr><th>Recipient Blood Type</th><th>Preferred Donor Type</th><th>Additional Permissible Types</th></tr></thead>
    <tbody>${T254.map(r => `<tr><td>${r.r}</td><td class="num" data-l="Preferred donor">${r.p}</td><td class="num" data-l="Additional permissible">${r.add.length ? r.add.join(', ') : 'None'}</td></tr>`).join('')}</tbody></table></div>
    <p class="tnote">Data from: Applegate EJ. <i>The Anatomy and Physiology Learning System</i>. 4th ed. Philadelphia, PA: Saunders; 2011. Source: A67 · B85.</p>`;
}

/* ===== data for tools: entities, numbers, picture quiz, tables, gallery names ===== */
const ENTITIES = [
  // Module 1
  { id: 'rbc', ty: 'Cell', n: 'Red blood cell (erythrocyte)', ar: 'الكرية الحمراء', mid: 'm1', src: 'A6, A8', def: 'Formed element (99% of formed elements) that carries oxygen on iron-rich hemoglobin.', find: 'Made in stem cells, stimulated by erythropoietin from the kidneys; up to 5 days to mature; lives about 120 days (4 months).', care: 'Measured by RBC count, hemoglobin level and hematocrit (Table 25-1).' },
  { id: 'wbc', ty: 'Cell', n: 'White blood cell (leukocyte)', ar: 'الكرية البيضاء', mid: 'm1', src: 'A6, A11', def: 'Formed element that provides immunity against foreign invaders; larger than RBCs; derived from stem cells.', find: 'In the spun tube it sits with the platelets in the thin band between plasma and RBCs.', care: 'Details and Table 25-2 in Module 2.' },
  { id: 'plt', ty: 'Cell', n: 'Platelet (thrombocyte)', ar: 'الصفيحة الدموية', mid: 'm1', src: 'A6, A13', def: 'Smallest formed element; clots the blood.', find: 'Normal 150,000–400,000 cells/mcL. Low: thrombocytopenia, certain cancers, certain leukemias, sickle cell disease, SLE. High: PE, polycythemia, acute hemorrhage, metastatic cancer, surgical stress.', care: 'About two-thirds circulate; the rest are stored in the spleen (Module 2).' },
  { id: 'plasma', ty: 'Component', n: 'Plasma', ar: 'البلازما', mid: 'm1', src: 'A6', def: '55% of total blood volume; 92% water and 8% various solutes.', find: 'Solutes: proteins, electrolytes, clotting factors, glucose.', care: 'The straw-coloured top layer of a spun sample.' },
  { id: 'formed', ty: 'Component', n: 'Formed elements', ar: 'العناصر المكوّنة', mid: 'm1', src: 'A6', def: '45% of total blood volume: RBCs (erythrocytes, 99%), WBCs (leukocytes) and platelets (thrombocytes).', find: '', care: '' },
  { id: 'epo', ty: 'Component', n: 'Erythropoietin', ar: 'الإريثروبويتين', mid: 'm1', src: 'A8', def: 'Protein secreted by the kidneys in response to circulatory need; stimulates RBC production in stem cells.', find: '', care: '' },
  { id: 'hgb', ty: 'Component', n: 'Hemoglobin', ar: 'الهيموغلوبين', mid: 'm1', src: 'A8, A10', def: 'Iron-rich protein inside RBCs that carries oxygen to the tissues; oxygen attached to it gives blood its red color.', find: 'Normal 12–16 g/dL females, 14–18 males, 10.7–17.1 children. Low: anemia, hyperthyroidism, liver disease, hemorrhage, hemolytic reactions. High: COPD, HF, polycythemia, high-altitude sickness.', care: 'Balanced blood: Hb is one-third of the hematocrit.' },
  { id: 'hct', ty: 'Lab test', n: 'Hematocrit', ar: 'الهيماتوكريت', mid: 'm1', src: 'A9, A10', def: 'Gives the overall proportion of RBCs in the blood.', find: 'Normal 35–45% females, 40–50% males, 32–55% children. Low: same as RBCs and Hb, including leukemia, lupus, endocarditis, rheumatic fever, nutritional disorders. High: polycythemia, anything producing severe dehydration.', care: 'Hb should be one-third of it.' },
  { id: 'rbcct', ty: 'Lab test', n: 'RBC count', ar: 'تعداد الكريات الحمراء', mid: 'm1', src: 'A9, A10', def: 'Measures the number of RBCs in a blood sample.', find: 'Normal 4.5–6 × 10⁶/mcL adults, 3.3–5.5 children. Low: anemia, hemorrhage, certain leukemias, overhydration, chronic infections. High: polycythemia, cardiovascular disease, hemoconcentration, dehydration.', care: 'Should be one-third of the hemoglobin level.' },
  { id: 'hgbl', ty: 'Lab test', n: 'Hemoglobin level', ar: 'مستوى الهيموغلوبين', mid: 'm1', src: 'A9', def: 'Identifies the amount of hemoglobin found within the RBCs.', find: '12–16 g/dL F · 14–18 M · 10.7–17.1 children.', care: '' },
  { id: 'bohr', ty: 'Component', n: 'Bohr effect', ar: 'تأثير بور', mid: 'm1', src: 'A8n', def: 'Oxygen-rich RBCs release oxygen in an environment with higher CO₂ concentrations (more acidotic).', find: '', care: '' },
  { id: 'hemopoietic', ty: 'Organ system', n: 'Hematopoietic system', ar: 'الجهاز المكوّن للدم', mid: 'm1', src: 'A3', def: 'Organs and tissues involved in the production of blood components.', find: 'Primarily bone marrow, spleen, lymph nodes.', care: '' },
];

const NUMBERS = [
  { q: 'Blood as a share of total body weight', a: '≈ 8%', d: ['≈ 9%', '≈ 55%', '≈ 45%'], src: 'A4, B5', mid: 'm1' },
  { q: 'Approximate total blood volume', a: '5 to 6 L', d: ['1 to 2 L', '8 to 10 L', '3 to 4 L'], src: 'A4, B5', mid: 'm1' },
  { q: 'Plasma: share of total blood volume', a: '55%', d: ['45%', '92%', '8%'], src: 'A6, B7', mid: 'm1' },
  { q: 'Formed elements: share of total blood volume', a: '45%', d: ['55%', '99%', '8%'], src: 'A6, B7', mid: 'm1' },
  { q: 'Plasma make-up', a: '92% water / 8% solutes', d: ['55% water / 45% solutes', '8% water / 92% solutes', '99% water / 1% solutes'], src: 'A6, B7', mid: 'm1' },
  { q: 'RBCs as a share of formed elements', a: '99%', d: ['45%', '55%', '92%'], src: 'A6, B7', mid: 'm1' },
  { q: 'Time for an RBC to mature', a: 'Up to 5 days', d: ['Up to 1 day', 'Up to 30 days', '5–7 days'], src: 'A8, B9', mid: 'm1' },
  { q: 'Average RBC life span', a: '120 days (≈ 4 months)', d: ['5 days', '30 days', '1 year'], src: 'A8, B9', mid: 'm1' },
  { q: 'Hemoglobin vs hematocrit in balanced blood', a: 'Hb = ⅓ of Hct', d: ['Hb = 3 × Hct', 'Hb = ½ of Hct', 'Hb = Hct'], src: 'A9, B10', mid: 'm1' },
  { q: 'RBC count vs hemoglobin in balanced blood', a: 'RBC = ⅓ of Hb', d: ['RBC = 3 × Hb', 'RBC = ½ of Hb', 'RBC = Hb'], src: 'A9, B10', mid: 'm1' },
  { q: 'Normal RBC count, adults (× 10⁶/mcL)', a: '4.5–6', d: ['3.3–5.5', '12–16', '14–18'], src: 'A10', mid: 'm1' },
  { q: 'Normal RBC count, children (× 10⁶/mcL)', a: '3.3–5.5', d: ['4.5–6', '10.7–17.1', '32–55'], src: 'A10', mid: 'm1' },
  { q: 'Normal hemoglobin, females (g/dL)', a: '12–16', d: ['14–18', '10.7–17.1', '35–45'], src: 'A10', mid: 'm1' },
  { q: 'Normal hemoglobin, males (g/dL)', a: '14–18', d: ['12–16', '40–50', '10.7–17.1'], src: 'A10', mid: 'm1' },
  { q: 'Normal hemoglobin, children (g/dL)', a: '10.7–17.1', d: ['12–16', '3.3–5.5', '32–55'], src: 'A10', mid: 'm1' },
  { q: 'Normal hematocrit, females', a: '35–45%', d: ['40–50%', '32–55%', '12–16%'], src: 'A10', mid: 'm1' },
  { q: 'Normal hematocrit, males', a: '40–50%', d: ['35–45%', '32–55%', '14–18%'], src: 'A10', mid: 'm1' },
  { q: 'Normal hematocrit, children', a: '32–55%', d: ['35–45%', '40–50%', '10.7–17.1%'], src: 'A10', mid: 'm1' },
  { q: 'Normal platelet count', a: '150,000–400,000 cells/mcL', d: ['4,500–10,000 cells/mcL', '15,000–40,000 cells/mcL', '1.5–4 million cells/mcL'], src: 'A10', mid: 'm1' },
  { q: 'Components of blood listed in the notes', a: '4', d: ['2', '3', '5'], src: 'A2, B2', mid: 'm1' },
  { q: 'Primary functions of blood', a: '8', d: ['4', '6', '10'], src: 'A5, B6', mid: 'm1' },
  { q: 'Common lab tests for red cells', a: '3', d: ['2', '4', '5'], src: 'A9, B10', mid: 'm1' },
];

const PICQ = [
  { img: 'blood_comp', a: 'Blood composition: plasma above formed elements', d: ['Hematocrit tube of urine', 'Clotting cascade', 'Blood-forming organs'], mid: 'm1' },
  { img: 'rbc_normal', a: 'Normal disc-shaped red blood cells', d: ['Sickle-shaped red blood cells', 'White blood cells', 'Platelets'], mid: 'm4' },
  { img: 'rbc_sickle', a: 'Normal and sickle-shaped red blood cells', d: ['Only normal red blood cells', 'Clumped platelets', 'Lymphoblasts'], mid: 'm4' },
  { img: 'table25_1', a: 'Table 25-1: RBC and platelet counts', d: ['Table 25-2: WBC count and differential', 'Table 25-3: findings with blood disorders', 'Table 25-4: ABO Rh donor types'], mid: 'm1' },
  { img: 'table25_2', a: 'Table 25-2: WBC count and differential', d: ['Table 25-1: RBC and platelet counts', 'Table 25-4: ABO Rh donor types', 'Table 25-3: findings with blood disorders'], mid: 'm2' },
  { img: 'table25_3', a: 'Table 25-3: common findings with blood disorders', d: ['Table 25-1: RBC and platelet counts', 'Table 25-2: WBC count and differential', 'Table 25-4: ABO Rh donor types'], mid: 'm3' },
  { img: 'table25_4', a: 'Table 25-4: ABO Rh and donor types', d: ['Table 25-1: RBC and platelet counts', 'Table 25-2: WBC count and differential', 'Table 25-3: findings with blood disorders'], mid: 'm8' },
];

/* tables shown in the cheat sheet under their module */
const TABLES = [
  { mid: 'm1', title: 'Table 25-1 · RBC and Platelet Counts', html: t251() },
];

const IMG_TITLES = {
  blood_comp: 'Blood composition', table25_1: 'Table 25-1 (original)', table25_2: 'Table 25-2 (original)', table25_3: 'Table 25-3 (original)', table25_4: 'Table 25-4 (original)',
  rbc_normal: 'Normal red blood cells', rbc_sickle: 'Normal and sickle red blood cells', leuk_child: 'Child with leukemia', ems_care: 'EMS crew treating a patient',
};
const IMG_MOD = { blood_comp: 'm1', table25_1: 'm1', table25_2: 'm2', table25_3: 'm3', table25_4: 'm8', rbc_normal: 'm4', rbc_sickle: 'm4', leuk_child: 'm6', ems_care: 'm6' };
const IX_NAMES = { label: 'Tap-to-label', order: 'Sequence builder', sort: 'Sort game', match: 'Match game', tube: 'Centrifuge', labcheck: 'CBC analyzer', tdrill: 'Table drill', triage: 'Clinical case', compare: 'Picture compare' };

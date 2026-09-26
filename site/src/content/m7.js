/* ===== Module 7 · Dialysis ===== */
const T213 = `<div class="tbl"><table>
<thead><tr><th>Problem</th><th>Prehospital management (Table 21-3)</th></tr></thead>
<tbody>
<tr class="grp"><td colspan="2">Problems related to dialysis itself</td></tr>
<tr><td>Hypotension</td><td>Administer 50 mL of normal saline intravenously.</td></tr>
<tr><td>Hemorrhage from the fistula or shunt</td><td>If the shunt cannot be reconnected, clamp it off; apply direct pressure to control bleeding; check for signs of shock.</td></tr>
<tr><td>Potassium imbalance</td><td>Hypokalemia: treat bradycardia with atropine. Hyperkalemia: calcium and bicarbonate may be considered if a lab value was obtained at a sending facility.</td></tr>
<tr><td>Disequilibrium syndrome</td><td>Provide only supportive treatment.</td></tr>
<tr><td>Air embolism</td><td>Position the patient in the left lateral recumbent position with about 10° of head-down tilt.</td></tr>
<tr><td>Machine dysfunction</td><td>Turn off machine; clamp ends of shunt; disconnect patient from machine; transport.</td></tr>
<tr class="grp"><td colspan="2">Problems to which dialysis patients are more vulnerable</td></tr>
<tr><td>Heart failure</td><td>Administer oxygen; place in sitting position; administer diuretic if the patient is producing urine; rapid transport to a dialysis-capable facility.</td></tr>
<tr><td>Myocardial infarction and cardiac dysrhythmias</td><td>Treat as any other patient, but use caution in administering any medications.</td></tr>
<tr><td>Hypertension</td><td>Transport; provide supportive care.</td></tr>
<tr><td>Pericardial tamponade</td><td>Provide emergency transport as soon as detected.</td></tr>
<tr><td>Uremic pericarditis</td><td>Administer oxygen; allow patient to assume position of comfort; transport.</td></tr>
</tbody></table></div>`;
CONTENT.m7 = {
  intro: 'Dialysis keeps ESRD patients alive, and it brings its own emergencies. Master Table 21-3 and you can walk into any dialysis call knowing exactly what to do.',
  steps: [
    { t: 'card', id: 'm7c1', title: 'What dialysis does', src: 'A51, B65', figs: [{ k: 'hd_photo', cap: 'Hemodialysis in a unit: blood runs from the arm through the machine and back.', labels: false }],
      predict: { q: 'Dialysis replaces three kidney jobs. Which ones?', a: 'Filters toxic wastes · removes excess fluid · restores electrolyte balance.' },
      body: ['<k>Renal dialysis</k> is a technique for <k>filtering the blood of its toxic wastes</k>, <k>removing excess fluid</k>, and <k>restoring the normal balance of electrolytes</k>.',
        'There are <k>two types</k>: <k>peritoneal dialysis</k> (<k>CAPD</k> and <k>APD</k>) and <k>hemodialysis</k>.'],
      beyond: 'CAPD = continuous ambulatory peritoneal dialysis (bags exchanged by hand during the day); APD = automated peritoneal dialysis (a machine cycles fluid, often overnight).' },
    { t: 'card', id: 'm7c2', title: 'The access: fistula or AV shunt', src: 'A52, B66', figs: [{ k: 'fistula', cap: 'Fistula: the artery is joined directly to a vein at the wrist.' }, { k: 'graft', cap: 'Looped graft: a tube loop links the artery and the vein in the forearm.' }],
      body: ['Hemodialysis patients have <k>vascular access through a fistula or an AV shunt</k> (a looped graft). This is where the machine’s needles go in.'],
      beyond: 'Never take a blood pressure or start an IV on the access arm: it can damage the patient’s lifeline.' },
    { t: 'ix', id: 'm7x1', kind: 'compare', title: 'Fistula or graft?', intro: 'Pick the right picture each round.',
      spec: { a: { img: 'fistula', label: 'Picture A' }, b: { img: 'graft', label: 'Picture B' }, rounds: [
        { q: 'Which shows a looped graft (AV shunt)?', ans: 'b', why: 'Picture B: a loop of tube joins the artery and the vein.' },
        { q: 'Which shows a fistula?', ans: 'a', why: 'Picture A: the artery is joined straight to the vein near the wrist.' },
        { q: 'Which access is placed near the wrist in these figures?', ans: 'a', why: 'The fistula figure shows the join close to the wrist.' }] } },
    { t: 'card', id: 'm7c3', title: 'Where and how often', src: 'A53, B67', figs: [{ k: 'pd_machine', cap: 'A home dialysis machine: dialysis can be done at home.', labels: false }],
      body: ['Dialysis is done in a <k>hospital</k>, a <k>community dialysis facility</k>, or <k>at home</k>. You will most likely meet dialysis machines only when <k>transporting patients to and from dialysis centres</k>.',
        'Patients usually undergo the process <k>every <n>2 or 3</n> days</k> for <n>3 to 5</n> hours.'],
      hook: '“<b>2–3 days, 3–5 hours.</b>”' },
    { t: 'q', q: { id: 'm7q1', lv: 'R', src: 'A51, B65', stem: 'Which is NOT one of the three things dialysis does?',
      opts: ['Produces red blood cells', 'Filters the blood of its toxic wastes', 'Removes excess fluid', 'Restores the normal balance of electrolytes'],
      why: 'Dialysis filters toxic wastes, removes excess fluid, and restores electrolyte balance.',
      trap: [3, 'Restoring electrolytes is one of the three; it is often forgotten.'] } },
    { t: 'q', q: { id: 'm7q2', lv: 'R', src: 'A54', stem: 'CAPD and APD are forms of:',
      opts: ['Peritoneal dialysis', 'Hemodialysis', 'Lithotripsy', 'Catheterization'],
      why: 'A54: peritoneal dialysis → CAPD, APD.',
      trap: [1, 'Hemodialysis uses a fistula or shunt and a machine; CAPD and APD are peritoneal.'] } },
    { t: 'q', q: { id: 'm7q3', lv: 'R', src: 'A53, B67', stem: 'How often, and for how long, do patients usually undergo dialysis?',
      opts: ['Every 2 or 3 days for 3 to 5 hours', 'Daily for 30 minutes', 'Weekly for 12 hours', 'Monthly for 1 day'],
      why: 'Notes: every 2 or 3 days for 3 to 5 hours.',
      trap: [1, 'Too short and too frequent compared with your notes.'] } },
    { t: 'q', q: { id: 'm7q4', lv: 'R', src: 'A52, B66', stem: 'Hemodialysis patients have vascular access through a:',
      opts: ['Fistula or AV shunt', 'Foley catheter', 'PCN tube', 'Central venous stent'],
      why: 'Notes: vascular access through a fistula or AV shunt.',
      trap: [2, 'A PCN tube drains the kidney for stones; it is not dialysis access.'] } },

    { t: 'card', id: 'm7c4', title: 'What goes wrong', src: 'A53–A55, B68, B70–B71',
      body: ['Problems may result from <k>accidental disconnection</k>, <k>bleeding from a fistula or shunt</k>, <k>malfunction of the machine</k>, <k>rapid shifts in fluids and electrolytes that produce hypotension</k>, <k>potassium imbalances</k>, and <k>disequilibrium syndrome</k>.',
        'Also: <k>human error</k> (cannulation of the shunt, connection or disconnection of the machine), <k>muscle cramps</k>, <k>nausea and vomiting</k>, <k>infections at the fistula or shunt site</k>, <k>hypotension and shock</k> and <k>air embolism</k>.'] },
    { t: 'ix', id: 'm7x2', kind: 'dialysis', title: 'Dialysis circuit', intro: 'Tap each problem. The circuit shows what fails, and the card tells you what to do.', spec: {} },
    { t: 'card', id: 'm7c5', title: 'Disequilibrium syndrome', src: 'B69',
      body: ['<k>Disequilibrium syndrome</k>: progressive neurological symptoms and signs from <k>cerebral edema</k>, caused by <k>fluid shifts into the brain</k> after a <k>relatively rapid decrease in serum osmolality during hemodialysis</k>.',
        'Signs: <k>nausea</k>, <k>headache</k>, <k>disorientation</k>, <k>confusion</k>, <k>dizziness</k>, <k>seizures</k>, and <k>coma or death</k> in severe cases. Treatment: <k>only supportive</k>.'],
      beyond: 'Think of it as the blood being cleaned faster than the brain can adjust, so water moves into the brain.' },
    { t: 'q', q: { id: 'm7q5', lv: 'R', src: 'B69', stem: 'Disequilibrium syndrome is caused by:',
      opts: ['Fluid shifts into the brain after a rapid fall in serum osmolality during hemodialysis', 'Air entering the dialysis line', 'A clot in the fistula', 'Missing several dialysis sessions'],
      why: 'B69: cerebral edema from fluid shifts into the brain following a relatively rapid decrease in serum osmolality during hemodialysis.',
      trap: [3, 'Missed dialysis causes volume overload and electrolyte imbalance, not disequilibrium syndrome.'] } },
    { t: 'q', q: { id: 'm7q6', lv: 'A', src: 'B69, Table 21-3', stem: 'During hemodialysis a patient develops headache, nausea and confusion, then a seizure. What is the likely cause and management?',
      opts: ['Disequilibrium syndrome: supportive treatment only', 'Air embolism: left lateral head-down', 'Hypotension: 50 mL normal saline', 'Hyperkalemia: calcium immediately'],
      why: 'Neurological signs during hemodialysis = disequilibrium syndrome; Table 21-3 says provide only supportive treatment.',
      trap: [1, 'Air embolism is also a dialysis emergency, but the neurological picture from fluid shifts points to disequilibrium.'] } },
    { t: 'q', q: { id: 'm7q7', lv: 'R', src: 'A54, B70', stem: 'Which is listed as an “other complication” of dialysis?',
      opts: ['Infections at the fistula or shunt site', 'Kidney stones', 'Testicular torsion', 'Priapism'],
      why: 'Other complications: muscle cramps, nausea and vomiting, infections at the fistula or shunt site.',
      trap: [1, 'Stones are a separate condition.'] } },

    { t: 'card', id: 'm7c6', title: 'Table 21-3: medical emergencies in dialysis patients', src: 'B72', html: T213, figs: [{ k: 'table21_3', cap: 'The original table from your instructor’s slide.', labels: false, title: 'Table 21-3' }],
      body: ['The table has two halves: <k>problems related to dialysis itself</k>, and <k>problems to which dialysis patients are more vulnerable</k>. Numbers to lock in: <n>50 mL</n> normal saline for hypotension and <n>10°</n> head-down, left lateral, for air embolism.'],
      hook: 'Air embolism: “<b>Left</b> side, <b>ten</b> down.” Hypotension: “<b>fifty</b> of saline.”' },
    { t: 'ix', id: 'm7x3', kind: 'triage', title: 'Table 21-3 emergency drill', intro: 'Alarms from the dialysis unit. Choose the prehospital management.',
      spec: { kind: 'Alarm', title: 'Dialysis emergency', shuffle: true, end: 'That is all eleven rows of Table 21-3. Replay until you get every one first time.', cases: [
        { head: 'Hypotension', alarm: true, text: 'BP falls to 82/50 near the end of a session.', q: 'Management?', opts: ['Administer 50 mL of normal saline IV', 'Give 2 L of saline rapidly', 'Place head-down left lateral', 'Give calcium'], why: 'Table 21-3: hypotension → administer 50 mL of normal saline intravenously.' },
        { head: 'Hemorrhage', alarm: true, text: 'The shunt is bleeding and cannot be reconnected.', q: 'Management?', opts: ['Clamp it off, apply direct pressure, check for shock', 'Apply a tourniquet above the elbow and leave it', 'Reconnect it to the machine anyway', 'Only elevate the arm'], why: 'If the shunt cannot be reconnected, clamp it off; direct pressure; check for signs of shock.' },
        { head: 'Hypokalemia', alarm: true, text: 'Low potassium from the sending facility; the patient is bradycardic.', q: 'Management?', opts: ['Treat the bradycardia with atropine', 'Give calcium and bicarbonate', 'Give insulin and glucose', 'Left lateral head-down'], why: 'Hypokalemia: treat bradycardia with atropine.' },
        { head: 'Hyperkalemia', alarm: true, text: 'The sending facility reports a high potassium lab value.', q: 'What may be considered?', opts: ['Calcium and bicarbonate', 'Atropine only', 'Diuretic only', '50 mL saline only'], why: 'Hyperkalemia: calcium and bicarbonate may be considered in the event that a lab value was obtained at a sending facility.' },
        { head: 'Disequilibrium', alarm: true, text: 'Headache, disorientation and nausea during hemodialysis.', q: 'Management?', opts: ['Only supportive treatment', 'Calcium', 'Head-down tilt', 'Diuretic'], why: 'Disequilibrium syndrome: provide only supportive treatment.' },
        { head: 'Air embolism', alarm: true, text: 'Sudden breathlessness; air is seen in the line.', q: 'How do you position the patient?', opts: ['Left lateral recumbent with about 10° head-down tilt', 'Right lateral, head up 45°', 'Supine with legs raised 30°', 'Sitting upright'], why: 'Air embolism: left lateral recumbent with about 10° of head-down tilt.' },
        { head: 'Machine dysfunction', alarm: true, text: 'The machine alarms and stops pumping.', q: 'Management?', opts: ['Turn off the machine, clamp the shunt ends, disconnect, transport', 'Restart it repeatedly until it works', 'Leave the patient connected and transport', 'Pull the needles out without clamping'], why: 'Turn off machine; clamp ends of shunt; disconnect the patient from the machine; transport.' },
        { head: 'Heart failure', text: 'Dialysis patient short of breath with crackles; still passes some urine.', q: 'Management?', opts: ['Oxygen, sitting position, diuretic if producing urine, rapid transport to a dialysis-capable facility', 'Lay flat and give a fluid bolus', 'Give 50 mL saline only', 'Supportive care only, no oxygen'], why: 'Heart failure: oxygen, sitting position, diuretic if producing urine, rapid transport to dialysis-capable facility.' },
        { head: 'MI / dysrhythmia', text: 'Chest pain with ST changes in a dialysis patient.', q: 'Management?', opts: ['Treat as any other patient, but use caution with any medications', 'Withhold all treatment', 'Treat only after dialysis', 'Give double doses'], why: 'MI and dysrhythmias: treat as any other patient, but use caution in administering any medications.' },
        { head: 'Hypertension', text: 'BP 190/100, no other symptoms.', q: 'Management?', opts: ['Transport and provide supportive care', 'Clamp the fistula', 'Give 50 mL saline', 'Head-down tilt'], why: 'Hypertension: transport; provide supportive care.' },
        { head: 'Pericardial tamponade', alarm: true, text: 'Hypotension, distended neck veins and muffled heart sounds.', q: 'Management?', opts: ['Emergency transport as soon as detected', 'Wait for the session to finish', 'Supportive care on scene for an hour', 'Give a diuretic'], why: 'Pericardial tamponade: provide emergency transport as soon as detected.' },
        { head: 'Uremic pericarditis', text: 'Sharp chest pain eased by sitting forward.', q: 'Management?', opts: ['Oxygen, position of comfort, transport', 'Calcium and bicarbonate', 'Left lateral head-down', 'Clamp the shunt'], why: 'Uremic pericarditis: administer oxygen; allow position of comfort; transport.' }] } },
    { t: 'q', q: { id: 'm7q8', lv: 'R', src: 'B72', stem: 'Air embolism in a dialysis patient: how should the patient be positioned?',
      opts: ['Left lateral recumbent with about 10° head-down tilt', 'Right lateral recumbent, head up', 'Supine with 30° leg raise', 'Sitting upright at 90°'],
      why: 'Table 21-3: left lateral recumbent position with about 10° of head-down tilt.',
      trap: [1, 'The side is LEFT and the head goes DOWN.'] } },
    { t: 'q', q: { id: 'm7q9', lv: 'R', src: 'B72', stem: 'Hypotension during dialysis is treated with:',
      opts: ['50 mL of normal saline IV', '500 mL of normal saline IV', 'Atropine', 'A diuretic'],
      why: 'Table 21-3: administer 50 mL of normal saline intravenously.',
      trap: [1, 'The table gives 50 mL, not 500 mL. Small volumes because these patients cannot remove fluid.'] } },
    { t: 'q', q: { id: 'm7q10', lv: 'A', src: 'B72', stem: 'A dialysis patient’s shunt is bleeding heavily and cannot be reconnected. What do you do?',
      opts: ['Clamp it off, apply direct pressure, check for shock', 'Reconnect it to the machine anyway', 'Give 50 mL saline and leave it', 'Position left lateral head-down'],
      why: 'Table 21-3: if the shunt cannot be reconnected, clamp it off; direct pressure; check for signs of shock.',
      trap: [2, '50 mL saline is for hypotension, not the bleeding itself.'] } },
    { t: 'q', q: { id: 'm7q11', lv: 'R', src: 'B72', stem: 'In a dialysis patient with hypokalemia and bradycardia, Table 21-3 says to give:',
      opts: ['Atropine', 'Calcium', 'Insulin and glucose', 'Bicarbonate'],
      why: 'Hypokalemia: treat bradycardia with atropine.',
      trap: [1, 'Calcium (with bicarbonate) is for hyperkalemia.'] } },
    { t: 'q', q: { id: 'm7q12', lv: 'A', src: 'B72', stem: 'A dialysis patient has heart failure and is still producing some urine. Which management is in Table 21-3?',
      opts: ['Oxygen, sitting position, diuretic, rapid transport to a dialysis-capable facility', 'Supine, fluid bolus, slow transport', 'Supportive care only', 'Atropine and head-down tilt'],
      why: 'Heart failure: oxygen; sitting position; diuretic if producing urine; rapid transport to dialysis-capable facility.',
      trap: [2, 'Supportive care alone is the rule for hypertension and disequilibrium, not heart failure.'] } },
    { t: 'q', q: { id: 'm7q13', lv: 'R', src: 'B72', stem: 'Pericardial tamponade in a dialysis patient requires:',
      opts: ['Emergency transport as soon as detected', 'Supportive care only', 'Oxygen and a position of comfort only', 'Waiting until the session ends'],
      why: 'Table 21-3: provide emergency transport as soon as detected.',
      trap: [2, 'Oxygen and position of comfort is the uremic pericarditis row.'] } },
    { t: 'q', q: { id: 'm7q14', lv: 'R', src: 'B72', stem: 'For MI and dysrhythmias in dialysis patients, Table 21-3 says:',
      opts: ['Treat as any other patient, but use caution with medications', 'Do not treat until after dialysis', 'Give only oxygen', 'Always give calcium'],
      why: 'Treat as any other patient, but use caution in administering any medications.',
      trap: [3, 'Calcium is not the routine answer; caution with all medications.'] } },
    { t: 'q', q: { id: 'm7q15', lv: 'R', src: 'B72', stem: 'Machine dysfunction: which is the correct sequence?',
      opts: ['Turn off machine → clamp shunt ends → disconnect → transport', 'Disconnect → turn off → transport → clamp', 'Clamp → restart machine → continue', 'Transport while still connected'],
      why: 'Table 21-3: turn off machine; clamp ends of shunt; disconnect patient from machine; transport.',
      trap: [1, 'Disconnecting before turning off and clamping risks blood loss.'] } },
    { t: 'q', q: { id: 'm7s1', type: 'sa', src: 'B72', stem: 'List the six “problems related to dialysis itself” in Table 21-3 with the management of each.',
      model: 'Hypotension: 50 mL NS IV. Hemorrhage from fistula/shunt: clamp if cannot reconnect, direct pressure, check shock. Potassium imbalance: hypoK atropine for bradycardia; hyperK calcium and bicarbonate may be considered. Disequilibrium: supportive only. Air embolism: left lateral recumbent, ~10° head-down. Machine dysfunction: turn off, clamp shunt ends, disconnect, transport.',
      points: ['Hypotension → 50 mL NS', 'Hemorrhage → clamp, direct pressure, check shock', 'K⁺: hypoK atropine / hyperK Ca + bicarbonate', 'Disequilibrium → supportive only', 'Air embolism → left lateral, 10° head-down', 'Machine → off, clamp, disconnect, transport'], pass: 0.8 } },
    { t: 'q', q: { id: 'm7s2', type: 'sa', src: 'B69', stem: 'Define disequilibrium syndrome and list its signs.',
      model: 'Progressive neurological signs from cerebral edema due to fluid shifts into the brain after a relatively rapid fall in serum osmolality during hemodialysis. Signs: nausea, headache, disorientation, confusion, dizziness, seizures, coma or death.',
      points: ['Cerebral edema / fluid shift into brain', 'Rapid fall in serum osmolality during hemodialysis', 'Nausea, headache, disorientation, confusion, dizziness', 'Seizures, coma or death'], pass: 0.75 } },
  ],
  recall: [
    { p: 'Three purposes and two types of dialysis', a: 'Filter toxic wastes · remove excess fluid · restore electrolytes · peritoneal (CAPD, APD) and hemodialysis', fc: 'm7f1' },
    { p: 'Schedule and access', a: 'Every 2–3 days for 3–5 h · fistula or AV shunt · hospital, community facility or home', fc: 'm7f3' },
    { p: 'Disequilibrium syndrome: cause and signs', a: 'Cerebral edema from fluid shift into brain after rapid ↓ osmolality in HD · nausea, headache, disorientation, confusion, dizziness, seizures, coma/death', fc: 'm7f6' },
    { p: 'Table 21-3, first half', a: 'Hypotension 50 mL NS · hemorrhage clamp/pressure/shock · K⁺ atropine or Ca+bicarb · disequilibrium supportive · air embolism left lateral 10° head-down · machine off/clamp/disconnect/transport', fc: 'm7f7' },
    { p: 'Table 21-3, second half', a: 'HF O₂/sit/diuretic/rapid transport · MI caution with meds · HTN transport/supportive · tamponade emergency transport · uremic pericarditis O₂/comfort/transport', fc: 'm7f8' },
  ],
  hooks: [
    { ic: '3', t: 'Wastes, water, salts', d: 'Dialysis filters toxic wastes, removes excess fluid, restores electrolytes.' },
    { ic: '2·3', t: '2–3 days, 3–5 hours', d: 'The usual hemodialysis schedule.' },
    { ic: '10°', t: 'Left side, ten down', d: 'Air embolism: left lateral recumbent with about 10° head-down tilt.' },
    { ic: '50', t: 'Fifty of saline', d: 'Hypotension during dialysis: 50 mL normal saline IV.' },
    { ic: 'OCD', t: 'Off, Clamp, Disconnect', d: 'Machine dysfunction: turn Off, Clamp the shunt ends, Disconnect, then transport.' },
  ],
  flash: [
    { id: 'm7f1', f: 'What does dialysis do, and what are its two types?', b: 'Filters toxic wastes, removes excess fluid, restores electrolytes. Peritoneal (CAPD, APD) and hemodialysis.' },
    { id: 'm7f2', f: 'Hemodialysis vascular access?', b: 'Fistula or AV shunt (looped graft).' },
    { id: 'm7f3', f: 'Dialysis schedule and settings?', b: 'Every 2 or 3 days for 3 to 5 hours; hospital, community facility or home.' },
    { id: 'm7f4', f: 'Problems related to dialysis may result from (B68)?', b: 'Accidental disconnection · bleeding from fistula/shunt · machine malfunction · rapid fluid/electrolyte shifts → hypotension · potassium imbalances · disequilibrium syndrome.' },
    { id: 'm7f5', f: 'Other dialysis complications (A)?', b: 'Human error (cannulation, connection/disconnection) · muscle cramps · N/V · infection at fistula/shunt · hypotension & shock · K⁺ imbalance · disequilibrium · air embolism.' },
    { id: 'm7f6', f: 'Disequilibrium syndrome?', b: 'Cerebral edema from fluid shifts into the brain after rapid ↓ serum osmolality during HD. Nausea, headache, disorientation, confusion, dizziness, seizures, coma/death. Supportive only.' },
    { id: 'm7f7', f: 'Table 21-3: problems of dialysis itself?', b: 'Hypotension: 50 mL NS · Hemorrhage: clamp if can’t reconnect, direct pressure, check shock · K⁺: hypo atropine / hyper Ca + bicarb · Disequilibrium: supportive · Air embolism: left lateral, 10° head-down · Machine: off, clamp, disconnect, transport.' },
    { id: 'm7f8', f: 'Table 21-3: problems dialysis patients are more vulnerable to?', b: 'HF: O₂, sitting, diuretic if urine, rapid transport to dialysis facility · MI/dysrhythmia: as any patient, caution with meds · HTN: transport, supportive · Tamponade: emergency transport · Uremic pericarditis: O₂, comfort, transport.' },
    { id: 'm7f9', f: 'Missed dialysis presents with?', b: 'Signs of electrolyte imbalance (and volume overload).' },
  ],
  arabic: `
<div class="blk"><h3>الغسيل الكلوي</h3><p>يرشّح الدم من السموم، ويزيل السوائل الزائدة، ويعيد توازن الأملاح. نوعان: <span class="en">peritoneal dialysis</span> (ومنه <span class="en">CAPD</span> و<span class="en">APD</span>) و<span class="en">hemodialysis</span>.</p><p>المدخل الوعائي: <span class="en">fistula</span> أو <span class="en">AV shunt</span>. يتم في المستشفى أو مركز أو البيت، كل ٢–٣ أيام لمدة ٣–٥ ساعات.</p></div>
<div class="blk"><h3>المشاكل</h3><p>فصل عرضي، نزيف من الناسور، عطل الجهاز، تحولات سريعة في السوائل تسبب هبوط الضغط، اضطراب البوتاسيوم، <span class="en">disequilibrium syndrome</span>، <span class="en">air embolism</span>، تشنجات عضلية، غثيان، عدوى في موضع الناسور، وخطأ بشري.</p></div>
<div class="blk"><h3><span class="en">Disequilibrium syndrome</span></h3><p>وذمة دماغية بسبب انتقال السوائل للدماغ بعد انخفاض سريع في <span class="en">osmolality</span> أثناء الغسيل: غثيان، صداع، توهان، تشوش، دوخة، تشنجات، غيبوبة أو وفاة. العلاج داعم فقط.</p></div>
<div class="blk"><h3>جدول <span class="en">21-3</span></h3><ul>
<li>هبوط الضغط: ٥٠ مل <span class="en">normal saline</span></li><li>نزيف الناسور: اقفله بالمشبك إذا لم يمكن إعادة توصيله، ضغط مباشر، وافحص الصدمة</li>
<li>نقص البوتاسيوم: <span class="en">atropine</span> لبطء القلب. ارتفاعه: <span class="en">calcium</span> و<span class="en">bicarbonate</span> إذا وُجدت نتيجة مختبر</li>
<li><span class="en">Air embolism</span>: على الجانب الأيسر مع خفض الرأس ١٠ درجات</li><li>عطل الجهاز: أطفئه، اقفل أطراف الوصلة، افصل المريض، انقله</li>
<li>فشل القلب: أكسجين، جلوس، مدر بول إذا كان يتبول، نقل سريع لمنشأة غسيل</li><li>الجلطة واضطراب النظم: كأي مريض مع الحذر في الأدوية. ارتفاع الضغط: نقل ودعم</li>
<li><span class="en">Tamponade</span>: نقل طارئ فوراً. <span class="en">Uremic pericarditis</span>: أكسجين، وضعية راحة، نقل</li></ul></div>`,
};

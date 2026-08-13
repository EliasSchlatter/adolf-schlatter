/**
 * tts-preprocess.js
 *
 * Bereitet den Sprechtext für die Sprachsynthese auf. Entfernt bzw. ersetzt
 * Zeichen und Kürzel, die eine englische Stimme falsch oder gar nicht ausspricht.
 *
 * Die Regeln wurden anhand des tatsächlichen Textbestands gewählt (siehe
 * tools/audio-script-en.json), nicht auf Verdacht.
 *
 * Nutzung als Modul:  const { preprocess } = require('./tts-preprocess');
 * Nutzung als CLI:    node tools/tts-preprocess.js            (Bericht + Beispiele)
 *                     node tools/tts-preprocess.js --write    (schreibt *-spoken.json)
 */

const RULES = [
    // --- Schreibweisen, die eine englische Stimme sonst verhaspelt ---
    {
        name: 'ß → ss',
        apply: (t) => t.replace(/ß/g, 'ss')
    },
    {
        name: 'St. → Saint (Ortsnamen, z. B. St. Gallen)',
        apply: (t) => t.replace(/\bSt\.\s+(?=[A-ZÄÖÜ])/g, 'Saint ')
    },
    {
        name: 'Prof. → Professor',
        apply: (t) => t.replace(/\bProf\.\s+/g, 'Professor ')
    },
    {
        name: 'e.g. / i.e. / cf. ausschreiben',
        apply: (t) => t
            .replace(/\be\.\s?g\.\s*/g, 'for example ')
            .replace(/\bi\.\s?e\.\s*/g, 'that is ')
            .replace(/\bcf\.\s*/gi, 'compare ')
    },
    {
        name: 'v. → von (Namenspartikel)',
        apply: (t) => t.replace(/\bv\.\s+(?=[A-ZÄÖÜ])/g, 'von ')
    },
    {
        name: 'Semesterkürzel ausschreiben (SS/WS + Jahr)',
        apply: (t) => t
            .replace(/\bSS\s+(\d{4})/g, 'summer semester $1')
            .replace(/\bWS\s+(\d{4})/g, 'winter semester $1')
    },

    // --- Zahlenbereiche: „1852–1871“ wird sonst als Minus oder gar nicht gelesen ---
    {
        name: 'Jahresbereiche → "to"',
        apply: (t) => t
            .replace(/(\d)\s*[–—]\s*(\d)/g, '$1 to $2')
            .replace(/(\d{4})\s*[–—]\s*(?=[a-zA-Z])/g, '$1 to ')
    },

    // --- Auslassungspunkte: markieren Zitat-Kürzungen, stören den Lesefluss ---
    {
        name: 'Ellipsen vor schließendem Anführungszeichen entfernen',
        apply: (t) => t.replace(/([^.!?,;:\s])?\s*(?:\.\.\.|…)\s*"/g, (m, before) =>
            (before ? before + '."' : '."'))
    },
    {
        name: 'Ellipse vor Satzanfang → Satzpunkt',
        apply: (t) => t.replace(/\s*(?:\.\.\.|…)\s+(?=[A-ZÄÖÜ])/g, '. ')
    },
    {
        name: 'übrige Ellipsen entfernen',
        apply: (t) => t.replace(/\s*(?:\.\.\.|…)\s*/g, ' ')
    },

    // --- Gedankenstriche: als Komma gelesen ergibt sich eine natürliche Pause ---
    {
        name: 'Gedankenstrich (—/–) → Komma',
        apply: (t) => t.replace(/\s*[—–]\s*/g, ', ')
    },

    // --- Aufräumen nach den Ersetzungen ---
    {
        name: 'doppelte Satzzeichen und Leerzeichen bereinigen',
        apply: (t) => t
            .replace(/\s+([,.;:!?])/g, '$1')      // Leerzeichen vor Satzzeichen
            .replace(/,\s*,+/g, ',')              // ,, → ,
            .replace(/([.!?])\s*,/g, '$1')        // ., → .
            .replace(/,\s*([.!?])/g, '$1')        // ,. → .
            .replace(/([.!?])\s*\1+/g, '$1')      // .. → .
            .replace(/\(\s*,\s*/g, '(')           // ( , → (
            .replace(/\s*,\s*\)/g, ')')           // , ) → )
            .replace(/[ \t]{2,}/g, ' ')           // Mehrfach-Leerzeichen
            .replace(/ +\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
    },
    {
        name: 'Satzende sicherstellen',
        apply: (t) => {
            const trimmed = t.trim();
            if (!trimmed) return trimmed;
            return /[.!?"']$/.test(trimmed) ? trimmed : trimmed + '.';
        }
    }
];

function preprocess(text) {
    return RULES.reduce((acc, rule) => rule.apply(acc), String(text || ''));
}

/** Liefert pro Regel, wie oft sie den Text verändert hat (für den Bericht). */
function analyze(texts) {
    const stats = RULES.map((r) => ({ name: r.name, changed: 0 }));
    texts.forEach((text) => {
        let cur = String(text || '');
        RULES.forEach((rule, i) => {
            const next = rule.apply(cur);
            if (next !== cur) stats[i].changed++;
            cur = next;
        });
    });
    return stats;
}

module.exports = { preprocess, analyze, RULES };

// ---- CLI ----
if (require.main === module) {
    const fs = require('fs');
    const path = require('path');
    const SCRIPT = path.join(__dirname, 'audio-script-en.json');
    const script = JSON.parse(fs.readFileSync(SCRIPT, 'utf8'));
    const texts = script.map((s) => s.text);

    console.log('Regeln, die im Text tatsächlich greifen (Anzahl betroffener Kapitel):');
    analyze(texts).forEach((s) => {
        console.log(`  ${s.changed > 0 ? '✓' : ' '} ${String(s.changed).padStart(2)}  ${s.name}`);
    });

    const before = texts.join('\n');
    const after = texts.map(preprocess).join('\n');

    const problems = {
        'Ellipsen (… / ...)': /…|\.\.\./g,
        'Gedankenstriche (— / –)': /[—–]/g,
        'ß': /ß/g,
        '„St.“ vor Namen': /\bSt\.\s+[A-ZÄÖÜ]/g,
        'e.g. / i.e. / cf.': /\b(e\.\s?g\.|i\.\s?e\.|cf\.)/gi,
        'doppelte Leerzeichen': /  +/g,
        'Leerzeichen vor Satzzeichen': /\s[,.;:!?]/g
    };
    console.log('\nRestbestand nach der Aufbereitung:');
    for (const [label, re] of Object.entries(problems)) {
        const b = (before.match(re) || []).length;
        const a = (after.match(re) || []).length;
        console.log(`  ${label.padEnd(30)} vorher ${String(b).padStart(3)}  →  nachher ${String(a).padStart(3)} ${a === 0 ? '✓' : '⚠'}`);
    }

    console.log('\nBeispiele (vorher → nachher):');
    const samples = [
        'Childhood and youth in St. Gallen (1852–1871)',
        'they lived before us and for us in bright light and … from the very beginning I saw',
        'their faith arose not from the church but from Jesus … Jesus was shown to me',
        'I miss you … and feel it as a gap …"',
        'as well as French and — voluntarily — English and Hebrew',
        'Only in his three Tübingen semesters (SS 1873 – SS 1874) did Schlatter',
        'apparent opposites (e.g. revelation and reason)',
        'among church leaders (F. v. Bodelschwingh the Younger)',
        'Pastor in Kilchberg, Neumünster and Keßwil (1875–1880)'
    ];
    samples.forEach((s) => {
        const out = preprocess(s);
        console.log(`  – ${s}\n    → ${out}`);
    });

    if (process.argv.includes('--write')) {
        const out = script.map((s) => ({ ...s, text: preprocess(s.text) }));
        const dest = path.join(__dirname, 'audio-script-en-spoken.json');
        fs.writeFileSync(dest, JSON.stringify(out, null, 2));
        console.log(`\nGeschrieben: ${path.relative(path.join(__dirname, '..'), dest)}`);
    }
}

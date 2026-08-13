/**
 * extract-audio-script.js
 *
 * Liest die englischen Übersetzungen (data-en / data-en-html) aus
 * pages/aboutSchlatter.html und erzeugt daraus das Sprechskript für die
 * englische Vertonung – in genau der Kapitelstruktur der bestehenden
 * deutschen Audiodateien:
 *
 *   01_intro_leben, 01_leben_1..7_combined
 *   02_intro_werk,  02_werk_1..7_combined
 *   03_intro_wirkung, 03_wirkung_1_combined
 *
 * Ausgabe: tools/audio-script-en.json  ([{ file, title, text }])
 *
 * Aufruf:  node tools/extract-audio-script.js
 */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const PAGE = path.join(REPO, 'pages/aboutSchlatter.html');
const OUT = path.join(__dirname, 'audio-script-en.json');

let JSDOM;
try {
    ({ JSDOM } = require('jsdom'));
} catch (e) {
    console.error('jsdom fehlt. Installieren mit:  npm install jsdom');
    process.exit(1);
}

const dom = new JSDOM(fs.readFileSync(PAGE, 'utf8'));
const doc = dom.window.document;

/** Entfernt Fußnoten-Marker und Fußnotenlisten, liefert sauberen Sprechtext. */
function speakable(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('sup, .footnotes, ol.footnotes, hr').forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
}

/** Englische Fassung eines Elements als Sprechtext (Fallback: Deutsch). */
function englishText(el) {
    if (!el) return '';
    const en = el.getAttribute('data-en');
    if (en !== null) return en.replace(/\s+/g, ' ').trim();
    const enHtml = el.getAttribute('data-en-html');
    if (enHtml !== null) {
        const tmp = doc.createElement('div');
        tmp.innerHTML = enHtml;
        return speakable(tmp);
    }
    return speakable(el);
}

/** Sammelt Titel + Fließtext eines Akkordeon-Kapitels. */
function chapterFrom(item) {
    const title = englishText(item.querySelector('.accordion-header h4'));
    const subtitle = englishText(item.querySelector('.accordion-header p'));
    const content = item.querySelector('.accordion-content');
    const parts = [];
    if (content) {
        content.querySelectorAll('p, li').forEach((node) => {
            // Fußnoten-Liste überspringen
            if (node.closest('.footnotes')) return;
            const txt = englishText(node);
            if (txt) parts.push(txt);
        });
    }
    return { title, subtitle, body: parts.join('\n\n') };
}

/** Intro einer Sektion: Überschrift + Untertitel (+ evtl. Einleitungsabsatz). */
function sectionIntro(sectionId) {
    const sec = doc.getElementById(sectionId);
    const h2 = englishText(sec.querySelector('h2'));
    const h3 = englishText(sec.querySelector('h3'));
    return { title: h2, subtitle: h3 };
}

const script = [];

function pushChapter(file, ch) {
    // Gesprochen wird: Titel, Untertitel, dann der Fließtext
    const text = [ch.title, ch.subtitle, ch.body].filter(Boolean).join('\n\n');
    script.push({ file, title: ch.title, text });
}

// Hinweis: Die Kapitel werden über die SEKTION gesucht, nicht über den
// *-accordion-Container – im Werk-Teil liegen drei Kapitel aufgrund einer
// verschachtelten <div>-Eigenheit der Seite außerhalb dieses Containers.
function chaptersOf(sectionId) {
    return Array.from(doc.querySelectorAll('#' + sectionId + ' .accordion-item'));
}

const SECTIONS = [
    { id: 'leben', intro: '01_intro_leben', prefix: '01_leben' },
    { id: 'werk', intro: '02_intro_werk', prefix: '02_werk' },
    { id: 'wirkung', intro: '03_intro_wirkung', prefix: '03_wirkung' }
];

SECTIONS.forEach((sec) => {
    const intro = sectionIntro(sec.id);
    pushChapter(sec.intro, { title: intro.title, subtitle: intro.subtitle, body: '' });
    chaptersOf(sec.id).forEach((item, i) => {
        pushChapter(`${sec.prefix}_${i + 1}_combined`, chapterFrom(item));
    });
});

fs.writeFileSync(OUT, JSON.stringify(script, null, 2));

const chars = script.reduce((n, s) => n + s.text.length, 0);
console.log(`Kapitel: ${script.length}`);
console.log(`Zeichen gesamt: ${chars.toLocaleString('de-DE')}`);
console.log(`Geschrieben: ${path.relative(REPO, OUT)}`);
script.forEach((s) => {
    console.log(`  ${s.file.padEnd(26)} ${String(s.text.length).padStart(6)} Zeichen  "${s.title.slice(0, 50)}"`);
});

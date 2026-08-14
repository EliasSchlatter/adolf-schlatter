/**
 * verify-stammbaum-lines.js
 *
 * Rendert pages/stammbaum.html in jsdom mit echtem D3 und prüft, ob jedes Kind
 * über einen Verteilbalken tatsächlich am RICHTIGEN Elternpaar hängt – also ob
 * die gezeichneten Linien die Datenlage korrekt wiedergeben.
 *
 * Voraussetzung: npm install --no-save jsdom d3
 * Aufruf:        node tools/verify-stammbaum-lines.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const REPO = path.resolve(__dirname, '..');
const PAGE = path.join(REPO, 'pages/stammbaum.html');
const html = fs.readFileSync(PAGE, 'utf8');

const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://example.com/pages/stammbaum.html', pretendToBeVisual: true });
const { window } = dom;
global.window = window; global.document = window.document;
global.localStorage = window.localStorage;
global.MutationObserver = window.MutationObserver;
global.CustomEvent = window.CustomEvent;
window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
window.fetch = () => Promise.reject(new Error('no-net'));

// echtes D3 in die Seite injizieren (statt CDN)
const d3src = fs.readFileSync(path.join(REPO, 'node_modules/d3/dist/d3.min.js'), 'utf8');
window.eval(d3src);

// Seiten-Skripte in DOM-Reihenfolge ausführen (CDN überspringen)
[...window.document.querySelectorAll('script')].forEach((s) => {
    const src = s.getAttribute('src');
    if (/json/i.test(s.getAttribute('type') || '')) return;
    try {
        if (src) {
            if (/^https?:/i.test(src)) return;
            window.eval(fs.readFileSync(path.resolve(path.dirname(PAGE), src), 'utf8'));
        } else if (s.textContent.trim()) {
            let code = s.textContent;
            // familyData ist ein top-level const und damit von außen unsichtbar –
            // aus dem definierenden Skript heraus zugänglich machen.
            if (/const\s+familyData\s*=/.test(code)) {
                code += '\n;window.__familyData = familyData;';
            }
            window.eval(code);
        }
    } catch (e) {
        console.log('  [warn]', (src || 'inline') + ':', e.message.split('\n')[0]);
    }
});
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

setTimeout(() => {
    const doc = window.document;
    const lines = [...doc.querySelectorAll('line.parent-child-line')].map((l) => ({
        x1: +l.getAttribute('x1'), y1: +l.getAttribute('y1'),
        x2: +l.getAttribute('x2'), y2: +l.getAttribute('y2')
    }));
    console.log(`gezeichnete Eltern-Kind-Linien: ${lines.length}`);
    if (!lines.length) { console.error('FEHLER: keine Linien gerendert'); process.exit(1); }

    // Layout-Koordinaten aus dem Seiten-Kontext holen (familyData ist ein
    // top-level const im klassischen Script, also nicht am window sichtbar)
    const graph = window.__familyData.graph;
    const nodes = graph.nodes;
    const edges = graph.edges;
    if (!nodes.some((n) => n.x != null)) { console.error('FEHLER: keine Layout-Koordinaten gefunden'); process.exit(1); }
    const byId = (id) => nodes.find((n) => n.id === id);
    const eq = (a, b) => Math.abs(a - b) < 0.5;

    // waagerechte Balken und senkrechte Stücke trennen
    const horiz = lines.filter((l) => eq(l.y1, l.y2) && !eq(l.x1, l.x2));
    const vert = lines.filter((l) => eq(l.x1, l.x2) && !eq(l.y1, l.y2));

    let failed = 0;
    const check = (ok, msg) => { console.log((ok ? 'ok  : ' : 'FAIL: ') + msg); if (!ok) failed++; };

    // Für jedes Kind: hängt seine Senkrechte an einem Balken, der auch mit dem
    // Mittelpunkt SEINES Elternpaares verbunden ist?
    const parentsOf = (id) => edges.filter((e) => e.type === 'PARENT_OF' && e.target === id).map((e) => e.source);
    const kids = [...new Set(edges.filter((e) => e.type === 'PARENT_OF').map((e) => e.target))];

    let checked = 0, wrong = [];
    kids.forEach((cid) => {
        const child = byId(cid);
        const ps = parentsOf(cid).map(byId).filter(Boolean);
        if (ps.length !== 2 || child.x == null) return;
        checked++;
        const midX = (ps[0].x + ps[1].x) / 2;

        // Senkrechte, die am Kind endet
        const drop = vert.find((l) => eq(l.x1, child.x) && (eq(l.y2, child.y) || eq(l.y1, child.y)));
        if (!drop) { wrong.push(`${child.name}: keine Senkrechte gefunden`); return; }
        const busY = eq(l_y(drop), child.y) ? Math.min(drop.y1, drop.y2) : Math.min(drop.y1, drop.y2);

        // Balken auf dieser Höhe, der den Kind-X und den Eltern-Mittelpunkt abdeckt
        const bar = horiz.find((h) => eq(h.y1, busY) &&
            Math.min(h.x1, h.x2) - 0.5 <= Math.min(child.x, midX) &&
            Math.max(h.x1, h.x2) + 0.5 >= Math.max(child.x, midX));
        // Senkrechte vom Elternpaar-Mittelpunkt zu genau diesem Balken
        const stem = vert.find((v) => eq(v.x1, midX) && (eq(v.y1, busY) || eq(v.y2, busY)));

        if (!bar && !eq(child.x, midX)) wrong.push(`${child.name}: kein passender Balken auf Höhe ${busY}`);
        else if (!stem) wrong.push(`${child.name}: kein Abgang vom Elternpaar-Mittelpunkt (${midX})`);
    });
    function l_y(l) { return Math.max(l.y1, l.y2); }

    check(wrong.length === 0, `alle ${checked} Kinder mit Elternpaar korrekt angebunden` + (wrong.length ? '\n      ' + wrong.join('\n      ') : ''));

    // Kollisionsprüfung: überlappen sich zwei Balken auf derselben Höhe?
    const clashes = [];
    for (let i = 0; i < horiz.length; i++) {
        for (let j = i + 1; j < horiz.length; j++) {
            const a = horiz[i], b = horiz[j];
            if (!eq(a.y1, b.y1)) continue;
            const a1 = Math.min(a.x1, a.x2), a2 = Math.max(a.x1, a.x2);
            const b1 = Math.min(b.x1, b.x2), b2 = Math.max(b.x1, b.x2);
            if (a1 <= b2 && b1 <= a2) clashes.push(`y=${a.y1}: [${a1.toFixed(0)},${a2.toFixed(0)}] & [${b1.toFixed(0)},${b2.toFixed(0)}]`);
        }
    }
    check(clashes.length === 0, 'keine zwei Verteilbalken überlappen auf derselben Höhe' + (clashes.length ? '\n      ' + clashes.join('\n      ') : ''));

    // Wie viele Ebenen werden genutzt?
    const levels = [...new Set(horiz.map((h) => Math.round(h.y1)))].sort((a, b) => a - b);
    console.log(`\nWaagerechte Balken: ${horiz.length} auf ${levels.length} verschiedenen Höhen`);

    console.log(failed ? '\nPRÜFUNG FEHLGESCHLAGEN' : '\nALLE PRÜFUNGEN BESTANDEN');
    process.exitCode = failed ? 1 : 0;
}, 200);

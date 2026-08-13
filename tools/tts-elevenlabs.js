/**
 * tts-elevenlabs.js
 *
 * Vertont das englische Sprechskript (tools/audio-script-en.json) mit
 * ElevenLabs und legt die MP3s unter audios_en/ ab – mit denselben Dateinamen
 * wie die deutschen Aufnahmen in audios/, damit der Player sie 1:1 nutzen kann.
 *
 * Voraussetzungen:
 *   - API-Key in der Umgebungsvariablen ELEVENLABS_API_KEY
 *     (alternativ in einer Datei .env im Projektroot: ELEVENLABS_API_KEY=...)
 *   - optional ffmpeg (für sauberes Zusammenfügen langer Kapitel)
 *
 * Aufruf:
 *   node tools/tts-elevenlabs.js --dry-run     # nur Vorschau (kein API-Call)
 *   node tools/tts-elevenlabs.js               # fehlende Kapitel vertonen
 *   node tools/tts-elevenlabs.js --force       # alles neu vertonen
 *   node tools/tts-elevenlabs.js --only 01_leben_1_combined
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const https = require('https');
const { preprocess } = require('./tts-preprocess');

/** Minimaler POST-Helfer (Node 16 hat noch kein globales fetch). */
function postJson(url, headers, payload) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const data = Buffer.from(JSON.stringify(payload), 'utf8');
        const req = https.request({
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: 'POST',
            headers: { ...headers, 'Content-Length': data.length }
        }, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve({
                status: res.statusCode,
                ok: res.statusCode >= 200 && res.statusCode < 300,
                body: Buffer.concat(chunks)
            }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

const REPO = path.resolve(__dirname, '..');
const SCRIPT_FILE = path.join(__dirname, 'audio-script-en.json');
const OUT_DIR = path.join(REPO, 'audios_en');

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const FORCE = args.includes('--force');
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

// ---- Konfiguration ----
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'enzbGixeo55iqn1QxbbC';
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
const MAX_CHARS = 2400;           // sichere Blockgröße pro Anfrage
const PAUSE_MS = 600;             // Pause zwischen Anfragen (API schonen)

function loadApiKey() {
    if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
    const envFile = path.join(REPO, '.env');
    if (fs.existsSync(envFile)) {
        const m = fs.readFileSync(envFile, 'utf8').match(/^\s*ELEVENLABS_API_KEY\s*=\s*(.+)\s*$/m);
        if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    }
    return null;
}

/** Teilt langen Text an Satzgrenzen in Blöcke <= MAX_CHARS. */
function chunkText(text) {
    if (text.length <= MAX_CHARS) return [text];
    const sentences = text.split(/(?<=[.!?])\s+|\n\n+/);
    const chunks = [];
    let cur = '';
    for (const s of sentences) {
        if ((cur + ' ' + s).trim().length > MAX_CHARS && cur) {
            chunks.push(cur.trim());
            cur = s;
        } else {
            cur = cur ? cur + ' ' + s : s;
        }
    }
    if (cur.trim()) chunks.push(cur.trim());
    return chunks;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function synthesize(apiKey, text, prevText, nextText) {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
    const body = {
        text,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true }
    };
    // Kontext für gleichmäßige Betonung über Blockgrenzen hinweg
    if (prevText) body.previous_text = prevText.slice(-500);
    if (nextText) body.next_text = nextText.slice(0, 500);

    for (let attempt = 1; attempt <= 4; attempt++) {
        const res = await postJson(url, {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg'
        }, body);
        if (res.ok) return res.body;

        const detail = res.body.toString('utf8');
        if (res.status === 429 || res.status >= 500) {
            const wait = 2000 * attempt;
            console.warn(`   ! ${res.status} – erneuter Versuch in ${wait / 1000}s`);
            await sleep(wait);
            continue;
        }
        throw new Error(`ElevenLabs ${res.status}: ${detail.slice(0, 300)}`);
    }
    throw new Error('Zu viele Fehlversuche gegen die ElevenLabs-API.');
}

function concatMp3(buffers, outFile) {
    if (buffers.length === 1) {
        fs.writeFileSync(outFile, buffers[0]);
        return;
    }
    const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'tts-'));
    const parts = buffers.map((buf, i) => {
        const p = path.join(tmpDir, `part-${String(i).padStart(3, '0')}.mp3`);
        fs.writeFileSync(p, buf);
        return p;
    });
    try {
        const listFile = path.join(tmpDir, 'list.txt');
        fs.writeFileSync(listFile, parts.map((p) => `file '${p}'`).join('\n'));
        execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
            '-i', listFile, '-c', 'copy', outFile]);
    } catch (e) {
        // Fallback ohne ffmpeg: MP3-Frames einfach aneinanderhängen
        fs.writeFileSync(outFile, Buffer.concat(buffers));
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

(async function main() {
    if (!fs.existsSync(SCRIPT_FILE)) {
        console.error('Sprechskript fehlt. Zuerst ausführen:  node tools/extract-audio-script.js');
        process.exit(1);
    }
    let script = JSON.parse(fs.readFileSync(SCRIPT_FILE, 'utf8'));
    // Sprechtext aufbereiten (Ellipsen, Gedankenstriche, Abkürzungen, Jahresbereiche …)
    script = script.map((s) => ({ ...s, text: preprocess(s.text) }));
    if (ONLY) script = script.filter((s) => s.file === ONLY);
    if (!script.length) { console.error('Keine passenden Kapitel.'); process.exit(1); }

    fs.mkdirSync(OUT_DIR, { recursive: true });

    const todo = script.filter((s) => FORCE || !fs.existsSync(path.join(OUT_DIR, s.file + '.mp3')));
    const chars = todo.reduce((n, s) => n + s.text.length, 0);

    console.log(`Stimme : ${VOICE_ID}`);
    console.log(`Modell : ${MODEL_ID}`);
    console.log(`Ziel   : ${path.relative(REPO, OUT_DIR)}/`);
    console.log(`Kapitel: ${todo.length} von ${script.length} (${chars.toLocaleString('de-DE')} Zeichen)\n`);

    if (DRY) {
        todo.forEach((s) => {
            const n = chunkText(s.text).length;
            console.log(`  ${s.file.padEnd(26)} ${String(s.text.length).padStart(6)} Zeichen  ${n} Block/Blöcke`);
        });
        console.log('\n(Vorschau – es wurde nichts an die API gesendet.)');
        return;
    }

    const apiKey = loadApiKey();
    if (!apiKey) {
        console.error('Kein API-Key gefunden.\n' +
            'Setze ihn per Umgebungsvariable:\n' +
            '  export ELEVENLABS_API_KEY="dein_key"\n' +
            'oder lege eine Datei .env im Projektroot an (steht in .gitignore):\n' +
            '  ELEVENLABS_API_KEY=dein_key');
        process.exit(1);
    }

    let done = 0;
    for (const chapter of todo) {
        const chunks = chunkText(chapter.text);
        process.stdout.write(`→ ${chapter.file} (${chapter.text.length} Zeichen, ${chunks.length} Block/Blöcke) `);
        const buffers = [];
        for (let i = 0; i < chunks.length; i++) {
            buffers.push(await synthesize(apiKey, chunks[i], chunks[i - 1], chunks[i + 1]));
            process.stdout.write('.');
            if (i < chunks.length - 1) await sleep(PAUSE_MS);
        }
        const outFile = path.join(OUT_DIR, chapter.file + '.mp3');
        concatMp3(buffers, outFile);
        const kb = Math.round(fs.statSync(outFile).size / 1024);
        console.log(` ✓ ${kb} KB`);
        done++;
        await sleep(PAUSE_MS);
    }
    console.log(`\nFertig: ${done} Kapitel vertont → ${path.relative(REPO, OUT_DIR)}/`);
})().catch((e) => {
    console.error('\nAbbruch:', e.message);
    process.exit(1);
});

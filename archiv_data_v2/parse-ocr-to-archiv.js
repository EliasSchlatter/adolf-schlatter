#!/usr/bin/env node

/**
 * Parse-OCR-to-Archiv
 * Überführt OCR-Ergebnisse (pageType: DATA) in strukturierte Archiv-Daten
 * 
 * WICHTIGE FEATURES:
 * 1. Kontext-Propagierung: Überschriften (Teil, Sektion, Unterabschnitt, Unterkategorie)
 *    werden von Seite zu Seite weitergegeben, wenn keine neue Überschrift erscheint
 * 2. Seitenübergreifende Einträge: Nach dem Parsen werden Einträge mit gleicher
 *    Inventarnummer von aufeinanderfolgenden Seiten automatisch zusammengeführt
 * 3. Zusätzliche Daten: Alles was nicht ins Schema passt wird in 'zusatzInfo' gespeichert
 */

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// ============================================================================
// KONFIGURATION
// ============================================================================

const CONFIG = {
    ocrResultsDir: './ocr_results',
    outputDir: './parsed_entries',
    model: 'gpt-5-mini',  // Kostengünstiger für strukturierte Extraktion
    maxConcurrent: 1,       // Sequentiell für Kontext-Propagierung
    retryAttempts: 3,
    retryDelay: 2000
};

// OpenAI Client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'YOUR_API_KEY_HERE'
});

// Kosten-Tracking
const costTracker = {
    totalRequests: 0,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    requests: []
};

// GPT-4o-mini Preise (pro 1M Tokens)
const PRICING = {
    input: 0.15 / 1000,   // $0.15 per 1M = $0.00015 per 1K
    output: 0.60 / 1000   // $0.60 per 1M = $0.0006 per 1K
};

// ============================================================================
// DATEN-SCHEMA (basierend auf archiv-data.js)
// ============================================================================

const ENTRY_SCHEMA = {
    type: "object",
    properties: {
        rawText: { type: "string", description: "Originaler Eintragstext wie im OCR" },
        nummer: { type: "string", description: "Archiv-Inventarnummer (z.B. '1', '38/1', '165')" },
        titel: { type: "string", description: "Haupttitel oder Bezeichnung des Eintrags" },
        beschreibung: { type: "string", description: "Beschreibung, Kontext, Zusatzinformationen" },
        typ: { 
            type: "string", 
            enum: ["Buch", "Druckschrift", "Manuskript", "Brief", "Korrespondenz", "Vorlesung", 
                   "Kollegheft", "Vortrag", "Rede", "Predigt", "Andacht", "Bibelstunde", 
                   "Artikel", "Aufsatz", "Kommentar", "Studie", "Notiz", "Notizbuch/Heft",
                   "Tagebuch/Reisetagebuch", "Sammlung", "Material", "Verzeichnis/Aufstellung",
                   "Interview", "Festschrift", "Sonderdruck", "Reihenband", "Lexikon",
                   "Wörterbuch", "Vokabular", "Urkunde", "Erinnerungen/Memoiren", "Gedichte/Lyrik",
                   "Nachschrift", "Regest", "Fotografie", "Scherenschnitt", "Schreiben",
                   "Widmung", "Erklärung", "Erlass", "Dossier", "Protokoll", "Mitteilung",
                   "Bericht", "Einladung", "Katalog", "Jahresbericht", "Aktennotiz", "Programm",
                   "Dissertation", "Entwurf", "Exzerpt", "Skizze", "Herbarium", "Sonstiges"]
        },
        teilfolge: { type: "string", description: "Mehrteiligkeit (z.B. 'Teil I', 'Band 2')" },
        datum: { type: "string", description: "Vollständiges Datum JJJJ-MM-TT (nur wenn Tag.Monat.Jahr vorhanden)" },
        jahr: { type: "integer", description: "Jahreszahl (4-stellig)" },
        zeitraum: { type: "string", description: "Zeitspanne (z.B. '1910-1938')" },
        seiten: { type: "string", description: "Seitenangaben" },
        umfang: { type: "string", description: "Physischer Umfang (z.B. '3 Bände', '12 Briefe')" },
        format: { type: "string", description: "Format: Folio, Oktav, Quart" },
        auflage: { type: "string", description: "Auflagenhinweis" },
        ort: { type: "string", description: "Entstehungs- oder Ereignisort" },
        verlag: { type: "string", description: "Verlag oder Herausgeber-Institution" },
        zeitschrift: { type: "string", description: "Name der Zeitschrift" },
        reihe: { type: "string", description: "Name der Reihe" },
        band: { type: "string", description: "Bandnummer" },
        heft: { type: "string", description: "Heftnummer" },
        in: { type: "string", description: "Erschienen in (Sammelwerk, Festschrift etc.)" },
        bibelstelle: { type: "string", description: "Biblischer Bezug" },
        anlass: { type: "string", description: "Anlass oder Kontext" },
        beteiligte: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    rolle: { 
                        type: "string",
                        enum: ["Autor", "Herausgeber", "Bearbeiter", "Übersetzer", "Verlag",
                               "Redaktion", "Adressat", "Absender", "Vortragender", "Redner",
                               "Korrespondent", "Interviewter", "Interviewer", "Protokollant",
                               "Zusammensteller", "Kommentator", "Herausgebende Stelle", "Erwähnt"]
                    },
                    entity: { type: "string", enum: ["Person", "Institution", "Organisation"] },
                    zusatz: { type: "string", description: "Zusatzinfo zur Person (Titel, Funktion)" }
                },
                required: ["name", "rolle"]
            }
        },
        verweis: { type: "string", description: "Querverweise auf andere Inventar-Nummern" },
        anmerkung: { type: "string", description: "Sonstige Anmerkungen" },
        untereintraege: {
            type: "array",
            description: "Untereinträge zu diesem Haupteintrag",
            items: {
                type: "object",
                properties: {
                    rawText: { type: "string" },
                    titel: { type: "string" },
                    beschreibung: { type: "string" },
                    typ: { type: "string" },
                    datum: { type: "string" },
                    jahr: { type: "integer" },
                    seiten: { type: "string" },
                    beteiligte: { 
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                rolle: { type: "string" },
                                entity: { type: "string" }
                            }
                        }
                    },
                    bibelstelle: { type: "string" },
                    in: { type: "string" },
                    verweis: { type: "string" }
                }
            }
        },
        zusatzInfo: { 
            type: "object", 
            description: "Alle weiteren Informationen die nicht ins Schema passen",
            additionalProperties: true
        }
    },
    required: ["nummer"]
};

// ============================================================================
// KONTEXT-MANAGEMENT
// ============================================================================

/**
 * Speichert und verwaltet den hierarchischen Kontext über Seitengrenzen hinweg
 */
class ContextManager {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.teil = null;           // I, II, III, Anhang
        this.sektion = null;        // A, B, C
        this.unterabschnitt = null; // "1. Wissenschaftlich-theologische Werke..."
        this.unterkategorie = null; // "a) Zu Lebzeiten erschienene Bücher"
    }
    
    /**
     * Aktualisiert den Kontext basierend auf erkannten Überschriften
     */
    update(extracted) {
        if (extracted.teil) this.teil = extracted.teil;
        if (extracted.sektion) this.sektion = extracted.sektion;
        if (extracted.unterabschnitt) this.unterabschnitt = extracted.unterabschnitt;
        if (extracted.unterkategorie) this.unterkategorie = extracted.unterkategorie;
    }
    
    /**
     * Gibt den aktuellen Kontext zurück
     */
    getCurrent() {
        return {
            teil: this.teil,
            sektion: this.sektion,
            unterabschnitt: this.unterabschnitt,
            unterkategorie: this.unterkategorie
        };
    }
}

// ============================================================================
// GPT PARSING
// ============================================================================

/**
 * Parsed eine einzelne OCR-Seite mit GPT
 */
async function parsePageWithGPT(pageData, context, archivStruktur) {
    const currentContext = context.getCurrent();
    
    const systemPrompt = `Du bist ein Experte für die Digitalisierung historischer Archive.
Deine Aufgabe ist, aus dem OCR-Ergebnis einer Inventarseite des Schlatter-Archivs alle Einträge zu extrahieren.

WICHTIGE REGELN:

1. KONTEXT-VERERBUNG:
   - Der aktuelle Kontext (Teil, Sektion, Unterabschnitt, Unterkategorie) gilt für alle Einträge, 
     bis eine NEUE Überschrift auf dieser Seite erscheint.
   - Aktueller Kontext: ${JSON.stringify(currentContext, null, 2)}
   - Wenn du eine neue Überschrift erkennst (z.B. "b) Druckschriften"), melde das im kontextUpdate

2. SEITENÜBERGREIFENDE EINTRÄGE:
   - Manche Einträge erstrecken sich über mehrere Seiten
   - Extrahiere JEDEN Eintrag so wie er auf DIESER Seite erscheint
   - Wenn eine Inventarnummer (z.B. "Nr. 165:") mehrfach auf verschiedenen Seiten vorkommt,
     werden die Teile später automatisch zusammengeführt
   - Du musst NICHT erkennen ob ein Eintrag "unvollständig" ist

3. DATENEXTRAKTION:
   - Extrahiere ALLE sichtbaren Einträge vollständig
   - Bei "Dasselbe" übernehme Titel vom vorherigen Eintrag
   - Untereinträge (ohne eigene Nummer) in "untereintraege" Liste
   - Alles was nicht ins Schema passt kommt in "zusatzInfo"
   - "datum" NUR bei vollständigem Datum (TT.MM.JJJJ), sonst nur "jahr"
   - 5-stellige "Jahreszahlen" korrigieren (z.B. 51982 → 1982)

4. ÜBERSCHRIFTEN ERKENNEN:
   Erkenne und melde neue Überschriften im kontextUpdate:
   - Neue Sektionen: "A BÜCHER", "B DOKUMENTE", "C BRIEFE"
   - Neue Unterabschnitte: "1. Wissenschaftlich-theologische...", "2. Werke mit Einzelbeiträgen..."
   - Neue Unterkategorien: "a) Bücher", "b) Druckschriften", "c) Rezensionen"`;

    const userPrompt = `SEITEN-INFORMATIONEN:
Datei: ${pageData.sourceImage}
Seitenzahl im Original: ${pageData.pageNumber}
Titel: ${pageData.pageTitle || 'N/A'}

SEITEN-INHALT (OCR):
${pageData.pageContent}

Extrahiere alle Einträge dieser Seite und melde erkannte Kontextwechsel.`;

    try {
        const response = await openai.chat.completions.create({
            model: CONFIG.model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            tools: [{
                type: "function",
                function: {
                    name: "extract_archive_page",
                    description: "Extrahiert strukturierte Archiv-Einträge und Kontext-Updates",
                    parameters: {
                        type: "object",
                        properties: {
                            kontextUpdate: {
                                type: "object",
                                description: "Neue Überschriften die auf dieser Seite erscheinen",
                                properties: {
                                    teil: { type: "string", description: "Neuer Teil (I, II, III, Anhang)" },
                                    sektion: { type: "string", description: "Neue Sektion (A, B, C)" },
                                    unterabschnitt: { type: "string", description: "Neuer nummerierter Unterabschnitt" },
                                    unterkategorie: { type: "string", description: "Neue alphabetische Unterkategorie" }
                                }
                            },
                            eintraege: {
                                type: "array",
                                description: "Alle Einträge dieser Seite",
                                items: ENTRY_SCHEMA
                            },
                            seitenNotizen: {
                                type: "string",
                                description: "Anmerkungen zur Seite (z.B. Qualitätsprobleme, unklare Stellen)"
                            }
                        },
                        required: ["eintraege"]
                    }
                }
            }],
            tool_choice: { type: "function", function: { name: "extract_archive_page" } }
        });

        // Kosten tracken
        const usage = response.usage;
        if (usage) {
            const inputCost = (usage.prompt_tokens / 1000) * PRICING.input;
            const outputCost = (usage.completion_tokens / 1000) * PRICING.output;
            costTracker.totalRequests++;
            costTracker.inputTokens += usage.prompt_tokens;
            costTracker.outputTokens += usage.completion_tokens;
            costTracker.totalTokens += usage.total_tokens;
            costTracker.requests.push({
                file: pageData.sourceImage,
                tokens: usage.total_tokens,
                cost: inputCost + outputCost
            });
        }

        // Ergebnis extrahieren
        const toolCall = response.choices[0].message.tool_calls?.[0];
        if (!toolCall) {
            throw new Error("Keine Tool-Antwort erhalten");
        }
        
        return JSON.parse(toolCall.function.arguments);
        
    } catch (error) {
        console.error(`   ❌ GPT-Fehler: ${error.message}`);
        throw error;
    }
}

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
    constructor(maxConcurrent) {
        this.maxConcurrent = maxConcurrent;
        this.running = 0;
        this.queue = [];
    }

    async execute(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.process();
        });
    }

    async process() {
        if (this.running >= this.maxConcurrent || this.queue.length === 0) return;
        
        this.running++;
        const { task, resolve, reject } = this.queue.shift();
        
        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.running--;
            this.process();
        }
    }
}

// ============================================================================
// MERGE-LOGIK FÜR SEITENÜBERGREIFENDE EINTRÄGE (NUMMERN-BASIERT)
// ============================================================================

/**
 * Extrahiert die Seitennummer aus dem Dateinamen (z.B. "page_033.json" → 33)
 */
function extractPageNumber(filename) {
    const match = filename.match(/page_(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * Prüft ob die Seiten aufeinanderfolgend sind
 */
function areConsecutivePages(entries) {
    if (entries.length < 2) return true;
    
    const pageNumbers = entries.map(e => extractPageNumber(e._quelldatei)).sort((a, b) => a - b);
    
    for (let i = 1; i < pageNumbers.length; i++) {
        // Erlaubt kleine Lücken (z.B. durch Overview-Seiten dazwischen)
        if (pageNumbers[i] - pageNumbers[i-1] > 3) {
            return false;
        }
    }
    return true;
}

/**
 * Führt mehrere Einträge mit gleicher Nummer zusammen
 */
function mergeEntriesWithSameNumber(entries) {
    if (entries.length === 1) return entries[0];
    
    // Sortiere nach Seitennummer
    const sorted = [...entries].sort((a, b) => 
        extractPageNumber(a._quelldatei) - extractPageNumber(b._quelldatei)
    );
    
    // Basis ist der erste Eintrag
    const merged = { ...sorted[0] };
    const sourcePages = [sorted[0]._quelldatei];
    
    // Füge alle weiteren hinzu
    for (let i = 1; i < sorted.length; i++) {
        const entry = sorted[i];
        sourcePages.push(entry._quelldatei);
        
        // rawText zusammenführen
        if (entry.rawText) {
            merged.rawText = (merged.rawText || "") + "\n---\n" + entry.rawText;
        }
        
        // Beschreibung zusammenführen
        if (entry.beschreibung) {
            merged.beschreibung = [merged.beschreibung, entry.beschreibung]
                .filter(Boolean).join(" | ");
        }
        
        // Untereinträge zusammenführen
        if (entry.untereintraege && entry.untereintraege.length > 0) {
            merged.untereintraege = [
                ...(merged.untereintraege || []),
                ...entry.untereintraege
            ];
        }
        
        // Beteiligte zusammenführen (ohne Duplikate)
        if (entry.beteiligte && entry.beteiligte.length > 0) {
            const existingNames = new Set((merged.beteiligte || []).map(b => b.name));
            const newBeteiligte = entry.beteiligte.filter(b => !existingNames.has(b.name));
            merged.beteiligte = [...(merged.beteiligte || []), ...newBeteiligte];
        }
        
        // zusatzInfo zusammenführen
        if (entry.zusatzInfo) {
            merged.zusatzInfo = {
                ...(merged.zusatzInfo || {}),
                ...entry.zusatzInfo
            };
        }
        
        // Felder übernehmen die im ersten Eintrag fehlen
        const fieldsToMerge = ['titel', 'typ', 'jahr', 'zeitraum', 'verlag', 'ort', 
                               'zeitschrift', 'reihe', 'band', 'heft', 'bibelstelle', 
                               'anlass', 'verweis', 'anmerkung', 'umfang', 'format'];
        for (const field of fieldsToMerge) {
            if (!merged[field] && entry[field]) {
                merged[field] = entry[field];
            }
        }
    }
    
    // Metadaten für Merge
    merged._quelldateien = sourcePages;
    merged._mergedFromPages = true;
    delete merged._quelldatei;
    
    return merged;
}

/**
 * Gruppiert Einträge nach Inventarnummer und führt zusammen
 */
function mergeEntriesByNumber(allEntries) {
    // Gruppiere nach Nummer
    const byNumber = new Map();
    
    for (const entry of allEntries) {
        const nummer = entry.nummer;
        if (!byNumber.has(nummer)) {
            byNumber.set(nummer, []);
        }
        byNumber.get(nummer).push(entry);
    }
    
    const mergedEntries = [];
    const mergeLog = [];
    const warnings = [];
    
    for (const [nummer, entries] of byNumber) {
        if (entries.length === 1) {
            // Einzelner Eintrag - direkt übernehmen
            mergedEntries.push(entries[0]);
        } else {
            // Mehrere Einträge mit gleicher Nummer
            if (areConsecutivePages(entries)) {
                // Aufeinanderfolgende Seiten → Zusammenführen
                const merged = mergeEntriesWithSameNumber(entries);
                mergedEntries.push(merged);
                mergeLog.push({
                    nummer,
                    pages: entries.map(e => e._quelldatei),
                    action: 'merged'
                });
            } else {
                // Nicht aufeinanderfolgend → Warnung + alle behalten
                for (const entry of entries) {
                    mergedEntries.push(entry);
                }
                warnings.push({
                    nummer,
                    pages: entries.map(e => e._quelldatei),
                    message: `Inventarnummer ${nummer} erscheint auf nicht-aufeinanderfolgenden Seiten`
                });
            }
        }
    }
    
    // Sortiere nach Nummer (numerisch wenn möglich)
    mergedEntries.sort((a, b) => {
        const numA = parseFloat(a.nummer.replace(/[^\d.]/g, '')) || 0;
        const numB = parseFloat(b.nummer.replace(/[^\d.]/g, '')) || 0;
        if (numA !== numB) return numA - numB;
        return (a.nummer || '').localeCompare(b.nummer || '');
    });
    
    return { mergedEntries, mergeLog, warnings };
}

// ============================================================================
// HILFSFUNKTIONEN FÜR RESUME-MODUS
// ============================================================================

/**
 * Prüft ob eine Seite bereits erfolgreich verarbeitet wurde
 */
function isPageProcessed(file) {
    const outputFile = path.join(CONFIG.outputDir, file);
    if (!fs.existsSync(outputFile)) return false;
    
    try {
        const data = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        // Erfolgreich wenn entries vorhanden und kein error
        return data.entries && data.entries.length > 0 && !data.error;
    } catch {
        return false;
    }
}

/**
 * Lädt bereits verarbeitete Seiten-Ergebnisse
 */
function loadExistingResults() {
    const results = [];
    
    if (!fs.existsSync(CONFIG.outputDir)) return results;
    
    const files = fs.readdirSync(CONFIG.outputDir)
        .filter(f => f.startsWith('page_') && f.endsWith('.json'));
    
    for (const file of files) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(CONFIG.outputDir, file), 'utf8'));
            if (data.entries && data.entries.length > 0 && !data.error) {
                results.push(data);
            }
        } catch {
            // Ignoriere fehlerhafte Dateien
        }
    }
    
    return results;
}

/**
 * Retry-Wrapper mit exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = CONFIG.retryAttempts, baseDelay = CONFIG.retryDelay) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // Bei Netzwerkfehlern oder Rate-Limits: Retry
            const isRetryable = error.message.includes('ECONNRESET') ||
                               error.message.includes('ETIMEDOUT') ||
                               error.message.includes('network') ||
                               error.message.includes('rate') ||
                               error.message.includes('429') ||
                               error.message.includes('503') ||
                               error.message.includes('fetch');
            
            if (!isRetryable || attempt === maxRetries) {
                throw error;
            }
            
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`   ⏳ Retry ${attempt}/${maxRetries} in ${delay/1000}s...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    
    throw lastError;
}

// ============================================================================
// HAUPTVERARBEITUNG
// ============================================================================

async function processAllPages(resumeMode = true) {
    console.log('🚀 Starte OCR → Archiv-Daten Konvertierung\n');
    console.log('=' .repeat(60));
    
    // Lade Archiv-Struktur
    const strukturPath = path.join(__dirname, 'archiv_struktur.json');
    const archivStruktur = JSON.parse(fs.readFileSync(strukturPath, 'utf8'));
    console.log('📂 Archiv-Struktur geladen\n');
    
    // Erstelle Output-Ordner
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    // Sammle alle DATA-Seiten
    const ocrFiles = fs.readdirSync(CONFIG.ocrResultsDir)
        .filter(f => f.startsWith('page_') && f.endsWith('.json'))
        .sort((a, b) => {
            const numA = parseInt(a.match(/page_(\d+)/)[1]);
            const numB = parseInt(b.match(/page_(\d+)/)[1]);
            return numA - numB;
        });
    
    const dataPages = [];
    for (const file of ocrFiles) {
        const filePath = path.join(CONFIG.ocrResultsDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.pageType === 'DATA' && data.isArchivalListing === true) {
            dataPages.push({ file, data });
        }
    }
    
    console.log(`📚 Gefunden: ${dataPages.length} DATA-Seiten insgesamt\n`);
    
    // Im Resume-Modus: Prüfe welche Seiten noch fehlen
    let pagesToProcess = dataPages;
    let existingResults = [];
    
    if (resumeMode) {
        existingResults = loadExistingResults();
        const processedFiles = new Set(existingResults.map(r => r.sourceFile));
        
        pagesToProcess = dataPages.filter(p => !processedFiles.has(p.file));
        
        console.log(`📋 Resume-Modus:`);
        console.log(`   - Bereits verarbeitet: ${existingResults.length} Seiten`);
        console.log(`   - Noch zu verarbeiten: ${pagesToProcess.length} Seiten\n`);
        
        if (pagesToProcess.length === 0) {
            console.log('✅ Alle Seiten bereits verarbeitet! Springe zur Zusammenführung...\n');
        }
    }
    
    // Kontext-Manager initialisieren
    const context = new ContextManager();
    
    // Initialisiere Kontext aus letzter erfolgreicher Seite (für Resume)
    if (resumeMode && existingResults.length > 0) {
        // Sortiere nach Seitennummer und nimm die letzte
        const sortedResults = existingResults.sort((a, b) => {
            const numA = extractPageNumber(a.sourceFile);
            const numB = extractPageNumber(b.sourceFile);
            return numA - numB;
        });
        
        const lastResult = sortedResults[sortedResults.length - 1];
        if (lastResult.context) {
            context.update(lastResult.context);
            console.log(`📋 Kontext wiederhergestellt von ${lastResult.sourceFile}`);
            console.log(`   ${JSON.stringify(lastResult.context)}\n`);
        }
    }
    
    // Neue Ergebnisse sammeln
    const newPageResults = [];
    
    // Sequentielle Verarbeitung (wichtig für Kontext-Propagierung!)
    for (let i = 0; i < pagesToProcess.length; i++) {
        const { file, data } = pagesToProcess[i];
        console.log(`[${i + 1}/${pagesToProcess.length}] 📄 ${file}`);
        
        try {
            // Parse Seite MIT Retry
            const result = await retryWithBackoff(async () => {
                return await parsePageWithGPT(data, context, archivStruktur);
            });
            
            // Kontext aktualisieren
            if (result.kontextUpdate) {
                context.update(result.kontextUpdate);
                console.log(`   📋 Kontext-Update: ${JSON.stringify(result.kontextUpdate)}`);
            }
            
            // Einträge verarbeiten
            const currentContext = context.getCurrent();
            const processedEntries = [];
            
            for (let j = 0; j < (result.eintraege || []).length; j++) {
                let entry = result.eintraege[j];
                
                // Füge Kontext hinzu
                entry = {
                    teil: currentContext.teil,
                    sektion: currentContext.sektion,
                    unterabschnitt: currentContext.unterabschnitt,
                    unterkategorie: currentContext.unterkategorie,
                    ...entry,
                    _quelldatei: file,
                    _pageNumber: data.pageNumber
                };
                
                processedEntries.push(entry);
            }
            
            // Speichere Seiten-Ergebnis
            const pageResult = {
                sourceFile: file,
                pageNumber: data.pageNumber,
                context: { ...currentContext },
                entriesCount: processedEntries.length,
                entries: processedEntries,
                notes: result.seitenNotizen
            };
            newPageResults.push(pageResult);
            
            // Speichere einzelne Seite
            const outputFile = path.join(CONFIG.outputDir, file);
            fs.writeFileSync(outputFile, JSON.stringify(pageResult, null, 2));
            
            console.log(`   ✅ ${processedEntries.length} Einträge extrahiert`);
            
            // Rate Limiting
            await new Promise(r => setTimeout(r, 500));
            
        } catch (error) {
            console.error(`   ❌ Fehler bei ${file}: ${error.message}`);
            newPageResults.push({
                sourceFile: file,
                error: error.message
            });
        }
    }
    
    // Kombiniere existierende und neue Ergebnisse
    const allPageResults = [...existingResults, ...newPageResults];
    
    // Sammle alle Einträge
    const allEntries = [];
    for (const pageResult of allPageResults) {
        if (pageResult.entries) {
            allEntries.push(...pageResult.entries);
        }
    }
    
    const pageResults = allPageResults;
    
    // =========================================================================
    // PASS 2: NUMMERN-BASIERTE ZUSAMMENFÜHRUNG
    // =========================================================================
    
    console.log('\n' + '='.repeat(60));
    console.log('🔗 Pass 2: Führe Einträge mit gleicher Nummer zusammen...\n');
    
    const { mergedEntries, mergeLog, warnings } = mergeEntriesByNumber(allEntries);
    
    // Log Merge-Aktivitäten
    if (mergeLog.length > 0) {
        console.log(`   📎 ${mergeLog.length} Einträge wurden zusammengeführt:`);
        for (const log of mergeLog) {
            console.log(`      - Nr. ${log.nummer}: ${log.pages.join(' + ')}`);
        }
    }
    
    if (warnings.length > 0) {
        console.log(`\n   ⚠️  ${warnings.length} Warnungen:`);
        for (const warn of warnings) {
            console.log(`      - ${warn.message}`);
        }
    }
    
    // Bereinige interne Felder für finale Ausgabe
    const cleanedEntries = mergedEntries.map(entry => {
        const cleaned = { ...entry };
        delete cleaned._pageNumber;
        // _quelldatei und _quelldateien behalten für Nachvollziehbarkeit
        return cleaned;
    });
    
    console.log(`\n📊 Finale Anzahl: ${cleanedEntries.length} Einträge (von ${allEntries.length} Roh-Einträgen)\n`);
    
    // Speichere alle Einträge als JSON
    const allEntriesPath = path.join(CONFIG.outputDir, 'alle_eintraege.json');
    fs.writeFileSync(allEntriesPath, JSON.stringify(cleanedEntries, null, 2));
    console.log(`📄 Gespeichert: ${allEntriesPath}`);
    
    // Speichere Merge-Log
    const mergeLogPath = path.join(CONFIG.outputDir, 'merge_log.json');
    fs.writeFileSync(mergeLogPath, JSON.stringify({ mergeLog, warnings }, null, 2));
    console.log(`📄 Merge-Log: ${mergeLogPath}`);
    
    // Speichere als JS-Modul (wie archiv-data.js)
    const jsModulePath = path.join(CONFIG.outputDir, 'archiv-data-v2.js');
    const jsContent = `// Auto-generiert aus OCR-Ergebnissen
// Erstellt am: ${new Date().toISOString()}
// Bitte nicht manuell bearbeiten!

const archivDataV2 = ${JSON.stringify(cleanedEntries, null, 2)};

if (typeof module !== 'undefined') {
    module.exports = { archivDataV2 };
}
`;
    fs.writeFileSync(jsModulePath, jsContent);
    console.log(`📄 Gespeichert: ${jsModulePath}`);
    
    // Statistiken
    const totalCost = costTracker.requests.reduce((sum, r) => sum + (r.cost || 0), 0);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Verarbeitung abgeschlossen!\n');
    console.log(`📊 Statistiken:`);
    console.log(`   - Seiten gesamt: ${pageResults.length}`);
    console.log(`   - Davon bereits vorhanden: ${existingResults.length}`);
    console.log(`   - Davon neu verarbeitet: ${newPageResults.filter(p => !p.error).length}`);
    console.log(`   - Roh-Einträge extrahiert: ${allEntries.length}`);
    console.log(`   - Finale Einträge (nach Merge): ${cleanedEntries.length}`);
    console.log(`   - Zusammengeführte Einträge: ${mergeLog.length}`);
    console.log(`   - Warnungen: ${warnings.length}`);
    console.log(`   - Fehlerhafte Seiten: ${pageResults.filter(p => p.error).length}`);
    console.log(`   - GPT-Anfragen (diese Session): ${costTracker.totalRequests}`);
    console.log(`   - Tokens (diese Session): ${costTracker.totalTokens.toLocaleString()}`);
    console.log(`   - Geschätzte Kosten (diese Session): $${totalCost.toFixed(4)}`);
    
    // Speichere Kostenlog
    const costLog = {
        processedAt: new Date().toISOString(),
        statistics: {
            pagesTotal: pageResults.length,
            pagesExisting: existingResults.length,
            pagesNewlyProcessed: newPageResults.filter(p => !p.error).length,
            rawEntries: allEntries.length,
            finalEntries: cleanedEntries.length,
            mergedEntries: mergeLog.length,
            warnings: warnings.length,
            errors: pageResults.filter(p => p.error).length,
            errorPages: pageResults.filter(p => p.error).map(p => p.sourceFile)
        },
        costsThisSession: {
            totalRequests: costTracker.totalRequests,
            totalTokens: costTracker.totalTokens,
            inputTokens: costTracker.inputTokens,
            outputTokens: costTracker.outputTokens,
            estimatedCost: totalCost
        },
        requests: costTracker.requests
    };
    
    const costLogPath = path.join(CONFIG.outputDir, 'parsing_cost_log.json');
    fs.writeFileSync(costLogPath, JSON.stringify(costLog, null, 2));
    console.log(`\n📄 Kostenlog: ${costLogPath}`);
}

// ============================================================================
// ENTRY POINT
// ============================================================================

if (require.main === module) {
    processAllPages().catch(error => {
        console.error('❌ Kritischer Fehler:', error);
        process.exit(1);
    });
}

module.exports = { processAllPages, parsePageWithGPT };


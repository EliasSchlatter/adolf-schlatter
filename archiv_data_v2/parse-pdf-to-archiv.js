#!/usr/bin/env node

/**
 * Parse-PDF-to-Archiv
 * Extrahiert Archiv-Einträge aus dem PDF und konvertiert sie in das archiv-data.js Format
 * 
 * Pipeline:
 * 1. PDF-Text extrahieren (pdf-parse)
 * 2. Text in Seiten/Abschnitte aufteilen
 * 3. Jeden Abschnitt per OpenAI GPT-4 in strukturierte Einträge parsen
 * 4. Alle Einträge sammeln und in JSON speichern
 */

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const OpenAI = require('openai');

// Konfiguration
const CONFIG = {
    // Pfade relativ zum archiv_data_preparation_files Ordner wenn von dort ausgeführt
    pdfFile: path.join(__dirname, '..', 'archiv_data_v2', 'Schlatter, Adolf - Adolf-Schlatter-Archiv Inventar, erstellt von Ernst Bock (Landeskirchliches Archiv Stuttgart Bestand D 40, 1998, 272pp)_OS.pdf'),
    outputDir: path.join(__dirname, '..', 'archiv_data_v2'),
    outputFile: 'archiv_eintraege_v2.json',
    outputFileJS: 'archiv-data-v2.js',
    // Seiten pro Batch für GPT-Verarbeitung
    pagesPerBatch: 3,
    // Maximale parallele Anfragen
    maxConcurrent: 3,
    // OpenAI API Key
    openaiApiKey: process.env.OPENAI_API_KEY || 'YOUR_API_KEY_HERE'
};

// OpenAI Client initialisieren
const openai = new OpenAI({
    apiKey: CONFIG.openaiApiKey
});

// Kosten-Tracking
const costTracker = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    requests: []
};

// GPT-4 Preise (pro 1K Tokens)
const PRICING = {
    input: 0.01,  // GPT-4 input
    output: 0.03  // GPT-4 output
};

/**
 * Rate Limiter für parallele Verarbeitung
 */
class RateLimiter {
    constructor(maxConcurrent = 3) {
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
        if (this.running >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }

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

/**
 * Extrahiert Text aus dem PDF
 */
async function extractPdfText(pdfPath) {
    console.log('📄 Lade PDF...');
    
    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: dataBuffer });
    
    // Nutze getText() Methode - gibt { pages, text, total } zurück
    const result = await parser.getText();
    
    const pageCount = result.pages ? result.pages.length : 0;
    const fullText = result.text || '';
    
    console.log(`✅ PDF geladen: ${pageCount} Seiten`);
    console.log(`📊 Zeichenanzahl: ${fullText.length.toLocaleString()}`);
    
    // Speichere auch die einzelnen Seiten für bessere Batch-Aufteilung
    return { 
        text: fullText, 
        numpages: pageCount,
        pages: result.pages || []
    };
}

/**
 * Teilt den PDF-Text in Seiten auf
 */
function splitIntoPages(pdfData) {
    // Nutze die pages array aus dem PDF-Parser wenn verfügbar
    if (pdfData.pages && pdfData.pages.length > 0) {
        const pages = pdfData.pages.map(page => page.text || page);
        console.log(`📑 ${pages.length} Seiten aus PDF extrahiert`);
        return pages;
    }
    
    // Fallback: Teile nach Formfeed-Zeichen
    let pages = pdfData.text.split('\f');
    
    // Falls keine Formfeeds, teile gleichmäßig auf
    if (pages.length < pdfData.numpages / 2) {
        const charsPerPage = Math.ceil(pdfData.text.length / pdfData.numpages);
        pages = [];
        for (let i = 0; i < pdfData.text.length; i += charsPerPage) {
            pages.push(pdfData.text.substring(i, i + charsPerPage));
        }
    }
    
    console.log(`📑 Text in ${pages.length} Abschnitte aufgeteilt`);
    return pages;
}

/**
 * Parst einen Textabschnitt mit GPT-4 in strukturierte Archiv-Einträge
 */
async function parseTextWithGPT(textContent, batchIndex, totalBatches) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: `Du bist ein Experte für die Digitalisierung historischer Archive.

Deine Aufgabe ist, aus dem OCR-Text einer Inventarseite des Schlatter-Archivs alle Einträge zu extrahieren und in eine strukturierte Datenstruktur zu überführen.

WICHTIGE REGELN:
- Extrahiere ALLE sichtbaren Einträge vollständig
- Halte dich strikt an die vorgegebene Datenstruktur
- **DATUM vs. JAHR**: Das Feld "datum" nur befüllen, wenn ein VOLLSTÄNDIGES Datum (Tag.Monat.Jahr) vorhanden ist, dann normalisiert zu JJJJ-MM-TT. Wenn nur ein Jahr genannt wird, das Feld "datum" LEER lassen und nur "jahr" befüllen.
- **Fehlerhafte Trennungen**: Wenn Wörter durch Zeilenumbrüche getrennt wurden (z.B. "Kauf-\\nmanns"), füge sie wieder zusammen ("Kaufmanns").
- Bei "Dasselbe" übernehme den vorherigen Titel
- Erfasse Untereinträge in der untereintraege-Liste
- Extrahiere beteiligte Personen/Institutionen mit ihren Rollen
- Nutze die typ-ENUMs wo möglich
- Fülle nur Felder aus, die tatsächlich Informationen enthalten
- **rawText**: Speichere den originalen Eintragstext als Plain-Text im Feld "rawText"

Antworte NUR mit validem JSON im angegebenen Format.`
                },
                {
                    role: "user",
                    content: `Extrahiere alle Archiv-Einträge aus folgendem Text (Batch ${batchIndex + 1}/${totalBatches}):

${textContent}

Antworte mit einem JSON-Objekt im Format:
{
  "entries": [
    {
      "teil": "I/II/III/Anhang",
      "sektion": "A/B/C oder römische Zahl",
      "unterabschnitt": "Numerischer Unterabschnitt",
      "unterkategorie": "Falls vorhanden",
      "rawText": "Originaler Eintragstext",
      "nummer": "Archiv-Inventarnummer",
      "titel": "Titel oder Bezeichnung",
      "beschreibung": "Beschreibung falls vorhanden",
      "typ": "Dokumentart (Buch, Brief, Manuskript, etc.)",
      "jahr": 1900,
      "datum": "JJJJ-MM-TT nur bei vollständigem Datum",
      "verlag": "Falls Buch",
      "beteiligte": [
        { "name": "Name", "rolle": "Autor/Herausgeber/Adressat/etc.", "entity": "Person/Institution" }
      ]
    }
  ]
}`
                }
            ],
            temperature: 0.1,
            max_tokens: 4096,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        let parsedData;
        
        try {
            parsedData = JSON.parse(content);
        } catch (parseError) {
            console.error(`   ⚠️ JSON-Parse-Fehler: ${parseError.message}`);
            return { entries: [] };
        }

        // Kosten-Tracking
        const usage = response.usage;
        if (usage) {
            const inputCost = (usage.prompt_tokens / 1000) * PRICING.input;
            const outputCost = (usage.completion_tokens / 1000) * PRICING.output;
            const requestCost = inputCost + outputCost;

            costTracker.totalRequests++;
            costTracker.totalTokens += usage.total_tokens;
            costTracker.totalCost += requestCost;

            costTracker.requests.push({
                batch: batchIndex,
                inputTokens: usage.prompt_tokens,
                outputTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
                cost: requestCost,
                timestamp: new Date().toISOString()
            });

            console.log(`   💰 $${requestCost.toFixed(4)} (${usage.total_tokens} tokens)`);
        }

        return parsedData;

    } catch (error) {
        console.error(`   ❌ Fehler: ${error.message}`);
        return { entries: [] };
    }
}

/**
 * Hauptfunktion
 */
async function runParser() {
    console.log('🚀 Starte PDF-zu-Archiv Parser...\n');
    console.log('='.repeat(60));

    // Prüfe ob PDF existiert
    if (!fs.existsSync(CONFIG.pdfFile)) {
        console.error('❌ PDF-Datei nicht gefunden:', CONFIG.pdfFile);
        process.exit(1);
    }

    // Prüfe API Key
    if (CONFIG.openaiApiKey === 'YOUR_API_KEY_HERE' || !CONFIG.openaiApiKey) {
        console.error('❌ OpenAI API Key nicht konfiguriert!');
        console.log('   Setze die Umgebungsvariable OPENAI_API_KEY oder trage den Key in CONFIG.openaiApiKey ein.');
        process.exit(1);
    }

    try {
        // 1. PDF Text extrahieren
        console.log('\n📖 SCHRITT 1: PDF-Text extrahieren\n');
        const pdfData = await extractPdfText(CONFIG.pdfFile);
        
        // Speichere extrahierten Text für Debugging
        const textOutputPath = path.join(CONFIG.outputDir, 'extracted_text.txt');
        fs.writeFileSync(textOutputPath, pdfData.text, 'utf8');
        console.log(`💾 Extrahierter Text gespeichert: ${textOutputPath}`);
        
        // 2. Text in Abschnitte aufteilen
        console.log('\n📑 SCHRITT 2: Text in Abschnitte aufteilen\n');
        const pages = splitIntoPages(pdfData);
        
        // Erstelle Batches für GPT-Verarbeitung
        const batches = [];
        for (let i = 0; i < pages.length; i += CONFIG.pagesPerBatch) {
            const batchPages = pages.slice(i, i + CONFIG.pagesPerBatch);
            batches.push(batchPages.join('\n\n--- SEITE ---\n\n'));
        }
        
        console.log(`📦 ${batches.length} Batches erstellt (je ${CONFIG.pagesPerBatch} Seiten)\n`);
        
        // 3. Batches mit GPT parsen
        console.log('\n🤖 SCHRITT 3: Einträge mit GPT-4 extrahieren\n');
        
        const rateLimiter = new RateLimiter(CONFIG.maxConcurrent);
        let allEntries = [];
        let processedBatches = 0;
        
        const parsePromises = batches.map((batch, index) =>
            rateLimiter.execute(async () => {
                processedBatches++;
                console.log(`[${processedBatches}/${batches.length}] 📄 Verarbeite Batch ${index + 1}...`);
                
                const result = await parseTextWithGPT(batch, index, batches.length);
                const entries = result.entries || [];
                
                console.log(`   ✅ ${entries.length} Einträge extrahiert\n`);
                
                return entries;
            })
        );
        
        const results = await Promise.all(parsePromises);
        
        // Alle Einträge sammeln
        results.forEach(entries => {
            allEntries = allEntries.concat(entries);
        });
        
        // 4. Einträge sortieren
        console.log('\n🔄 SCHRITT 4: Einträge sortieren\n');
        allEntries.sort((a, b) => {
            // Sortiere nach Teil
            const teilOrder = { 'I': 1, 'II': 2, 'III': 3, 'Anhang': 4 };
            if (a.teil !== b.teil) {
                return (teilOrder[a.teil] || 99) - (teilOrder[b.teil] || 99);
            }
            
            // Sortiere nach Sektion
            if (a.sektion !== b.sektion) {
                return (a.sektion || '').localeCompare(b.sektion || '');
            }
            
            // Sortiere nach Nummer (numerisch wenn möglich)
            const numA = parseInt((a.nummer || '').match(/\d+/)?.[0] || '0');
            const numB = parseInt((b.nummer || '').match(/\d+/)?.[0] || '0');
            return numA - numB;
        });
        
        // 5. JSON speichern
        console.log('\n💾 SCHRITT 5: Ergebnisse speichern\n');
        
        const jsonOutputPath = path.join(CONFIG.outputDir, CONFIG.outputFile);
        fs.writeFileSync(jsonOutputPath, JSON.stringify(allEntries, null, 2), 'utf8');
        console.log(`✅ JSON gespeichert: ${jsonOutputPath}`);
        
        // 6. JavaScript-Modul erstellen
        const jsContent = `// Auto-generiert aus ${path.basename(CONFIG.pdfFile)}
// Generiert am: ${new Date().toISOString()}
// Bitte nicht manuell bearbeiten!

const archivDataV2 = ${JSON.stringify(allEntries, null, 2)};

// Export für verschiedene Module-Systeme
if (typeof module !== 'undefined' && module.exports) {
    module.exports = archivDataV2;
}

// Für direkten Script-Import
if (typeof window !== 'undefined') {
    window.archivDataV2 = archivDataV2;
}
`;
        
        const jsOutputPath = path.join(CONFIG.outputDir, CONFIG.outputFileJS);
        fs.writeFileSync(jsOutputPath, jsContent, 'utf8');
        console.log(`✅ JavaScript-Modul gespeichert: ${jsOutputPath}`);
        
        // 7. Kosten-Log speichern
        const costLog = {
            summary: {
                pdfFile: path.basename(CONFIG.pdfFile),
                totalPages: pdfData.numpages,
                totalBatches: batches.length,
                totalEntries: allEntries.length,
                totalRequests: costTracker.totalRequests,
                totalTokens: costTracker.totalTokens,
                totalCost: costTracker.totalCost,
                processingDate: new Date().toISOString()
            },
            requests: costTracker.requests
        };
        
        const costLogPath = path.join(CONFIG.outputDir, 'parsing_cost_log.json');
        fs.writeFileSync(costLogPath, JSON.stringify(costLog, null, 2), 'utf8');
        console.log(`✅ Kostenlog gespeichert: ${costLogPath}`);
        
        // Zusammenfassung
        console.log('\n' + '='.repeat(60));
        console.log('🎉 PARSING ABGESCHLOSSEN!');
        console.log('='.repeat(60));
        console.log(`📄 PDF-Seiten:        ${pdfData.numpages}`);
        console.log(`📦 Verarbeitete Batches: ${batches.length}`);
        console.log(`📝 Extrahierte Einträge: ${allEntries.length}`);
        console.log(`📊 Gesamt-Requests:   ${costTracker.totalRequests}`);
        console.log(`🔢 Gesamt-Tokens:     ${costTracker.totalTokens.toLocaleString()}`);
        console.log(`💵 Gesamt-Kosten:     $${costTracker.totalCost.toFixed(4)}`);
        console.log('='.repeat(60));
        
        // Zeige Beispiel-Eintrag
        if (allEntries.length > 0) {
            console.log('\n📋 BEISPIEL-EINTRAG (erster im Array):');
            console.log('='.repeat(60));
            console.log(JSON.stringify(allEntries[0], null, 2).substring(0, 800) + '...');
        }
        
    } catch (error) {
        console.error('\n❌ Unerwarteter Fehler:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Starte Parser
runParser();

module.exports = { runParser, parseTextWithGPT };


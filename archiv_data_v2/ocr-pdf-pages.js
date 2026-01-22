#!/usr/bin/env node

/**
 * OCR für PDF-Seiten mit GPT-5-mini Vision
 * Liest alle PNG-Bilder aus pdf_images und führt OCR durch
 * 
 * Ausführung:
 * node ocr-pdf-pages.js
 */

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Konfiguration
const CONFIG = {
    // Output-Ordner
    imagesDir: path.join(__dirname, 'pdf_images'),
    ocrResultsDir: path.join(__dirname, 'ocr_results'),
    
    // OpenAI API Key
    openaiApiKey: process.env.OPENAI_API_KEY || 'YOUR_API_KEY_HERE',
    
    // Pause zwischen API-Calls (ms) um Rate-Limits zu vermeiden
    apiDelay: 500
};

// OpenAI Client
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

// GPT-5-mini Preise
const PRICING = {
    input: 0.00025,   // $0.00025 per 1K input tokens  
    output: 0.002     // $0.002 per 1K output tokens
};

/**
 * Liest alle PNG-Bilder aus dem pdf_images Ordner
 */
function getImageFiles() {
    console.log('📂 Lese Bilder aus pdf_images...\n');
    
    if (!fs.existsSync(CONFIG.imagesDir)) {
        console.error('❌ Ordner pdf_images nicht gefunden!');
        return [];
    }
    
    const files = fs.readdirSync(CONFIG.imagesDir)
        .filter(f => f.endsWith('.png'))
        .sort();
    
    console.log(`✅ ${files.length} Bilder gefunden\n`);
    
    return files;
}

/**
 * Extrahiert Seitenzahl aus Dateiname (z.B. page_029.png -> 29)
 */
function getPageNumber(filename) {
    const match = filename.match(/page_(\d+)\.png/);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * Führt OCR auf einem Bild mit GPT-5-mini Vision durch
 */
async function ocrImage(imagePath, pageNumber) {
    try {
        // Lese Bild als Base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        
        const response = await openai.chat.completions.create({
            model: "gpt-5-mini", 
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Dieses Projekt dient der digitalen Erfassung eines historischen Buchinventars („Schlatter-Archiv").

Das Buch enthält zwei Arten von Seiten:
1. **DATEN-SEITEN**: Enthalten Inventar-Einträge mit Nummern (z.B. "Nr. 142"), Titeln, Verlagen, Jahreszahlen und beschreibenden Texten
2. **ÜBERSICHTS-SEITEN**: Enthalten Inhaltsverzeichnisse, Gliederungen, Abschnittsüberschriften oder andere strukturelle Informationen

WICHTIG: Erkenne automatisch, welcher Typ diese Seite ist!

KRITISCHE WARNUNG VOR DURCHSCHEINEN:
- Bei alten Büchern scheint manchmal Text der nächsten Seite durch das Papier
- Dieser durchscheinende Text erscheint verblasst oder verschwommen
- Er gehört NICHT zu dieser Seite und muss vollständig ignoriert werden

REGELN:
- pageTitle: Erste Zeile/Überschrift der Seite
- pageNumber: Seitenzahl (meist unten, hier sollte circa ${pageNumber} stehen)
- pageContent: Gesamter Seiteninhalt als sauberer Text (kein HTML, nur strukturierter Plaintext)
- pageType: "DATA" für Inventar-Einträge, "OVERVIEW" für Strukturseiten, "OTHER" für sonstiges
- isArchivalListing: true wenn Inventar-Einträge vorhanden, false sonst
- structureInfo: Bei OVERVIEW-Seiten die erkannte Struktur (z.B. "Teil I, Abschnitt A")
- entryCount: Bei DATA-Seiten die ungefähre Anzahl der Einträge auf dieser Seite

Analysiere dieses Bild und extrahiere den vollständigen Text dieser Seite.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/png;base64,${base64Image}`,
                                detail: "high"
                            }
                        }
                    ]
                }
            ],
            tools: [
                {
                    type: "function",
                    function: {
                        name: "extract_page_content",
                        description: "Extrahiert strukturierten Inhalt von einer Archiv-Seite",
                        parameters: {
                            type: "object",
                            properties: {
                                pageTitle: {
                                    type: "string",
                                    description: "Titel/Überschrift der Seite"
                                },
                                pageNumber: {
                                    type: "string",
                                    description: "Seitenzahl (falls vorhanden)"
                                },
                                pageContent: {
                                    type: "string",
                                    description: "Vollständiger Seiteninhalt als strukturierter Plaintext"
                                },
                                pageType: {
                                    type: "string",
                                    enum: ["DATA", "OVERVIEW", "OTHER"],
                                    description: "Typ der Seite: DATA = Inventar-Einträge, OVERVIEW = Strukturseite, OTHER = sonstiges"
                                },
                                isArchivalListing: {
                                    type: "boolean",
                                    description: "True wenn die Seite Inventar-Einträge mit Nummern enthält"
                                },
                                structureInfo: {
                                    type: "string",
                                    description: "Bei OVERVIEW-Seiten: erkannte Strukturinformation (z.B. 'Teil I, Abschnitt A')"
                                },
                                entryCount: {
                                    type: "number",
                                    description: "Bei DATA-Seiten: ungefähre Anzahl der Einträge"
                                },
                                ghostTextDetected: {
                                    type: "boolean",
                                    description: "True wenn durchscheinender Text erkannt und ignoriert wurde"
                                }
                            },
                            required: ["pageTitle", "pageNumber", "pageContent", "pageType", "isArchivalListing"]
                        }
                    }
                }
            ],
            tool_choice: { type: "function", function: { name: "extract_page_content" } }
        });

        // Extrahiere strukturierte Daten
        const toolCall = response.choices[0].message.tool_calls?.[0];
        let result;
        
        if (toolCall && toolCall.function.name === "extract_page_content") {
            result = JSON.parse(toolCall.function.arguments);
        } else {
            result = {
                pageTitle: "",
                pageNumber: String(pageNumber),
                pageContent: response.choices[0].message.content || "",
                pageType: "OTHER",
                isArchivalListing: false,
                structureInfo: "",
                entryCount: 0,
                ghostTextDetected: false
            };
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
                page: pageNumber,
                inputTokens: usage.prompt_tokens,
                outputTokens: usage.completion_tokens,
                cost: requestCost,
                pageType: result.pageType,
                timestamp: new Date().toISOString()
            });
        }
        
        return result;
        
    } catch (error) {
        console.error(`   ❌ OCR-Fehler: ${error.message}`);
        throw error;
    }
}

/**
 * Pause-Helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Hauptfunktion
 */
async function runOCR() {
    console.log('🚀 Starte OCR mit GPT-5-mini Vision\n');
    console.log('='.repeat(60));
    
    // Erstelle Output-Ordner
    if (!fs.existsSync(CONFIG.ocrResultsDir)) {
        fs.mkdirSync(CONFIG.ocrResultsDir, { recursive: true });
    }
    
    try {
        // 1. Lese alle Bilder
        const imageFiles = getImageFiles();
        
        if (imageFiles.length === 0) {
            console.error('❌ Keine Bilder gefunden!');
            process.exit(1);
        }
        
        // 2. OCR für jedes Bild
        console.log('🔍 Starte OCR...\n');
        
        const results = [];
        let skipped = 0;
        
        for (let i = 0; i < imageFiles.length; i++) {
            const imageFile = imageFiles[i];
            const pageNumber = getPageNumber(imageFile);
            const imagePath = path.join(CONFIG.imagesDir, imageFile);
            
            // Prüfe ob Seite bereits erfolgreich verarbeitet wurde
            const outputFile = path.join(CONFIG.ocrResultsDir, `page_${String(pageNumber).padStart(3, '0')}.json`);
            if (fs.existsSync(outputFile)) {
                try {
                    const existingData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
                    // Überspringe nur wenn erfolgreich verarbeitet (kein ERROR, hat Content)
                    if (existingData.pageType !== 'ERROR' && 
                        existingData.pageContent && 
                        existingData.pageContent.length > 10) {
                        skipped++;
                        continue;
                    }
                    // Sonst: Fehlerhafte Datei -> erneut verarbeiten
                    console.log(`   🔄 Wiederhole fehlerhafte Seite ${pageNumber}...`);
                } catch (e) {
                    // JSON-Lesefehler -> erneut verarbeiten
                    console.log(`   🔄 Wiederhole korrupte Datei für Seite ${pageNumber}...`);
                }
            }
            
            console.log(`[${i + 1 - skipped}/${imageFiles.length - skipped}] 📄 Seite ${pageNumber}...`);
            
            try {
                const result = await ocrImage(imagePath, pageNumber);
                
                // Speichere Ergebnis
                const outputFile = path.join(CONFIG.ocrResultsDir, `page_${String(pageNumber).padStart(3, '0')}.json`);
                fs.writeFileSync(outputFile, JSON.stringify({
                    pageNumber,
                    sourceImage: imageFile,
                    ...result,
                    processedAt: new Date().toISOString()
                }, null, 2), 'utf8');
                
                const typeEmoji = result.pageType === 'DATA' ? '📊' : result.pageType === 'OVERVIEW' ? '📋' : '📝';
                const lastCost = costTracker.requests[costTracker.requests.length - 1]?.cost || 0;
                console.log(`   ${typeEmoji} ${result.pageType} | Einträge: ${result.entryCount || 0} | $${lastCost.toFixed(4)}`);
                
                results.push({ pageNumber, ...result });
                
                // Pause um Rate-Limits zu vermeiden
                if (i < imageFiles.length - 1) {
                    await sleep(CONFIG.apiDelay);
                }
                
            } catch (error) {
                console.error(`   ❌ Fehler bei Seite ${pageNumber}: ${error.message}`);
                results.push({
                    pageNumber,
                    pageType: 'ERROR',
                    error: error.message
                });
            }
        }
        
        // 3. Zusammenfassung
        console.log('\n' + '='.repeat(60));
        console.log('🎉 OCR ABGESCHLOSSEN!\n');
        
        if (skipped > 0) {
            console.log(`⏭️  Übersprungen:          ${skipped} (bereits verarbeitet)`);
        }
        
        const dataPages = results.filter(r => r.pageType === 'DATA').length;
        const overviewPages = results.filter(r => r.pageType === 'OVERVIEW').length;
        const otherPages = results.filter(r => r.pageType === 'OTHER').length;
        const errorPages = results.filter(r => r.pageType === 'ERROR').length;
        const totalEntries = results.reduce((sum, r) => sum + (r.entryCount || 0), 0);
        
        console.log(`📄 Verarbeitete Seiten:    ${results.length}`);
        console.log(`📊 Daten-Seiten:           ${dataPages}`);
        console.log(`📋 Übersichts-Seiten:      ${overviewPages}`);
        console.log(`📝 Sonstige Seiten:        ${otherPages}`);
        console.log(`❌ Fehler-Seiten:          ${errorPages}`);
        console.log(`📝 Geschätzte Einträge:    ${totalEntries}`);
        console.log(`💵 Gesamt-Kosten:          $${costTracker.totalCost.toFixed(4)}`);
        console.log(`🔢 Gesamt-Tokens:          ${costTracker.totalTokens.toLocaleString()}`);
        
        // Speichere Zusammenfassung
        const summary = {
            processedAt: new Date().toISOString(),
            statistics: {
                totalPages: results.length,
                dataPages,
                overviewPages,
                otherPages,
                errorPages,
                estimatedEntries: totalEntries
            },
            costs: {
                totalRequests: costTracker.totalRequests,
                totalTokens: costTracker.totalTokens,
                totalCost: costTracker.totalCost
            },
            pages: results.map(r => ({
                pageNumber: r.pageNumber,
                pageType: r.pageType,
                isArchivalListing: r.isArchivalListing,
                entryCount: r.entryCount || 0,
                structureInfo: r.structureInfo || '',
                error: r.error || null
            }))
        };
        
        fs.writeFileSync(
            path.join(CONFIG.ocrResultsDir, 'ocr_summary.json'),
            JSON.stringify(summary, null, 2),
            'utf8'
        );
        
        fs.writeFileSync(
            path.join(CONFIG.ocrResultsDir, 'cost_log.json'),
            JSON.stringify(costTracker, null, 2),
            'utf8'
        );
        
        console.log(`\n💾 Ergebnisse gespeichert in: ${CONFIG.ocrResultsDir}`);
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n❌ Unerwarteter Fehler:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Starte OCR
runOCR();

module.exports = { runOCR, ocrImage };

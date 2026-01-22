/**
 * Bereinigt die Archiv-Daten:
 * 1. Behebt UTF-8/Latin-1 Encoding-Probleme (Mojibake)
 * 2. Markiert ungültige Inventarnummern
 * 3. Sortiert Einträge: gültige Nummern zuerst, dann ungültige
 */

const fs = require('fs');
const path = require('path');

// Mojibake-Korrekturen (UTF-8 falsch als Latin-1 interpretiert)
const encodingFixes = [
    ['Ã¤', 'ä'],
    ['Ã¶', 'ö'],
    ['Ã¼', 'ü'],
    ['Ã„', 'Ä'],
    ['Ã–', 'Ö'],
    ['Ãœ', 'Ü'],
    ['ÃŸ', 'ß'],
    ['Ã©', 'é'],
    ['Ã¨', 'è'],
    ['Ã ', 'à'],
    ['Ã¢', 'â'],
    ['Ã®', 'î'],
    ['Ã´', 'ô'],
    ['Ã»', 'û'],
    ['Ã§', 'ç'],
    ['Ã±', 'ñ'],
    ['Ã³', 'ó'],
    ['Ã­', 'í'],
    ['Ãº', 'ú'],
    ['Ã¡', 'á'],
    ['Â¶', ''],  // Absatzzeichen entfernen
    ['Â§', '§'],
    ['Â»', '»'],
    ['Â«', '«'],
    ['Â°', '°'],
    ['Â´', "'"],
    ['Â½', '½'],
    ['Â¼', '¼'],
    ['Â¾', '¾'],
];

// Ungültige Inventarnummern-Muster
const invalidNumberPatterns = [
    /^Ã?œberschrift$/i,
    /^Überschrift$/i,
    /^note-/i,
    /^kontext-/i,
    /^N\/A$/i,
    /^heading-/i,
    /^section-/i,
    /^-$/,
    /^$/,
];

/**
 * Behebt Encoding-Probleme in einem String
 */
function fixEncoding(str) {
    if (!str || typeof str !== 'string') return str;
    
    let result = str;
    for (const [wrong, correct] of encodingFixes) {
        result = result.split(wrong).join(correct);
    }
    return result;
}

/**
 * Behebt Encoding rekursiv in einem Objekt
 */
function fixEncodingRecursive(obj) {
    if (typeof obj === 'string') {
        return fixEncoding(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => fixEncodingRecursive(item));
    }
    if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = fixEncodingRecursive(value);
        }
        return result;
    }
    return obj;
}

/**
 * Prüft ob eine Inventarnummer gültig ist
 * Gültig: Zahlen, optional mit "/" und weiterer Zahl (z.B. "38/3")
 */
function isValidInventoryNumber(nummer) {
    if (!nummer || typeof nummer !== 'string') return false;
    
    const trimmed = nummer.trim();
    if (!trimmed) return false;
    
    // Prüfe auf ungültige Muster
    for (const pattern of invalidNumberPatterns) {
        if (pattern.test(trimmed)) return false;
    }
    
    // Gültige Formate: "123", "38/3", "1555/1"
    const validPattern = /^\d+(?:\/\d+)?$/;
    return validPattern.test(trimmed);
}

/**
 * Extrahiert numerischen Wert für Sortierung
 */
function getNumericValue(nummer) {
    if (!nummer) return Infinity;
    
    const match = nummer.match(/^(\d+)/);
    if (match) {
        const mainNum = parseInt(match[1], 10);
        // Bei Subnummern wie "38/3" -> 38.003 für korrekte Sortierung
        const subMatch = nummer.match(/\/(\d+)$/);
        if (subMatch) {
            return mainNum + parseInt(subMatch[1], 10) / 1000;
        }
        return mainNum;
    }
    return Infinity;
}

/**
 * Sortierungsfunktion für Archiveinträge
 */
function sortEntries(a, b) {
    const aValid = isValidInventoryNumber(a.nummer);
    const bValid = isValidInventoryNumber(b.nummer);
    
    // Einträge mit gültiger Nummer zuerst
    if (aValid && !bValid) return -1;
    if (!aValid && bValid) return 1;
    
    // Beide gültig: nach Nummer sortieren
    if (aValid && bValid) {
        return getNumericValue(a.nummer) - getNumericValue(b.nummer);
    }
    
    // Beide ungültig: nach Quelldatei (Seitenreihenfolge) sortieren
    const aPage = parseInt((a._quelldatei || '').match(/\d+/)?.[0] || '9999', 10);
    const bPage = parseInt((b._quelldatei || '').match(/\d+/)?.[0] || '9999', 10);
    return aPage - bPage;
}

// Hauptprogramm
console.log('🔧 Starte Datenbereinigung...\n');

// Lade die Original-Daten
const inputPath = path.join(__dirname, '..', 'archiv-data.js');
const content = fs.readFileSync(inputPath, 'utf8');

// Extrahiere das Array aus der JavaScript-Datei
const match = content.match(/const archivData = (\[[\s\S]*\]);/);
if (!match) {
    console.error('Konnte archivData nicht finden!');
    process.exit(1);
}

const data = JSON.parse(match[1]);
console.log(`${data.length} Eintraege geladen`);

// 1. Encoding-Probleme beheben
console.log('\n1. Behebe Encoding-Probleme...');
const fixedData = data.map(entry => fixEncodingRecursive(entry));

// Zaehle Encoding-Fixes
let encodingFixCount = 0;
const checkStr = JSON.stringify(data);
for (const [wrong] of encodingFixes) {
    const regex = new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = checkStr.match(regex);
    if (matches) encodingFixCount += matches.length;
}
console.log(`   ${encodingFixCount} Encoding-Probleme behoben`);

// 2. Ungültige Nummern identifizieren
console.log('\n2. Analysiere Inventarnummern...');
const validEntries = fixedData.filter(e => isValidInventoryNumber(e.nummer));
const invalidEntries = fixedData.filter(e => !isValidInventoryNumber(e.nummer));

console.log(`   ${validEntries.length} Eintraege mit gueltiger Nummer`);
console.log(`   ${invalidEntries.length} Eintraege ohne/mit ungueltiger Nummer`);

// Zeige Beispiele ungültiger Nummern
const uniqueInvalidNumbers = [...new Set(invalidEntries.map(e => e.nummer).filter(Boolean))];
if (uniqueInvalidNumbers.length > 0) {
    console.log('\n   Beispiele ungueltiger Nummern:');
    uniqueInvalidNumbers.slice(0, 10).forEach(n => console.log(`     - "${n}"`));
    if (uniqueInvalidNumbers.length > 10) {
        console.log(`     ... und ${uniqueInvalidNumbers.length - 10} weitere`);
    }
}

// 3. Sortieren
console.log('\n3. Sortiere Eintraege...');
fixedData.sort(sortEntries);
console.log('   Eintraege sortiert (gueltige Nummern zuerst)');

// 4. Speichern
console.log('\n4. Speichere bereinigte Daten...');

const outputContent = `// Auto-generiert aus OCR-Ergebnissen
// Erstellt am: ${new Date().toISOString()}
// Bereinigt: Encoding-Fixes, Sortierung nach Inventarnummer
// Bitte nicht manuell bearbeiten!

const archivData = ${JSON.stringify(fixedData, null, 2)};

// Globale Zuweisung fuer Browser
if (typeof window !== 'undefined') {
    window.archivData = archivData;
}

// Node.js Export
if (typeof module !== 'undefined') {
    module.exports = { archivData };
}
`;

fs.writeFileSync(inputPath, outputContent, 'utf8');
console.log(`   Gespeichert: ${inputPath}`);

// Statistik
console.log('\nZusammenfassung:');
console.log(`   - Eintraege gesamt: ${fixedData.length}`);
console.log(`   - Mit gueltiger Nummer: ${validEntries.length}`);
console.log(`   - Ohne gueltige Nummer: ${invalidEntries.length} (ans Ende sortiert)`);
console.log(`   - Encoding-Fixes: ~${encodingFixCount}`);

console.log('\nFertig!');

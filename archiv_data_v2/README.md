# Archiv Data V2 - PDF Parser

Dieses Verzeichnis enthält Skripte zur Extraktion von Archiv-Einträgen aus dem neuen Schlatter-Archiv Inventar PDF.

## Voraussetzungen

1. Node.js installiert
2. OpenAI API Key

## Installation

```bash
cd archiv_data_v2
npm install
```

## Konfiguration

Setze deinen OpenAI API Key als Umgebungsvariable:

```bash
# Windows PowerShell
$env:OPENAI_API_KEY = "sk-..."

# Windows CMD
set OPENAI_API_KEY=sk-...

# Linux/Mac
export OPENAI_API_KEY="sk-..."
```

Alternativ kannst du den Key direkt in `parse-pdf-to-archiv.js` in der `CONFIG.openaiApiKey` Variable eintragen.

## Verwendung

### PDF parsen

```bash
npm run parse
```

Das Skript:
1. Extrahiert den Text aus dem PDF
2. Teilt den Text in Batches auf
3. Sendet jeden Batch an GPT-4 zur Strukturierung
4. Speichert die Ergebnisse als JSON und JavaScript-Modul

### Output-Dateien

- `extracted_text.txt` - Der reine Text aus dem PDF (für Debugging)
- `archiv_eintraege_v2.json` - Alle Einträge als JSON-Array
- `archiv-data-v2.js` - JavaScript-Modul für den Browser
- `parsing_cost_log.json` - Kosten-Log der API-Anfragen

## Datenformat

Jeder Eintrag hat folgendes Format:

```json
{
  "teil": "I",
  "sektion": "A",
  "unterabschnitt": "1. Wissenschaftlich-theologische Werke",
  "unterkategorie": "Zu Lebzeiten erschienene Bücher",
  "rawText": "Originaler Text des Eintrags",
  "nummer": "1",
  "titel": "Topographie zur Geschichte Palästinas",
  "typ": "Buch",
  "jahr": 1893,
  "verlag": "Calwer Verlag",
  "beteiligte": [
    {
      "name": "Adolf Schlatter",
      "rolle": "Autor",
      "entity": "Person"
    }
  ]
}
```

## Integration in die Website

Nach dem Parsing kann `archiv-data-v2.js` wie folgt verwendet werden:

1. Kopiere die Datei ins Root-Verzeichnis der Website
2. Binde sie in `archiv-interface.html` ein:

```html
<script src="../archiv-data-v2.js"></script>
```

3. Die Daten sind dann über `window.archivDataV2` verfügbar.





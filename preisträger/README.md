# Preisträger Detailseiten

Dieses Verzeichnis enthält die Detailseiten für die Adolf-Schlatter-Preisträger.

## Struktur

- `utils.js` - HTML-Generator-Klasse für alle Detailseiten
- `oliver-gussmann.html` - Beispiel-Seite für Dr. Oliver Gußmann

## Neue Preisträger-Seite erstellen

1. Kopiere `oliver-gussmann.html` und benenne es um (z.B. `michael-braeutigam.html`)
2. Fülle die `preistraegerData` mit den entsprechenden Daten aus
3. Stelle sicher, dass das Bild im `preisträger/` Ordner liegt
4. Teste die Seite lokal

## Datenstruktur

### Pflichtfelder
- `name` - Vollständiger Name
- `location` - Ort/Stadt
- `image` - Pfad zum Bild (relativ zum preisträger Ordner)

### Optionale Felder
- `description` - Kurze Beschreibung
- `tags` - Array von Schwerpunkten
- `biography` - Ausführliche Biografie
- `career` - Array von Berufserfahrungen
- `specializations` - Array von Spezialisierungen
- `contact` - Kontaktdaten (address, phone, website)
- `awards` - Array von Auszeichnungen
- `academic` - Array von akademischen Stationen
- `publications` - Array von Publikationen
- `researchAreas` - Array von Forschungsschwerpunkten

## GitHub Pages Kompatibilität

- Alle Dateien sind statisch und funktionieren ohne Server
- Relative Pfade für Bilder und Scripts
- Keine Server-seitige Verarbeitung erforderlich
- CDN-basierte Abhängigkeiten (Tailwind, FontAwesome)

## Beispiel-Verwendung

```javascript
const preistraegerData = {
    name: "Dr. Max Mustermann",
    location: "Musterstadt",
    image: "../preisträger/mustermann.jpg",
    tags: ["Theologie", "Exegese"],
    biography: "Dr. Mustermann wurde...",
    // ... weitere Daten
};

const builder = new PreistraegerPageBuilder(preistraegerData);
document.body.innerHTML = builder.generatePage();
```

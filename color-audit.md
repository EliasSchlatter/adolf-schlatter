# Farbverwendung im Projekt - Audit

Dieses Dokument sammelt alle Stellen im Projekt, wo Farben verwendet werden.

## 1. Farbpaletten-Definitionen

### 1.1 Hauptpalette (index.html, aboutSchlatter.html, adolfSchlatterPrice.html, pages/preisträger/oliver-gussmann.html, pages/preisträger/utils.js)
```javascript
"primary": "#2C2F48",
"secondary": "#F25C3C", 
"accent": "#E2E6F5",
"text-primary": "#111827" (oder "#FFFFFF" in index.html),
"text-secondary": "#4B5563" (oder "#D1D5DB" in index.html),
"bg-light": "#F9FAFB",
"bg-dark": "#1F2937"
```

**Verwendet in:**
- `index.html` (Zeile 16-23) - mit Varianten für appbar
- `pages/aboutSchlatter.html` (Zeile 16-22)
- `pages/adolfSchlatterPrice.html` (Zeile 15-21)
- `pages/preisträger/oliver-gussmann.html` (Zeile 26-32)
- `pages/preisträger/utils.js` (Zeile 36-42)

### 1.2 Alternative Palette 1 (mehrere Preisträger-Seiten)
```javascript
"primary": "#1a365d",
"secondary": "#2d5a87",
"accent": "#f7fafc",
"text-primary": "#2d3748",
"text-secondary": "#4a5568",
"bg-dark": "#1a202c"
```

**Verwendet in:**
- `pages/preisträger/j-gerrit-hohage.html` (Zeile 26-31)
- `pages/preisträger/werner-neuer.html` (Zeile 26-31)
- `pages/preisträger/roland-deines.html` (Zeile 26-31)
- `pages/preisträger/clemens-hägele.html` (Zeile 26-31)
- `pages/preisträger/ulrich-beuttler.html` (Zeile 26-31)
- `pages/preisträger/michael-bräutigam.html` (Zeile 26-31)

### 1.3 Archiv-Palette (archiv-interface.html)
```javascript
primary: '#2C2F48',
secondary: '#E77C3C',
accent: '#F2F3F5',
'text-primary': '#111827',
'text-secondary': '#4B5563',
'background-light': '#FAFAFA',
'background-dark': '#1E2530',
highlight: '#FCE6D6'
```

**Verwendet in:**
- `pages/archiv-interface.html` (Zeile 25-32)

---

## 2. Hex-Farbwerte im Code

### 2.1 Stammbaum (stammbaum.html)

#### Scrollbar Styles
```css
/* Zeile 25-32 */
background: #f1f1f1;   /* Scrollbar track */
background: #888;      /* Scrollbar thumb */
background: #555;      /* Scrollbar thumb hover */
```

#### SVG Knoten - Männlich
```css
/* Zeile 48-56 */
fill: #EBF3FA;        /* Sehr heller, freundlicher Blauton */
stroke: #4A7BA7;      /* Helleres, freundlicheres Blau */
/* Hover: */
fill: #D6E8F7;        /* Etwas kräftiger beim Hover */
stroke: #2E5A7D;      /* Etwas dunkler beim Hover */
```

#### SVG Knoten - Weiblich
```css
/* Zeile 60-68 */
fill: #FAEBEC;        /* Sehr heller, freundlicher Rosa-Ton */
stroke: #C05B7C;      /* Helleres, freundlicheres Weinrot */
/* Hover: */
fill: #F4D6DA;        /* Etwas kräftiger beim Hover */
stroke: #A0476A;      /* Etwas dunkler beim Hover */
```

#### SVG Knoten - Besonders
```css
/* Zeile 72-81 */
fill: #fef3c7;        /* Gelb-Ton */
stroke: #f59e0b;      /* Orange-Ton */
/* Hover: */
fill: #fde68a;        /* Helleres Gelb beim Hover */
stroke: #d97706;      /* Dunkleres Orange beim Hover */
```

#### SVG Linien und Text
```css
/* Zeile 85-133 */
stroke: #1a365d;      /* Primary Blau aus dem Header - Hauptlinie */
stroke: #9ca3af;      /* Grau - Andere Linien */

fill: #1f2937;        /* Text - Besonders hervorgehoben */
fill: #6b7280;        /* Text - Standard */
fill: #9ca3af;        /* Text - Labels */
fill: #374151;        /* Text - Groß */
```

#### Inline Styles
```html
<!-- Zeile 200 -->
<button style="background-color: #1a365d;">

<!-- Zeile 210 -->
<div style="background-color: #1a365d;"></div>
```

### 2.2 Archiv Interface (archiv-interface.html)

#### CSS Styles
```css
/* Zeile 56 */
background-color: #f3f4f6;

/* Zeile 69, 78 */
background: #F3F4F6;
background: #D1D5DB;

/* Zeile 108, 120 */
border: 2px solid #D1D5DB;

/* Zeile 112, 130, 145, 150 */
border-color: #9CA3AF;
```

#### Tailwind-Klassen mit Hex-Werten
```html
<!-- Zeile 336 -->
<div class="bg-gradient-to-r from-[#E8EAED] to-[#F0F1F3]">

<!-- Zeile 339, 362, 365, 370, 1390, 1517, 1706 -->
<div class="bg-[#1E2530]">
<button class="bg-[#1E2530] hover:bg-[#2D3440]">

<!-- Zeile 1446, 1549, 1683 -->
<div class="bg-[#2D3440]">

<!-- Zeile 1457, 1573 -->
<div class="bg-[#3A4354]">

<!-- Zeile 1515 -->
<section class="bg-[#F0F1F3]">

<!-- Zeile 1388, 1455, 1547 -->
<section class="bg-[#E8EAED]">

<!-- Zeile 1646 -->
<div class="bg-[#4A5568]">

<!-- JavaScript Zeile 2030 -->
color: '#2C2F48'
```

### 2.3 Index.html
```css
/* Zeile 47, 50 */
color: #4B5563 !important;
color: #2C2F48 !important;
```

### 2.4 Components

#### footer.css
```css
/* Zeile 18 */
background-color: #F25C3C !important;
```

### 2.5 Andere Seiten
```css
/* pages/adolfSchlatterPrice.html, aboutSchlatter.html, index.html */
/* Zeile 51-52, 53, 64 */
outline: 2px solid #3F20FB;
background-color: rgba(63, 32, 251, 0.1);
```

---

## 3. RGB/RGBA-Farbwerte

### 3.1 Archiv Interface (archiv-interface.html)

#### Box Shadows
```css
/* Zeile 106, 113, 125, 131 */
box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);
box-shadow: 0 2px 6px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);

/* Zeile 146, 151 */
box-shadow: 0 0 0 3px rgba(209, 213, 219, 0.3);
```

#### Inline Background Colors
```html
<!-- Zeile 396, 548, 591, 634 -->
<div style="background-color: rgb(30 37 48);">

<!-- Zeile 409, 457, 505, 645, 560-621 (wiederholt) -->
<div style="background-color: rgb(45 52 64);">
onmouseover="this.style.backgroundColor='rgb(55 62 74)'"
onmouseout="this.style.backgroundColor='rgb(45 52 64)'"
```

### 3.2 Stammbaum (stammbaum.html)

#### Drop Shadows
```css
/* Zeile 42 */
filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));

/* Zeile 56 */
filter: drop-shadow(0 8px 15px rgba(74, 123, 167, 0.3));

/* Zeile 68 */
filter: drop-shadow(0 8px 15px rgba(192, 91, 124, 0.3));

/* Zeile 81 */
filter: drop-shadow(0 8px 15px rgba(245, 158, 11, 0.4));
```

### 3.3 Components - appbar.css

#### Gradient Backgrounds
```css
/* Zeile 33, 37 */
background: linear-gradient(to bottom right, rgba(26, 54, 93, 0.2), rgba(26, 32, 44, 0.2));
background: linear-gradient(to bottom right, rgba(26, 54, 93, 0.1), rgba(26, 32, 44, 0.2));

/* Zeile 41, 45 */
background: linear-gradient(to bottom right, rgba(45, 90, 135, 0.2), rgba(26, 54, 93, 0.2));
background: linear-gradient(to bottom right, rgba(45, 90, 135, 0.1), rgba(26, 54, 93, 0.2));

/* Zeile 49, 53 */
background: linear-gradient(to bottom right, rgba(247, 250, 252, 0.3), rgba(26, 54, 93, 0.2));
background: linear-gradient(to bottom right, rgba(247, 250, 252, 0.2), rgba(45, 90, 135, 0.2));

/* Zeile 72, 77 */
background: rgba(26, 54, 93, 0.2);
background: rgba(26, 54, 93, 0.3);
```

---

## 4. JavaScript Inline-Styles

### 4.1 Stammbaum (stammbaum.html)
```javascript
// Zeile 1006, 1028
this.style.backgroundColor = '#1a365d';
```

### 4.2 Archiv Interface (archiv-interface.html)
```javascript
// Zeile 560-621 (mehrfach)
onmouseover="this.style.backgroundColor='rgb(55 62 74)'"
onmouseout="this.style.backgroundColor='rgb(45 52 64)'"
```

---

## 5. Zusammenfassung der verwendeten Farben

### Primärfarben (häufig verwendet)
- `#2C2F48` - Dunkles Blau-Grau (Primary in Hauptpalette)
- `#F25C3C` / `#E77C3C` - Orange (Secondary)
- `#1a365d` - Dunkles Navy-Blau (Alternative Primary)

### Sekundärfarben
- `#E2E6F5` / `#F2F3F5` - Sehr helles Grau-Blau (Accent)
- `#1E2530` - Sehr dunkles Blau-Grau (Background Dark)
- `#2D3440` - Dunkelgrau (Hover-States)

### Textfarben
- `#111827` - Fast schwarz (Primary Text)
- `#4B5563` - Mittelgrau (Secondary Text)
- `#6b7280` / `#9ca3af` - Hellgrau (Labels, disabled)

### Hintergrundfarben
- `#F9FAFB` / `#FAFAFA` - Fast weiß (Background Light)
- `#f3f4f6` / `#F3F4F6` - Sehr helles Grau
- `#1F2937` - Dunkelgrau (Background Dark)

### SVG/Graph Farben (Stammbaum)
- **Männlich:** `#EBF3FA`, `#4A7BA7`, `#D6E8F7`, `#2E5A7D`
- **Weiblich:** `#FAEBEC`, `#C05B7C`, `#F4D6DA`, `#A0476A`
- **Besonders:** `#fef3c7`, `#f59e0b`, `#fde68a`, `#d97706`

### Grautöne (Borders, Dividers)
- `#D1D5DB` - Helles Grau
- `#9CA3AF` - Mittelgrau
- `#888`, `#555` - Scrollbar Grautöne

### Spezialfarben
- `#3F20FB` - Lila (Focus-Outlines)
- `#FCE6D6` - Helles Beige (Highlight)

---

## 6. Empfehlungen für Zentralisierung

1. **CSS Custom Properties erstellen** für alle Hauptfarben
2. **Farbpalette vereinheitlichen** - es gibt derzeit mindestens 3 verschiedene Paletten
3. **RGB-Werte standardisieren** - viele Farben werden sowohl als Hex als auch RGB definiert
4. **Inline-Styles ersetzen** durch CSS-Klassen oder Custom Properties
5. **JavaScript-Farbmanipulation** über CSS-Variablen steuern
6. **Drop-Shadow und Box-Shadow Werte** zentralisieren



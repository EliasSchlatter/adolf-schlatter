/**
 * timeline-i18n.js – Sprachschicht für die Biographie-Timeline
 * (pages/schlatter_timeline.html).
 *
 * Die Timeline ist datengetrieben (window.timelineData aus timeline-data.js,
 * auto-generiert – NICHT editieren). Übersetzungen liegen deshalb in getrennten
 * Side-Car-Dateien, die hier eingemischt werden – die Originaldaten bleiben
 * unangetastet:
 *
 *   - window.TIMELINE_LABELS_EN  (aus components/timeline-labels-en.js)
 *       Wörterbuch für die ENDLICHEN Label-Mengen: Kapitel-/Abschnittstitel und
 *       Kategorie-Tags. Form: { "Deutsches Label": "English label", ... }
 *
 *   - window.timelineDataEn      (aus components/timeline-data-en.js)
 *       Prosa-Übersetzungen je Ereignis, verschlüsselt über den fortlaufenden
 *       Index in exakt der Reihenfolge, in der der Renderer die Ereignisse
 *       flacht (data.timeline[].events[] von oben nach unten).
 *       Form: { "0": { title_en, text_en }, "1": { ... }, ... }
 *
 * Namen (Personen/Orte/Institutionen), Werktitel, Daten, Jahre und
 * Inventarnummern bleiben IMMER deutsch – der Renderer nutzt die Originalfelder.
 * Fehlt eine Übersetzung, wird automatisch Deutsch angezeigt (Fallback,
 * niemals leer).
 */
(function () {
    /**
     * Mischt die Prosa-Übersetzungen (window.timelineDataEn) per fortlaufendem
     * Index in die Ereignisse ein (als title_en / text_en). Idempotent.
     * Die Walk-Reihenfolge MUSS identisch zur Flatten-Logik des Renderers sein.
     */
    function mergeTimelineTranslations() {
        if (!window.timelineData || !window.timelineDataEn) return;
        const timeline = window.timelineData.timeline || [];
        let i = 0;
        timeline.forEach(yearData => {
            (yearData.events || []).forEach(event => {
                const tr = window.timelineDataEn[i++];
                if (!tr) return;
                if (tr.title_en) event.title_en = tr.title_en;
                if (tr.text_en) event.text_en = tr.text_en;
            });
        });
    }

    /**
     * Übersetzt ein endliches Label (Kapitel-/Abschnittstitel, Kategorie-Tag).
     * Fällt bei fehlender Übersetzung oder im Deutsch-Modus auf den Originalwert
     * zurück.
     * @param {string} value
     */
    function LBL(value) {
        if (!value) return value;
        if (window.I18N && window.I18N.lang === 'en' && window.TIMELINE_LABELS_EN) {
            return window.TIMELINE_LABELS_EN[value] || value;
        }
        return value;
    }

    /**
     * Wählt ein Prosa-Feld (title/text) sprachabhängig; Fallback = Deutsch.
     * @param {Object} entry
     * @param {string} field  z. B. "title" oder "text"
     */
    function TXT(entry, field) {
        if (!entry) return '';
        if (window.I18N && window.I18N.lang === 'en' && entry[field + '_en']) {
            return entry[field + '_en'];
        }
        return entry[field] || '';
    }

    window.TimelineI18N = { mergeTimelineTranslations, LBL, TXT };
})();

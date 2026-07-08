/**
 * archiv-i18n.js – Sprachschicht für das Archiv (archiv-interface.html).
 *
 * Das Archiv ist datengetrieben (window.archivData, auto-generiert – NICHT editieren).
 * Übersetzungen liegen deshalb in getrennten Side-Car-Dateien, die hier eingemischt
 * werden – die Originaldaten bleiben unangetastet:
 *
 *   - window.ARCHIV_LABELS_EN  (aus components/archiv-labels-en.js)
 *       Wörterbuch für die ENDLICHEN Label-Mengen: teil, sektion, unterabschnitt,
 *       unterkategorie, typ, rolle. Form: { "Deutsches Label": "English label", ... }
 *
 *   - window.archivDataEn      (aus components/archiv-data-en.js)
 *       Prosa-Übersetzungen je Eintrag, verschlüsselt über den kanonischen
 *       DFS-Index (siehe walkArchiv). Form: { "0": { beschreibung_en, anmerkung_en }, ... }
 *
 * Titel, rawText, Namen (name/entity), Verlag, Ort, Daten, Inventarnummern bleiben
 * IMMER deutsch (keine Übersetzung – der Renderer nutzt die Originalfelder direkt).
 */
(function () {
    /**
     * Kanonischer, deterministischer DFS-Walk über die Archivdaten.
     * MUSS identisch zur Extraktion sein, mit der die Side-Car-Indizes erzeugt werden:
     * jeder Eintrag bekommt einen fortlaufenden Index, danach werden seine
     * untereintraege in Reihenfolge besucht.
     * @param {Array} data
     * @param {(entry:Object, index:number)=>void} cb
     */
    function walkArchiv(data, cb) {
        let i = 0;
        const rec = (arr) => {
            for (const entry of arr) {
                cb(entry, i++);
                if (Array.isArray(entry.untereintraege)) rec(entry.untereintraege);
            }
        };
        rec(data || []);
        return i;
    }

    /**
     * Mischt die Prosa-Übersetzungen (window.archivDataEn) per DFS-Index in die
     * Einträge ein (als beschreibung_en / anmerkung_en). Idempotent.
     */
    function mergeArchivTranslations() {
        if (!window.archivData || !window.archivDataEn) return;
        walkArchiv(window.archivData, (entry, index) => {
            const tr = window.archivDataEn[index];
            if (!tr) return;
            if (tr.beschreibung_en) entry.beschreibung_en = tr.beschreibung_en;
            if (tr.anmerkung_en) entry.anmerkung_en = tr.anmerkung_en;
        });
    }

    /**
     * Übersetzt ein endliches Label (typ/rolle/Kategorie). Fällt bei fehlender
     * Übersetzung oder im Deutsch-Modus auf den Originalwert zurück.
     * @param {string} value
     */
    function AL(value) {
        if (!value) return value;
        if (window.I18N && window.I18N.lang === 'en' && window.ARCHIV_LABELS_EN) {
            return window.ARCHIV_LABELS_EN[value] || value;
        }
        return value;
    }

    /**
     * Wählt Prosa (beschreibung/anmerkung) sprachabhängig; Fallback = Deutsch.
     * @param {Object} entry
     * @param {string} field  z. B. "beschreibung"
     */
    function AText(entry, field) {
        if (!entry) return '';
        if (window.I18N && window.I18N.lang === 'en' && entry[field + '_en']) {
            return entry[field + '_en'];
        }
        return entry[field] || '';
    }

    window.ArchivI18N = { walkArchiv, mergeArchivTranslations, AL, AText };
})();

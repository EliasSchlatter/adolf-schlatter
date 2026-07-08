/**
 * i18n.js – Zentrale Sprachumschaltung (DE/EN) für die gesamte Seite.
 *
 * Funktionsweise:
 *  - Statische Texte im HTML werden inline annotiert:
 *      <h1 data-en="Life and Work">Leben und Werk</h1>
 *    Das deutsche Original bleibt der sichtbare Default. Beim Umschalten auf EN
 *    wird der textContent durch data-en ersetzt (und wieder zurück).
 *  - Attribute werden über data-en-<attr> übersetzt, z. B.
 *      <input data-en-placeholder="Search…" placeholder="Suchen…">
 *      <meta name="description" data-en-content="...">
 *  - Für Texte mit Inline-Markup: data-en-html="..." ersetzt innerHTML.
 *  - Dynamisch eingefügte Komponenten (Appbar, Footer) werden automatisch
 *    über einen MutationObserver mitübersetzt.
 *  - Datengetriebene Views (Timeline, Archiv, Galerie) nutzen I18N.t(de, en)
 *    und lauschen auf das Event 'i18n:change', um neu zu rendern.
 *
 * Eigennamen und Werktitel werden NICHT annotiert und bleiben dadurch deutsch.
 */
(function () {
    const STORAGE_KEY = 'site-lang';
    const DEFAULT_LANG = 'de';
    const LANGS = ['de', 'en'];

    function getStoredLang() {
        try {
            const v = localStorage.getItem(STORAGE_KEY);
            return v === 'en' || v === 'de' ? v : DEFAULT_LANG;
        } catch (e) {
            return DEFAULT_LANG;
        }
    }

    // Für SEO ist die URL maßgeblich: ?lang=en ergibt eine eigene, indexierbare
    // englische Adresse. Reihenfolge: URL-Parameter > gespeicherte Wahl > Deutsch.
    function getUrlLang() {
        try {
            const v = new URLSearchParams(window.location.search).get('lang');
            return v === 'en' || v === 'de' ? v : null;
        } catch (e) {
            return null;
        }
    }

    function resolveInitialLang() {
        const urlLang = getUrlLang();
        if (urlLang) {
            try { localStorage.setItem(STORAGE_KEY, urlLang); } catch (e) {}
            return urlLang;
        }
        return getStoredLang();
    }

    const I18N = {
        lang: resolveInitialLang(),

        /** Übersetzungs-Helfer für JS-Strings (Renderer). */
        t(de, en) {
            return this.lang === 'en' && en != null ? en : de;
        },

        /**
         * Wendet die aktuelle Sprache auf alle annotierten Elemente unter `root` an.
         */
        applyTo(root) {
            root = root || document;
            const en = this.lang === 'en';

            // 1) Textinhalt: [data-en]
            const textNodes = root.querySelectorAll('[data-en]');
            textNodes.forEach((el) => {
                if (el.getAttribute('data-de') === null) {
                    el.setAttribute('data-de', el.textContent);
                }
                el.textContent = en ? el.getAttribute('data-en') : el.getAttribute('data-de');
            });

            // 2) innerHTML: [data-en-html]
            const htmlNodes = root.querySelectorAll('[data-en-html]');
            htmlNodes.forEach((el) => {
                if (el.getAttribute('data-de-html') === null) {
                    el.setAttribute('data-de-html', el.innerHTML);
                }
                el.innerHTML = en ? el.getAttribute('data-en-html') : el.getAttribute('data-de-html');
            });

            // 3) Attribute: [data-en-<attr>] (außer html, das oben behandelt wird)
            const attrNodes = root.querySelectorAll('[data-en-placeholder],[data-en-title],[data-en-alt],[data-en-aria-label],[data-en-content],[data-en-value]');
            attrNodes.forEach((el) => {
                for (const attr of Array.from(el.attributes)) {
                    if (!attr.name.startsWith('data-en-') || attr.name === 'data-en-html') continue;
                    const target = attr.name.slice('data-en-'.length).replace(/-/g, '-');
                    const realAttr = target === 'aria-label' ? 'aria-label' : target;
                    const backup = 'data-de-' + target;
                    if (el.getAttribute(backup) === null) {
                        el.setAttribute(backup, el.getAttribute(realAttr) || '');
                    }
                    el.setAttribute(realAttr, en ? attr.value : el.getAttribute(backup));
                }
            });

            // Aktuelle Sprache anzeigen (Umschalter zeigt den aktuellen Zustand)
            const FLAGS = { de: '🇩🇪', en: '🇬🇧' };
            root.querySelectorAll('[data-lang-current]').forEach((el) => {
                el.textContent = this.lang.toUpperCase();
            });
            root.querySelectorAll('[data-lang-flag]').forEach((el) => {
                el.textContent = FLAGS[this.lang] || '';
            });
            // Aktive Sprachoption im Dropdown markieren + crawlbare href je Sprache
            root.querySelectorAll('[data-lang-set]').forEach((btn) => {
                const target = btn.getAttribute('data-lang-set');
                const active = target === this.lang;
                btn.setAttribute('aria-selected', active ? 'true' : 'false');
                const check = btn.querySelector('[data-lang-check]');
                if (check) check.classList.toggle('hidden', !active);
                // Wenn die Option ein Link ist: echte, indexierbare Sprach-URL setzen
                if (btn.tagName === 'A') btn.setAttribute('href', this.buildLangUrl(target));
            });
            // Rückwärtskompatibilität: alter Toggle-Button (zeigt Zielsprache)
            root.querySelectorAll('[data-lang-toggle] [data-lang-label]').forEach((label) => {
                label.textContent = en ? 'DE' : 'EN';
            });
        },

        /**
         * Baut die (absolute) URL der aktuellen Seite für eine bestimmte Sprache.
         * Deutsch = saubere URL (kein Parameter), Englisch = ?lang=en.
         */
        buildLangUrl(lang) {
            const url = new URL(window.location.href);
            url.searchParams.delete('lang');
            if (lang === 'en') url.searchParams.set('lang', 'en');
            return url.origin + url.pathname + (url.search ? url.search : '') + url.hash;
        },

        /**
         * Pflegt die SEO-Tags: selbstreferenzierendes canonical je Sprache,
         * hreflang-Alternates (de/en/x-default) und og:locale/og:url. Idempotent.
         */
        updateSeoTags() {
            const head = document.head;
            if (!head) return;
            const deUrl = this.buildLangUrl('de');
            const enUrl = this.buildLangUrl('en');
            const selfUrl = this.lang === 'en' ? enUrl : deUrl;

            const upsertLink = (id, rel, hreflang, href) => {
                // Vorhandenes (auch statisch im HTML gesetztes) Tag wiederverwenden,
                // damit keine Duplikate entstehen.
                let el = hreflang
                    ? head.querySelector('link[rel="alternate"][hreflang="' + hreflang + '"]')
                    : null;
                if (!el) el = head.querySelector('[data-i18n-seo="' + id + '"]');
                if (!el) {
                    el = document.createElement('link');
                    el.setAttribute('data-i18n-seo', id);
                    head.appendChild(el);
                }
                el.setAttribute('rel', rel);
                if (hreflang) el.setAttribute('hreflang', hreflang); else el.removeAttribute('hreflang');
                el.setAttribute('href', href);
            };
            // canonical: vorhandenes Tag wiederverwenden (kein konkurrierendes Duplikat)
            let canon = head.querySelector('link[rel="canonical"]');
            if (!canon) {
                canon = document.createElement('link');
                canon.setAttribute('rel', 'canonical');
                canon.setAttribute('data-i18n-seo', 'canonical');
                head.appendChild(canon);
            }
            canon.setAttribute('href', selfUrl);
            upsertLink('alt-de', 'alternate', 'de', deUrl);
            upsertLink('alt-en', 'alternate', 'en', enUrl);
            upsertLink('alt-x', 'alternate', 'x-default', deUrl);

            const upsertMeta = (prop, content) => {
                let el = head.querySelector('meta[property="' + prop + '"]');
                if (!el) {
                    el = document.createElement('meta');
                    el.setAttribute('property', prop);
                    head.appendChild(el);
                }
                el.setAttribute('content', content);
            };
            upsertMeta('og:locale', this.lang === 'en' ? 'en_GB' : 'de_DE');
            upsertMeta('og:url', selfUrl);
        },

        /** Setzt die Sprache, speichert sie und aktualisiert die gesamte Seite. */
        setLang(lang, opts) {
            this.lang = lang === 'en' ? 'en' : 'de';
            try { localStorage.setItem(STORAGE_KEY, this.lang); } catch (e) {}
            document.documentElement.lang = this.lang;
            // URL an die Sprache anpassen (eigene, teilbare/indexierbare Adresse)
            if (!(opts && opts.skipUrl)) {
                try {
                    window.history.replaceState(null, '', this.buildLangUrl(this.lang));
                } catch (e) {}
            }
            this.applyTo(document);
            this.updateSeoTags();
            window.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: this.lang } }));
        },

        toggle() {
            this.setLang(this.lang === 'en' ? 'de' : 'en');
        }
    };

    window.I18N = I18N;

    // Klick-Delegation für Sprach-Umschalter (funktioniert auch für später
    // eingefügte Buttons in Appbar/Footer).
    document.addEventListener('click', (e) => {
        // Gezielte Sprachwahl über Dropdown-Option
        const setBtn = e.target.closest('[data-lang-set]');
        if (setBtn) {
            e.preventDefault();
            I18N.setLang(setBtn.getAttribute('data-lang-set'));
            return;
        }
        // Rückwärtskompatibilität: alter Toggle-Button
        const btn = e.target.closest('[data-lang-toggle]');
        if (btn) {
            e.preventDefault();
            I18N.toggle();
        }
    });

    // Beim ersten Laden das <html lang> setzen und – falls EN gewählt ist –
    // bereits vorhandenes DOM übersetzen.
    document.documentElement.lang = I18N.lang;
    function initialApply() { I18N.applyTo(document); I18N.updateSeoTags(); }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialApply);
    } else {
        initialApply();
    }

    // Dynamisch eingefügte Knoten (Appbar, Footer, gerenderte Listen) automatisch
    // übersetzen, wenn eine andere Sprache als Deutsch aktiv ist.
    const observer = new MutationObserver((mutations) => {
        if (I18N.lang === DEFAULT_LANG) return;
        for (const m of mutations) {
            m.addedNodes.forEach((node) => {
                if (node.nodeType !== 1) return;
                if (node.matches && node.matches('[data-en],[data-en-html],[data-en-placeholder],[data-en-title],[data-en-alt],[data-en-aria-label],[data-en-content],[data-en-value],[data-lang-toggle]')) {
                    I18N.applyTo(node.parentNode || node);
                } else if (node.querySelector && node.querySelector('[data-en],[data-en-html],[data-lang-toggle]')) {
                    I18N.applyTo(node);
                }
            });
        }
    });
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
})();

/**
 * seo.js – Strukturierte Daten (JSON-LD).
 *
 * Injiziert je nach Seite und aktueller Sprache:
 *   - Organization (Stiftung) + WebSite   (alle Seiten)
 *   - Person Adolf Schlatter              (Seite „Über Schlatter")
 *   - Person Preisträger                  (Preisträger-Detailseiten)
 *
 * Alles wird bei Sprachwechsel (i18n:change) und nach dem Einfügen der Appbar
 * (appbar:inserted) neu aufgebaut. Idempotent (vorher markierte Elemente werden
 * entfernt). Eigennamen/Daten bleiben sprachneutral, nur beschreibende Texte
 * werden lokalisiert.
 */
(function () {
    const ORIGIN = window.location.origin && window.location.origin !== 'null'
        ? window.location.origin
        : 'https://adolf-schlatter-stiftung.de';
    const HOME = ORIGIN + '/';

    function t(de, en) { return window.I18N ? window.I18N.t(de, en) : de; }
    function lang() { return window.I18N ? window.I18N.lang : 'de'; }

    function basename() {
        const parts = window.location.pathname.split('/').filter(Boolean);
        return parts.length ? parts[parts.length - 1] : 'index.html';
    }
    function isPreistraeger() { return window.location.pathname.includes('/preis'); }
    function currentAbsUrl() {
        // Kanonische (deutsche) Adresse der Seite ohne lang-Parameter
        return ORIGIN + window.location.pathname;
    }

    function laureateName() {
        // Titel-Format des Builders: "<Name> - Adolf Schlatter Preis"
        const title = document.title || '';
        return title.split(' - ')[0].trim() || 'Preisträger';
    }

    // ---- JSON-LD ----
    function injectJsonLd(id, obj) {
        const s = document.createElement('script');
        s.type = 'application/ld+json';
        s.setAttribute('data-seo', id);
        s.textContent = JSON.stringify(obj);
        document.head.appendChild(s);
    }

    function organization() {
        return {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Adolf Schlatter Stiftung',
            url: HOME,
            logo: ORIGIN + '/images/SchlatterHeader.png',
            foundingDate: '2002',
            description: t(
                'Die Adolf Schlatter Stiftung fördert seit 2002 die wissenschaftliche Theologie und würdigt herausragende Arbeiten im Geiste Adolf Schlatters.',
                'Since 2002 the Adolf Schlatter Foundation has advanced academic theology and honoured outstanding work in the spirit of Adolf Schlatter.'
            )
        };
    }

    function website() {
        return {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Adolf Schlatter Stiftung',
            url: HOME,
            inLanguage: lang()
        };
    }

    function personSchlatter() {
        return {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Adolf Schlatter',
            givenName: 'Adolf',
            familyName: 'Schlatter',
            birthDate: '1852-08-16',
            deathDate: '1938-05-19',
            birthPlace: { '@type': 'Place', name: 'St. Gallen' },
            deathPlace: { '@type': 'Place', name: 'Tübingen' },
            jobTitle: t('Theologe', 'Theologian'),
            description: t(
                'Schweizer evangelischer Theologe und Neutestamentler, Professor in Bern, Greifswald, Berlin und Tübingen.',
                'Swiss Protestant theologian and New Testament scholar; professor in Bern, Greifswald, Berlin and Tübingen.'
            ),
            sameAs: [
                'https://de.wikipedia.org/wiki/Adolf_Schlatter',
                'https://en.wikipedia.org/wiki/Adolf_Schlatter'
            ]
        };
    }

    function personLaureate() {
        return {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: laureateName(),
            url: currentAbsUrl(),
            award: 'Adolf-Schlatter-Preis'
        };
    }

    // ---- Aufbau / Neuaufbau ----
    function clearInjected() {
        document.querySelectorAll('script[data-seo]').forEach(function (el) { el.remove(); });
    }

    function run() {
        if (!document.head || !document.body) return;
        clearInjected();
        // evtl. früher eingefügte Breadcrumb-Leiste entfernen
        const oldBc = document.getElementById('i18n-breadcrumb');
        if (oldBc) oldBc.remove();
        injectJsonLd('org', organization());
        injectJsonLd('website', website());
        if (basename() === 'aboutSchlatter.html') injectJsonLd('person', personSchlatter());
        if (isPreistraeger()) injectJsonLd('person', personLaureate());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
    // Nach Appbar-Einfügung (auch nach Preisträger-Neuaufbau) und bei Sprachwechsel
    window.addEventListener('appbar:inserted', run);
    window.addEventListener('i18n:change', run);

    window.SEO = { run: run };
})();

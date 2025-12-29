    /**
 * Appbar Utils - Zentrale Verwaltung der Appbar für alle Seiten
 */
class AppbarManager {
    constructor() {
        this.appbarHTML = this.generateAppbarHTML();
        // Google Analytics sofort beim Laden der Klasse initialisieren
        this.loadGoogleAnalytics();
        // Cookie Manager sofort beim Laden der Klasse initialisieren
        this.loadCookieManager();
    }

    /**
     * Ermittelt die korrekten Pfade basierend auf dem aktuellen Verzeichnis
     */
    getPathPrefix() {
        const path = window.location.pathname;
        // Von pages/preisträger/ (zwei Ebenen tief)
        if (path.includes('/preis')) {
            return '../../';
        }
        // Von pages/ Unterseiten (eine Ebene tief)
        if (path.includes('/pages/')) {
            return '../';
        }
        // Von Root
        return './';
    }

    /**
     * Ermittelt den korrekten Pfad für Bilder
     */
    getImagePrefix() {
        const path = window.location.pathname;
        // Von pages/preisträger/ (zwei Ebenen tief)
        if (path.includes('/preis')) {
            return '../../images/';
        }
        // Von pages/ (eine Ebene tief)
        if (path.includes('/pages/')) {
            return '../images/';
        }
        // Von Root
        return './images/';
    }

    /**
     * Lädt Google Analytics global
     */
    loadGoogleAnalytics() {
        // Prüfen ob Google Analytics bereits geladen wurde
        if (window.gtag) {
            return;
        }

        // Google Analytics sofort initialisieren (vor Script-Load)
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        
        // Cookie Consent für Google Analytics
        gtag('consent', 'default', {
            'analytics_storage': 'denied'
        });
        
        gtag('config', 'G-S1FQPW2481');

        // Google Analytics Script laden
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-S1FQPW2481';
        document.head.appendChild(script);
    }

    /**
     * Lädt Cookie Manager global
     */
    loadCookieManager() {
        // Prüfen ob Cookie Manager bereits geladen wurde
        if (window.cookieManager) {
            return;
        }

        // Cookie Manager Funktionalität direkt hier implementieren
        this.initializeCookieManager();
    }

    /**
     * Initialisiert den Cookie Manager
     */
    initializeCookieManager() {
        this.consentGiven = this.getStoredConsent();
        this.analyticsEnabled = this.consentGiven !== 'declined';
        
        // Debug: Log current consent status
        console.log('Cookie consent status:', this.consentGiven);
        
        // Load cookie banner if no consent stored
        if (!this.consentGiven) {
            console.log('Loading cookie banner...');
            this.loadCookieBanner();
        } else {
            console.log('Consent already given:', this.consentGiven);
            // Analytics already enabled/disabled based on stored consent
            this.updateAnalyticsState();
        }
    }

    /**
     * Load cookie banner HTML
     */
    loadCookieBanner() {
        console.log('Creating cookie banner...');
        
        // Cookie Banner HTML direkt hier definieren
        const bannerHTML = `
        <div id="cookie-banner" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 transform translate-y-full transition-transform duration-300">
            <div class="max-w-7xl mx-auto px-6 py-4">
                <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div class="flex-1">
                        <h3 class="font-semibold text-primary mb-2">🍪 Cookies</h3>
                        <p class="text-sm text-gray-700">
                            Diese Website verwendet Cookies, um Ihnen die bestmögliche Erfahrung zu bieten. 
                            <a href="pages/datenschutz.html" class="text-secondary hover:text-orange-600 transition-colors underline">Weitere Informationen</a>
                        </p>
                    </div>
                    <div class="flex gap-3">
                        <button id="cookie-decline" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg">
                            Ablehnen
                        </button>
                        <button id="cookie-accept" class="px-4 py-2 text-sm bg-secondary text-white hover:bg-orange-600 transition-colors rounded-lg">
                            Akzeptieren
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', bannerHTML);
        this.initializeBannerEvents();
        this.showBanner();
    }

    /**
     * Initialize banner event listeners
     */
    initializeBannerEvents() {
        const acceptBtn = document.getElementById('cookie-accept');
        const declineBtn = document.getElementById('cookie-decline');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                this.acceptCookies();
                this.hideBanner();
            });
        }

        if (declineBtn) {
            declineBtn.addEventListener('click', () => {
                this.declineCookies();
                this.hideBanner();
            });
        }
    }

    /**
     * Show cookie banner
     */
    showBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            setTimeout(() => {
                banner.classList.remove('translate-y-full');
            }, 100);
        }
    }

    /**
     * Hide cookie banner
     */
    hideBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.classList.add('translate-y-full');
            setTimeout(() => {
                banner.remove();
            }, 300);
        }
    }

    /**
     * Accept cookies
     */
    acceptCookies() {
        this.setStoredConsent('accepted');
        this.consentGiven = 'accepted';
        this.analyticsEnabled = true;
        this.updateAnalyticsState();
    }

    /**
     * Decline cookies
     */
    declineCookies() {
        this.setStoredConsent('declined');
        this.consentGiven = 'declined';
        this.analyticsEnabled = false;
        this.updateAnalyticsState();
    }

    /**
     * Get stored consent
     */
    getStoredConsent() {
        return localStorage.getItem('cookie-consent');
    }

    /**
     * Set stored consent
     */
    setStoredConsent(consent) {
        localStorage.setItem('cookie-consent', consent);
    }

    /**
     * Update Google Analytics state based on consent
     */
    updateAnalyticsState() {
        if (this.analyticsEnabled) {
            // Enable Google Analytics
            if (window.gtag) {
                window.gtag('consent', 'update', {
                    'analytics_storage': 'granted'
                });
            }
        } else {
            // Disable Google Analytics
            if (window.gtag) {
                window.gtag('consent', 'update', {
                    'analytics_storage': 'denied'
                });
            }
        }
    }

    /**
     * Generiert die komplette Appbar HTML-Struktur
     */
    generateAppbarHTML() {
        const prefix = this.getPathPrefix();
        const imgPrefix = this.getImagePrefix();
        return `
        <header id="appbar" class="bg-white backdrop-blur-md border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <!-- Logo -->
                    <div class="flex items-center space-x-3">
                        <a href="${prefix}index.html" class="flex items-center space-x-3 group">
                            <div class="w-10 h-10 bg-gradient-to-br from-primary to-bg-dark rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                                <i class="fas fa-book text-white text-lg"></i>
                            </div>
                            <div class="hidden sm:block">
                                <div class="font-headline text-lg font-bold text-primary">Adolf Schlatter</div>
                                <div class="text-xs text-text-secondary">Stiftung</div>
                            </div>
                        </a>
                    </div>

                    <!-- Desktop Navigation -->
                    <nav class="hidden lg:flex items-center space-x-1">
                        <!-- Über Schlatter -->
                        <div class="relative group">
                            <button class="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-primary transition-colors font-medium">
                                <span>Über Schlatter</span>
                                <i class="fas fa-chevron-down text-xs transition-transform group-hover:rotate-180"></i>
                            </button>
                            <div class="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                <div class="p-6">
                                    <div class="grid grid-cols-1 gap-4">
                                        <a href="${prefix}pages/aboutSchlatter.html" class="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-12 h-12 bg-gradient-to-br from-primary/10 to-bg-dark/10 rounded-lg flex items-center justify-center group-hover:from-primary/20 group-hover:to-bg-dark/20 transition-colors">
                                                <i class="fas fa-user text-primary"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-primary mb-1">Überblick</h3>
                                                <p class="text-sm text-text-secondary">Leben und Werk Adolf Schlatters</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}pages/aboutSchlatter.html#anhoeren" class="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-12 h-12 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg flex items-center justify-center group-hover:from-secondary/20 group-hover:to-primary/20 transition-colors">
                                                <i class="fas fa-volume-up text-secondary"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-primary mb-1">Anhören</h3>
                                                <p class="text-sm text-text-secondary">Audio-Aufnahmen und Vorträge</p>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Archiv -->
                        <div class="relative group">
                            <button class="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-primary transition-colors font-medium">
                                <span>Archiv</span>
                                <i class="fas fa-chevron-down text-xs transition-transform group-hover:rotate-180"></i>
                            </button>
                            <div class="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                <div class="p-6">
                                    <div class="grid grid-cols-1 gap-4">
                                        <a href="${prefix}pages/archiv-interface.html" class="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-12 h-12 bg-gradient-to-br from-accent/20 to-primary/10 rounded-lg flex items-center justify-center group-hover:from-accent/30 group-hover:to-primary/20 transition-colors">
                                                <i class="fas fa-archive text-primary"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-primary mb-1">Nachlass</h3>
                                                <p class="text-sm text-text-secondary">Digitales Inventar & Recherche</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}pages/schlatter_timeline.html" class="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-12 h-12 bg-gradient-to-br from-primary/10 to-bg-dark/10 rounded-lg flex items-center justify-center group-hover:from-primary/20 group-hover:to-bg-dark/20 transition-colors">
                                                <i class="fas fa-timeline text-primary"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-primary mb-1">Biographie</h3>
                                                <p class="text-sm text-text-secondary">Chronologie des Lebens</p>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Preis -->
                        <div class="relative group">
                            <button class="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-primary transition-colors font-medium">
                                <span>Preis</span>
                                <i class="fas fa-chevron-down text-xs transition-transform group-hover:rotate-180"></i>
                            </button>
                            <div class="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                <div class="p-6">
                                    <div class="grid grid-cols-1 gap-4">
                                        <a href="${prefix}pages/adolfSchlatterPrice.html" class="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-12 h-12 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg flex items-center justify-center group-hover:from-secondary/20 group-hover:to-primary/20 transition-colors">
                                                <i class="fas fa-award text-secondary"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-primary mb-1">Über den Preis</h3>
                                                <p class="text-sm text-text-secondary">Ausschreibung und Vergabe</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}pages/adolfSchlatterPrice.html#preisverleihung-2017" class="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-12 h-12 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg flex items-center justify-center group-hover:from-secondary/20 group-hover:to-primary/20 transition-colors">
                                                <i class="fas fa-video text-secondary"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-primary mb-1">Preisverleihung 2017</h3>
                                                <p class="text-sm text-text-secondary">Video-Aufzeichnung der Veranstaltung</p>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Preisträger -->
                        <div class="relative group">
                            <button class="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-primary transition-colors font-medium">
                                <span>Preisträger</span>
                                <i class="fas fa-chevron-down text-xs transition-transform group-hover:rotate-180"></i>
                            </button>
                            <div class="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                <div class="p-6">
                                    <div class="grid grid-cols-2 gap-3">
                                        <a href="${prefix}pages/preistr\u00e4ger/michael-br\u00e4utigam.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${imgPrefix}preistr\u00e4gerImages/Michael-Brautigam-Portrait-2022-500x500.jpg" alt="Dr. Michael Bräutigam" class="w-full h-full object-cover object-center">
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-primary text-sm">Dr. Michael Bräutigam</h4>
                                                <p class="text-xs text-text-secondary">2015</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}pages/preistr\u00e4ger/oliver-gussmann.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${imgPrefix}preistr\u00e4gerImages/Gußman.jpeg" alt="Dr. Oliver Gußmann" class="w-full h-full object-cover object-center">
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-primary text-sm">Dr. Oliver Gußmann</h4>
                                                <p class="text-xs text-text-secondary">2009</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}pages/preistr\u00e4ger/ulrich-beuttler.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${imgPrefix}preistr\u00e4gerImages/Passbild_Ulrich_Beuttler.jfif" alt="Dr. Ulrich Beuttler" class="w-full h-full object-cover object-center">
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-primary text-sm">Dr. Ulrich Beuttler</h4>
                                                <p class="text-xs text-text-secondary">2007</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}pages/preistr\u00e4ger/clemens-hägele.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${imgPrefix}preistr\u00e4gerImages/clemens-haegele.avif" alt="Dr. Clemens Hägele" class="w-full h-full object-cover object-center">
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-primary text-sm">Dr. Clemens Hägele</h4>
                                                <p class="text-xs text-text-secondary">2005</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}pages/preistr\u00e4ger/werner-neuer.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${imgPrefix}preistr\u00e4gerImages/dr-werner-neuer.jpg" alt="Dr. Werner Neuer" class="w-full h-full object-cover object-center">
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-primary text-sm">Dr. Werner Neuer</h4>
                                                <p class="text-xs text-text-secondary">2005</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}pages/preistr\u00e4ger/roland-deines.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${imgPrefix}preistr\u00e4gerImages/Deines.jpg" alt="Dr. Roland Deines" class="w-full h-full object-cover object-center">
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-primary text-sm">Dr. Roland Deines</h4>
                                                <p class="text-xs text-text-secondary">2005</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}pages/preistr\u00e4ger/j-gerrit-hohage.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${imgPrefix}preistr\u00e4gerImages/Hohage.png" alt="Dr. J.-Gerrit Hohage" class="w-full h-full object-cover object-center">
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-primary text-sm">Dr. J.-Gerrit Hohage</h4>
                                                <p class="text-xs text-text-secondary">2005</p>
                                            </div>
                                        </a>
                                        <div class="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                                            <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                <i class="fas fa-user text-gray-400"></i>
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-gray-500 text-sm">Remmer Schunke</h4>
                                                <p class="text-xs text-gray-400">2002</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Weitere Ressourcen -->
                        <div class="relative group">
                            <button class="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-primary transition-colors font-medium">
                                <span>Weitere Ressourcen</span>
                                <i class="fas fa-chevron-down text-xs transition-transform group-hover:rotate-180"></i>
                            </button>
                            <div class="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                <div class="p-6">
                                    <div class="grid grid-cols-1 gap-4">
                                        <a href="${prefix}pages/stammbaum.html" class="flex items-center space-x-4 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-12 h-12 bg-gradient-to-br from-primary/10 to-bg-dark/10 rounded-lg flex items-center justify-center group-hover:from-primary/20 group-hover:to-bg-dark/20 transition-colors">
                                                <i class="fas fa-sitemap text-primary"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-primary mb-1">Stammbaum</h3>
                                            </div>
                                        </a>
                                        <a href="#" class="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent transition-colors group opacity-50 cursor-not-allowed">
                                            <div class="w-12 h-12 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-images text-secondary"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-gray-500 mb-1">Bildergalerie</h3>
                                                <p class="text-sm text-gray-400">Bald verfügbar</p>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </nav>

                    <!-- Mobile Menu Button -->
                    <button id="mobile-menu-btn" class="lg:hidden p-2 text-text-secondary hover:text-primary transition-colors">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                </div>

                <!-- Mobile Menu -->
                <div id="mobile-menu" class="lg:hidden hidden border-t border-gray-200 bg-white" style="background-color: #ffffff !important;">
                    <div class="px-6 py-4 space-y-4" style="background-color: #ffffff !important;">
                        <div>
                            <h3 class="font-semibold text-primary mb-2">Über Schlatter</h3>
                            <div class="space-y-2 ml-4">
                                <a href="${prefix}pages/aboutSchlatter.html" class="block text-text-secondary hover:text-primary transition-colors break-words">Überblick</a>
                                <a href="${prefix}pages/aboutSchlatter.html#anhoeren" class="block text-text-secondary hover:text-primary transition-colors break-words">Anhören</a>
                            </div>
                        </div>
                        <div>
                            <a href="${prefix}pages/archiv-interface.html" class="block font-semibold text-primary hover:text-secondary transition-colors break-words">Archiv</a>
                        </div>
                        <div>
                            <h3 class="font-semibold text-primary mb-2">Preis</h3>
                            <div class="space-y-2 ml-4">
                                <a href="${prefix}pages/adolfSchlatterPrice.html" class="block text-text-secondary hover:text-primary transition-colors break-words">Über den Preis</a>
                                <a href="${prefix}pages/adolfSchlatterPrice.html#preisverleihung-2017" class="block text-text-secondary hover:text-primary transition-colors break-words">Preisverleihung 2017</a>
                            </div>
                        </div>
                        <div>
                            <h3 class="font-semibold text-primary mb-2">Ressourcen</h3>
                            <div class="space-y-2 ml-4">
                                <a href="${prefix}pages/archiv-interface.html" class="block text-text-secondary hover:text-primary transition-colors break-words">Nachlass</a>
                                <a href="${prefix}pages/archiv-interface.html#nachlass" class="block text-text-secondary hover:text-primary transition-colors break-words">Nachlassübersicht</a>
                                <a href="${prefix}pages/schlatter_timeline.html" class="block text-text-secondary hover:text-primary transition-colors break-words">Biographie-Timeline</a>
                                <a href="${prefix}pages/stammbaum.html" class="block text-text-secondary hover:text-primary transition-colors break-words">Stammbaum</a>
                            </div>
                        </div>
                        <div>
                            <h3 class="font-semibold text-primary mb-2">Preisträger</h3>
                            <div class="space-y-2 ml-4">
                                <a href="${prefix}pages/preistr\u00e4ger/michael-bräutigam.html" class="block text-text-secondary hover:text-primary transition-colors break-words">Dr. Michael Bräutigam (2015)</a>
                                <a href="${prefix}pages/preistr\u00e4ger/oliver-gussmann.html" class="block text-text-secondary hover:text-primary transition-colors break-words">Dr. Oliver Gußmann (2009)</a>
                                <a href="${prefix}pages/preistr\u00e4ger/ulrich-beuttler.html" class="block text-text-secondary hover:text-primary transition-colors break-words">Dr. Ulrich Beuttler (2007)</a>
                                <a href="${prefix}pages/preistr\u00e4ger/clemens-hägele.html" class="block text-text-secondary hover:text-primary transition-colors break-words">Dr. Clemens Hägele (2005)</a>
                                <a href="${prefix}pages/preistr\u00e4ger/werner-neuer.html" class="block text-text-secondary hover:text-primary transition-colors break-words">Dr. Werner Neuer (2005)</a>
                                <a href="${prefix}pages/preistr\u00e4ger/roland-deines.html" class="block text-text-secondary hover:text-primary transition-colors break-words">Dr. Roland Deines (2005)</a>
                                <a href="${prefix}pages/preistr\u00e4ger/j-gerrit-hohage.html" class="block text-text-secondary hover:text-primary transition-colors break-words">Dr. J.-Gerrit Hohage (2005)</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>`;
    }


    /**
     * Fügt die Appbar in den angegebenen Container ein
     */
    insertAppbar(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            // Generiere die Appbar mit korrekten Pfaden
            const html = this.generateAppbarHTML();
            
            container.innerHTML = html;
            this.initializeMobileMenu();
            
            // Markiere als geladen um Blitzen zu verhindern
            setTimeout(() => {
                container.classList.add('loaded');
            }, 10);
            
        } else {
            console.error(`Container mit ID '${containerId}' nicht gefunden`);
        }
    }


    /**
     * Initialisiert das Mobile Menu
     */
    initializeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');

        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-bars');
                    icon.classList.toggle('fa-times');
                }
            });
        }
    }

    /**
     * Aktualisiert die Preisträger-Liste in der Appbar
     * @param {Array} preistraeger - Array mit Preisträger-Daten
     */
    updatePreistraeger(preistraeger) {
        // Diese Methode kann später erweitert werden, um die Preisträger-Liste dynamisch zu aktualisieren
        console.log('Preisträger-Liste aktualisiert:', preistraeger);
    }
}

// Globale Instanz erstellen
window.appbarManager = new AppbarManager();

/**
 * Appbar Utils - Zentrale Verwaltung der Appbar für alle Seiten
 */
class AppbarManager {
    constructor() {
        this.appbarHTML = this.generateAppbarHTML();
    }

    /**
     * Ermittelt die korrekten Pfade basierend auf dem aktuellen Verzeichnis
     */
    getPathPrefix() {
        const path = window.location.pathname;
        if (path.includes('/preistr%C3%A4ger/')) {
            return '../';
        }
        return '';
    }

    /**
     * Generiert die komplette Appbar HTML-Struktur
     */
    generateAppbarHTML() {
        const prefix = this.getPathPrefix();
        return `
        <header id="appbar" class="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm relative z-50">
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
                                        <a href="${prefix}aboutSchlatter.html" class="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-12 h-12 bg-gradient-to-br from-primary/10 to-bg-dark/10 rounded-lg flex items-center justify-center group-hover:from-primary/20 group-hover:to-bg-dark/20 transition-colors">
                                                <i class="fas fa-user text-primary"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-primary mb-1">Biografie</h3>
                                                <p class="text-sm text-text-secondary">Leben und Werk Adolf Schlatters</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}aboutSchlatter.html#anhoeren" class="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent transition-colors group">
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

                        <!-- Preis -->
                        <div class="relative group">
                            <button class="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-primary transition-colors font-medium">
                                <span>Preis</span>
                                <i class="fas fa-chevron-down text-xs transition-transform group-hover:rotate-180"></i>
                            </button>
                            <div class="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                <div class="p-6">
                                    <div class="grid grid-cols-1 gap-4">
                                        <a href="${prefix}adolfSchlatterPrice.html" class="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-12 h-12 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg flex items-center justify-center group-hover:from-secondary/20 group-hover:to-primary/20 transition-colors">
                                                <i class="fas fa-award text-secondary"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-semibold text-primary mb-1">Über den Preis</h3>
                                                <p class="text-sm text-text-secondary">Ausschreibung und Vergabe</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}adolfSchlatterPrice.html#preisverleihung-2017" class="flex items-start space-x-4 p-3 rounded-lg hover:bg-accent transition-colors group">
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
                                        <a href="${prefix}preistr\u00e4ger/michael-br\u00e4utigam.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${prefix}preistr\u00e4gerImages/Michael-Brautigam-Portrait-2022-500x500.jpg" alt="Dr. Michael Bräutigam" class="w-full h-full object-cover object-top">
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-primary text-sm">Dr. Michael Bräutigam</h4>
                                                <p class="text-xs text-text-secondary">2015</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}preistr\u00e4ger/oliver-gussmann.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${prefix}preistr\u00e4gerImages/Gußman.jpeg" alt="Dr. Oliver Gußmann" class="w-full h-full object-cover object-top">
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-primary text-sm">Dr. Oliver Gußmann</h4>
                                                <p class="text-xs text-text-secondary">2009</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}preistr\u00e4ger/ulrich-beuttler.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${prefix}preistr\u00e4gerImages/Passbild_Ulrich_Beuttler.jfif" alt="Dr. Ulrich Beuttler" class="w-full h-full object-cover object-top">
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-primary text-sm">Dr. Ulrich Beuttler</h4>
                                                <p class="text-xs text-text-secondary">2007</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}preistr\u00e4ger/clemens-hägele.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${prefix}preistr\u00e4gerImages/clemens-haegele.avif" alt="Dr. Clemens Hägele" class="w-full h-full object-cover object-top">
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-primary text-sm">Dr. Clemens Hägele</h4>
                                                <p class="text-xs text-text-secondary">2005</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}preistr\u00e4ger/werner-neuer.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${prefix}preistr\u00e4gerImages/dr-werner-neuer.jpg" alt="Dr. Werner Neuer" class="w-full h-full object-cover object-top">
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-primary text-sm">Dr. Werner Neuer</h4>
                                                <p class="text-xs text-text-secondary">2005</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}preistr\u00e4ger/roland-deines.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${prefix}preistr\u00e4gerImages/Deines.jpg" alt="Dr. Roland Deines" class="w-full h-full object-cover object-top">
                                            </div>
                                            <div>
                                                <h4 class="font-medium text-primary text-sm">Dr. Roland Deines</h4>
                                                <p class="text-xs text-text-secondary">2005</p>
                                            </div>
                                        </a>
                                        <a href="${prefix}preistr\u00e4ger/j-gerrit-hohage.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                                            <div class="w-10 h-10 rounded-full overflow-hidden">
                                                <img src="${prefix}preistr\u00e4gerImages/Hohage.png" alt="Dr. J.-Gerrit Hohage" class="w-full h-full object-cover object-top">
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
                    </nav>

                    <!-- Mobile Menu Button -->
                    <button id="mobile-menu-btn" class="lg:hidden p-2 text-text-secondary hover:text-primary transition-colors">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                </div>

                <!-- Mobile Menu -->
                <div id="mobile-menu" class="lg:hidden hidden border-t border-gray-200 bg-white">
                    <div class="px-6 py-4 space-y-4">
                        <div>
                            <h3 class="font-semibold text-primary mb-2">Über Schlatter</h3>
                            <div class="space-y-2 ml-4">
                                <a href="${prefix}aboutSchlatter.html" class="block text-text-secondary hover:text-primary transition-colors">Biografie</a>
                                <a href="${prefix}aboutSchlatter.html#anhoeren" class="block text-text-secondary hover:text-primary transition-colors">Anhören</a>
                            </div>
                        </div>
                        <div>
                            <h3 class="font-semibold text-primary mb-2">Preis</h3>
                            <div class="space-y-2 ml-4">
                                <a href="${prefix}adolfSchlatterPrice.html" class="block text-text-secondary hover:text-primary transition-colors">Über den Preis</a>
                                <a href="${prefix}adolfSchlatterPrice.html#preisverleihung-2017" class="block text-text-secondary hover:text-primary transition-colors">Preisverleihung 2017</a>
                            </div>
                        </div>
                        <div>
                            <h3 class="font-semibold text-primary mb-2">Preisträger</h3>
                            <div class="space-y-2 ml-4">
                                <a href="${prefix}preistr\u00e4ger/michael-bräutigam.html" class="block text-text-secondary hover:text-primary transition-colors">Dr. Michael Bräutigam (2015)</a>
                                <a href="${prefix}preistr\u00e4ger/oliver-gussmann.html" class="block text-text-secondary hover:text-primary transition-colors">Dr. Oliver Gußmann (2009)</a>
                                <a href="${prefix}preistr\u00e4ger/ulrich-beuttler.html" class="block text-text-secondary hover:text-primary transition-colors">Dr. Ulrich Beuttler (2007)</a>
                                <a href="${prefix}preistr\u00e4ger/clemens-hägele.html" class="block text-text-secondary hover:text-primary transition-colors">Dr. Clemens Hägele (2005)</a>
                                <a href="${prefix}preistr\u00e4ger/werner-neuer.html" class="block text-text-secondary hover:text-primary transition-colors">Dr. Werner Neuer (2005)</a>
                                <a href="${prefix}preistr\u00e4ger/roland-deines.html" class="block text-text-secondary hover:text-primary transition-colors">Dr. Roland Deines (2005)</a>
                                <a href="${prefix}preistr\u00e4ger/j-gerrit-hohage.html" class="block text-text-secondary hover:text-primary transition-colors">Dr. J.-Gerrit Hohage (2005)</a>
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

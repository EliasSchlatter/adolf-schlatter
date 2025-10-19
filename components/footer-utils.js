/**
 * Footer Manager - Handles dynamic footer insertion and customization
 */
class FooterManager {
    constructor() {
        this.footerContainer = null;
        this.footerHTML = null;
    }

    /**
     * Load footer HTML from components/footer.html
     */
    async loadFooter() {
        try {
            const response = await fetch('components/footer.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.footerHTML = await response.text();
        } catch (error) {
            console.error('Error loading footer:', error);
            // Use embedded footer HTML instead of fallback
            this.footerHTML = this.getEmbeddedFooter();
        }
    }

    /**
     * Get the correct path prefix based on current location
     */
    getPathPrefix() {
        const path = window.location.pathname;
        // Von pages/ Unterseiten (eine Ebene tief)
        if (path.includes('/pages/')) {
            return '../';
        }
        // Von Root
        return './';
    }

    /**
     * Insert footer into specified container
     * @param {string} containerId - ID of the container element
     * @param {Object} options - Configuration options
     * @param {string} options.description - Custom description text for the page
     * @param {string} options.title - Custom title (optional)
     */
    async insertFooter(containerId, options = {}) {
        // Load footer if not already loaded
        if (!this.footerHTML) {
            await this.loadFooter();
        }

        // Find container
        this.footerContainer = document.getElementById(containerId);
        if (!this.footerContainer) {
            console.error(`Footer container with ID '${containerId}' not found`);
            return;
        }

        // Get correct path prefix
        const prefix = this.getPathPrefix();
        
        // Update footer HTML with correct paths
        let updatedFooterHTML = this.footerHTML;
        
        // Replace all href="pages/ with the correct prefix
        updatedFooterHTML = updatedFooterHTML.replace(/href="pages\//g, `href="${prefix}pages/`);

        // Insert footer HTML
        this.footerContainer.innerHTML = updatedFooterHTML;

        // Apply customizations
        this.customizeFooter(options);

        // Load CSS if not already loaded
        this.loadFooterCSS();
    }

    /**
     * Customize footer with page-specific content
     * @param {Object} options - Customization options
     */
    customizeFooter(options) {
        const descriptionElement = document.getElementById('footer-description');
        
        if (descriptionElement && options.description) {
            descriptionElement.textContent = options.description;
        }

        // You can add more customization options here
        // For example: custom title, different social links, etc.
    }

    /**
     * Load footer CSS if not already loaded
     */
    loadFooterCSS() {
        // Check if CSS is already loaded
        if (document.querySelector('link[href="components/footer.css"]')) {
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'components/footer.css';
        document.head.appendChild(link);
    }

    /**
     * Embedded footer HTML (used when fetch fails)
     */
    getEmbeddedFooter() {
        return `<!-- Modern Footer Component -->
<footer id="footer" class="text-white py-16" style="background: var(--gradient-section-dark);">
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div class="md:col-span-2">
                <div class="flex items-center space-x-3 mb-6">
                    <div class="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                        <i class="fas fa-graduation-cap text-white text-xl"></i>
                    </div>
                    <div>
                        <h3 class="font-headline font-bold text-xl">Adolf Schlatter Preis</h3>
                        <p class="text-white/70 text-sm">Förderung christlicher Theologie</p>
                    </div>
                </div>
                <p id="footer-description" class="text-white/80 mb-6 max-w-md">
                    Die Adolf Schlatter Stiftung vergibt seit 2002 Preise zur Förderung theologischer Forschung und würdigt herausragende wissenschaftliche Arbeiten.
                </p>
            </div>

            <div>
                <h4 class="font-headline font-bold text-lg mb-6">Adolf Schlatter Stiftung</h4>
                <ul class="space-y-3">
                    <li><a href="pages/aboutSchlatter.html" class="text-white/80 hover:text-white transition-colors">Über uns</a></li>
                    <li><a href="pages/adolfSchlatterPrice.html#kontakt" class="text-white/80 hover:text-white transition-colors">Kontakt</a></li>
                    <li><a href="pages/impressum.html" class="text-white/80 hover:text-white transition-colors">Impressum</a></li>
                    <li><a href="pages/datenschutz.html" class="text-white/80 hover:text-white transition-colors">Datenschutz</a></li>
                </ul>
            </div>

            <div>
                <h4 class="font-headline font-bold text-lg mb-6">Themen</h4>
                <ul class="space-y-3">
                    <li><a href="pages/aboutSchlatter.html" class="text-white/80 hover:text-white transition-colors">Biografie</a></li>
                    <li><a href="pages/aboutSchlatter.html#werk" class="text-white/80 hover:text-white transition-colors">Publikationen</a></li>
                    <li><a href="pages/adolfSchlatterPrice.html" class="text-white/80 hover:text-white transition-colors">Preis</a></li>
                </ul>
            </div>
        </div>

        <div class="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div class="flex space-x-6 mt-4 md:mt-0">
                <span class="text-white/60 hover:text-white text-sm transition-colors cursor-pointer">Cookie-Richtlinie</span>
            </div>
        </div>
    </div>
</footer>`;
    }

    /**
     * Fallback footer HTML in case of loading error
     */
    getFallbackFooter() {
        return `
            <footer id="footer" class="text-white py-16" style="background: var(--gradient-section-dark);">
                <div class="max-w-7xl mx-auto px-6 lg:px-8">
                    <div class="text-center">
                        <h3 class="font-headline font-bold text-xl mb-4">Adolf Schlatter Stiftung</h3>
                        <p class="text-white/80 mb-6">Förderung christlicher Theologie seit 2002</p>
                        <p class="text-white/60 text-sm">© 2024 Adolf Schlatter Stiftung. Alle Rechte vorbehalten.</p>
                    </div>
                </div>
            </footer>
        `;
    }
}

// Create global instance
window.footerManager = new FooterManager();

// Auto-initialize if container exists on page load
document.addEventListener('DOMContentLoaded', function() {
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer && window.footerManager) {
        // Default description for pages that don't specify one
        const defaultDescription = "Die Adolf Schlatter Stiftung vergibt seit 2002 Preise zur Förderung theologischer Forschung und würdigt herausragende wissenschaftliche Arbeiten.";
        
        window.footerManager.insertFooter('footer-container', {
            description: defaultDescription
        });
    }
});

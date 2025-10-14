/**
 * Quote Manager - Handles Adolf Schlatter quotes
 */
class QuoteManager {
    constructor() {
        this.quotes = [
            "Aus der uns gegebenen Lage entsteht unsere Pflicht.",
            "Man kann die Heilige Schrift nicht lesen wie die tägliche Zeitung. Sie ist wie ein Bergwerk. Man muß mühsam in ihre Schächte hinabsteigen, um ihre Goldader anzuschlagen.",
            "Wenn die Menschen leidenschaftlich werden, schreien und toben, zu den Waffen greifen, Gewalt üben, Gericht halten und töten, dann übertönt ihr Lärm leicht die Erinnerung an Gott.",
            "Buße tun und Bekehrung ist nicht nur Gebot für Nichtchristen, sondern zuerst Pflicht der Christenheit.",
            "Im Umgang mit vielen Menschen verwechselt man oft, was man selbst innerlich besitzt und was man von anderen entlehnt.",
            "Binsenwahrheiten: Die eine Hälfte führte vor einigen Jahrhunderten auf den Scheiterhaufen; die andre besteht aus Unwahrheiten, die aus Bequemlichkeit für wahr gelten.",
            "Es ist eine sichere Erfahrung, daß das Gebet, das sich mit uns selbst beschäftigt, verdorrt.",
            "Durch Jesus wird man in die Gemeinde Gottes eingegliedert, und es gibt keinen Eingang in die ewige Kirche als durch ihn.",
            "Wenn uns der Geist bewegen soll, ohne dass wir uns bewegen; uns erleuchten soll, ohne dass wir denken; uns heiligen soll, ohne dass wir wollen; uns gehorsam machen soll, ohne dass wir gehorchen; uns vom Bösen erlösen soll, ohne dass wir es lassen; so haben wir nicht Christi Verheißung für uns.",
            "Dem Retter der Welt folgen nur wenige.",
            "Es ist besser, ich bete einen Rachepsalm, als einen gottlosen Hass in meinem Herzen zu tragen.",
            "Was die Liebe anschaut, glänzt."
        ];
    }

    /**
     * Get a random quote
     */
    getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        return this.quotes[randomIndex];
    }

    /**
     * Load and insert quote component
     * @param {string} containerId - ID of the container element
     */
    async insertQuote(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Quote container with ID '${containerId}' not found`);
            return;
        }

        try {
            // Try to load quote.html
            const response = await fetch('components/quote.html');
            if (response.ok) {
                const html = await response.text();
                container.innerHTML = html;
            } else {
                // Use embedded version
                container.innerHTML = this.getEmbeddedQuote();
            }
        } catch (error) {
            console.error('Error loading quote component:', error);
            container.innerHTML = this.getEmbeddedQuote();
        }

        // Set random quote
        const quoteElement = document.getElementById('quote-text');
        if (quoteElement) {
            quoteElement.textContent = `„${this.getRandomQuote()}"`;
        }
    }

    /**
     * Get embedded quote HTML
     */
    getEmbeddedQuote() {
        return `
        <section id="quote-section" class="py-20 bg-secondary" style="min-height: 300px; display: flex; align-items: center;">
            <div class="container mx-auto px-6">
                <div class="max-w-4xl mx-auto text-center">
                    <blockquote id="quote-text" class="font-quote text-2xl lg:text-3xl text-white mb-8 italic leading-relaxed">
                        <!-- Quote wird hier eingefügt -->
                    </blockquote>
                    <cite class="text-xl text-white font-semibold">
                        – Adolf Schlatter
                    </cite>
                </div>
            </div>
        </section>
        `;
    }

    /**
     * Generate quote HTML directly (for use in templates)
     */
    generateQuoteHTML() {
        const quote = this.getRandomQuote();
        return `
        <section id="inspiration" class="py-20 bg-secondary" style="min-height: 300px; display: flex; align-items: center;">
            <div class="container mx-auto px-6">
                <div class="max-w-4xl mx-auto text-center">
                    <blockquote class="font-quote text-2xl lg:text-3xl text-white mb-8 italic leading-relaxed">
                        „${quote}"
                    </blockquote>
                    <cite class="text-xl text-white font-semibold">
                        – Adolf Schlatter
                    </cite>
                </div>
            </div>
        </section>
        `;
    }
}

// Create global instance
window.quoteManager = new QuoteManager();

// Auto-initialize if container exists on page load
document.addEventListener('DOMContentLoaded', function() {
    const quoteContainer = document.getElementById('quote-container');
    if (quoteContainer && window.quoteManager) {
        window.quoteManager.insertQuote('quote-container');
    }
});


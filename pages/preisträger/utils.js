// Preisträger Detail Page Utils
// HTML Generator Functions for GitHub Pages compatible static site

class PreistraegerPageBuilder {
    constructor(data) {
        this.data = data;
    }

    // Generate complete HTML page
    generatePage() {
        return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.data.name} - Adolf Schlatter Preis</title>
    <meta name="description" content="${this.data.description || `Preisträger des Adolf-Schlatter-Preises: ${this.data.name}`}">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script>window.FontAwesomeConfig = { autoReplaceSvg: 'nest'};</script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    
    <!-- Central Color System -->
    <link rel="stylesheet" href="../../styles/colors.css">
    
    <!-- Appbar CSS -->
    <link rel="stylesheet" href="../../components/appbar.css">
    
    <style>
        ::-webkit-scrollbar { display: none;}
        .font-headline { font-family: 'Merriweather', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-highlight { font-family: 'Playfair Display', serif; }
    </style>
    <script>tailwind.config = {
  "theme": {
    "extend": {
      "colors": {
        "primary": "var(--color-primary)",
        "secondary": "var(--color-secondary)",
        "accent": "var(--color-accent)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "bg-light": "var(--color-bg-light)",
        "bg-dark": "var(--color-bg-dark)"
      },
      "fontFamily": {}
    }
  }
};</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&amp;display=swap">
</head>
<body class="bg-white font-custom">
    ${this.generateHeader()}
    ${this.generateProfileBanner()}
    ${this.generateLebenslauf()}
    ${this.data.academic && this.data.academic.length > 0 ? this.generateAkademischeLaufbahn() : ''}
    ${this.generateForschungsschwerpunkte()}
    ${this.data.publications && this.data.publications.length > 0 ? this.generatePublikationen() : ''}
    ${this.generateQuote()}
    ${this.generateFooter()}
    ${this.generateScripts()}
</body>
</html>`;
    }

    // Generate header navigation (now using Appbar Utils)
    generateHeader() {
        return `<!-- Modern Appbar -->
<div id="appbar-container">
    <!-- Appbar wird hier eingefügt -->
</div>`;
    }


    // Generate profile banner section
    generateProfileBanner() {
        const imageSrc = this.data.image || 'https://storage.googleapis.com/uxpilot-auth.appspot.com/ed7a3e6e7f-e124e82d1190350e3e39.png';
        const tags = this.data.tags || [];
        
        return `<section id="intro" style="background: var(--gradient-header-primary); min-height: 600px; display: flex; align-items: center;">
        <div class="max-w-7xl mx-auto px-6 py-20 w-full">
            <div class="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
                <div class="flex-shrink-0">
                    <img class="w-64 h-64 rounded-full object-cover border-4 border-white shadow-xl" src="${imageSrc}" alt="${this.data.name}">
                </div>
                <div class="text-center lg:text-left text-white">
                    <h1 class="text-5xl font-headline font-bold mb-4">${this.data.name}</h1>
                    <p class="text-xl font-medium mb-4 text-gray-200">${this.data.location}</p>
                    <p class="text-lg leading-relaxed max-w-2xl">
                        ${this.data.description || 'Preisträger des Adolf-Schlatter-Preises für Förderung christlicher Theologie'}
                    </p>
                    <div class="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
                        ${tags.map(tag => `<span class="bg-secondary text-white px-4 py-2 rounded-full text-sm font-medium">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    </section>`;
    }

    // Generate Lebenslauf section
    generateLebenslauf() {
        const careerItems = this.data.career || [];
        const specializations = this.data.specializations || [];
        const contact = this.data.contact || {};
        const awards = this.data.awards || [];

        return `<section id="lebenslauf" class="py-16 bg-white">
        <div class="max-w-7xl mx-auto px-6">
            <div class="grid lg:grid-cols-3 gap-12">
                <div class="lg:col-span-2">
                    <h2 class="text-4xl font-headline font-bold text-primary mb-8">Lebenslauf</h2>
                    ${Array.isArray(this.data.biography) ? `
                    <div class="space-y-1 mb-8">
                        ${this.data.biography.map(item => `
                        <div class="flex items-start border-b border-gray-200 pb-3 last:border-b-0">
                            <div class="w-32 flex-shrink-0">
                                <span class="text-text-secondary text-sm font-medium">${item.year || ''}</span>
                            </div>
                            <div class="flex-1">
                                <span class="text-text-secondary">${item.text}</span>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                    ` : `
                    <div class="prose prose-lg max-w-none">
                        <p class="text-text-secondary leading-relaxed mb-6">
                            ${this.data.biography || 'Biografische Informationen werden in Kürze ergänzt.'}
                        </p>
                    </div>
                    `}
                    
                    ${contact.video ? (() => {
                        const embedUrl = this.getYouTubeEmbedUrl(contact.video);
                        return `
                    <div class="mt-8 mb-12">
                        ${contact.videoTitle ? `<h3 class="text-2xl font-headline font-semibold text-primary mb-4">${contact.videoTitle}</h3>` : ''}
                        <div class="aspect-video max-w-2xl">
                            <iframe src="${embedUrl}" title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="w-full h-full rounded-lg"></iframe>
                        </div>
                    </div>
                    `;
                    })() : ''}
                    
                    <div class="mt-12">
                        <h3 class="text-2xl font-headline font-semibold text-primary mb-6">Beruflicher Werdegang</h3>
                        <div class="space-y-6">
                            ${careerItems.map(item => `
                            <div class="flex items-start space-x-4">
                                <div class="flex-shrink-0 w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                                    <i class="${item.icon || 'fas fa-briefcase'} text-white"></i>
                                </div>
                                <div>
                                    <h4 class="font-semibold text-text-primary">${item.title}</h4>
                                    <p class="text-text-secondary">${item.description}</p>
                                </div>
                            </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-1">
                    <div class="bg-bg-light rounded-lg p-8">
                        <h3 class="text-xl font-headline font-semibold text-primary mb-6">Schwerpunkte</h3>
                        <ul class="space-y-4">
                            ${specializations.map(spec => `
                            <li class="flex items-center space-x-3">
                                <i class="fas fa-star text-secondary"></i>
                                <span class="text-text-secondary">${spec}</span>
                            </li>
                            `).join('')}
                        </ul>

                        ${contact.address || contact.phone || contact.website || contact.emails || contact.websites || contact.video ? `
                        <div class="mt-8 pt-8 border-t border-gray-200">
                            <h4 class="font-semibold text-primary mb-4">Kontakt</h4>
                            <div class="space-y-3 text-sm">
                                ${contact.address ? `
                                <div class="flex items-start space-x-3">
                                    <i class="fas fa-map-marker-alt text-secondary mt-1"></i>
                                    <span class="text-text-secondary">${contact.address}</span>
                                </div>
                                ` : ''}
                                ${contact.phone ? `
                                <div class="flex items-center space-x-3">
                                    <i class="fas fa-phone text-secondary"></i>
                                    <span class="text-text-secondary">${contact.phone}</span>
                                </div>
                                ` : ''}
                                ${contact.emails ? contact.emails.map(email => `
                                <div class="flex items-center space-x-3">
                                    <i class="fas fa-envelope text-secondary"></i>
                                    <span class="text-secondary hover:underline cursor-pointer">${email}</span>
                                </div>
                                `).join('') : ''}
                                ${contact.website ? `
                                <div class="flex items-center space-x-3">
                                    <i class="fas fa-globe text-secondary"></i>
                                    <span class="text-secondary hover:underline cursor-pointer">Website</span>
                                </div>
                                ` : ''}
                                ${contact.websites ? contact.websites.map(website => `
                                <div class="flex items-center space-x-3">
                                    <i class="fas fa-globe text-secondary"></i>
                                    <a href="${typeof website === 'string' ? website : website.url}" target="_blank" rel="noopener noreferrer" class="text-secondary hover:underline cursor-pointer">${typeof website === 'string' ? 'Website' : (website.label || 'Website')}</a>
                                </div>
                                `).join('') : ''}
                            </div>
                        </div>
                        ` : ''}
                    </div>

                    ${awards.length > 0 ? `
                    <div class="mt-8 bg-gradient-section-dark rounded-lg p-8 text-white">
                        <h4 class="font-headline font-semibold mb-4">Besondere Auszeichnungen</h4>
                        <div class="space-y-4">
                            ${awards.map(award => `
                            <div class="flex items-start space-x-3">
                                <i class="fas fa-award text-secondary mt-1"></i>
                                <div>
                                    <p class="font-medium">${award.title}</p>
                                    <p class="text-sm text-gray-300">${award.description}</p>
                                </div>
                            </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    </section>`;
    }

    // Generate Akademische Laufbahn section
    generateAkademischeLaufbahn() {
        const academicItems = this.data.academic || [];

        return `<section id="akademische-laufbahn" class="py-16 bg-accent">
        <div class="max-w-7xl mx-auto px-6">
            <h2 class="text-4xl font-headline font-bold text-primary mb-12 text-center">Akademische Laufbahn</h2>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${academicItems.map(item => `
                <div class="bg-white rounded-lg p-8 shadow-lg">
                    <div class="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-6">
                        <i class="${item.icon || 'fas fa-graduation-cap'} text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-primary mb-4">${item.title}</h3>
                    <p class="text-text-secondary mb-4">${item.description}</p>
                    ${item.details ? `<p class="text-sm text-text-secondary font-medium">${item.details}</p>` : ''}
                    ${item.list ? `
                    <ul class="text-sm text-text-secondary space-y-2 mt-4">
                        ${item.list.map(listItem => `<li>• ${listItem}</li>`).join('')}
                    </ul>
                    ` : ''}
                </div>
                `).join('')}
            </div>
        </div>
    </section>`;
    }

    // Generate Publikationen section
    generatePublikationen() {
        const publications = this.data.publications || [];

        return `<section id="publikationen" class="py-16 bg-accent">
        <div class="max-w-7xl mx-auto px-6">
            <h2 class="text-4xl font-headline font-bold text-primary mb-12 text-center">Veröffentlichungen (Auswahl)</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                ${publications.map((pub, index) => `
                <div class="bg-white rounded-lg p-8 shadow-lg transition-shadow flex flex-col relative">
                    ${pub.links ? `
                    <div class="absolute top-4 right-4">
                        <a href="${pub.links[0]}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors">
                            <i class="fas fa-external-link-alt text-sm"></i>
                        </a>
                    </div>
                    ` : ''}
                    <div class="flex items-start space-x-4 mb-4 ${pub.links ? 'pr-12' : ''}">
                        ${pub.coverImage ? `
                        <img src="${pub.coverImage}" alt="${pub.title}" class="w-16 h-24 object-cover rounded shadow-md flex-shrink-0">
                        ` : `
                        <div class="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-book text-white"></i>
                        </div>
                        `}
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-primary leading-tight mb-2">${pub.title}</h3>
                            ${pub.coverImage ? `
                            <p class="text-text-secondary text-sm leading-relaxed">${pub.description}</p>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${!pub.coverImage ? `<p class="text-text-secondary text-sm mb-4 leading-relaxed">${pub.description}</p>` : ''}
                    
                    ${pub.details ? `<p class="text-xs text-text-secondary mb-4 italic">${pub.details}</p>` : ''}
                    
                    ${pub.tags ? `
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${pub.tags.map(tag => `<span class="bg-secondary text-white px-2 py-1 rounded-full text-xs">${tag}</span>`).join('')}
                    </div>
                    ` : ''}
                    
                    ${pub.list ? `
                    <ul class="space-y-1 text-text-secondary text-sm list-disc list-inside">
                        ${pub.list.map(listItem => `<li class="leading-relaxed">${listItem}</li>`).join('')}
                    </ul>
                    ` : ''}
                </div>
                `).join('')}
            </div>
        </div>
    </section>`;
    }

    // Generate Forschungsschwerpunkte section
    generateForschungsschwerpunkte() {
        const researchAreas = this.data.researchAreas || [];

        return `<section id="forschungsschwerpunkte" class="py-16 bg-gradient-section-dark text-white">
        <div class="max-w-7xl mx-auto px-6">
            <h2 class="text-4xl font-headline font-bold mb-12 text-center">Forschungsschwerpunkte</h2>
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                ${researchAreas.map(area => `
                <div class="text-center">
                    <div class="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="${area.icon || 'fas fa-search'} text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold mb-4">${area.title}</h3>
                    <p class="text-gray-300">${area.description}</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>`;
    }


    // Generate quote section
    generateQuote() {
        const quotes = [
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
        
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        return `<!-- Quote Section -->
<section id="inspiration" class="py-20" style="background-color: #F25C3C; min-height: 300px; display: flex; align-items: center;">
    <div class="container mx-auto px-6">
        <div class="max-w-4xl mx-auto text-center">
            <blockquote class="font-highlight text-2xl lg:text-3xl text-white mb-8 italic leading-relaxed">
                „${randomQuote}"
            </blockquote>
            <cite class="text-xl text-white font-semibold">
                – Adolf Schlatter
            </cite>
        </div>
    </div>
</section>`;
    }

    // Generate footer using Footer Component
    generateFooter() {
        return `<!-- Footer -->
<div id="footer-container">
    <!-- Footer wird hier eingefügt -->
</div>`;
    }

    // Generate JavaScript
    generateScripts() {
        return `<script>
        function toggleAccordion(accordionId) {
            const content = document.getElementById(accordionId);
            const icon = document.getElementById('icon' + accordionId.slice(-1));
            
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon.style.transform = 'rotate(180deg)';
            } else {
                content.classList.add('hidden');
                icon.style.transform = 'rotate(0deg)';
            }
        }
    </script>

    <!-- Mobile Menu Script -->
    <script>
        // Mobile Menu functionality
        document.addEventListener('DOMContentLoaded', function() {
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
        });
    </script>

    <!-- Appbar Utils -->
    <script src="../components/appbar-utils.js"></script>
    <!-- Footer Utils -->
    <script src="../components/footer-utils.js"></script>
    <script>
        // Appbar und Footer laden
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                if (window.appbarManager) {
                    window.appbarManager.insertAppbar('appbar-container');
                }
                
                if (window.footerManager) {
                    window.footerManager.insertFooter('footer-container', {
                        description: "Preisträger des Adolf-Schlatter-Preises für Förderung christlicher Theologie und herausragende wissenschaftliche Arbeiten."
                    });
                }
            }, 50);
        });
    </script>`;
    }

    // Generate YouTube embed URL from watch URL
    getYouTubeEmbedUrl(url) {
        const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
        if (videoIdMatch && videoIdMatch[1]) {
            return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
        }
        return url;
    }
}

// Export for use in individual pages
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PreistraegerPageBuilder;
}

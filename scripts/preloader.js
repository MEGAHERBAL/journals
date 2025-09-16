class JournalsPreloader {
    constructor() {
        this.artistBios = new Map();
        this.preloadedPages = new Map();
        this.currentArtist = null;
        this.transitionState = 'idle';
        this.pendingTimeouts = [];

        this.artists = [
            { name: "pearl lump", bio: "04 01 half vampire", url: "//pearllump.journals.network", preloadUrl: "members/pearllump.html" },
            { name: "Llythyryn Mud", bio: "𓆏𓆏𓆏", url: "//llythyrynmud.journals.network", preloadUrl: "members/llythyrynmud.html" },
            { name: "tilde", bio: "~", url: "//tilde.journals.network", preloadUrl: "members/tilde.html" },
            { name: "Expoded", bio: "Sonic Realms Emerge from Decay", url: "//expoded.journals.network", preloadUrl: "members/expoded.html" },
            { name: "Voidsong", bio: "", url: "//voidsong.journals.network", preloadUrl: "members/voidsong.html" },
            { name: "MEGAHERB", bio: "sine scavenger : byte bungler\n\n🌿\n\nit's safe to rest here", url: "//megaherb.journals.network", preloadUrl: "members/megaherb.html" },
            { name: "TWELVE", bio: "Hi, I'm TWELVE. I've been producing for over 15 years and specialise in mixing, mastering, and sound design. From Drum & Bass and Dubstep to House and Techno, experimental genres and beyond, I like toying with all sorts of digital audio.\n\nI'm all about collaboration and when I'm not working on client projects, I'm diving deep into sound design, crafting custom patches, creating powerful drums and sample packs, synthesising new textures, and constantly exploring new ways to shape audio. For me, it's all about innovation and constantly evolving my sound whilst keeping an ear to the ground on what's fresh and exciting.", url: "//twelve.journals.network", preloadUrl: "members/twelve.html" },
            { name: "klarigon", bio: "Klarigon is the MC/producer duo project of ~ and Klara Stereobub. Klara raps, ~ beats.", url: "//klarigon.journals.network", preloadUrl: "members/klarigon.html" },
            { name: "Ruby", bio: "I'm (she/her) a multimedia artist that has a strong fascination with computers and audio software. Ever since I was a small child I've always been in love with computers and the art of making them do things. What started as just playing around with settings in the windows control panel on the family computer has blossomed into playing with web and game development, electronic music production, and various types of digitally rendered visuals.\n\nThis past year or so I've really been pushing myself to get good at music production, with the hopes of turning it into my full-time career. I've been documenting the things I learn along the way, and of course have been steadily releasing my finished songs.", url: "//ruby.journals.network", preloadUrl: "members/ruby.html" },
            { name: "new universe naomi", bio: "ᜈᜂᜋᜒ\n\nmusic / game dev / muse\n\nCarbonMade™\n\nshe-her / it-its", url: "//newuniverse.journals.network", preloadUrl: "members/newuniverse.html" }
        ];

        this.elements = {
            title: document.getElementById('title'),
            bioContent: document.getElementById('bio-content'),
            youtubeEmbed: document.getElementById('youtube-embed'),
            centralView: document.getElementById('central-view')
        };

        this.preloadArtistBios();
        this.setupEventListeners();
    }

    preloadArtistBios() {
        this.artists.forEach(artist => {
            this.artistBios.set(artist.name, artist.bio);
        });
    }

    clearPendingTimeouts() {
        this.pendingTimeouts.forEach(clearTimeout);
        this.pendingTimeouts = [];
    }

    addTimeout(callback, delay) {
        const timeoutId = setTimeout(() => {
            callback();
            this.pendingTimeouts = this.pendingTimeouts.filter(id => id !== timeoutId);
        }, delay);
        this.pendingTimeouts.push(timeoutId);
        return timeoutId;
    }

    async preloadPage(url) {
        if (this.preloadedPages.has(url)) {
            return this.preloadedPages.get(url);
        }

        try {
            const response = await fetch(url);
            const html = await response.text();
            this.preloadedPages.set(url, html);
            return html;
        } catch (error) {
            console.error(`Failed to preload page: ${url}`, error);
            return '';
        }
    }

    setupEventListeners() {
        const artistLinks = document.querySelectorAll('a[data-artist]');

        artistLinks.forEach(link => {
            const artistName = link.getAttribute('data-artist');
            const url = link.getAttribute('href');

            if (!artistName || !url) return;

            const artist = this.artists.find(a => a.name === artistName);
            if (!artist) return;

            link.addEventListener('mouseenter', () => {
                this.handleArtistHover(artistName, artist.preloadUrl);
            });

            link.addEventListener('mouseleave', () => {
                this.handleArtistLeave();
            });

            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleArtistClick(url, artist.preloadUrl);
            });
        });

        window.addEventListener('popstate', () => {
            window.location.reload();
        });
    }

    handleArtistHover(artistName, preloadUrl) {
        this.clearPendingTimeouts();
        this.currentArtist = artistName;
        this.transitionState = 'hovering';

        this.preloadPage(preloadUrl);

        this.elements.title.classList.add('fade-glow');
        this.addTimeout(() => {
            if (this.currentArtist === artistName) {
                this.elements.title.style.opacity = '0';
                this.addTimeout(() => {
                    if (this.currentArtist === artistName) {
                        this.elements.title.textContent = artistName;
                        this.elements.title.style.opacity = '1';
                        this.addTimeout(() => {
                            if (this.currentArtist === artistName) {
                                this.elements.title.classList.remove('fade-glow');
                            }
                        }, 100);
                    }
                }, 100);
            }
        }, 100);

        this.elements.youtubeEmbed.style.opacity = '0';
        this.elements.bioContent.classList.remove('show');

        this.addTimeout(() => {
            if (this.currentArtist === artistName && this.transitionState === 'hovering') {
                const bio = this.artistBios.get(artistName) || 'No bio available';
                const bioClass = (artistName === 'MEGAHERB' || artistName === 'new universe naomi') ? 'bio-text centered' : 'bio-text';
                this.elements.bioContent.innerHTML = `<div class="${bioClass}">${bio.replace(/\n/g, '<br>')}</div>`;
                this.elements.bioContent.classList.add('show');
            }
        }, 150);
    }

    handleArtistLeave() {
        if (!this.currentArtist) return;

        this.clearPendingTimeouts();
        this.currentArtist = null;
        this.transitionState = 'leaving';

        this.elements.title.classList.add('fade-glow');
        this.addTimeout(() => {
            if (!this.currentArtist) {
                this.elements.title.style.opacity = '0';
                this.addTimeout(() => {
                    if (!this.currentArtist) {
                        this.elements.title.textContent = 'JOURNALS';
                        this.elements.title.style.opacity = '1';
                        this.addTimeout(() => {
                            if (!this.currentArtist) {
                                this.elements.title.classList.remove('fade-glow');
                            }
                        }, 100);
                    }
                }, 100);
            }
        }, 100);

        this.elements.bioContent.classList.remove('show');
        this.addTimeout(() => {
            if (!this.currentArtist && this.transitionState === 'leaving') {
                this.elements.youtubeEmbed.style.opacity = '1';
                this.transitionState = 'idle';
            }
        }, 300);
    }

    async handleArtistClick(url, preloadUrl) {
        const preloadedHtml = await this.preloadPage(preloadUrl);
        
        if (preloadedHtml) {
            // Replace entire document with preloaded content instantly
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = preloadedHtml;
            const newDocumentContent = tempDiv.querySelector('html') || tempDiv;
            document.documentElement.innerHTML = newDocumentContent.innerHTML;
            
            // Then immediately redirect to the actual URL
            window.location.href = url;
        } else {
            window.location.href = url;
        }
    }
}

// Safari bfcache handling - must be outside class?
window.onpageshow = function (event) {
    if (event.persisted) {
        window.location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    new JournalsPreloader();
});
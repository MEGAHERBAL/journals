# journals (very WIP!)

## Info
journals.network is a website free for any members of the journals collective to host their content, or share links to where their content can be found. The index will serve as a minimal showcase of journals related art and artist bios for members. Any member is welcome to request a subdomain (e.g. MEGAHERB.journals.network). A template page will be provided, but you are welcome to customise your page however you like. This is a public web page, please be careful not to share any information you don't want publicly available (don't dox yourself). Please don't host any illegal or nsfw content. 

This repository uses cloudflare pages to host the site. Contributions/pull requests are welcome, but feel free to ask me (Jordan/MEGAHERB) to make any changes on your behalf. I'm not primarily a web developer but I'll do my best to accommodate any requests swiftly. Please be aware that cloudflare pages has a maximum filesize of 25 mb. This can be worked around if necessary, so let me know if you need to host larger files, but note that this is not intended as a file hosting service. Anything external can be embedded (youtube videos, soundcloud tracks, etc.).

## In Progress
- ~~Initial commit and updated readme~~ 
- ~~Domain registered~~
- ~~Index page finished~~
- ~~Member bio/hover behaviour implemented on index~~
- ~~Google forms for member info~~
- ~~Subdomain template finished~~
- ~~All custom subdomains added~~
- Mobile layout implemented

## Performance Optimisations
I intend for the site to be fast and minimal, at least for now. I'll provide a list of optimisations I intend to implement. This is primarily for my own reference, but if you're submitting a pull request it might be worth keeping these in mind. Some of these will result in messy source code but imo that's okay since it's a small site.
- Inline CSS/styling
- Subdomain html preloading on hover and instant load on click
- Artist bio/content preloading on initial page load
class Tenor {
    baseUrl = "https://tenor.com";

    constructor(fetchPath, cheerioPath, browser) {
        this.browser = browser;
    }

    async fetchSearchResult(query = "hello", page = 1, perPage = 48) {
        const url = `${this.baseUrl}/search/${query.replace(" ", "-")}-gifs`;
        const data = await this.browser.scrape(
            url,
            () => {
                const items = document.querySelectorAll('.UniversalGifListItem');
                const results = [];

                items.forEach(fig => {
                    const link = fig.querySelector('a');
                    const img = fig.querySelector('img');
                    if (!link || !img) return;

                    const href = link.getAttribute('href') || "";

                    let idMatch = href.match(/-(\d+)(?:$|\/?$)/);
                    const id = idMatch ? idMatch[1] : null;

                    const imgUrl = img.getAttribute('src');
                    const tagsRaw = img.getAttribute('alt') || "";
                    const tags = tagsRaw.trim().split(/\s+/).filter(Boolean);

                    if (id && imgUrl) {
                        results.push({
                            id,
                            image: imgUrl,
                            sampleImageUrl: imgUrl,
                            tags,
                            type: "preview"
                        });
                    }
                });

                const hasNextPage = false;

                return { results, hasNextPage };
            },
            { waitSelector: '.UniversalGifListItem', timeout: 15000 }
        );

        return {
            results: data.results,
            hasNextPage: data.hasNextPage,
            page
        };
    }

    async fetchInfo(id) {
        const url = `${this.baseUrl}/view/gif-${id}`;

        const data = await this.browser.scrape(
            url,
            () => {
                const img = document.querySelector('img[alt]');
                const fullImage = img?.src || null;

                const tags = [...document.querySelectorAll('.tag-list li a .RelatedTag')]
                    .map(tag => tag.textContent.trim())
                    .filter(Boolean);

                let createdAt = Date.now();

                const detailNodes = [...document.querySelectorAll('.gif-details dd')];
                const createdNode = detailNodes.find(n => n.textContent.includes("Created:"));

                if (createdNode) {
                    const raw = createdNode.textContent.replace("Created:", "").trim();
                    const parts = raw.split(/[\/,: ]+/);
                    // [dd, mm, yyyy, HH, MM, SS]
                    if (parts.length >= 6) {
                        let [dd, mm, yyyy, hh, min, ss] = parts.map(p => parseInt(p, 10));
                        createdAt = new Date(yyyy, mm - 1, dd, hh, min, ss).getTime();
                    }
                }

                return {
                    fullImage,
                    tags,
                    createdAt
                };
            }
        );

        return {
            id,
            fullImage: data.fullImage,
            tags: data.tags,
            createdAt: data.createdAt,
            rating: "Unknown"
        };
    }
}

module.exports = { Tenor };
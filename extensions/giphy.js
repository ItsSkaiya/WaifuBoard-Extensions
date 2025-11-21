class Giphy {
    baseUrl = "https://giphy.com";

    constructor(fetchPath, cheerioPath, browser) {
        this.browser = browser;
    }

    async fetchSearchResult(query = "hello", page = 1, perPage = 48) {
        const url = `${this.baseUrl}/search/${query.trim().replace(/\s+/g, "-")}`;

        const data = await this.browser.scrape(
            url,
            () => {
                const items = document.querySelectorAll('a[data-giphy-id]');
                const results = [];

                items.forEach(el => {
                    const id = el.getAttribute('data-giphy-id');

                    const srcWebp = el.querySelector('source[type="image/webp"]');
                    const srcImg = el.querySelector('img');

                    const imgUrl =
                        srcWebp?.getAttribute("srcset")?.split(" ")[0] ||
                        srcImg?.src ||
                        null;

                    if (!imgUrl) return;

                    const alt = srcImg?.getAttribute("alt") || "";
                    const tags = alt.trim().split(/\s+/).filter(Boolean);

                    results.push({
                        id,
                        image: imgUrl,
                        sampleImageUrl: imgUrl,
                        tags,
                        type: "preview"
                    });
                });

                return {
                    results,
                    hasNextPage: false
                };
            },
            { waitSelector: 'a[data-giphy-id]', timeout: 15000 }
        );

        return {
            results: data.results,
            hasNextPage: data.hasNextPage,
            page
        };
    }

    async fetchInfo(id) {
        const url = `${this.baseUrl}/gifs/${id}`;

        const data = await this.browser.scrape(
            url,
            () => {
                let fullImage = null;

                // Webp
                const srcWebp = document.querySelector('picture source[type="image/webp"]');
                if (srcWebp?.srcset) { fullImage = srcWebp.srcset.split(" ")[0] }

                // Fallback GIF
                if (!fullImage) {
                    const img = document.querySelector('picture img');
                    if (img?.src && !img.src.startsWith("data:")) { fullImage = img.src }
                }

                const tagElements = document.querySelectorAll('.group.flex.flex-wrap a .font-bold');

                const tags = [...tagElements].map(t => t.textContent.trim()) .filter(Boolean);
                const createdAt = Date.now();

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

module.exports = { Giphy };
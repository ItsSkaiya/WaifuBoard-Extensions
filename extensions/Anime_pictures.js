class Anime_pictures {
    baseUrl = "https://anime-pictures.net";

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    constructor(fetchPath, cheerioPath, browser) {
        this.browser = browser;
    }

    async fetchSearchResult(query = "thighs", page = 1, perPage = 48) {
        const url = `${this.baseUrl}/posts?page=${page - 1}&search_tag=${query}&order_by=date&lang=en`;
        const data = await this.browser.scrape(
            url,
            () => {
                const items = document.querySelectorAll('.img-block.img-block-big');
                const results = [];

                items.forEach(div => {
                    const link = div.querySelector('a');
                    const img = div.querySelector('img');
                    if (!link || !img) return;

                    let href = link.getAttribute('href') || "";
                    let idMatch = href.match(/\/posts\/(\d+)/);
                    let id = idMatch ? idMatch[1] : null;

                    let imgUrl = img.getAttribute('src');

                    let tagsRaw = img.getAttribute('alt') || "";
                    let tags = tagsRaw.trim().split(/\s+/).filter(Boolean);

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

                const nextPageBtn = document.querySelector('.numeric_pages a.desktop_only');
                const hasNextPage = !!nextPageBtn;

                return { results, hasNextPage };
            },
            { waitSelector: '.img-block.img-block-big', timeout: 15000 }
        );

        return {
            results: data.results,
            hasNextPage: data.hasNextPage,
            page
        };
    }

    async fetchInfo(id) {
        const url = `${this.baseUrl}/posts/${id}?lang=en`;

        const data = await this.browser.scrape(
            url,
            () => {
                const img = document.querySelector('#big_preview');
                const fullImage = img ? img.src : null;

                const tagLinks = document.querySelectorAll('.tags li a');
                const tags = [...tagLinks].map(a => a.textContent.trim());

                return { fullImage, tags };
            },
            { waitSelector: '#big_preview', timeout: 15000 }
        );

        return {
            id,
            fullImage: data.fullImage,
            tags: data.tags,
            createdAt: Date.now(),
            rating: "Unknown"
        };
    }
}

module.exports = { Anime_pictures };
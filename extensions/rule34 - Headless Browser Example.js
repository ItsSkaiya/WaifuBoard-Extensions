class Rule34Headless {
    baseUrl = "https://rule34.xxx";
    name = "Rule34 (Headless)";

    constructor(fetchPath, cheerioPath, browser) {
        this.browser = browser; 
    }

    async fetchSearchResult(query, page = 1) {
        if (!query) query = "alisa_mikhailovna_kujou";

        const perPage = 42;
        const offset = (page - 1) * perPage;
        const url = `${this.baseUrl}/index.php?page=post&s=list&tags=${query}&pid=${offset}`;

        console.log(`[Rule34-Headless] Navigating to: ${url}`);

        const data = await this.browser.scrape(
            url,
            () => {
                const results = [];
                const items = document.querySelectorAll('.image-list span');

                items.forEach((item) => {
                    const idRaw = item.getAttribute('id'); 
                    const id = idRaw ? idRaw.replace('s', '') : null;

                    const imgElement = item.querySelector('img');
                    if (!imgElement) return;

                    let imgUrl = imgElement.getAttribute('src') || imgElement.src;

                    if (imgUrl) {
                        if (imgUrl.startsWith('//')) {
                            imgUrl = 'https:' + imgUrl;
                        } else if (!imgUrl.startsWith('http')) {
                            imgUrl = 'https:' + imgUrl;
                        }
                    }

                    const tagsRaw = imgElement.getAttribute('alt') || "";
                    const tags = tagsRaw.trim().split(' ').filter(t => t.length > 0);

                    if (id && imgUrl) {
                        results.push({
                            id: id,
                            image: imgUrl,        
                            sampleImageUrl: imgUrl, 
                            tags: tags,
                            type: 'preview'
                        });
                    }
                });

                const nextLink = document.querySelector('#paginator a[alt="next"]');
                const hasNextPage = !!nextLink;

                return { results, hasNextPage };
            },
            { waitSelector: '.image-list', timeout: 15000 }
        );

        return {
            results: data.results,
            hasNextPage: data.hasNextPage,
            page: page
        };
    }

    async fetchInfo(id) {
        return {
            id: id,
            fullImage: `${this.baseUrl}/index.php?page=post&s=view&id=${id}`,
            tags: ["headless"],
            createdAt: Date.now(),
            rating: "Unknown"
        };
    }
}

module.exports = { Rule34Headless };
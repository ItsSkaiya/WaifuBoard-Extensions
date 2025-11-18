class Realbooru {

    baseUrl = "https://realbooru.com"; 

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    constructor(fetchPath, cheerioPath) {
        this.fetch = require(fetchPath);
        this.cheerio = require(cheerioPath); 
    }

    LoadDoc(body) {
        return this.cheerio.load(body);
    }

    async fetchSearchResult(query, page = 1, perPage = 42) { 
        if (!query) query = "original"; 

        const offset = (page - 1) * perPage;
        const url = `${this.baseUrl}/index.php?page=post&s=list&tags=${query}&pid=${offset}`;

        try {
            const response = await this.fetch(url, { headers: this.headers });
            const data = await response.text();

            const $ = this.cheerio.load(data);

            const results = [];

            $('#post-list a[id^="p"], #post-list a[href*="&s=view"], .thumb a').each((i, e) => {
                const $a = $(e);

                const href = $a.attr('href');
                let id = null;
                if (href) {
                    const idMatch = href.match(/&id=(\d+)/);
                    if (idMatch) {
                        id = idMatch[1];
                    }
                }

                if (!id) {
                    id = $a.closest('span, div').attr('id')?.replace('s', '').replace('post_', '');
                }

                const imageElement = $a.find('img').first();
                let image = imageElement.attr('src');

                if (image && !image.startsWith('http')) {
                    image = `https:${image}`;
                }

                let tags = imageElement.attr('alt')?.trim()?.split(' ').filter(tag => tag !== "");
                if (!tags || tags.length === 0) {
                    tags = $a.attr('title')?.trim()?.split(' ').filter(tag => tag !== "");
                }

                if (id && image) {
                    results.push({
                        id: id,
                        image: image, 
                        tags: tags,
                        type: 'preview'
                    });
                }
            });

            const pagination = $('#paginator .pagination');
            const lastPageLink = pagination.find('a[alt="last page"]');
            let totalPages = 1;

            if (lastPageLink.length > 0) {
                const pid = lastPageLink.attr('href')?.split('pid=')[1];
                totalPages = Math.ceil(parseInt(pid || "0", 10) / perPage) + 1;
            } else {
                const pageLinks = pagination.find('a');
                if (pageLinks.length > 0) {
                     const lastLinkText = pageLinks.eq(-2).text();
                     totalPages = parseInt(lastLinkText, 10) || 1;
                } else if (results.length > 0) {
                     totalPages = 1; 
                }
            }

            const currentPage = page;
            const hasNextPage = currentPage < totalPages;
            const next = hasNextPage ? (currentPage + 1) : 0;
            const previous = currentPage > 1 ? (currentPage - 1) : 0;

            const total = totalPages * perPage; 

            return { total, next, previous, pages: totalPages, page: currentPage, hasNextPage, results };

        } catch (e) {
            console.error("Error during Realbooru search:", e);

            return { total: 0, next: 0, previous: 0, pages: 1, page: 1, hasNextPage: false, results: [] };
        }
    }

    async fetchInfo(id) {
        const url = `${this.baseUrl}/index.php?page=post&s=view&id=${id}`;

        const fetchHeaders = { ...this.headers };

        const response = await this.fetch(url, { headers: fetchHeaders });
        const original = await response.text();

        const $ = this.cheerio.load(original);

        let fullImage = $('#image').attr('src') || $('video').attr('src');

        const originalLink = $('div.link-list a:contains("Original image")').attr('href');
        if (originalLink) {
            fullImage = originalLink;
        }

        if (fullImage && !fullImage.startsWith('http')) {
            fullImage = `https:${fullImage}`;
        }

        let resizedImageUrl = $('#image-holder img').attr('src');
        if (resizedImageUrl && !resizedImageUrl.startsWith('http')) {
            resizedImageUrl = `https:${resizedImageUrl}`;
        } else if (!resizedImageUrl) {

            resizedImageUrl = fullImage;
        }

        const tags = $('.tag-list a.tag-link').map((i, el) => $(el).text().trim()).get();

        const stats = $('#stats ul');

        const postedData = stats.find("li:contains('Posted:')").text().trim();
        const postedDateMatch = postedData.match(/Posted: (.*?) by/);
        const createdAt = postedDateMatch ? new Date(postedDateMatch[1]).getTime() : undefined;

        const publishedByMatch = postedData.match(/by\s*(.*)/);
        const publishedBy = publishedByMatch ? publishedByMatch[1].trim() : undefined;

        const rating = stats.find("li:contains('Rating:')").text().trim().split("Rating: ")[1] || undefined;

        const comments = $('#comment-list div').map((i, el) => {
            const $el = $(el);
            const id = $el.attr('id')?.replace('c', '');
            const user = $el.find('.col1').text().trim().split("\n")[0];
            const comment = $el.find('.col2').text().trim();
            if (id && user && comment) {
                return { id, user, comment };
            }
            return null;
        }).get().filter(Boolean);

        return {
            id,
            fullImage,
            resizedImageUrl,
            tags,
            createdAt,
            publishedBy,
            rating,
            comments
        };
    }
}

module.exports = { Realbooru };
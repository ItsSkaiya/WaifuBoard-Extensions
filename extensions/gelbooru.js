class Gelbooru {
    baseUrl = "https://gelbooru.com";

    constructor(fetchPath, cheerioPath) {
        this.fetch = require(fetchPath);
        this.load = require(cheerioPath).load;
    }

    async fetchSearchResult(query, page = 1, perPage = 42) {
        if (!query) query = "original";

        const url = `${this.baseUrl}/index.php?page=post&s=list&tags=${query}&pid=${(page - 1) * perPage}`;

        const response = await this.fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const data = await response.text();

        const $ = this.load(data); 

        const results = [];

        $('.thumbnail-container a').each((i, e) => {
            const $e = $(e);
            const href = $e.attr('href');

            const idMatch = href.match(/id=(\d+)/);
            const id = idMatch ? idMatch[1] : null;

            const image = $e.find('img').attr('src');

            const tags = $e.find('img').attr('alt')?.trim()?.split(' ').filter(tag => tag !== "");

            if (id && image) {
                results.push({
                    id: id,
                    image: image,
                    tags: tags,
                    type: 'preview'
                });
            }
        });

        const pagination = $('.pagination a');

        let totalPages = 1;
        pagination.each((i, e) => {
            const href = $(e).attr('href');
            if (href && href.includes('pid=')) {
                const pidMatch = href.match(/pid=(\d+)/);
                if (pidMatch) {
                    const pid = parseInt(pidMatch[1], 10);
                    totalPages = Math.max(totalPages, Math.floor(pid / perPage) + 1);
                }
            }
        });

        const currentPage = page;
        const nextPage = currentPage < totalPages ? currentPage + 1 : null;
        const previousPage = currentPage > 1 ? currentPage - 1 : null;
        const hasNextPage = nextPage !== null;

        return { 
            total: totalPages * perPage, 
            next: nextPage !== null ? nextPage : 0, 
            previous: previousPage !== null ? previousPage : 0, 
            pages: totalPages, 
            page: currentPage, 
            hasNextPage, 
            results 
        };
    }

    async fetchInfo(id) {
        const url = `${this.baseUrl}/index.php?page=post&s=view&id=${id}`;

        const response = await this.fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const original = await response.text();

        const $ = this.load(original); 

        let fullImage;

        fullImage = $('#gelcom_img').attr('src') || $('#gelcom_mp4').attr('src');

        if (!fullImage) {
            fullImage = $('#right-col a[href*="/images/"]').attr('href') || $('#right-col a[href*="/videos/"]').attr('href');
        }

        if (fullImage && fullImage.startsWith('/')) {
            fullImage = new URL(fullImage, this.baseUrl).href;
        }

        const tagsList = $('#tag-list a');
        const tags = tagsList.map((i, el) => $(el).text().trim()).get();

        const stats = $('#post-view-image-container + br + br + br + br + ul, #stats');

        const postedData = stats.find("li:contains('Posted:')").text().trim();
        const createdAt = new Date(postedData.split("Posted: ")[1]).getTime();

        const publishedBy = stats.find("li:contains('User:') a").text().trim() || null;

        const rating = stats.find("li:contains('Rating:')").text().trim().split("Rating: ")[1];

        const comments = $('#comment-list .comment').map((i, el) => {
            const $e = $(el);
            const id = $e.attr('id')?.replace('c', '');
            const user = $e.find('.comment-user a').text().trim();
            const comment = $e.find('.comment-body').text().trim();
            return {
                id,
                user,
                comment,
            }
        }).get().filter(Boolean).filter((comment) => comment.comment !== '');

        return {
            id,
            fullImage,
            resizedImageUrl: fullImage, 
            tags,
            createdAt,
            publishedBy,
            rating,

            comments
        }
    }
}

module.exports = { Gelbooru };

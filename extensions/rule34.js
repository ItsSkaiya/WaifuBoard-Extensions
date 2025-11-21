class Rule34 {
    baseUrl = "https://rule34.xxx";

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    constructor(fetchPath, cheerioPath) {
        this.fetch = require(fetchPath);
        this.cheerio = require(cheerioPath); 
        this.type = "image-board";
    }

    async fetchSearchResult(query, page = 1, perPage = 42) { 
        if (!query) query = "alisa_mikhailovna_kujou";

        const offset = (page - 1) * perPage;
        const url = `${this.baseUrl}/index.php?page=post&s=list&tags=${query}&pid=${offset}`;

        const response = await this.fetch(url, { headers: this.headers });
        const data = await response.text();

        const $ = this.cheerio.load(data);

        const results = [];

        $('.image-list span').each((i, e) => {
            const $e = $(e);
            const id = $e.attr('id')?.replace('s', '');

            let image = $e.find('img').attr('src');
            if (image && !image.startsWith('http')) {
                image = `https:${image}`;
            }

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
    }

    async fetchInfo(id) {
        const url = `${this.baseUrl}/index.php?page=post&s=view&id=${id}`;

        const resizeCookies = {
            'resize-notification': 1,
            'resize-original': 1
        };

        const cookieString = Object.entries(resizeCookies).map(([key, value]) => `${key}=${value}`).join('; ');

        const fetchHeaders = { ...this.headers };
        const resizeHeaders = { ...this.headers, 'cookie': cookieString };

        const [resizedResponse, nonResizedResponse] = await Promise.all([
            this.fetch(url, { headers: resizeHeaders }), 
            this.fetch(url, { headers: fetchHeaders })  
        ]);

        const [resized, original] = await Promise.all([resizedResponse.text(), nonResizedResponse.text()]);

        const $resized = this.cheerio.load(resized);
        const $ = this.cheerio.load(original);

        let resizedImageUrl = $resized('#image').attr('src');
        if (resizedImageUrl && !resizedImageUrl.startsWith('http')) {
            resizedImageUrl = `https:${resizedImageUrl}`;
        }

        let fullImage = $('#image').attr('src');
        if (fullImage && !fullImage.startsWith('http')) {
            fullImage = `https:${fullImage}`;
        }

        const tags = $('#image').attr('alt')?.trim()?.split(' ').filter(tag => tag !== "");
        const stats = $('#stats ul');

        const postedData = stats.find('li:nth-child(2)').text().trim();
        const createdAt = new Date(postedData.split("Posted: ")[1].split("by")[0]).getTime();
        const publishedBy = postedData.split("by")[1].trim();
        const rating = stats.find("li:contains('Rating:')").text().trim().split("Rating: ")[1];

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

module.exports = { Rule34 };
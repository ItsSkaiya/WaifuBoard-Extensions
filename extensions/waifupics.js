class WaifuPics {
    baseUrl = "https://api.waifu.pics";

    SFW_CATEGORIES = [
        'waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo',
        'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave',
        'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick',
        'happy', 'wink', 'poke', 'dance', 'cringe'
    ];

    constructor(fetchPath, cheerioPath) {
        this.fetch = require(fetchPath);
        this.type = "image-board";
    }

    async fetchSearchResult(query, page = 1, perPage = 42) {
        if (!query) query = "waifu"; 

        const category = query.trim().split(' ')[0];

        if (!this.SFW_CATEGORIES.includes(category)) {
            console.warn(`[WaifuPics] Category '${category}' not supported.`);

            return {
                total: 0,
                next: 0,
                previous: 0,
                pages: 1,
                page: 1,
                hasNextPage: false,
                results: []
            };
        }

        try {

            const response = await this.fetch(`${this.baseUrl}/many/sfw/${category}`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exclude: [] }), 
            });

            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${await response.text()}`);
            }

            const data = await response.json(); 

            const results = data.files.map((url, index) => {

                const id = url.substring(url.lastIndexOf('/') + 1) || `${category}-${index}`;
                const uniqueId = `${page}-${id}`;

                return {
                    id: uniqueId,
                    image: url,      
                    tags: [category], 
                    type: 'preview'
                };
            });

            return {
                total: 30, 
                next: page + 1,   
                previous: page > 1 ? page - 1 : 0, 
                pages: page + 1,  
                page: page,
                hasNextPage: true, 
                results: results
            };

        } catch (error) {
            console.error(`[WaifuPics] Error fetching images:`, error);
            return {
                total: 0,
                next: 0,
                previous: 0,
                pages: 1,
                page: 1,
                hasNextPage: false,
                results: []
            };
        }
    }

    async fetchInfo(id) {
        console.log(`[WaifuPics] fetchInfo called for ${id}, but this API only provides direct URLs.`);
        return {
            id: id,
            fullImage: `https://i.waifu.pics/${id}`, 
            resizedImageUrl: `https://i.waifu.pics/${id}`,
            tags: [],
            createdAt: null,
            publishedBy: 'Waifu.pics',
            rating: 'sfw',
            comments: []
        };
    }
}

module.exports = { WaifuPics };
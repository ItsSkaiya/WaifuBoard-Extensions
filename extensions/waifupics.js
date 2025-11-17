/*
  WaifuPics.js
  This is an extension for the waifu.pics API.
  It's different from a scraper, as it fetches from a JSON API.
  To search, you must use one of the SFW_CATEGORIES as your search query.
*/

class WaifuPics {
    baseUrl = "https://api.waifu.pics";

    // List of SFW categories supported by the API
    SFW_CATEGORIES = [
        'waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo',
        'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave',
        'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick',
        'happy', 'wink', 'poke', 'dance', 'cringe'
    ];

    constructor(baseURL) {
        if (baseURL) {
            if (baseURL.startsWith("http") || baseURL.startsWith("https://")) {
                this.baseUrl = baseURL;
            } else {
                this.baseUrl = `http://${baseURL}`;
            }
        }
    }

    // This is the main function the app calls
    async fetchSearchResult(query, page = 1, perPage = 42) {
        if (!query) query = "waifu"; // Default search

        // Use the first tag in the search query as the category
        const category = query.trim().split(' ')[0];

        // Check if the category is one of the valid SFW categories
        if (!this.SFW_CATEGORIES.includes(category)) {
            console.warn(`[WaifuPics] Category '${category}' not supported.`);
            // Return an empty result set
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
            // Use the "many" endpoint to get 30 images
            const response = await fetch(`${this.baseUrl}/many/sfw/${category}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exclude: [] }), // 'exclude' is required
            });

            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${await response.text()}`);
            }

            const data = await response.json(); // e.g., { files: ['url1', 'url2', ...] }

            // We must convert the API's array of URLs into the format the app expects
            const results = data.files.map((url, index) => {
                // Try to get a unique ID from the filename, and make it unique per page
                const id = url.substring(url.lastIndexOf('/') + 1) || `${category}-${index}`;
                const uniqueId = `${page}-${id}`;
                
                return {
                    id: uniqueId,
                    image: url,      // The thumbnail is the full image
                    tags: [category], // The only tag we know is the category
                    type: 'preview'
                };
            });

            // The API doesn't support pages, so we fake it.
            // Every "page" will be a new random set of 30 images.
            // MODIFIED: We now tell the app there is always a next page.
            return {
                total: 30, // Total results in this "page"
                next: page + 1,   // Fake next page
                previous: page > 1 ? page - 1 : 0, // Fake previous page
                pages: page + 1,  // Fake total pages
                page: page,
                hasNextPage: true, // <-- THIS ENABLES INFINITE SCROLL
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

    // This function is not used by the app's current design,
    // but we'll include a placeholder.
    async fetchInfo(id) {
        console.log(`[WaifuPics] fetchInfo called for ${id}, but this API only provides direct URLs.`);
        // We can't get more info, so we return a minimal object
        return {
            id: id,
            fullImage: `https://i.waifu.pics/${id}`, // Guess the URL based on the ID format
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
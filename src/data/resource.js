export class Resource {
    constructor({ id, title, url, favIconUrl, highlights = [], data = {} } = {}) {
        this.id =
            id != null && id !== ""
                ? id
                : Math.random().toString(36).substring(2, 9);
        this.title = title;
        this.url = url;
        this.favIconUrl = favIconUrl;
        this.highlights = highlights;
        this.data = data;
    }

    static fromJSON(json) {
        return new Resource({
            id: json.id,
            title: json.title,
            url: json.url,
            favIconUrl: json.favIconUrl,
            highlights: json.highlights || [],
            data: json.data || {},
        });
    }

    toJson() {
        return {
            id: this.id,
            title: this.title,
            url: this.url,
            favIconUrl: this.favIconUrl,
            highlights: this.highlights,
            data: this.data,
        };
    }
}
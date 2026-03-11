import { Resource } from "./resource";


export class Tab {
    id;
    resource;
    resourceId;
    groupId;
    contextId;
    created;
    lastAccessed;
    active = false;
    isIncognito = false;
    index;
    journey = new Journey();
    image;

    get url() {
        return this.journey.presentResource?.url;
    }
    get favIconUrl() {
        return this.journey.presentResource?.favIconUrl;
    }
    get title() {
        return this.journey.presentResource?.title;
    }

    get canGoForward() {
        return this.journey.queue.length > 0 ||
            (this.journey.presentResource?.highlights.length > 0) ||
            (this.journey.index < this.journey.history.length - 1);
    }
    get canGoBack() {
        return this.journey.index > 0;
    }

    constructor({ url, title, resourceId, resource, contextId, isIncognito = false } = {}) {
        this.id = Math.random().toString(36).substring(2, 9); // Equivalent to Uuid().v4().split('-').last
        this.created = Date.now();
        const initialResource = resource || new Resource({ title, url });
        this.resourceId = resourceId; // Set resourceId in constructor as well
        this.resource = resource; // Set resource in constructor as well
        this.contextId = contextId; // Set contextId in constructor as well
        this.isIncognito = isIncognito; // Set isIncognito in constructor as well
        this.journey.updateLocation(initialResource);
    }

    static fromJSON(json) {
        const tab = new Tab();
        tab.id = json.id?.toString();
        tab.created = json.created;
        tab.lastAccessed = json.lastAccessed ? Math.round(json.lastAccessed) : undefined;
        tab.resourceId = json.resourceId;
        tab.journey = json.journey ? Journey.fromJSON(json.journey) : new Journey();
        if (tab.journey.history.length === 0 && !tab.journey.presentResource) {
            tab.journey.updateLocation(new Resource({
                title: json.title,
                favIconUrl: json.favIconUrl,
                url: json.url
            }));
        }
        tab.contextId = json.contextId;
        tab.groupId = json.groupId?.toString();
        tab.active = json.active ?? false;
        tab.isIncognito = json.isIncognito ?? false;
        return tab;
    }

    toJson() {
        const json = {
            id: this.id,
            created: this.created,
            lastAccessed: this.lastAccessed,
            url: this.url,
            favIconUrl: this.favIconUrl,
            title: this.title,
            resourceId: this.resourceId,
            journey: this.journey.toJson(),
            contextId: this.contextId,
            groupId: this.groupId,
            active: this.active,
            isIncognito: this.isIncognito,
        };
        return json;
    }

    toJsonForPrompt() {
        const json = {
            tabId: this.id,
            id: this.journey.presentResource?.id,
            created: this.created,
            lastAccessed: this.lastAccessed,
            url: this.url,
            title: this.title,
            //'text': this.journey.presentResource?.text,
            //'highlights': this.journey.presentResource?.highlights.map((h) => h.toJson()),
            data: this.journey.presentResource?.data,
            //'journey': this.journey.toJson(),
        };
        // Remove properties with null or undefined values
        Object.keys(json).forEach(key => (json[key] === null || json[key] === undefined) && delete json[key]);
        return json;
    }

    copyWith({ url, title, resourceId, groupId, contextId } = {}) {
        const tab = new Tab({
            url: url ?? this.url,
            title: title ?? this.title,
            resourceId: resourceId ?? this.resourceId,
            resource: this.resource,
            contextId: contextId ?? this.contextId,
            isIncognito: this.isIncognito, // Ensure isIncognito is copied
        });
        tab.id = Math.random().toString(36).substring(2, 9); // Generate new ID for the copied tab
        tab.created = this.created; // Keep original creation time
        tab.lastAccessed = this.lastAccessed; // Keep original last accessed time
        tab.active = this.active; // Copy active state
        tab.journey = Journey.fromJSON(this.journey.toJson()); // Deep copy journey
        return tab;
    }
}



export class Journey {
    constructor() {
        this.history = [];
        this.queue = [];
        this.index = -1;
        this.presentResource = null;
    }

    updateLocation(resource) {
        if (this.presentResource) {
            this.history = this.history.slice(0, this.index + 1);
            this.history.push(this.presentResource);
        }
        this.presentResource = resource;
        this.index = this.history.length - 1;
        this.queue = []; // Clear queue on new navigation
    }

    static fromJSON(json) {
        const journey = new Journey();
        journey.history = json.history ? json.history.map(r => Resource.fromJSON(r)) : [];
        journey.queue = json.queue ? json.queue.map(r => Resource.fromJSON(r)) : [];
        journey.index = json.index !== undefined ? json.index : -1;
        journey.presentResource = json.presentResource ? Resource.fromJSON(json.presentResource) : null;
        return journey;
    }

    toJson() {
        return {
            history: this.history.map(r => r.toJson()),
            queue: this.queue.map(r => r.toJson()),
            index: this.index,
            presentResource: this.presentResource ? this.presentResource.toJson() : null,
        };
    }
}


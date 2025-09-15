import { browser } from '$app/environment';

export interface BreadcrumbItem {
    href: string;
    label: string;
}

class BreadcrumbStore {
    private _items = $state<BreadcrumbItem[]>([]);

    get items() {
        return this._items;
    }

    set(items: BreadcrumbItem[]) {
        this._items = items;
    }

    add(item: BreadcrumbItem) {
        this._items.push(item);
    }

    clear() {
        this._items = [];
    }
}

export const breadcrumbStore = new BreadcrumbStore();
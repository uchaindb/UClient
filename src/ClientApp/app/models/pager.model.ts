import { URLSearchParams } from '@angular/http'

export class Pager {
    static MaxCount: number = 10;

    constructor(obj: Pager = {} as Pager) {
        let {
            sinceId = null,
            maxId = null,
            count = 0,
        } = obj;

        this.sinceId = sinceId;
        this.maxId = maxId;
        this.count = count;
    }

    public sinceId: string;
    public maxId: string;
    public count: number;

    getParams(): URLSearchParams {
        let params = new URLSearchParams();
        if (this.sinceId != null) params.set('sinceId', this.sinceId);
        if (this.maxId != null) params.set('maxId', this.maxId);
        if (this.count > 0) params.set('count', this.count.toString());
        return params;
    }

    public toString(): string {
        return `${this.sinceId}|${this.maxId}|${this.count}`;
    }
}

export type PaginationType = {
    totalItems: number,
    currentPage: number,
    pageSize: number,
    totalPages: number,
    startPage: number,
    endPage: number,
    startIndex: number,
    endIndex: number,
    pages: number[],
}
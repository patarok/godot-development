// src/lib/server/database/models/pagination.ts
export type SortOrder = 'ASC' | 'DESC';

// Generic options, parameterized by the domain’s allowed sort keys
export interface PaginationOptions<TSort extends string = string> {
    page?: number;
    limit?: number;
    sortBy?: TSort;     // caller supplies an allowed key
    sortOrder?: SortOrder;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
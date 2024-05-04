import { paginationFunction } from './pagination.js'

export class ApiFeatures {
    constructor(mongooseQuery, queryData) {
        this.mongooseQuery = mongooseQuery
        this.queryData = queryData
    }

    // pagination
    pagination() {
        const { page, size } = this.queryData
        const { limit, skip } = paginationFunction({ page, size })
        this.mongooseQuery.limit(limit).skip(skip)
        return this
    }

    // sort

    // sort() {
    //     this.mongooseQuery.sort(this.queryData.sort?.replaceAll(',', ' '))
    //     return this
    // }
    // select

    select() {
        this.mongooseQuery.select(this.queryData.select?.replaceAll(',', ' '))
        return this
    }


    //filters


    // filters() {
    //     const { page, size, sort, select, ...queryInstance } = this.queryData
    //     const queryString = JSON.parse(
    //         JSON.stringify(queryInstance).replace(
    //             /gt|lt|gte|lte|in|nin|eq|neq|regex/g,
    //             (match) => `$${match}`,
    //         ),
    //     )
    //     this.mongooseQuery.find(queryString)
    //     return this
    // }
}
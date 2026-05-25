package com.movix.core.data.repository

import com.movix.core.model.SearchResult
import kotlinx.coroutines.flow.Flow

interface SearchRepository {
    suspend fun search(query: String, page: Int = 1): Result<List<SearchResult>>
    fun getSearchHistory(): Flow<List<String>>
    suspend fun addToSearchHistory(query: String)
    suspend fun clearSearchHistory()
}

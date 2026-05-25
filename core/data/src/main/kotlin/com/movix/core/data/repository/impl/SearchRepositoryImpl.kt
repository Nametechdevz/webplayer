package com.movix.core.data.repository.impl

import com.movix.core.data.local.dao.SearchHistoryDao
import com.movix.core.data.local.entity.SearchHistoryEntity
import com.movix.core.data.repository.SearchRepository
import com.movix.core.model.SearchResult
import com.movix.core.network.api.TmdbApiService
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class SearchRepositoryImpl @Inject constructor(
    private val apiService: TmdbApiService,
    private val searchHistoryDao: SearchHistoryDao
) : SearchRepository {

    override suspend fun search(query: String, page: Int): Result<List<SearchResult>> {
        return try {
            val response = apiService.searchMulti(query = query, page = page)
            if (response.isSuccessful) {
                val results = response.body()?.results?.map { it.toDomain() } ?: emptyList()
                addToSearchHistory(query)
                Result.success(results)
            } else {
                Result.failure(Exception("Error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun getSearchHistory(): Flow<List<String>> {
        return searchHistoryDao.getSearchHistory()
    }

    override suspend fun addToSearchHistory(query: String) {
        if (query.isNotBlank()) {
            searchHistoryDao.insertSearch(SearchHistoryEntity(query = query.trim()))
        }
    }

    override suspend fun clearSearchHistory() {
        searchHistoryDao.deleteAll()
    }
}

package com.movix.core.data.repository

import com.movix.core.model.TvShow
import kotlinx.coroutines.flow.Flow

interface TvShowRepository {
    suspend fun getTrendingTvShows(page: Int = 1): Result<List<TvShow>>
    suspend fun getPopularTvShows(page: Int = 1): Result<List<TvShow>>
    suspend fun getTvShowDetails(showId: Int): Result<TvShow>
    suspend fun searchTvShows(query: String, page: Int = 1): Result<List<TvShow>>
    fun getCachedTvShows(): Flow<List<TvShow>>
}

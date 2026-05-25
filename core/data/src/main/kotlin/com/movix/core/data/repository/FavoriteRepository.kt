package com.movix.core.data.repository

import com.movix.core.model.Favorite
import com.movix.core.model.Watchlist
import kotlinx.coroutines.flow.Flow

interface FavoriteRepository {
    suspend fun addFavorite(mediaType: String, mediaId: Int, title: String, posterPath: String?): Result<Unit>
    suspend fun removeFavorite(mediaType: String, mediaId: Int): Result<Unit>
    suspend fun isFavorite(mediaType: String, mediaId: Int): Result<Boolean>
    fun getFavorites(): Flow<List<Favorite>>

    suspend fun addToWatchlist(mediaType: String, mediaId: Int, title: String, posterPath: String?): Result<Unit>
    suspend fun removeFromWatchlist(mediaType: String, mediaId: Int): Result<Unit>
    suspend fun isInWatchlist(mediaType: String, mediaId: Int): Result<Boolean>
    fun getWatchlist(): Flow<List<Watchlist>>
}

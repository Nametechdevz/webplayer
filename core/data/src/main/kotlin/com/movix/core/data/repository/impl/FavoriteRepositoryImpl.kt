package com.movix.core.data.repository.impl

import com.movix.core.data.local.dao.FavoriteDao
import com.movix.core.data.local.dao.WatchlistDao
import com.movix.core.data.local.entity.FavoriteEntity
import com.movix.core.data.local.entity.WatchlistEntity
import com.movix.core.data.repository.FavoriteRepository
import com.movix.core.model.Favorite
import com.movix.core.model.Watchlist
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class FavoriteRepositoryImpl @Inject constructor(
    private val favoriteDao: FavoriteDao,
    private val watchlistDao: WatchlistDao
) : FavoriteRepository {

    override suspend fun addFavorite(
        mediaType: String,
        mediaId: Int,
        title: String,
        posterPath: String?
    ): Result<Unit> {
        return try {
            favoriteDao.addFavorite(
                FavoriteEntity(
                    mediaType = mediaType,
                    mediaId = mediaId,
                    title = title,
                    posterPath = posterPath
                )
            )
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun removeFavorite(mediaType: String, mediaId: Int): Result<Unit> {
        return try {
            favoriteDao.removeFavorite(mediaId = mediaId, mediaType = mediaType)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun isFavorite(mediaType: String, mediaId: Int): Result<Boolean> {
        return try {
            val favorite = favoriteDao.getFavoriteByMediaId(mediaId = mediaId, mediaType = mediaType)
            Result.success(favorite != null)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun getFavorites(): Flow<List<Favorite>> {
        return favoriteDao.getAllFavorites().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun addToWatchlist(
        mediaType: String,
        mediaId: Int,
        title: String,
        posterPath: String?
    ): Result<Unit> {
        return try {
            watchlistDao.addToWatchlist(
                WatchlistEntity(
                    mediaType = mediaType,
                    mediaId = mediaId,
                    title = title,
                    posterPath = posterPath
                )
            )
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun removeFromWatchlist(mediaType: String, mediaId: Int): Result<Unit> {
        return try {
            watchlistDao.removeFromWatchlist(mediaId = mediaId, mediaType = mediaType)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun isInWatchlist(mediaType: String, mediaId: Int): Result<Boolean> {
        return try {
            val watchlist = watchlistDao.getWatchlistByMediaId(mediaId = mediaId, mediaType = mediaType)
            Result.success(watchlist != null)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun getWatchlist(): Flow<List<Watchlist>> {
        return watchlistDao.getAllWatchlist().map { entities ->
            entities.map { it.toDomain() }
        }
    }
}

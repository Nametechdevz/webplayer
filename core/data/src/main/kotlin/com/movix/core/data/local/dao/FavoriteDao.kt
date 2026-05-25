package com.movix.core.data.local.dao

import androidx.room.*
import com.movix.core.data.local.entity.FavoriteEntity
import com.movix.core.data.local.entity.WatchlistEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface FavoriteDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addFavorite(favorite: FavoriteEntity)

    @Query("SELECT * FROM favorites ORDER BY addedDate DESC")
    fun getAllFavorites(): Flow<List<FavoriteEntity>>

    @Query("SELECT * FROM favorites WHERE mediaId = :mediaId AND mediaType = :mediaType")
    suspend fun getFavoriteByMediaId(mediaId: Int, mediaType: String): FavoriteEntity?

    @Query("DELETE FROM favorites WHERE mediaId = :mediaId AND mediaType = :mediaType")
    suspend fun removeFavorite(mediaId: Int, mediaType: String)

    @Query("DELETE FROM favorites")
    suspend fun deleteAllFavorites()
}

@Dao
interface WatchlistDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addToWatchlist(watchlist: WatchlistEntity)

    @Query("SELECT * FROM watchlist ORDER BY addedDate DESC")
    fun getAllWatchlist(): Flow<List<WatchlistEntity>>

    @Query("SELECT * FROM watchlist WHERE mediaId = :mediaId AND mediaType = :mediaType")
    suspend fun getWatchlistByMediaId(mediaId: Int, mediaType: String): WatchlistEntity?

    @Query("DELETE FROM watchlist WHERE mediaId = :mediaId AND mediaType = :mediaType")
    suspend fun removeFromWatchlist(mediaId: Int, mediaType: String)

    @Query("DELETE FROM watchlist")
    suspend fun deleteAllWatchlist()
}

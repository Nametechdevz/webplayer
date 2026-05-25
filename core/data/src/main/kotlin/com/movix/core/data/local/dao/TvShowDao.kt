package com.movix.core.data.local.dao

import androidx.room.*
import com.movix.core.data.local.entity.TvShowEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TvShowDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTvShows(shows: List<TvShowEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTvShow(show: TvShowEntity)

    @Query("SELECT * FROM tv_shows ORDER BY popularity DESC LIMIT :limit")
    fun getPopularTvShows(limit: Int = 20): Flow<List<TvShowEntity>>

    @Query("SELECT * FROM tv_shows WHERE id = :id")
    suspend fun getTvShowById(id: Int): TvShowEntity?

    @Query("SELECT * FROM tv_shows WHERE name LIKE '%' || :query || '%' LIMIT :limit")
    fun searchTvShows(query: String, limit: Int = 50): Flow<List<TvShowEntity>>

    @Query("SELECT * FROM tv_shows ORDER BY voteAverage DESC LIMIT :limit")
    fun getTopRatedTvShows(limit: Int = 20): Flow<List<TvShowEntity>>

    @Delete
    suspend fun deleteTvShow(show: TvShowEntity)

    @Query("DELETE FROM tv_shows")
    suspend fun deleteAllTvShows()
}

package com.movix.core.data.local.dao

import androidx.room.*
import com.movix.core.data.local.entity.MovieEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface MovieDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMovies(movies: List<MovieEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMovie(movie: MovieEntity)

    @Query("SELECT * FROM movies ORDER BY popularity DESC LIMIT :limit")
    fun getPopularMovies(limit: Int = 20): Flow<List<MovieEntity>>

    @Query("SELECT * FROM movies WHERE id = :id")
    suspend fun getMovieById(id: Int): MovieEntity?

    @Query("SELECT * FROM movies WHERE title LIKE '%' || :query || '%' LIMIT :limit")
    fun searchMovies(query: String, limit: Int = 50): Flow<List<MovieEntity>>

    @Query("SELECT * FROM movies ORDER BY voteAverage DESC LIMIT :limit")
    fun getTopRatedMovies(limit: Int = 20): Flow<List<MovieEntity>>

    @Query("SELECT COUNT(*) FROM movies")
    suspend fun getMoviesCount(): Int

    @Delete
    suspend fun deleteMovie(movie: MovieEntity)

    @Query("DELETE FROM movies")
    suspend fun deleteAllMovies()
}

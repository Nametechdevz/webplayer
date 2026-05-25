package com.movix.core.data.repository

import com.movix.core.model.Movie
import kotlinx.coroutines.flow.Flow

interface MovieRepository {
    suspend fun getTrendingMovies(page: Int = 1): Result<List<Movie>>
    suspend fun getPopularMovies(page: Int = 1): Result<List<Movie>>
    suspend fun getUpcomingMovies(page: Int = 1): Result<List<Movie>>
    suspend fun getMovieDetails(movieId: Int): Result<Movie>
    suspend fun searchMovies(query: String, page: Int = 1): Result<List<Movie>>
    fun getCachedMovies(): Flow<List<Movie>>
}

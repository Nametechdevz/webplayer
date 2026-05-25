package com.movix.core.data.repository.impl

import com.movix.core.data.local.dao.MovieDao
import com.movix.core.data.local.entity.toEntity
import com.movix.core.data.repository.MovieRepository
import com.movix.core.model.Movie
import com.movix.core.network.api.TmdbApiService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class MovieRepositoryImpl @Inject constructor(
    private val apiService: TmdbApiService,
    private val movieDao: MovieDao
) : MovieRepository {

    override suspend fun getTrendingMovies(page: Int): Result<List<Movie>> {
        return try {
            val response = apiService.getTrendingMovies(page = page)
            if (response.isSuccessful) {
                val movies = response.body()?.results?.map { it.toDomain() } ?: emptyList()
                movieDao.insertMovies(movies.map { it.toEntity() })
                Result.success(movies)
            } else {
                Result.failure(Exception("Error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getPopularMovies(page: Int): Result<List<Movie>> {
        return try {
            val response = apiService.getPopularMovies(page = page)
            if (response.isSuccessful) {
                val movies = response.body()?.results?.map { it.toDomain() } ?: emptyList()
                movieDao.insertMovies(movies.map { it.toEntity() })
                Result.success(movies)
            } else {
                Result.failure(Exception("Error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getUpcomingMovies(page: Int): Result<List<Movie>> {
        return try {
            val response = apiService.getUpcomingMovies(page = page)
            if (response.isSuccessful) {
                val movies = response.body()?.results?.map { it.toDomain() } ?: emptyList()
                movieDao.insertMovies(movies.map { it.toEntity() })
                Result.success(movies)
            } else {
                Result.failure(Exception("Error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getMovieDetails(movieId: Int): Result<Movie> {
        return try {
            val response = apiService.getMovieDetails(movieId = movieId)
            if (response.isSuccessful) {
                val movie = response.body()?.toDomain()
                if (movie != null) {
                    movieDao.insertMovie(movie.toEntity())
                    Result.success(movie)
                } else {
                    Result.failure(Exception("Empty response"))
                }
            } else {
                Result.failure(Exception("Error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun searchMovies(query: String, page: Int): Result<List<Movie>> {
        return try {
            val response = apiService.searchMulti(query = query, page = page)
            if (response.isSuccessful) {
                val movies = response.body()?.results
                    ?.filter { it.mediaType == "movie" }
                    ?.map { searchDto ->
                        Movie(
                            id = searchDto.id,
                            title = searchDto.title ?: "",
                            posterPath = searchDto.posterPath,
                            backdropPath = searchDto.backdropPath,
                            overview = searchDto.overview,
                            releaseDate = searchDto.releaseDate ?: "",
                            voteAverage = searchDto.voteAverage,
                            voteCount = 0,
                            originalLanguage = "",
                            popularity = searchDto.popularity
                        )
                    } ?: emptyList()
                Result.success(movies)
            } else {
                Result.failure(Exception("Error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun getCachedMovies(): Flow<List<Movie>> {
        return movieDao.getPopularMovies(limit = 100).map { entities ->
            entities.map { it.toDomain() }
        }
    }
}

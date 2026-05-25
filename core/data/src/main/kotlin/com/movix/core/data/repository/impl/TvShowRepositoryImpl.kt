package com.movix.core.data.repository.impl

import com.movix.core.data.local.dao.TvShowDao
import com.movix.core.data.local.entity.toEntity
import com.movix.core.data.repository.TvShowRepository
import com.movix.core.model.TvShow
import com.movix.core.network.api.TmdbApiService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class TvShowRepositoryImpl @Inject constructor(
    private val apiService: TmdbApiService,
    private val tvShowDao: TvShowDao
) : TvShowRepository {

    override suspend fun getTrendingTvShows(page: Int): Result<List<TvShow>> {
        return try {
            val response = apiService.getTrendingTvShows(page = page)
            if (response.isSuccessful) {
                val shows = response.body()?.results?.map { it.toDomain() } ?: emptyList()
                tvShowDao.insertTvShows(shows.map { it.toEntity() })
                Result.success(shows)
            } else {
                Result.failure(Exception("Error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getPopularTvShows(page: Int): Result<List<TvShow>> {
        return try {
            val response = apiService.getPopularTvShows(page = page)
            if (response.isSuccessful) {
                val shows = response.body()?.results?.map { it.toDomain() } ?: emptyList()
                tvShowDao.insertTvShows(shows.map { it.toEntity() })
                Result.success(shows)
            } else {
                Result.failure(Exception("Error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getTvShowDetails(showId: Int): Result<TvShow> {
        return try {
            val response = apiService.getTvShowDetails(seriesId = showId)
            if (response.isSuccessful) {
                val show = response.body()?.toDomain()
                if (show != null) {
                    tvShowDao.insertTvShow(show.toEntity())
                    Result.success(show)
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

    override suspend fun searchTvShows(query: String, page: Int): Result<List<TvShow>> {
        return try {
            val response = apiService.searchMulti(query = query, page = page)
            if (response.isSuccessful) {
                val shows = response.body()?.results
                    ?.filter { it.mediaType == "tv" }
                    ?.map { searchDto ->
                        TvShow(
                            id = searchDto.id,
                            name = searchDto.title ?: "",
                            posterPath = searchDto.posterPath,
                            backdropPath = searchDto.backdropPath,
                            overview = searchDto.overview,
                            firstAirDate = searchDto.releaseDate ?: "",
                            voteAverage = searchDto.voteAverage,
                            voteCount = 0,
                            numberOfSeasons = 0,
                            numberOfEpisodes = 0,
                            originalLanguage = "",
                            popularity = searchDto.popularity
                        )
                    } ?: emptyList()
                Result.success(shows)
            } else {
                Result.failure(Exception("Error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun getCachedTvShows(): Flow<List<TvShow>> {
        return tvShowDao.getPopularTvShows(limit = 100).map { entities ->
            entities.map { it.toDomain() }
        }
    }
}

package com.movix.core.network.api

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query
import com.movix.core.network.dto.*

interface TmdbApiService {

    // Movies
    @GET("trending/movie/week")
    suspend fun getTrendingMovies(
        @Query("page") page: Int = 1,
        @Query("language") language: String = "es-MX"
    ): Response<MovieResponseDto>

    @GET("movie/popular")
    suspend fun getPopularMovies(
        @Query("page") page: Int = 1,
        @Query("language") language: String = "es-MX"
    ): Response<MovieResponseDto>

    @GET("movie/upcoming")
    suspend fun getUpcomingMovies(
        @Query("page") page: Int = 1,
        @Query("language") language: String = "es-MX"
    ): Response<MovieResponseDto>

    @GET("movie/{movieId}")
    suspend fun getMovieDetails(
        @Path("movieId") movieId: Int,
        @Query("language") language: String = "es-MX",
        @Query("append_to_response") append: String = "credits,reviews,recommendations,videos"
    ): Response<MovieDto>

    // TV Shows
    @GET("trending/tv/week")
    suspend fun getTrendingTvShows(
        @Query("page") page: Int = 1,
        @Query("language") language: String = "es-MX"
    ): Response<TvShowResponseDto>

    @GET("tv/popular")
    suspend fun getPopularTvShows(
        @Query("page") page: Int = 1,
        @Query("language") language: String = "es-MX"
    ): Response<TvShowResponseDto>

    @GET("tv/{seriesId}")
    suspend fun getTvShowDetails(
        @Path("seriesId") seriesId: Int,
        @Query("language") language: String = "es-MX",
        @Query("append_to_response") append: String = "credits,reviews,recommendations,videos"
    ): Response<TvShowDto>

    // Search
    @GET("search/multi")
    suspend fun searchMulti(
        @Query("query") query: String,
        @Query("page") page: Int = 1,
        @Query("language") language: String = "es-MX"
    ): Response<SearchResponseDto>

    // Genres
    @GET("genre/movie/list")
    suspend fun getMovieGenres(
        @Query("language") language: String = "es-MX"
    ): Response<GenreResponseDto>

    @GET("genre/tv/list")
    suspend fun getTvGenres(
        @Query("language") language: String = "es-MX"
    ): Response<GenreResponseDto>
}

@kotlinx.serialization.Serializable
data class GenreResponseDto(
    @kotlinx.serialization.SerialName("genres")
    val genres: List<GenreDto> = emptyList()
)

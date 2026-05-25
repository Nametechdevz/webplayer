package com.movix.core.network.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import com.movix.core.model.Movie
import com.movix.core.model.Genre

@Serializable
data class MovieDto(
    @SerialName("id")
    val id: Int,
    @SerialName("title")
    val title: String,
    @SerialName("poster_path")
    val posterPath: String? = null,
    @SerialName("backdrop_path")
    val backdropPath: String? = null,
    @SerialName("overview")
    val overview: String = "",
    @SerialName("release_date")
    val releaseDate: String = "",
    @SerialName("vote_average")
    val voteAverage: Double = 0.0,
    @SerialName("vote_count")
    val voteCount: Int = 0,
    @SerialName("runtime")
    val runtime: Int? = null,
    @SerialName("budget")
    val budget: Long? = null,
    @SerialName("revenue")
    val revenue: Long? = null,
    @SerialName("original_language")
    val originalLanguage: String = "",
    @SerialName("popularity")
    val popularity: Double = 0.0,
    @SerialName("genres")
    val genres: List<GenreDto> = emptyList(),
    @SerialName("videos")
    val videos: VideosResponseDto? = null,
    @SerialName("credits")
    val credits: CreditsDto? = null,
    @SerialName("reviews")
    val reviews: ReviewsResponseDto? = null,
    @SerialName("recommendations")
    val recommendations: MovieResponseDto? = null
) {
    fun toDomain(): Movie {
        return Movie(
            id = id,
            title = title,
            posterPath = posterPath,
            backdropPath = backdropPath,
            overview = overview,
            releaseDate = releaseDate,
            voteAverage = voteAverage,
            voteCount = voteCount,
            runtime = runtime,
            budget = budget,
            revenue = revenue,
            originalLanguage = originalLanguage,
            popularity = popularity,
            genres = genres.map { it.toDomain() },
            videos = videos?.results?.map { it.toDomain() } ?: emptyList(),
            credits = credits?.toDomain(),
            reviews = reviews?.results?.map { it.toDomain() } ?: emptyList(),
            recommendations = recommendations?.results?.map { it.toDomain() } ?: emptyList()
        )
    }
}

@Serializable
data class MovieResponseDto(
    @SerialName("page")
    val page: Int = 1,
    @SerialName("results")
    val results: List<MovieDto> = emptyList(),
    @SerialName("total_pages")
    val totalPages: Int = 1,
    @SerialName("total_results")
    val totalResults: Int = 0
)

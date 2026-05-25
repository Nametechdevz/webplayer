package com.movix.core.network.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import com.movix.core.model.TvShow

@Serializable
data class TvShowDto(
    @SerialName("id")
    val id: Int,
    @SerialName("name")
    val name: String,
    @SerialName("poster_path")
    val posterPath: String? = null,
    @SerialName("backdrop_path")
    val backdropPath: String? = null,
    @SerialName("overview")
    val overview: String = "",
    @SerialName("first_air_date")
    val firstAirDate: String = "",
    @SerialName("vote_average")
    val voteAverage: Double = 0.0,
    @SerialName("vote_count")
    val voteCount: Int = 0,
    @SerialName("number_of_seasons")
    val numberOfSeasons: Int = 0,
    @SerialName("number_of_episodes")
    val numberOfEpisodes: Int = 0,
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
    val recommendations: TvShowResponseDto? = null
) {
    fun toDomain(): TvShow {
        return TvShow(
            id = id,
            name = name,
            posterPath = posterPath,
            backdropPath = backdropPath,
            overview = overview,
            firstAirDate = firstAirDate,
            voteAverage = voteAverage,
            voteCount = voteCount,
            numberOfSeasons = numberOfSeasons,
            numberOfEpisodes = numberOfEpisodes,
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
data class TvShowResponseDto(
    @SerialName("page")
    val page: Int = 1,
    @SerialName("results")
    val results: List<TvShowDto> = emptyList(),
    @SerialName("total_pages")
    val totalPages: Int = 1,
    @SerialName("total_results")
    val totalResults: Int = 0
)

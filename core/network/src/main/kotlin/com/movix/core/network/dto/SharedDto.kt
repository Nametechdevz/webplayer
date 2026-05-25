package com.movix.core.network.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import com.movix.core.model.*

@Serializable
data class GenreDto(
    @SerialName("id")
    val id: Int,
    @SerialName("name")
    val name: String
) {
    fun toDomain(): Genre = Genre(id, name)
}

@Serializable
data class CastDto(
    @SerialName("id")
    val id: Int,
    @SerialName("name")
    val name: String,
    @SerialName("character")
    val character: String = "",
    @SerialName("profile_path")
    val profilePath: String? = null,
    @SerialName("order")
    val order: Int = 0
) {
    fun toDomain(): Cast = Cast(id, name, character, profilePath, order)
}

@Serializable
data class CrewDto(
    @SerialName("id")
    val id: Int,
    @SerialName("name")
    val name: String,
    @SerialName("job")
    val job: String = "",
    @SerialName("department")
    val department: String = "",
    @SerialName("profile_path")
    val profilePath: String? = null
) {
    fun toDomain(): Crew = Crew(id, name, job, department, profilePath)
}

@Serializable
data class CreditsDto(
    @SerialName("cast")
    val cast: List<CastDto> = emptyList(),
    @SerialName("crew")
    val crew: List<CrewDto> = emptyList()
) {
    fun toDomain(): Credits = Credits(
        cast = cast.map { it.toDomain() },
        crew = crew.map { it.toDomain() }
    )
}

@Serializable
data class ReviewDto(
    @SerialName("id")
    val id: String,
    @SerialName("author")
    val author: String,
    @SerialName("content")
    val content: String,
    @SerialName("rating")
    val rating: Double? = null,
    @SerialName("created_at")
    val createdAt: String = "",
    @SerialName("url")
    val url: String = ""
) {
    fun toDomain(): Review = Review(id, author, content, rating, createdAt, url)
}

@Serializable
data class ReviewsResponseDto(
    @SerialName("results")
    val results: List<ReviewDto> = emptyList()
)

@Serializable
data class VideoDto(
    @SerialName("id")
    val id: String,
    @SerialName("name")
    val name: String = "",
    @SerialName("key")
    val key: String,
    @SerialName("type")
    val type: String = "",
    @SerialName("site")
    val site: String = "",
    @SerialName("size")
    val size: Int = 0,
    @SerialName("official")
    val official: Boolean = false,
    @SerialName("published_at")
    val publishedAt: String = ""
) {
    fun toDomain(): Video = Video(id, name, key, type, site, size, official, publishedAt)
}

@Serializable
data class VideosResponseDto(
    @SerialName("results")
    val results: List<VideoDto> = emptyList()
)

@Serializable
data class SearchResultDto(
    @SerialName("id")
    val id: Int,
    @SerialName("media_type")
    val mediaType: String = "",
    @SerialName("title")
    val title: String? = null,
    @SerialName("name")
    val name: String? = null,
    @SerialName("poster_path")
    val posterPath: String? = null,
    @SerialName("backdrop_path")
    val backdropPath: String? = null,
    @SerialName("overview")
    val overview: String = "",
    @SerialName("vote_average")
    val voteAverage: Double = 0.0,
    @SerialName("popularity")
    val popularity: Double = 0.0,
    @SerialName("release_date")
    val releaseDate: String? = null,
    @SerialName("first_air_date")
    val firstAirDate: String? = null
) {
    fun toDomain(): SearchResult = SearchResult(
        id = id,
        mediaType = mediaType,
        title = title ?: name ?: "",
        posterPath = posterPath,
        backdropPath = backdropPath,
        overview = overview,
        voteAverage = voteAverage,
        popularity = popularity,
        releaseDate = releaseDate ?: firstAirDate
    )
}

@Serializable
data class SearchResponseDto(
    @SerialName("page")
    val page: Int = 1,
    @SerialName("results")
    val results: List<SearchResultDto> = emptyList(),
    @SerialName("total_pages")
    val totalPages: Int = 1,
    @SerialName("total_results")
    val totalResults: Int = 0
)

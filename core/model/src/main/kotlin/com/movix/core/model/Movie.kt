package com.movix.core.model

data class Movie(
    val id: Int,
    val title: String,
    val posterPath: String?,
    val backdropPath: String?,
    val overview: String,
    val releaseDate: String,
    val voteAverage: Double,
    val voteCount: Int,
    val runtime: Int? = null,
    val budget: Long? = null,
    val revenue: Long? = null,
    val originalLanguage: String,
    val popularity: Double,
    val genres: List<Genre> = emptyList(),
    val videos: List<Video> = emptyList(),
    val credits: Credits? = null,
    val reviews: List<Review> = emptyList(),
    val recommendations: List<Movie> = emptyList()
)

data class TvShow(
    val id: Int,
    val name: String,
    val posterPath: String?,
    val backdropPath: String?,
    val overview: String,
    val firstAirDate: String,
    val voteAverage: Double,
    val voteCount: Int,
    val numberOfSeasons: Int,
    val numberOfEpisodes: Int,
    val originalLanguage: String,
    val popularity: Double,
    val genres: List<Genre> = emptyList(),
    val videos: List<Video> = emptyList(),
    val credits: Credits? = null,
    val reviews: List<Review> = emptyList(),
    val recommendations: List<TvShow> = emptyList()
)

data class Genre(
    val id: Int,
    val name: String
)

data class Cast(
    val id: Int,
    val name: String,
    val character: String,
    val profilePath: String?,
    val order: Int
)

data class Crew(
    val id: Int,
    val name: String,
    val job: String,
    val department: String,
    val profilePath: String?
)

data class Credits(
    val cast: List<Cast> = emptyList(),
    val crew: List<Crew> = emptyList()
)

data class Review(
    val id: String,
    val author: String,
    val content: String,
    val rating: Double?,
    val createdAt: String,
    val url: String
)

data class Video(
    val id: String,
    val name: String,
    val key: String,
    val type: String,
    val site: String,
    val size: Int,
    val official: Boolean,
    val publishedAt: String
)

data class Favorite(
    val id: Int,
    val mediaType: String, // "movie" or "tv"
    val mediaId: Int,
    val title: String,
    val posterPath: String?,
    val addedDate: Long = System.currentTimeMillis()
)

data class Watchlist(
    val id: Int,
    val mediaType: String,
    val mediaId: Int,
    val title: String,
    val posterPath: String?,
    val addedDate: Long = System.currentTimeMillis()
)

data class SearchResult(
    val id: Int,
    val mediaType: String,
    val title: String?,
    val posterPath: String?,
    val backdropPath: String?,
    val overview: String,
    val voteAverage: Double,
    val popularity: Double,
    val releaseDate: String?
)

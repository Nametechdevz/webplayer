package com.movix.core.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.movix.core.model.TvShow

@Entity(tableName = "tv_shows")
data class TvShowEntity(
    @PrimaryKey val id: Int,
    val name: String,
    val posterPath: String? = null,
    val backdropPath: String? = null,
    val overview: String,
    val firstAirDate: String,
    val voteAverage: Double,
    val voteCount: Int,
    val numberOfSeasons: Int,
    val numberOfEpisodes: Int,
    val originalLanguage: String,
    val popularity: Double,
    val lastUpdated: Long = System.currentTimeMillis()
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
            popularity = popularity
        )
    }
}

fun TvShow.toEntity(): TvShowEntity {
    return TvShowEntity(
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
        popularity = popularity
    )
}

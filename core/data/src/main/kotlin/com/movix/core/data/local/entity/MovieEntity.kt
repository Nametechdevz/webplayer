package com.movix.core.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.movix.core.model.Movie

@Entity(tableName = "movies")
data class MovieEntity(
    @PrimaryKey val id: Int,
    val title: String,
    val posterPath: String? = null,
    val backdropPath: String? = null,
    val overview: String,
    val releaseDate: String,
    val voteAverage: Double,
    val voteCount: Int,
    val runtime: Int? = null,
    val budget: Long? = null,
    val revenue: Long? = null,
    val originalLanguage: String,
    val popularity: Double,
    val lastUpdated: Long = System.currentTimeMillis()
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
            popularity = popularity
        )
    }
}

fun Movie.toEntity(): MovieEntity {
    return MovieEntity(
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
        popularity = popularity
    )
}

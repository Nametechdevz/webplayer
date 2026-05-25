package com.movix.core.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.movix.core.model.Favorite
import com.movix.core.model.Watchlist

@Entity(
    tableName = "favorites",
    indices = [Index("mediaId")]
)
data class FavoriteEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val mediaType: String,
    val mediaId: Int,
    val title: String,
    val posterPath: String?,
    val addedDate: Long = System.currentTimeMillis()
) {
    fun toDomain(): Favorite = Favorite(
        id = id,
        mediaType = mediaType,
        mediaId = mediaId,
        title = title,
        posterPath = posterPath,
        addedDate = addedDate
    )
}

@Entity(
    tableName = "watchlist",
    indices = [Index("mediaId")]
)
data class WatchlistEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val mediaType: String,
    val mediaId: Int,
    val title: String,
    val posterPath: String?,
    val addedDate: Long = System.currentTimeMillis()
) {
    fun toDomain(): Watchlist = Watchlist(
        id = id,
        mediaType = mediaType,
        mediaId = mediaId,
        title = title,
        posterPath = posterPath,
        addedDate = addedDate
    )
}

fun Favorite.toEntity(): FavoriteEntity = FavoriteEntity(
    id = id,
    mediaType = mediaType,
    mediaId = mediaId,
    title = title,
    posterPath = posterPath,
    addedDate = addedDate
)

fun Watchlist.toEntity(): WatchlistEntity = WatchlistEntity(
    id = id,
    mediaType = mediaType,
    mediaId = mediaId,
    title = title,
    posterPath = posterPath,
    addedDate = addedDate
)

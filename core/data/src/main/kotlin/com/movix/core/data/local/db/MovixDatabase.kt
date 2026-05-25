package com.movix.core.data.local.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.movix.core.data.local.entity.*
import com.movix.core.data.local.dao.*

@Database(
    entities = [
        MovieEntity::class,
        TvShowEntity::class,
        FavoriteEntity::class,
        WatchlistEntity::class,
        SearchHistoryEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class MovixDatabase : RoomDatabase() {
    abstract fun movieDao(): MovieDao
    abstract fun tvShowDao(): TvShowDao
    abstract fun favoriteDao(): FavoriteDao
    abstract fun watchlistDao(): WatchlistDao
    abstract fun searchHistoryDao(): SearchHistoryDao

    companion object {
        private var INSTANCE: MovixDatabase? = null

        fun getDatabase(context: Context): MovixDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    MovixDatabase::class.java,
                    "movix_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}

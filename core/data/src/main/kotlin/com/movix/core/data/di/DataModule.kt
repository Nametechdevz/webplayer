package com.movix.core.data.di

import android.content.Context
import androidx.room.Room
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import com.movix.core.data.local.db.MovixDatabase
import com.movix.core.data.local.dao.*
import com.movix.core.data.repository.FavoriteRepository
import com.movix.core.data.repository.MovieRepository
import com.movix.core.data.repository.SearchRepository
import com.movix.core.data.repository.TvShowRepository
import com.movix.core.data.repository.impl.FavoriteRepositoryImpl
import com.movix.core.data.repository.impl.MovieRepositoryImpl
import com.movix.core.data.repository.impl.SearchRepositoryImpl
import com.movix.core.data.repository.impl.TvShowRepositoryImpl
import com.movix.core.network.api.TmdbApiService

@Module
@InstallIn(SingletonComponent::class)
object DataModule {

    @Provides
    @Singleton
    fun provideMovixDatabase(
        @ApplicationContext context: Context
    ): MovixDatabase {
        return Room.databaseBuilder(
            context,
            MovixDatabase::class.java,
            "movix_database"
        ).build()
    }

    @Provides
    @Singleton
    fun provideMovieDao(database: MovixDatabase): MovieDao {
        return database.movieDao()
    }

    @Provides
    @Singleton
    fun provideTvShowDao(database: MovixDatabase): TvShowDao {
        return database.tvShowDao()
    }

    @Provides
    @Singleton
    fun provideFavoriteDao(database: MovixDatabase): FavoriteDao {
        return database.favoriteDao()
    }

    @Provides
    @Singleton
    fun provideWatchlistDao(database: MovixDatabase): WatchlistDao {
        return database.watchlistDao()
    }

    @Provides
    @Singleton
    fun provideSearchHistoryDao(database: MovixDatabase): SearchHistoryDao {
        return database.searchHistoryDao()
    }

    @Provides
    @Singleton
    fun provideMovieRepository(
        apiService: TmdbApiService,
        movieDao: MovieDao
    ): MovieRepository {
        return MovieRepositoryImpl(apiService, movieDao)
    }

    @Provides
    @Singleton
    fun provideTvShowRepository(
        apiService: TmdbApiService,
        tvShowDao: TvShowDao
    ): TvShowRepository {
        return TvShowRepositoryImpl(apiService, tvShowDao)
    }

    @Provides
    @Singleton
    fun provideSearchRepository(
        apiService: TmdbApiService,
        searchHistoryDao: SearchHistoryDao
    ): SearchRepository {
        return SearchRepositoryImpl(apiService, searchHistoryDao)
    }

    @Provides
    @Singleton
    fun provideFavoriteRepository(
        favoriteDao: FavoriteDao,
        watchlistDao: WatchlistDao
    ): FavoriteRepository {
        return FavoriteRepositoryImpl(favoriteDao, watchlistDao)
    }
}

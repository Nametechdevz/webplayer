package com.movix.core.data.repository

import com.movix.core.data.local.dao.MovieDao
import com.movix.core.data.local.entity.MovieEntity
import com.movix.core.data.repository.impl.MovieRepositoryImpl
import com.movix.core.network.api.TmdbApiService
import com.movix.core.network.dto.MovieDto
import com.movix.core.network.dto.MovieResponseDto
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.kotlin.whenever
import retrofit2.Response

@ExperimentalCoroutinesApi
class MovieRepositoryTest {

    @Mock
    private lateinit var apiService: TmdbApiService

    @Mock
    private lateinit var movieDao: MovieDao

    private lateinit var repository: MovieRepository

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        repository = MovieRepositoryImpl(apiService, movieDao)
    }

    @Test
    fun `getTrendingMovies returns success with data`() = runTest {
        // Arrange
        val movieDto = MovieDto(
            id = 1,
            title = "Test Movie",
            posterPath = "/poster.jpg",
            backdropPath = "/backdrop.jpg",
            overview = "Test overview",
            releaseDate = "2024-01-01",
            voteAverage = 8.5,
            voteCount = 1000,
            originalLanguage = "en",
            popularity = 100.0
        )
        val response = Response.success(
            MovieResponseDto(
                page = 1,
                results = listOf(movieDto),
                totalPages = 1,
                totalResults = 1
            )
        )
        whenever(apiService.getTrendingMovies(page = 1)).thenReturn(response)

        // Act
        val result = repository.getTrendingMovies(page = 1)

        // Assert
        assert(result.isSuccess)
        val movies = result.getOrNull()
        assert(movies != null)
        assert(movies?.size == 1)
        assert(movies?.get(0)?.title == "Test Movie")
    }

    @Test
    fun `getTrendingMovies returns error on failure`() = runTest {
        // Arrange
        whenever(apiService.getTrendingMovies(page = 1))
            .thenThrow(RuntimeException("Network error"))

        // Act
        val result = repository.getTrendingMovies(page = 1)

        // Assert
        assert(result.isFailure)
        assert(result.exceptionOrNull() != null)
    }

    @Test
    fun `getPopularMovies returns success`() = runTest {
        // Arrange
        val movieDto = MovieDto(
            id = 2,
            title = "Popular Movie",
            posterPath = "/poster2.jpg",
            backdropPath = "/backdrop2.jpg",
            overview = "Popular overview",
            releaseDate = "2024-01-02",
            voteAverage = 7.5,
            voteCount = 2000,
            originalLanguage = "en",
            popularity = 200.0
        )
        val response = Response.success(
            MovieResponseDto(
                page = 1,
                results = listOf(movieDto),
                totalPages = 1,
                totalResults = 1
            )
        )
        whenever(apiService.getPopularMovies(page = 1)).thenReturn(response)

        // Act
        val result = repository.getPopularMovies(page = 1)

        // Assert
        assert(result.isSuccess)
        val movies = result.getOrNull()
        assert(movies?.get(0)?.id == 2)
    }
}

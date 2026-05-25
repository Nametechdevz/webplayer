package com.movix.feature.home.presentation

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.movix.core.model.Movie
import com.movix.feature.home.domain.usecase.GetTrendingMoviesUseCase
import com.movix.feature.home.domain.usecase.GetPopularMoviesUseCase
import com.movix.feature.home.domain.usecase.GetUpcomingMoviesUseCase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.kotlin.whenever

@ExperimentalCoroutinesApi
class HomeViewModelTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    private val testDispatcher = StandardTestDispatcher()

    @Mock
    private lateinit var getTrendingMovies: GetTrendingMoviesUseCase

    @Mock
    private lateinit var getPopularMovies: GetPopularMoviesUseCase

    @Mock
    private lateinit var getUpcomingMovies: GetUpcomingMoviesUseCase

    private lateinit var viewModel: HomeViewModel

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadHomeData success with movies`() = runTest {
        // Arrange
        val mockMovies = listOf(
            Movie(
                id = 1,
                title = "Movie 1",
                posterPath = "/poster1.jpg",
                backdropPath = "/backdrop1.jpg",
                overview = "Overview 1",
                releaseDate = "2024-01-01",
                voteAverage = 8.5,
                voteCount = 1000,
                originalLanguage = "es",
                popularity = 100.0
            )
        )

        whenever(getTrendingMovies(page = 1)).thenReturn(Result.success(mockMovies))
        whenever(getPopularMovies(page = 1)).thenReturn(Result.success(mockMovies))
        whenever(getUpcomingMovies(page = 1)).thenReturn(Result.success(mockMovies))

        // Act
        viewModel = HomeViewModel(
            getTrendingMovies = getTrendingMovies,
            getPopularMovies = getPopularMovies,
            getUpcomingMovies = getUpcomingMovies
        )

        // Assert
        val state = viewModel.uiState.value
        assert(state is HomeUiState.Success)
        val successState = state as HomeUiState.Success
        assert(successState.data.trendingMovies.isNotEmpty())
        assert(successState.data.trendingMovies.size == 1)
        assert(successState.data.trendingMovies[0].title == "Movie 1")
    }

    @Test
    fun `loadHomeData error handling`() = runTest {
        // Arrange
        val errorMessage = "Network error"
        whenever(getTrendingMovies(page = 1))
            .thenReturn(Result.failure(Exception(errorMessage)))
        whenever(getPopularMovies(page = 1))
            .thenReturn(Result.failure(Exception(errorMessage)))
        whenever(getUpcomingMovies(page = 1))
            .thenReturn(Result.failure(Exception(errorMessage)))

        // Act
        viewModel = HomeViewModel(
            getTrendingMovies = getTrendingMovies,
            getPopularMovies = getPopularMovies,
            getUpcomingMovies = getUpcomingMovies
        )

        // Assert
        val state = viewModel.uiState.value
        assert(state is HomeUiState.Error)
        val errorState = state as HomeUiState.Error
        assert(errorState.message.isNotEmpty())
    }
}

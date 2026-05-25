package com.movix.feature.search.presentation

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.movix.core.data.repository.SearchRepository
import com.movix.core.model.SearchResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
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
class SearchViewModelTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    private val testDispatcher = StandardTestDispatcher()

    @Mock
    private lateinit var searchRepository: SearchRepository

    private lateinit var viewModel: SearchViewModel

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
    fun `search with valid query returns success`() = runTest {
        // Arrange
        val query = "Avengers"
        val mockResults = listOf(
            SearchResult(
                id = 1,
                mediaType = "movie",
                title = "Avengers",
                posterPath = "/poster.jpg",
                backdropPath = "/backdrop.jpg",
                overview = "Overview",
                voteAverage = 8.5,
                popularity = 100.0,
                releaseDate = "2024-01-01"
            )
        )
        whenever(searchRepository.search(query = query, page = 1))
            .thenReturn(Result.success(mockResults))
        whenever(searchRepository.getSearchHistory())
            .thenReturn(flowOf(listOf()))

        // Act
        viewModel = SearchViewModel(searchRepository)
        viewModel.search(query)

        // Assert
        val state = viewModel.uiState.value
        assert(state is SearchUiState.Success)
        val successState = state as SearchUiState.Success
        assert(successState.results.size == 1)
        assert(successState.results[0].title == "Avengers")
    }

    @Test
    fun `search with empty query does nothing`() = runTest {
        // Arrange
        whenever(searchRepository.getSearchHistory())
            .thenReturn(flowOf(listOf()))

        // Act
        viewModel = SearchViewModel(searchRepository)
        val initialState = viewModel.uiState.value
        viewModel.search("")

        // Assert
        assert(initialState is SearchUiState.Initial)
        assert(viewModel.uiState.value is SearchUiState.Initial)
    }

    @Test
    fun `search error handling`() = runTest {
        // Arrange
        val query = "Test"
        val errorMessage = "Network error"
        whenever(searchRepository.search(query = query, page = 1))
            .thenReturn(Result.failure(Exception(errorMessage)))
        whenever(searchRepository.getSearchHistory())
            .thenReturn(flowOf(listOf()))

        // Act
        viewModel = SearchViewModel(searchRepository)
        viewModel.search(query)

        // Assert
        val state = viewModel.uiState.value
        assert(state is SearchUiState.Error)
        val errorState = state as SearchUiState.Error
        assert(errorState.message.isNotEmpty())
    }

    @Test
    fun `updateQuery updates search query`() = runTest {
        // Arrange
        whenever(searchRepository.getSearchHistory())
            .thenReturn(flowOf(listOf()))

        // Act
        viewModel = SearchViewModel(searchRepository)
        viewModel.updateQuery("New Query")

        // Assert
        assert(viewModel.searchQuery.value == "New Query")
    }
}

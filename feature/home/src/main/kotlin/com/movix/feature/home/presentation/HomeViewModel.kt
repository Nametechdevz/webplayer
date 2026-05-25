package com.movix.feature.home.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.movix.core.model.Movie
import com.movix.feature.home.domain.usecase.GetTrendingMoviesUseCase
import com.movix.feature.home.domain.usecase.GetPopularMoviesUseCase
import com.movix.feature.home.domain.usecase.GetUpcomingMoviesUseCase
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val getTrendingMovies: GetTrendingMoviesUseCase,
    private val getPopularMovies: GetPopularMoviesUseCase,
    private val getUpcomingMovies: GetUpcomingMoviesUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadHomeData()
    }

    fun loadHomeData() {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading
            try {
                val trendingResult = getTrendingMovies(page = 1)
                val popularResult = getPopularMovies(page = 1)
                val upcomingResult = getUpcomingMovies(page = 1)

                if (trendingResult.isSuccess && popularResult.isSuccess && upcomingResult.isSuccess) {
                    _uiState.value = HomeUiState.Success(
                        HomeUiModel(
                            trendingMovies = trendingResult.getOrNull() ?: emptyList(),
                            popularMovies = popularResult.getOrNull() ?: emptyList(),
                            upcomingMovies = upcomingResult.getOrNull() ?: emptyList()
                        )
                    )
                } else {
                    val errorMessage = trendingResult.exceptionOrNull()?.message
                        ?: popularResult.exceptionOrNull()?.message
                        ?: upcomingResult.exceptionOrNull()?.message
                        ?: "Error desconocido"
                    _uiState.value = HomeUiState.Error(errorMessage)
                }
            } catch (e: Exception) {
                _uiState.value = HomeUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }
}

sealed class HomeUiState {
    object Loading : HomeUiState()
    data class Success(val data: HomeUiModel) : HomeUiState()
    data class Error(val message: String) : HomeUiState()
}

data class HomeUiModel(
    val trendingMovies: List<Movie> = emptyList(),
    val popularMovies: List<Movie> = emptyList(),
    val upcomingMovies: List<Movie> = emptyList()
)

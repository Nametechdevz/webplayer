package com.movix.feature.details.presentation

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.movix.core.model.Movie
import com.movix.core.model.TvShow
import com.movix.feature.details.domain.usecase.GetMovieDetailsUseCase
import com.movix.feature.details.domain.usecase.GetTvShowDetailsUseCase
import javax.inject.Inject

@HiltViewModel
class DetailsViewModel @Inject constructor(
    private val getMovieDetails: GetMovieDetailsUseCase,
    private val getTvShowDetails: GetTvShowDetailsUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val movieId: Int? = savedStateHandle["movieId"]
    private val showId: Int? = savedStateHandle["showId"]

    private val _uiState = MutableStateFlow<DetailsUiState>(DetailsUiState.Loading)
    val uiState: StateFlow<DetailsUiState> = _uiState.asStateFlow()

    init {
        loadDetails()
    }

    fun loadDetails() {
        viewModelScope.launch {
            _uiState.value = DetailsUiState.Loading
            try {
                when {
                    movieId != null -> {
                        val result = getMovieDetails(movieId = movieId)
                        if (result.isSuccess) {
                            _uiState.value = DetailsUiState.MovieSuccess(result.getOrNull()!!)
                        } else {
                            _uiState.value = DetailsUiState.Error(
                                result.exceptionOrNull()?.message ?: "Error desconocido"
                            )
                        }
                    }
                    showId != null -> {
                        val result = getTvShowDetails(showId = showId)
                        if (result.isSuccess) {
                            _uiState.value = DetailsUiState.TvShowSuccess(result.getOrNull()!!)
                        } else {
                            _uiState.value = DetailsUiState.Error(
                                result.exceptionOrNull()?.message ?: "Error desconocido"
                            )
                        }
                    }
                    else -> {
                        _uiState.value = DetailsUiState.Error("ID de contenido no válido")
                    }
                }
            } catch (e: Exception) {
                _uiState.value = DetailsUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }
}

sealed class DetailsUiState {
    object Loading : DetailsUiState()
    data class MovieSuccess(val movie: Movie) : DetailsUiState()
    data class TvShowSuccess(val tvShow: TvShow) : DetailsUiState()
    data class Error(val message: String) : DetailsUiState()
}

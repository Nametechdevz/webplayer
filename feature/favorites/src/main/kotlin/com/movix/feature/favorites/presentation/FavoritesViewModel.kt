package com.movix.feature.favorites.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.movix.core.data.repository.FavoriteRepository
import com.movix.core.model.Favorite
import com.movix.core.model.Watchlist
import javax.inject.Inject

@HiltViewModel
class FavoritesViewModel @Inject constructor(
    private val favoriteRepository: FavoriteRepository
) : ViewModel() {

    private val _favoritesState = MutableStateFlow<FavoritesUiState>(FavoritesUiState.Loading)
    val favoritesState: StateFlow<FavoritesUiState> = _favoritesState.asStateFlow()

    private val _watchlistState = MutableStateFlow<WatchlistUiState>(WatchlistUiState.Loading)
    val watchlistState: StateFlow<WatchlistUiState> = _watchlistState.asStateFlow()

    init {
        loadFavorites()
        loadWatchlist()
    }

    private fun loadFavorites() {
        viewModelScope.launch {
            favoriteRepository.getFavorites().collect { favorites ->
                if (favorites.isEmpty()) {
                    _favoritesState.value = FavoritesUiState.Empty
                } else {
                    _favoritesState.value = FavoritesUiState.Success(favorites)
                }
            }
        }
    }

    private fun loadWatchlist() {
        viewModelScope.launch {
            favoriteRepository.getWatchlist().collect { watchlist ->
                if (watchlist.isEmpty()) {
                    _watchlistState.value = WatchlistUiState.Empty
                } else {
                    _watchlistState.value = WatchlistUiState.Success(watchlist)
                }
            }
        }
    }

    fun removeFavorite(mediaType: String, mediaId: Int) {
        viewModelScope.launch {
            favoriteRepository.removeFavorite(mediaType, mediaId)
        }
    }

    fun removeFromWatchlist(mediaType: String, mediaId: Int) {
        viewModelScope.launch {
            favoriteRepository.removeFromWatchlist(mediaType, mediaId)
        }
    }
}

sealed class FavoritesUiState {
    object Loading : FavoritesUiState()
    object Empty : FavoritesUiState()
    data class Success(val favorites: List<Favorite>) : FavoritesUiState()
}

sealed class WatchlistUiState {
    object Loading : WatchlistUiState()
    object Empty : WatchlistUiState()
    data class Success(val watchlist: List<Watchlist>) : WatchlistUiState()
}

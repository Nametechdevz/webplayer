package com.movix.feature.search.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.movix.core.data.repository.SearchRepository
import com.movix.core.model.SearchResult
import javax.inject.Inject

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val searchRepository: SearchRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _uiState = MutableStateFlow<SearchUiState>(SearchUiState.Initial)
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()

    private val _searchHistory = searchRepository.getSearchHistory()
    val searchHistory: StateFlow<List<String>> = _searchHistory.asStateFlow()

    init {
        loadSearchHistory()
    }

    fun updateQuery(query: String) {
        _searchQuery.value = query
    }

    fun search(query: String) {
        if (query.isBlank()) return

        updateQuery(query)
        viewModelScope.launch {
            _uiState.value = SearchUiState.Loading
            try {
                val result = searchRepository.search(query = query)
                if (result.isSuccess) {
                    val results = result.getOrNull() ?: emptyList()
                    _uiState.value = SearchUiState.Success(results)
                } else {
                    _uiState.value = SearchUiState.Error(
                        result.exceptionOrNull()?.message ?: "Error desconocido"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = SearchUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }

    fun clearHistory() {
        viewModelScope.launch {
            searchRepository.clearSearchHistory()
        }
    }

    fun searchFromHistory(query: String) {
        search(query)
    }

    private fun loadSearchHistory() {
        viewModelScope.launch {
            searchRepository.getSearchHistory().collect { history ->
                // Updated in searchHistory StateFlow
            }
        }
    }
}

sealed class SearchUiState {
    object Initial : SearchUiState()
    object Loading : SearchUiState()
    data class Success(val results: List<SearchResult>) : SearchUiState()
    data class Error(val message: String) : SearchUiState()
}

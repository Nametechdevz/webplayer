package com.movix.feature.search.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.movix.core.model.SearchResult
import com.movix.core.ui.component.ErrorMessage
import com.movix.core.ui.component.LoadingIndicator
import com.movix.core.ui.component.MovieCard
import com.movix.core.ui.component.SearchBar

@Composable
fun SearchScreen(
    viewModel: SearchViewModel = hiltViewModel(),
    onResultClick: (mediaType: String, id: Int) -> Unit = { _, _ -> }
) {
    val searchQuery by viewModel.searchQuery.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    val searchHistory by viewModel.searchHistory.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        SearchBar(
            query = searchQuery,
            onQueryChange = { viewModel.updateQuery(it) },
            onSearch = { viewModel.search(it) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        )

        when (uiState) {
            is SearchUiState.Initial -> {
                if (searchHistory.isNotEmpty()) {
                    SearchHistorySection(
                        history = searchHistory,
                        onHistoryItemClick = { viewModel.searchFromHistory(it) },
                        onClear = { viewModel.clearHistory() }
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Busca películas y series",
                            color = Color.Gray,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
            is SearchUiState.Loading -> {
                LoadingIndicator(message = "Buscando...")
            }
            is SearchUiState.Success -> {
                val results = (uiState as SearchUiState.Success).results
                SearchResultsGrid(
                    results = results,
                    onResultClick = onResultClick
                )
            }
            is SearchUiState.Error -> {
                val message = (uiState as SearchUiState.Error).message
                ErrorMessage(message = message)
            }
        }
    }
}

@Composable
private fun SearchHistorySection(
    history: List<String>,
    onHistoryItemClick: (String) -> Unit,
    onClear: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Búsquedas recientes",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White
                )
                IconButton(onClick = onClear) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Limpiar historial",
                        tint = Color.Gray
                    )
                }
            }
        }

        items(history) { query ->
            SearchHistoryItem(
                query = query,
                onClick = { onHistoryItemClick(query) }
            )
        }
    }
}

@Composable
private fun SearchHistoryItem(
    query: String,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .clickable { onClick() },
        color = Color.DarkGray.copy(alpha = 0.3f),
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = query,
            style = MaterialTheme.typography.bodyMedium,
            color = Color.White,
            modifier = Modifier.padding(12.dp),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun SearchResultsGrid(
    results: List<SearchResult>,
    onResultClick: (mediaType: String, id: Int) -> Unit
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(results) { result ->
            SearchResultCard(
                result = result,
                onClick = { onResultClick(result.mediaType, result.id) }
            )
        }
    }
}

@Composable
private fun SearchResultCard(
    result: SearchResult,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp)
            .clickable { onClick() },
        shape = MaterialTheme.shapes.medium,
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(
            modifier = Modifier.fillMaxSize()
        ) {
            if (result.posterPath != null) {
                coil.compose.AsyncImage(
                    model = "https://image.tmdb.org/t/p/w342${result.posterPath}",
                    contentDescription = result.title,
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        brush = androidx.compose.ui.graphics.Brush.verticalGradient(
                            colors = listOf(
                                Color.Transparent,
                                Color.Black.copy(alpha = 0.9f)
                            ),
                            startY = 100f
                        )
                    )
            )

            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(8.dp),
                verticalArrangement = Arrangement.Bottom
            ) {
                Text(
                    text = result.title,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.White,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "⭐ ${String.format("%.1f", result.voteAverage)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Yellow,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
    }
}

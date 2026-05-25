package com.movix.feature.favorites.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.movix.core.model.Favorite
import com.movix.core.model.Watchlist
import com.movix.core.ui.component.LoadingIndicator
import com.movix.core.ui.component.MovieCard

@Composable
fun FavoritesScreen(
    viewModel: FavoritesViewModel = hiltViewModel(),
    onFavoriteClick: (mediaType: String, id: Int) -> Unit = { _, _ -> }
) {
    val favoritesState by viewModel.favoritesState.collectAsState()
    val watchlistState by viewModel.watchlistState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            item {
                Text(
                    text = "Mi Biblioteca",
                    style = MaterialTheme.typography.headlineLarge,
                    color = Color.White,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp)
                )
            }

            // Favorites section
            item {
                SectionHeader(title = "Favoritos")
            }

            item {
                when (favoritesState) {
                    is FavoritesUiState.Loading -> {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(150.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                    is FavoritesUiState.Empty -> {
                        EmptyState(message = "No tienes favoritos yet")
                    }
                    is FavoritesUiState.Success -> {
                        val favorites = (favoritesState as FavoritesUiState.Success).favorites
                        FavoriteRow(
                            favorites = favorites,
                            onItemClick = { favorite ->
                                onFavoriteClick(favorite.mediaType, favorite.mediaId)
                            },
                            onDelete = { mediaType, mediaId ->
                                viewModel.removeFavorite(mediaType, mediaId)
                            }
                        )
                    }
                }
            }

            // Watchlist section
            item {
                SectionHeader(title = "Ver después", topPadding = 24.dp)
            }

            item {
                when (watchlistState) {
                    is WatchlistUiState.Loading -> {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(150.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                    is WatchlistUiState.Empty -> {
                        EmptyState(message = "Tu lista de espera está vacía")
                    }
                    is WatchlistUiState.Success -> {
                        val watchlist = (watchlistState as WatchlistUiState.Success).watchlist
                        WatchlistRow(
                            watchlist = watchlist,
                            onItemClick = { item ->
                                onFavoriteClick(item.mediaType, item.mediaId)
                            },
                            onDelete = { mediaType, mediaId ->
                                viewModel.removeFromWatchlist(mediaType, mediaId)
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    topPadding: Int = 16
) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleLarge,
        color = Color.White,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = topPadding.dp)
    )
}

@Composable
private fun EmptyState(message: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = message,
            color = Color.Gray,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

@Composable
private fun FavoriteRow(
    favorites: List<Favorite>,
    onItemClick: (Favorite) -> Unit,
    onDelete: (String, Int) -> Unit
) {
    LazyRow(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(favorites) { favorite ->
            FavoriteCard(
                favorite = favorite,
                onClick = { onItemClick(favorite) },
                onDelete = { onDelete(favorite.mediaType, favorite.mediaId) }
            )
        }
    }
}

@Composable
private fun WatchlistRow(
    watchlist: List<Watchlist>,
    onItemClick: (Watchlist) -> Unit,
    onDelete: (String, Int) -> Unit
) {
    LazyRow(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(watchlist) { item ->
            WatchlistCard(
                item = item,
                onClick = { onItemClick(item) },
                onDelete = { onDelete(item.mediaType, item.mediaId) }
            )
        }
    }
}

@Composable
private fun FavoriteCard(
    favorite: Favorite,
    onClick: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(140.dp)
            .height(210.dp),
        shape = MaterialTheme.shapes.medium,
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(
            modifier = Modifier.fillMaxSize()
        ) {
            if (favorite.posterPath != null) {
                coil.compose.AsyncImage(
                    model = "https://image.tmdb.org/t/p/w342${favorite.posterPath}",
                    contentDescription = favorite.title,
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            }

            IconButton(
                onClick = onDelete,
                modifier = Modifier.align(Alignment.TopEnd)
            ) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Eliminar",
                    tint = Color.Red
                )
            }
        }
    }
}

@Composable
private fun WatchlistCard(
    item: Watchlist,
    onClick: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(140.dp)
            .height(210.dp),
        shape = MaterialTheme.shapes.medium,
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(
            modifier = Modifier.fillMaxSize()
        ) {
            if (item.posterPath != null) {
                coil.compose.AsyncImage(
                    model = "https://image.tmdb.org/t/p/w342${item.posterPath}",
                    contentDescription = item.title,
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            }

            IconButton(
                onClick = onDelete,
                modifier = Modifier.align(Alignment.TopEnd)
            ) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Eliminar",
                    tint = Color.Red
                )
            }
        }
    }
}

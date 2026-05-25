package com.movix.feature.home.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.movix.core.model.Movie
import com.movix.core.ui.component.ErrorMessage
import com.movix.core.ui.component.LoadingIndicator
import com.movix.core.ui.component.MovieCard

@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel(),
    onMovieClick: (Movie) -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        when (uiState) {
            is HomeUiState.Loading -> {
                LoadingIndicator(message = "Cargando películas y series...")
            }
            is HomeUiState.Success -> {
                val data = (uiState as HomeUiState.Success).data
                HomeContent(data = data, onMovieClick = onMovieClick)
            }
            is HomeUiState.Error -> {
                val errorMessage = (uiState as HomeUiState.Error).message
                ErrorMessage(
                    message = errorMessage,
                    onRetry = { viewModel.loadHomeData() }
                )
            }
        }
    }
}

@Composable
private fun HomeContent(
    data: HomeUiModel,
    onMovieClick: (Movie) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        item {
            Text(
                text = "Bienvenido a Movix",
                style = MaterialTheme.typography.headlineLarge,
                color = Color.White,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp)
            )
        }

        // Trending
        if (data.trendingMovies.isNotEmpty()) {
            item {
                SectionTitle(title = "Tendencias")
            }
            item {
                MovieRow(
                    movies = data.trendingMovies.take(10),
                    onMovieClick = onMovieClick
                )
            }
        }

        // Popular
        if (data.popularMovies.isNotEmpty()) {
            item {
                SectionTitle(title = "Popular")
            }
            item {
                MovieRow(
                    movies = data.popularMovies.take(10),
                    onMovieClick = onMovieClick
                )
            }
        }

        // Upcoming
        if (data.upcomingMovies.isNotEmpty()) {
            item {
                SectionTitle(title = "Próximamente")
            }
            item {
                MovieRow(
                    movies = data.upcomingMovies.take(10),
                    onMovieClick = onMovieClick
                )
            }
        }
    }
}

@Composable
private fun SectionTitle(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleLarge,
        color = Color.White,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
    )
}

@Composable
private fun MovieRow(
    movies: List<Movie>,
    onMovieClick: (Movie) -> Unit
) {
    LazyRow(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(movies) { movie ->
            MovieCard(
                movie = movie,
                onClick = { onMovieClick(movie) }
            )
        }
    }
}

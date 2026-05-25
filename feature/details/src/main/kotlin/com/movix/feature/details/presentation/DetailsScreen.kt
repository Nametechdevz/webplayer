package com.movix.feature.details.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.movix.core.common.constant.ApiConstants
import com.movix.core.model.Movie
import com.movix.core.model.TvShow
import com.movix.core.ui.component.CastSection
import com.movix.core.ui.component.ErrorMessage
import com.movix.core.ui.component.LoadingIndicator

@Composable
fun DetailsScreen(
    viewModel: DetailsViewModel = hiltViewModel(),
    onBackClick: () -> Unit = {},
    onPlayClick: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        when (uiState) {
            is DetailsUiState.Loading -> {
                LoadingIndicator(message = "Cargando detalles...")
            }
            is DetailsUiState.MovieSuccess -> {
                val movie = (uiState as DetailsUiState.MovieSuccess).movie
                MovieDetailsContent(
                    movie = movie,
                    onBackClick = onBackClick,
                    onPlayClick = onPlayClick
                )
            }
            is DetailsUiState.TvShowSuccess -> {
                val show = (uiState as DetailsUiState.TvShowSuccess).tvShow
                TvShowDetailsContent(
                    tvShow = show,
                    onBackClick = onBackClick,
                    onPlayClick = onPlayClick
                )
            }
            is DetailsUiState.Error -> {
                val message = (uiState as DetailsUiState.Error).message
                ErrorMessage(
                    message = message,
                    onRetry = { viewModel.loadDetails() }
                )
            }
        }
    }
}

@Composable
private fun MovieDetailsContent(
    movie: Movie,
    onBackClick: () -> Unit,
    onPlayClick: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize()
    ) {
        item {
            DetailsHeader(
                backdropPath = movie.backdropPath,
                posterPath = movie.posterPath,
                title = movie.title,
                onBackClick = onBackClick,
                onPlayClick = onPlayClick
            )
        }

        item {
            DetailsInfo(
                title = movie.title,
                releaseDate = movie.releaseDate,
                voteAverage = movie.voteAverage,
                overview = movie.overview,
                runtime = movie.runtime?.toString()
            )
        }

        if (movie.credits != null) {
            item {
                CastSection(cast = movie.credits.cast)
            }
        }
    }
}

@Composable
private fun TvShowDetailsContent(
    tvShow: TvShow,
    onBackClick: () -> Unit,
    onPlayClick: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize()
    ) {
        item {
            DetailsHeader(
                backdropPath = tvShow.backdropPath,
                posterPath = tvShow.posterPath,
                title = tvShow.name,
                onBackClick = onBackClick,
                onPlayClick = onPlayClick
            )
        }

        item {
            DetailsInfo(
                title = tvShow.name,
                releaseDate = tvShow.firstAirDate,
                voteAverage = tvShow.voteAverage,
                overview = tvShow.overview,
                seasons = "${tvShow.numberOfSeasons} temporadas"
            )
        }

        if (tvShow.credits != null) {
            item {
                CastSection(cast = tvShow.credits.cast)
            }
        }
    }
}

@Composable
private fun DetailsHeader(
    backdropPath: String?,
    posterPath: String?,
    title: String,
    onBackClick: () -> Unit,
    onPlayClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(300.dp)
    ) {
        if (backdropPath != null) {
            AsyncImage(
                model = "${ApiConstants.TMDB_IMAGE_BASE_URL}${ApiConstants.TMDB_IMAGE_SIZE_BACKDROP}$backdropPath",
                contentDescription = title,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            Color.Black.copy(alpha = 0.8f)
                        ),
                        startY = 200f
                    )
                )
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            IconButton(onClick = onBackClick) {
                Icon(
                    imageVector = Icons.Default.ArrowBack,
                    contentDescription = "Atrás",
                    tint = Color.White
                )
            }
            IconButton(onClick = { }) {
                Icon(
                    imageVector = Icons.Default.FavoriteBorder,
                    contentDescription = "Favorito",
                    tint = Color.White
                )
            }
        }

        Row(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            if (posterPath != null) {
                Card(
                    modifier = Modifier
                        .width(100.dp)
                        .height(150.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    AsyncImage(
                        model = "${ApiConstants.TMDB_IMAGE_BASE_URL}${ApiConstants.TMDB_IMAGE_SIZE_POSTER}$posterPath",
                        contentDescription = title,
                        contentScale = ContentScale.Crop
                    )
                }
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color.White,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Button(
                    onClick = onPlayClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                ) {
                    Text("▶ Reproducir")
                }
            }
        }
    }
}

@Composable
private fun DetailsInfo(
    title: String,
    releaseDate: String,
    voteAverage: Double,
    overview: String,
    runtime: String? = null,
    seasons: String? = null
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = releaseDate.take(4),
                style = MaterialTheme.typography.labelMedium,
                color = Color.Gray
            )
            Text(
                text = "⭐ ${String.format("%.1f", voteAverage)}",
                style = MaterialTheme.typography.labelMedium,
                color = Color.Yellow
            )
            if (runtime != null) {
                Text(
                    text = "⏱ ${runtime}m",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color.Gray
                )
            }
            if (seasons != null) {
                Text(
                    text = seasons,
                    style = MaterialTheme.typography.labelMedium,
                    color = Color.Gray
                )
            }
        }

        Text(
            text = "Sinopsis",
            style = MaterialTheme.typography.titleMedium,
            color = Color.White
        )

        Text(
            text = overview,
            style = MaterialTheme.typography.bodyMedium,
            color = Color.White,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

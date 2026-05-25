package com.movix.feature.player.presentation

import android.view.ViewGroup
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.media3.ui.PlayerView
import com.movix.core.ui.component.ErrorMessage
import com.movix.core.ui.component.LoadingIndicator

@Composable
fun PlayerScreen(
    viewModel: PlayerViewModel = hiltViewModel(),
    onBackClick: () -> Unit = {}
) {
    val playerState by viewModel.playerState.collectAsState()
    val context = LocalContext.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        when (playerState) {
            is PlayerViewModel.PlayerState.Preparing -> {
                LoadingIndicator(message = "Preparando video...")
            }
            is PlayerViewModel.PlayerState.Error -> {
                val error = (playerState as PlayerViewModel.PlayerState.Error).message
                ErrorMessage(
                    message = error,
                    onRetry = { /* Reintentar */ }
                )
            }
            else -> {
                // ExoPlayer View
                AndroidView(
                    factory = { ctx ->
                        PlayerView(ctx).apply {
                            player = viewModel.getExoPlayer()
                            useController = true
                            controllerShowTimeoutMs = 5000
                            controllerHideTimeoutMs = 5000
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )

                // Top controls
                Row(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .fillMaxWidth()
                        .padding(16.dp)
                        .background(Color.Black.copy(alpha = 0.3f)),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Cerrar",
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }

                    Text(
                        text = viewModel.movieTitle ?: "Reproducción",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        modifier = Modifier.weight(1f).padding(horizontal = 8.dp)
                    )

                    IconButton(onClick = { /* Settings */ }) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Configuración",
                            tint = Color.White
                        )
                    }
                }
            }
        }
    }

    LaunchedEffect(Unit) {
        viewModel.play()
    }
}

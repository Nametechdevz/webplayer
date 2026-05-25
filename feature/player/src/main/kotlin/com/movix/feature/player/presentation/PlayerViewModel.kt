package com.movix.feature.player.presentation

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.viewModelScope
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.text.CueGroup
import androidx.media3.exoplayer.ExoPlayer
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PlayerViewModel @Inject constructor(
    application: Application,
    savedStateHandle: SavedStateHandle
) : AndroidViewModel(application) {

    val movieId: Int? = savedStateHandle["movieId"]
    val movieTitle: String? = savedStateHandle["title"]

    private val _playerState = MutableStateFlow<PlayerState>(PlayerState.Preparing)
    val playerState: StateFlow<PlayerState> = _playerState.asStateFlow()

    private var exoPlayer: ExoPlayer? = null

    init {
        initializePlayer()
    }

    private fun initializePlayer() {
        viewModelScope.launch {
            try {
                val context = getApplication<Application>()
                exoPlayer = ExoPlayer.Builder(context)
                    .build()
                    .apply {
                        // Add listener
                        addListener(PlayerListener(this@PlayerViewModel))
                    }

                // Load a sample video URL
                // In production, this would come from your backend or TMDB
                val videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4"
                val mediaItem = MediaItem.Builder()
                    .setUri(videoUrl)
                    .setMimeType(MimeTypes.VIDEO_MP4)
                    .build()

                exoPlayer?.setMediaItem(mediaItem)
                exoPlayer?.prepare()
                _playerState.value = PlayerState.Ready
            } catch (e: Exception) {
                _playerState.value = PlayerState.Error(e.message ?: "Error initializing player")
            }
        }
    }

    fun play() {
        exoPlayer?.play()
    }

    fun pause() {
        exoPlayer?.pause()
    }

    fun seekTo(positionMs: Long) {
        exoPlayer?.seekTo(positionMs)
    }

    fun getExoPlayer(): ExoPlayer? = exoPlayer

    fun getCurrentPosition(): Long = exoPlayer?.currentPosition ?: 0L
    fun getDuration(): Long = exoPlayer?.duration ?: 0L
    fun isPlaying(): Boolean = exoPlayer?.isPlaying ?: false

    override fun onCleared() {
        super.onCleared()
        exoPlayer?.release()
        exoPlayer = null
    }

    sealed class PlayerState {
        object Preparing : PlayerState()
        object Ready : PlayerState()
        object Playing : PlayerState()
        object Paused : PlayerState()
        data class Error(val message: String) : PlayerState()
    }

    private inner class PlayerListener(private val viewModel: PlayerViewModel) :
        androidx.media3.common.Player.Listener {
        override fun onPlaybackStateChanged(state: Int) {
            when (state) {
                androidx.media3.common.Player.STATE_READY -> {
                    _playerState.value = PlayerState.Ready
                }
                androidx.media3.common.Player.STATE_ENDED -> {
                    _playerState.value = PlayerState.Paused
                }
            }
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
            if (isPlaying) {
                _playerState.value = PlayerState.Playing
            } else {
                _playerState.value = PlayerState.Paused
            }
        }
    }
}

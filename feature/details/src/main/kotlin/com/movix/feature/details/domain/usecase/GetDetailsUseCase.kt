package com.movix.feature.details.domain.usecase

import com.movix.core.data.repository.MovieRepository
import com.movix.core.data.repository.TvShowRepository
import com.movix.core.model.Movie
import com.movix.core.model.TvShow
import javax.inject.Inject

class GetMovieDetailsUseCase @Inject constructor(
    private val movieRepository: MovieRepository
) {
    suspend operator fun invoke(movieId: Int): Result<Movie> {
        return movieRepository.getMovieDetails(movieId = movieId)
    }
}

class GetTvShowDetailsUseCase @Inject constructor(
    private val tvShowRepository: TvShowRepository
) {
    suspend operator fun invoke(showId: Int): Result<TvShow> {
        return tvShowRepository.getTvShowDetails(showId = showId)
    }
}

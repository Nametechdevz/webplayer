package com.movix.feature.home.domain.usecase

import com.movix.core.data.repository.MovieRepository
import com.movix.core.model.Movie
import javax.inject.Inject

class GetTrendingMoviesUseCase @Inject constructor(
    private val movieRepository: MovieRepository
) {
    suspend operator fun invoke(page: Int = 1): Result<List<Movie>> {
        return movieRepository.getTrendingMovies(page = page)
    }
}

class GetPopularMoviesUseCase @Inject constructor(
    private val movieRepository: MovieRepository
) {
    suspend operator fun invoke(page: Int = 1): Result<List<Movie>> {
        return movieRepository.getPopularMovies(page = page)
    }
}

class GetUpcomingMoviesUseCase @Inject constructor(
    private val movieRepository: MovieRepository
) {
    suspend operator fun invoke(page: Int = 1): Result<List<Movie>> {
        return movieRepository.getUpcomingMovies(page = page)
    }
}

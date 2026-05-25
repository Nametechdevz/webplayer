package com.movix.core.common.constant

object ApiConstants {
    const val TMDB_API_KEY = "174d6bd131df029d17d13dc4c0402696"
    const val TMDB_BASE_URL = "https://api.themoviedb.org/3/"
    const val TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/"
    const val TMDB_IMAGE_SIZE_POSTER = "w342"
    const val TMDB_IMAGE_SIZE_BACKDROP = "w780"
    const val TMDB_IMAGE_SIZE_PROFILE = "w185"

    const val DEFAULT_LANGUAGE = "es-MX"
    const val DEFAULT_PAGE_SIZE = 20
    const val DEFAULT_TIMEOUT_SECONDS = 30L

    object Endpoints {
        const val MOVIE_TRENDING = "trending/movie/week"
        const val MOVIE_POPULAR = "movie/popular"
        const val MOVIE_UPCOMING = "movie/upcoming"
        const val MOVIE_DETAILS = "movie/{movieId}"
        const val TV_TRENDING = "trending/tv/week"
        const val TV_POPULAR = "tv/popular"
        const val TV_DETAILS = "tv/{seriesId}"
        const val SEARCH_MULTI = "search/multi"
        const val GENRE_MOVIES = "genre/movie/list"
        const val GENRE_TV = "genre/tv/list"
    }
}

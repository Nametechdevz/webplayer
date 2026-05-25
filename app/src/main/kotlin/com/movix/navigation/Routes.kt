package com.movix.navigation

object Routes {
    const val HOME = "home"
    const val SEARCH = "search"
    const val FAVORITES = "favorites"
    const val SETTINGS = "settings"
    const val MOVIE_DETAILS = "movie_details/{movieId}"
    const val TV_DETAILS = "tv_details/{showId}"
    const val PLAYER = "player/{movieId}?title={title}"

    fun movieDetails(movieId: Int) = "movie_details/$movieId"
    fun tvDetails(showId: Int) = "tv_details/$showId"
    fun player(movieId: Int, title: String) = "player/$movieId?title=$title"
}

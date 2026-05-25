package com.movix.navigation

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import androidx.navigation.NavType
import com.movix.feature.details.presentation.DetailsScreen
import com.movix.feature.favorites.presentation.FavoritesScreen
import com.movix.feature.home.presentation.HomeScreen
import com.movix.feature.player.presentation.PlayerScreen
import com.movix.feature.search.presentation.SearchScreen
import com.movix.feature.settings.presentation.SettingsScreen

@Composable
fun NavGraph(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Routes.HOME
    ) {
        // Home
        composable(Routes.HOME) {
            HomeScreen(
                onMovieClick = { movie ->
                    navController.navigate(Routes.movieDetails(movie.id))
                }
            )
        }

        // Search
        composable(Routes.SEARCH) {
            SearchScreen(
                onResultClick = { mediaType, id ->
                    if (mediaType == "movie") {
                        navController.navigate(Routes.movieDetails(id))
                    } else if (mediaType == "tv") {
                        navController.navigate(Routes.tvDetails(id))
                    }
                }
            )
        }

        // Movie Details
        composable(
            route = Routes.MOVIE_DETAILS,
            arguments = listOf(
                navArgument("movieId") { type = NavType.IntType }
            )
        ) {
            DetailsScreen(
                onBackClick = { navController.popBackStack() },
                onPlayClick = {
                    // Get movie title from arguments if needed
                    navController.navigate(Routes.player(it.id, it.title))
                }
            )
        }

        // TV Show Details
        composable(
            route = Routes.TV_DETAILS,
            arguments = listOf(
                navArgument("showId") { type = NavType.IntType }
            )
        ) {
            DetailsScreen(
                onBackClick = { navController.popBackStack() },
                onPlayClick = { /* Handle TV show playback */ }
            )
        }

        // Player
        composable(
            route = Routes.PLAYER,
            arguments = listOf(
                navArgument("movieId") { type = NavType.IntType },
                navArgument("title") { type = NavType.StringType }
            )
        ) {
            PlayerScreen(
                onBackClick = { navController.popBackStack() }
            )
        }

        // Favorites
        composable(Routes.FAVORITES) {
            FavoritesScreen(
                onFavoriteClick = { mediaType, id ->
                    if (mediaType == "movie") {
                        navController.navigate(Routes.movieDetails(id))
                    }
                }
            )
        }

        // Settings
        composable(Routes.SETTINGS) {
            SettingsScreen()
        }
    }
}

package com.movix.ui

import androidx.compose.foundation.background
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.movix.navigation.NavGraph
import com.movix.navigation.Routes

data class NavigationItem(
    val route: String,
    val label: String,
    val icon: ImageVector
)

@Composable
fun MainScreen(navController: NavHostController) {
    val navItems = listOf(
        NavigationItem(Routes.HOME, "Inicio", Icons.Default.Home),
        NavigationItem(Routes.SEARCH, "Buscar", Icons.Default.Search),
        NavigationItem(Routes.FAVORITES, "Favoritos", Icons.Default.Favorite),
        NavigationItem(Routes.SETTINGS, "Configuración", Icons.Default.Settings),
    )

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    val showBottomBar = currentDestination?.route in listOf(
        Routes.HOME,
        Routes.SEARCH,
        Routes.FAVORITES,
        Routes.SETTINGS
    )

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    modifier = Modifier.background(Color.Black),
                    containerColor = Color.Black,
                    contentColor = MaterialTheme.colorScheme.primary
                ) {
                    navItems.forEach { item ->
                        val isSelected = currentDestination?.hierarchy?.any {
                            it.route == item.route
                        } == true

                        NavigationBarItem(
                            icon = { Icon(item.icon, contentDescription = item.label) },
                            label = { Text(item.label) },
                            selected = isSelected,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(Routes.HOME) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                selectedTextColor = MaterialTheme.colorScheme.primary,
                                unselectedIconColor = Color.Gray,
                                unselectedTextColor = Color.Gray,
                                indicatorColor = Color.DarkGray.copy(alpha = 0.3f)
                            )
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        NavGraph(navController)
    }
}

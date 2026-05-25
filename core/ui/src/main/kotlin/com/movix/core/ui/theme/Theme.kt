package com.movix.core.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = MovixPrimary,
    onPrimary = MovixOnPrimary,
    primaryContainer = MovixPrimaryContainer,
    onPrimaryContainer = MovixOnPrimaryContainer,
    secondary = MovixSecondary,
    onSecondary = MovixOnSecondary,
    secondaryContainer = MovixSecondaryContainer,
    onSecondaryContainer = MovixOnSecondaryContainer,
    tertiary = MovixTertiary,
    onTertiary = MovixOnTertiary,
    tertiaryContainer = MovixTertiaryContainer,
    onTertiaryContainer = MovixOnTertiaryContainer,
    error = MovixError,
    onError = MovixOnError,
    errorContainer = MovixErrorContainer,
    onErrorContainer = MovixOnErrorContainer,
    background = MovixBackground,
    onBackground = MovixOnBackground,
    surface = MovixSurface,
    onSurface = MovixOnSurface,
    surfaceVariant = MovixSurfaceVariant,
    onSurfaceVariant = MovixOnSurfaceVariant,
    outline = MovixOutline,
    outlineVariant = MovixOutlineVariant,
    scrim = MovixScrim
)

private val LightColorScheme = lightColorScheme(
    primary = MovixPrimary,
    onPrimary = MovixOnPrimary,
    primaryContainer = MovixPrimaryContainer,
    onPrimaryContainer = MovixOnPrimaryContainer,
    secondary = MovixSecondary,
    onSecondary = MovixOnSecondary,
    secondaryContainer = MovixSecondaryContainer,
    onSecondaryContainer = MovixOnSecondaryContainer,
    tertiary = MovixTertiary,
    onTertiary = MovixOnTertiary,
    tertiaryContainer = MovixTertiaryContainer,
    onTertiaryContainer = MovixOnTertiaryContainer,
    error = MovixError,
    onError = MovixOnError,
    errorContainer = MovixErrorContainer,
    onErrorContainer = MovixOnErrorContainer,
    background = MovixBackground,
    onBackground = MovixOnBackground,
    surface = MovixSurface,
    onSurface = MovixOnSurface,
    surfaceVariant = MovixSurfaceVariant,
    onSurfaceVariant = MovixOnSurfaceVariant,
    outline = MovixOutline,
    outlineVariant = MovixOutlineVariant,
    scrim = MovixScrim
)

@Composable
fun MovixTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && darkTheme -> darkColorScheme()
        dynamicColor && !darkTheme -> lightColorScheme()
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view)?.isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = MovixTypography,
        shapes = MovixShapes,
        content = content
    )
}

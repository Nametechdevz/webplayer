package com.movix.feature.settings.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

@Composable
fun SettingsScreen() {
    val darkMode = remember { mutableStateOf(true) }
    val notifications = remember { mutableStateOf(true) }
    val autoplay = remember { mutableStateOf(true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            item {
                Text(
                    text = "Configuración",
                    style = MaterialTheme.typography.headlineLarge,
                    color = Color.White,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp)
                )
            }

            item {
                SettingSection(title = "Pantalla")
            }

            item {
                ToggleSetting(
                    icon = Icons.Default.DarkMode,
                    title = "Modo oscuro",
                    description = "Tema oscuro activado",
                    isChecked = darkMode.value,
                    onCheckedChange = { darkMode.value = it }
                )
            }

            item {
                SettingSection(title = "Reproducción")
            }

            item {
                ToggleSetting(
                    icon = Icons.Default.PlayArrow,
                    title = "Reproducción automática",
                    description = "Reproducir automáticamente al cargar",
                    isChecked = autoplay.value,
                    onCheckedChange = { autoplay.value = it }
                )
            }

            item {
                SettingSection(title = "Notificaciones")
            }

            item {
                ToggleSetting(
                    icon = Icons.Default.Notifications,
                    title = "Notificaciones",
                    description = "Recibir notificaciones de nuevas películas",
                    isChecked = notifications.value,
                    onCheckedChange = { notifications.value = it }
                )
            }

            item {
                SettingSection(title = "Información")
            }

            item {
                BasicSetting(
                    icon = Icons.Default.Info,
                    title = "Versión",
                    description = "Movix 1.0.0"
                )
            }

            item {
                BasicSetting(
                    icon = Icons.Default.Shield,
                    title = "Política de privacidad",
                    description = "Ver política de privacidad"
                )
            }

            item {
                BasicSetting(
                    icon = Icons.Default.Description,
                    title = "Términos de servicio",
                    description = "Ver términos de servicio"
                )
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun SettingSection(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
    )
}

@Composable
private fun ToggleSetting(
    icon: ImageVector,
    title: String,
    description: String,
    isChecked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .clickable { onCheckedChange(!isChecked) },
        color = Color.DarkGray.copy(alpha = 0.2f),
        shape = MaterialTheme.shapes.medium
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )

                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White
                    )
                    Text(
                        text = description,
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.Gray
                    )
                }
            }

            Switch(
                checked = isChecked,
                onCheckedChange = onCheckedChange,
                modifier = Modifier.scale(0.8f)
            )
        }
    }
}

@Composable
private fun BasicSetting(
    icon: ImageVector,
    title: String,
    description: String,
    onClick: () -> Unit = {}
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .clickable { onClick() },
        color = Color.DarkGray.copy(alpha = 0.2f),
        shape = MaterialTheme.shapes.medium
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )

                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White
                    )
                    Text(
                        text = description,
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.Gray
                    )
                }
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = "Navegar",
                tint = Color.Gray
            )
        }
    }
}

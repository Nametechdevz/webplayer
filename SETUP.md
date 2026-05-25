# Guía de Instalación - Movix App

## Requisitos Previos

- Android Studio 2023.1 o superior
- JDK 17
- Android SDK compileSdk 34
- minSdk 26 (Android 8.0+)
- Gradle 8.0+

## Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Nametechdevz/webplayer.git
cd webplayer
```

### 2. Abrir en Android Studio

```bash
# Abrir en Android Studio
open -a "Android Studio" .
```

### 3. Sincronizar Gradle

- Android Studio → File → Sync Now
- O ejecutar desde terminal:

```bash
./gradlew build
```

## Compilar la Aplicación

### Modo Debug (Desarrollo)

```bash
./gradlew assembleDebug
```

La APK se encontrará en: `app/build/outputs/apk/debug/`

### Modo Release (Producción)

```bash
./gradlew assembleRelease
```

## Ejecutar Tests Unitarios

```bash
# Ejecutar todos los tests
./gradlew test

# Ejecutar tests de módulo específico
./gradlew :feature:home:test
./gradlew :core:data:test
./gradlew :feature:search:test
```

### Resultados de Tests

Los reportes se encontrarán en:
- `feature/home/build/reports/tests/`
- `core/data/build/reports/tests/`
- `feature/search/build/reports/tests/`

## Instalar en Dispositivo/Emulador

### Opción 1: Desde Android Studio

1. Conectar dispositivo o iniciar emulador
2. Run → Run 'app'
3. Seleccionar dispositivo
4. Presionar OK

### Opción 2: Desde Terminal

```bash
# Instalar APK debug
adb install app/build/outputs/apk/debug/app-debug.apk

# Ejecutar la app
adb shell am start -n com.movix/.MainActivity
```

## Características Implementadas

### ✅ Funcionalidad Completa

- **Home**: Películas trending, populares, próximamente
- **Search**: Búsqueda multi-tipo con historial
- **Details**: Información de películas/series con cast
- **Player**: Reproductor con ExoPlayer (video de prueba)
- **Favorites**: Guardar favoritos y watchlist
- **Settings**: Configuración de usuario
- **Navigation**: Navegación completa entre pantallas

### ✅ Tecnologías

- **Kotlin 1.9.20** - Lenguaje principal
- **Jetpack Compose** - UI moderna
- **Material Design 3** - Diseño profesional
- **MVVM + Clean Architecture** - Arquitectura
- **Hilt** - Inyección de dependencias
- **Room** - Base de datos local
- **Retrofit** - Cliente HTTP
- **ExoPlayer** - Reproductor de video
- **Coroutines** - Async/Await
- **Flow/StateFlow** - Reactive programming

### ✅ Testing

- Unit tests para ViewModels
- Unit tests para Repositories
- Mock objects con Mockito
- Pruebas de flujos
- Cobertura en features principales

## Estructura del Proyecto

```
movix/
├── app/                    # Aplicación principal
├── core/
│   ├── common/            # Constantes, excepciones
│   ├── network/           # API TMDB
│   ├── data/              # Room, Repositorios
│   ├── model/             # Entidades de dominio
│   └── ui/                # Componentes compartidos
├── feature/
│   ├── home/              # Pantalla principal
│   ├── search/            # Búsqueda
│   ├── details/           # Detalles de película/serie
│   ├── player/            # Reproductor
│   ├── favorites/         # Favoritos
│   └── settings/          # Configuración
└── gradle/                # Configuración gradle
```

## Problemas Comunes

### Error: "Gradle sync failed"

**Solución:**
```bash
./gradlew clean
./gradlew build
```

### Error: "Unable to get library definitions from...mvnrepository.com"

**Solución:** Verificar conexión a internet o usar proxy:
```bash
./gradlew build --gradle-user-home /tmp/gradle_tmp
```

### Video no reproduce en Player

**Verificar:**
1. Conexión a internet (video de prueba es de internet)
2. Permisos de INTERNET en AndroidManifest.xml
3. Usar URL HTTPS válida

## Próximos Pasos

### Agregar URL real de streaming:

Editar `feature/player/src/main/kotlin/com/movix/feature/player/presentation/PlayerViewModel.kt`:

```kotlin
// Línea ~30
val videoUrl = "tu_url_de_video_aqui"  // Reemplazar
```

### Agregar subtítulos:

1. Preparar archivo de subtítulos (SRT/VTT)
2. Usar MediaItem.SubtitleConfiguration en PlayerViewModel
3. Agregar selector de idioma en UI

## Contacto y Soporte

Para reportar bugs o sugerencias:
- Crear issue en GitHub
- Email: soporte@movix.dev

## Licencia

MIT License - Ver LICENSE.md para detalles

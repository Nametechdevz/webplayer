@echo off
REM =====================================================
REM   INSTALADOR AUTOMATICO MOVIX PARA WINDOWS
REM   Este script instala Android Studio, emulador y la app
REM =====================================================

color 0A
title Instalador Movix - Windows
cls

echo.
echo   ╔════════════════════════════════════════════════════╗
echo   ║                                                    ║
echo   ║     🎬 BIENVENIDO AL INSTALADOR MOVIX 🎬          ║
echo   ║                                                    ║
echo   ║     App de Películas y Series con Kotlin          ║
echo   ║                                                    ║
echo   ╚════════════════════════════════════════════════════╝
echo.

REM Verificar si se está ejecutando como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo   ⚠️  ADVERTENCIA: Este script necesita privilegios de Administrador
    echo.
    echo   Por favor, ejecuta este archivo como Administrador:
    echo   1. Click derecho en instalar-movix.bat
    echo   2. Selecciona "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo   ✅ Ejecutándose como Administrador
echo.

REM Verificar si Java está instalado
echo   Verificando requisitos...
java -version >nul 2>&1
if %errorLevel% equ 0 (
    echo   ✅ Java detectado
) else (
    echo   ⚠️  Java no está instalado
    echo.
    echo   Opción 1: Descargar desde https://www.oracle.com/java/technologies/downloads/
    echo   Opción 2: Android Studio incluye JDK
    echo.
)

REM Menú de opciones
echo.
echo   ╔════════════════════════════════════════════════════╗
echo   ║         SELECCIONA UNA OPCIÓN DE INSTALACIÓN      ║
echo   ╠════════════════════════════════════════════════════╣
echo   ║                                                    ║
echo   ║   1. Instalación Automática (RECOMENDADO)        ║
echo   ║      - Descarga Android Studio                    ║
echo   ║      - Configura emulador                         ║
echo   ║      - Instala la app automáticamente             ║
echo   ║                                                    ║
echo   ║   2. Instalar Solo la App (si ya tienes Android)  ║
echo   ║      - Compila y ejecuta la app                   ║
echo   ║                                                    ║
echo   ║   3. Descargar APK Pre-compilada                  ║
echo   ║      - Solo descarga el APK                       ║
echo   ║      - Instala manualmente después                ║
echo   ║                                                    ║
echo   ║   4. Ver Instrucciones Manuales                   ║
echo   ║      - Muestra pasos detallados                   ║
echo   ║                                                    ║
echo   ║   0. Salir                                         ║
echo   ║                                                    ║
echo   ╚════════════════════════════════════════════════════╝
echo.

set /p option="   Ingresa el número de opción (0-4): "

if "%option%"=="1" goto instalacion_automatica
if "%option%"=="2" goto instalar_app
if "%option%"=="3" goto descargar_apk
if "%option%"=="4" goto instrucciones_manuales
if "%option%"=="0" goto salir
goto menu_invalido

:menu_invalido
cls
echo.
echo   ❌ Opción inválida. Por favor, intenta de nuevo.
echo.
timeout /t 2 >nul
goto instalar-movix

:instalacion_automatica
cls
echo.
echo   ╔════════════════════════════════════════════════════╗
echo   ║         INSTALACIÓN AUTOMÁTICA EN PROGRESO        ║
echo   ╚════════════════════════════════════════════════════╝
echo.

echo   📥 Descargando Android Studio...
echo   (Esto puede tomar varios minutos)
echo.

REM Crear carpeta de descargas
if not exist "%USERPROFILE%\Downloads\Movix" mkdir "%USERPROFILE%\Downloads\Movix"

REM Ir a la carpeta de descargas
cd /d "%USERPROFILE%\Downloads\Movix"

REM Descargar Android Studio
powershell -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://dl.google.com/android/studio/install/2023.1.1.27/android-studio-2023.1.1.27-windows.exe' -OutFile 'android-studio.exe' } catch { Write-Host 'Error descargando Android Studio' }"

if exist android-studio.exe (
    echo   ✅ Android Studio descargado
    echo.
    echo   🔧 Instalando Android Studio...
    echo   (Se abrirá una ventana de instalación)
    echo.
    start /wait android-studio.exe
    echo   ✅ Android Studio instalado
) else (
    echo   ❌ Error descargando Android Studio
    echo.
    echo   Intenta descargarlo manualmente desde:
    echo   https://developer.android.com/studio
    echo.
)

goto despues_android_studio

:despues_android_studio
cls
echo.
echo   ╔════════════════════════════════════════════════════╗
echo   ║           SIGUIENTE: CREAR EMULADOR               ║
echo   ╚════════════════════════════════════════════════════╝
echo.
echo   1. Abre Android Studio
echo   2. Ve a Tools → Device Manager
echo   3. Click "Create Device"
echo   4. Selecciona "Pixel 4" o cualquier modelo
echo   5. Selecciona "Android 12" o superior
echo   6. Click "Finish"
echo   7. Click el botón PLAY para iniciar el emulador
echo.
echo   Presiona cualquier tecla cuando el emulador esté listo...
pause >nul

goto instalar_app

:instalar_app
cls
echo.
echo   ╔════════════════════════════════════════════════════╗
echo   ║          COMPILANDO E INSTALANDO APP              ║
echo   ╚════════════════════════════════════════════════════╝
echo.

REM Buscar la carpeta del proyecto
if exist "%cd%\settings.gradle.kts" (
    echo   ✅ Proyecto encontrado en: %cd%
) else if exist "%USERPROFILE%\webplayer\settings.gradle.kts" (
    cd /d "%USERPROFILE%\webplayer"
    echo   ✅ Proyecto encontrado en: %cd%
) else (
    echo.
    echo   ❌ Carpeta del proyecto no encontrada
    echo.
    echo   Por favor:
    echo   1. Descarga el proyecto desde: https://github.com/Nametechdevz/webplayer
    echo   2. Descomprime en una carpeta
    echo   3. Abre PowerShell en esa carpeta
    echo   4. Ejecuta este script desde allí
    echo.
    pause
    exit /b 1
)

echo.
echo   🔨 Compilando aplicación...
echo   (Esto puede tomar varios minutos la primera vez)
echo.

call gradlew.bat assembleDebug

if %errorLevel% equ 0 (
    echo.
    echo   ✅ Compilación exitosa
    echo.
    echo   📦 Instalando en emulador...
    echo   (Asegúrate de que el emulador está corriendo)
    echo.

    call gradlew.bat installDebug

    if %errorLevel% equ 0 (
        echo.
        echo   ✅ ¡Instalación completada con éxito!
        echo.
        echo   📱 La app se instaló correctamente
        echo.
    ) else (
        echo.
        echo   ⚠️  Error instalando la app
        echo.
        echo   Asegúrate de que:
        echo   1. El emulador está corriendo
        echo   2. Ejecutó: adb devices
        echo.
    )
) else (
    echo.
    echo   ❌ Error durante la compilación
    echo.
    echo   Intenta ejecutar manualmente:
    echo   gradlew.bat clean
    echo   gradlew.bat build
    echo.
)

goto instalar_exitosa

:instalar_exitosa
cls
echo.
echo   ╔════════════════════════════════════════════════════╗
echo   ║            ✅ ¡INSTALACIÓN EXITOSA! ✅            ║
echo   ╚════════════════════════════════════════════════════╝
echo.
echo   🎉 Movix está listo para usar
echo.
echo   Próximos pasos:
echo   1. Abre el emulador si no está abierto
echo   2. Busca el icono de Movix
echo   3. ¡Haz click y disfruta!
echo.
echo   Características disponibles:
echo   ✅ Ver películas trending/popular/próximamente
echo   ✅ Buscar películas y series
echo   ✅ Ver detalles y cast
echo   ✅ Reproducir videos
echo   ✅ Guardar favoritos
echo.
echo   Presiona cualquier tecla para salir...
pause >nul
goto salir

:descargar_apk
cls
echo.
echo   ╔════════════════════════════════════════════════════╗
echo   ║          DESCARGAR APK PRE-COMPILADA              ║
echo   ╚════════════════════════════════════════════════════╝
echo.
echo   📥 Descargando APK...
echo.

powershell -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://github.com/Nametechdevz/webplayer/releases/download/v1.0.0/movix-v1.0.0.apk' -OutFile 'movix-v1.0.0.apk' } catch { Write-Host 'Error descargando APK' }"

if exist movix-v1.0.0.apk (
    echo   ✅ APK descargado: movix-v1.0.0.apk
    echo.
    echo   Para instalar:
    echo   Opción 1: Arrastra el APK a BlueStacks
    echo   Opción 2: Ejecuta: adb install movix-v1.0.0.apk
    echo.
) else (
    echo   ℹ️  APK no disponible en el repositorio
    echo.
    echo   Para obtener el APK, compila localmente:
    echo   gradlew.bat assembleDebug
    echo.
    echo   El APK se encontrará en:
    echo   app\build\outputs\apk\debug\app-debug.apk
    echo.
)

pause
goto salir

:instrucciones_manuales
cls
echo.
echo   ╔════════════════════════════════════════════════════╗
echo   ║        INSTRUCCIONES DE INSTALACIÓN MANUAL        ║
echo   ╚════════════════════════════════════════════════════╝
echo.
echo   PASO 1: Instalar Android Studio
echo   ─────────────────────────────────
echo   1. Descarga desde: https://developer.android.com/studio
echo   2. Ejecuta el instalador
echo   3. Selecciona "Next" hasta completar
echo.
echo   PASO 2: Crear Emulador
echo   ──────────────────────
echo   1. Abre Android Studio
echo   2. Menú: Tools → Device Manager
echo   3. Click "Create Device"
echo   4. Selecciona "Pixel 4"
echo   5. Selecciona "Android 12" o superior
echo   6. Click "Finish"
echo.
echo   PASO 3: Clonar el Proyecto
echo   ──────────────────────────
echo   1. Abre PowerShell o CMD
echo   2. Ejecuta:
echo      git clone https://github.com/Nametechdevz/webplayer.git
echo      cd webplayer
echo.
echo   PASO 4: Compilar e Instalar
echo   ────────────────────────────
echo   1. En la carpeta del proyecto, ejecuta:
echo      gradlew.bat run
echo.
echo   2. Espera a que compile e instale
echo   3. ¡La app se abrirá automáticamente!
echo.
echo   PASO 5: Solucionar Problemas
echo   ────────────────────────────
echo   Lee el archivo: INSTALADOR_WINDOWS.md
echo   O consulta: SETUP.md
echo.
pause
goto salir

:salir
cls
echo.
echo   ¡Hasta luego! 👋
echo.
echo   Para más información, lee:
echo   - INSTALADOR_WINDOWS.md
echo   - SETUP.md
echo.
exit /b 0

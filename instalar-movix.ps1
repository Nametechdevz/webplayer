# =====================================================
# INSTALADOR MOVIX PARA WINDOWS (PowerShell)
# Instala Android Studio, emulador y compila la app
# =====================================================

# Configuración
$ErrorActionPreference = "Continue"
$ProgressPreference = 'SilentlyContinue'

# Funciones
function Show-Header {
    Clear-Host
    Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                    ║" -ForegroundColor Cyan
    Write-Host "║     🎬 INSTALADOR MOVIX PARA WINDOWS 🎬           ║" -ForegroundColor Cyan
    Write-Host "║                                                    ║" -ForegroundColor Cyan
    Write-Host "║  App de Películas y Series con Kotlin + Compose  ║" -ForegroundColor Cyan
    Write-Host "║                                                    ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Check-Admin {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
    if (-not $isAdmin) {
        Write-Host "⚠️  Este script necesita privilegios de Administrador" -ForegroundColor Yellow
        Write-Host "`nEjecuta PowerShell como Administrador y reintenta." -ForegroundColor Yellow
        Read-Host "Presiona Enter para salir"
        exit 1
    }
    Write-Host "✅ Ejecutándose como Administrador`n" -ForegroundColor Green
}

function Check-Requirements {
    Write-Host "Verificando requisitos..." -ForegroundColor Yellow

    # Verificar Java
    try {
        $javaVersion = java -version 2>&1
        Write-Host "✅ Java detectado" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Java no encontrado" -ForegroundColor Yellow
        Write-Host "   Descarga desde: https://www.oracle.com/java/technologies/downloads/`n" -ForegroundColor Yellow
    }

    # Verificar Git
    try {
        $gitVersion = git --version 2>&1
        Write-Host "✅ Git detectado" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Git no encontrado" -ForegroundColor Yellow
        Write-Host "   Descarga desde: https://git-scm.com/download/win`n" -ForegroundColor Yellow
    }
}

function Show-Menu {
    Show-Header
    Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║      SELECCIONA UNA OPCIÓN DE INSTALACIÓN         ║" -ForegroundColor Cyan
    Write-Host "╠════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║                                                    ║" -ForegroundColor Cyan
    Write-Host "║  1. 📱 Instalación Automática (RECOMENDADO)       ║" -ForegroundColor Cyan
    Write-Host "║     - Descarga Android Studio                     ║" -ForegroundColor Cyan
    Write-Host "║     - Configura emulador                          ║" -ForegroundColor Cyan
    Write-Host "║     - Instala la app                              ║" -ForegroundColor Cyan
    Write-Host "║                                                    ║" -ForegroundColor Cyan
    Write-Host "║  2. 🔨 Compilar e Instalar (si ya tienes Android)║" -ForegroundColor Cyan
    Write-Host "║                                                    ║" -ForegroundColor Cyan
    Write-Host "║  3. 📥 Descargar APK Pre-compilada                ║" -ForegroundColor Cyan
    Write-Host "║                                                    ║" -ForegroundColor Cyan
    Write-Host "║  4. 📖 Ver Instrucciones Manuales                 ║" -ForegroundColor Cyan
    Write-Host "║                                                    ║" -ForegroundColor Cyan
    Write-Host "║  0. 🚪 Salir                                      ║" -ForegroundColor Cyan
    Write-Host "║                                                    ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan

    $option = Read-Host "`nIngresa el número de opción (0-4)"
    return $option
}

function Install-AndroidStudio {
    Write-Host "`n🎯 INSTALACIÓN AUTOMÁTICA EN PROGRESO`n" -ForegroundColor Cyan
    Write-Host "📥 Descargando Android Studio..." -ForegroundColor Yellow
    Write-Host "(Esto puede tomar varios minutos)`n" -ForegroundColor Yellow

    $outputPath = "$env:USERPROFILE\Downloads\android-studio.exe"
    $url = "https://dl.google.com/android/studio/install/2023.1.1.27/android-studio-2023.1.1.27-windows.exe"

    try {
        Invoke-WebRequest -Uri $url -OutFile $outputPath -UseBasicParsing
        Write-Host "✅ Android Studio descargado`n" -ForegroundColor Green
        Write-Host "🔧 Instalando Android Studio..." -ForegroundColor Yellow
        Write-Host "(Se abrirá una ventana de instalación)`n" -ForegroundColor Yellow

        Start-Process -FilePath $outputPath -Wait
        Write-Host "✅ Android Studio instalado`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error descargando Android Studio" -ForegroundColor Red
        Write-Host "Descarga manualmente desde: https://developer.android.com/studio`n" -ForegroundColor Yellow
    }
}

function Setup-Emulator {
    Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║         SIGUIENTE: CREAR Y INICIAR EMULADOR       ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

    Write-Host "1. Abre Android Studio" -ForegroundColor White
    Write-Host "2. Ve a Tools → Device Manager" -ForegroundColor White
    Write-Host "3. Click 'Create Device'" -ForegroundColor White
    Write-Host "4. Selecciona 'Pixel 4' o cualquier modelo" -ForegroundColor White
    Write-Host "5. Selecciona 'Android 12' o superior" -ForegroundColor White
    Write-Host "6. Click 'Finish'" -ForegroundColor White
    Write-Host "7. Click el botón PLAY para iniciar el emulador`n" -ForegroundColor White

    Read-Host "Presiona Enter cuando el emulador esté listo"
}

function Compile-App {
    Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║      COMPILANDO E INSTALANDO APLICACIÓN           ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

    # Buscar el proyecto
    $projectPath = $null

    if (Test-Path ".\settings.gradle.kts") {
        $projectPath = (Get-Location).Path
    } elseif (Test-Path "$env:USERPROFILE\webplayer\settings.gradle.kts") {
        $projectPath = "$env:USERPROFILE\webplayer"
        Set-Location $projectPath
    } else {
        Write-Host "❌ Carpeta del proyecto no encontrada`n" -ForegroundColor Red
        Write-Host "Por favor:" -ForegroundColor Yellow
        Write-Host "1. Descarga desde: https://github.com/Nametechdevz/webplayer" -ForegroundColor Yellow
        Write-Host "2. Descomprime en una carpeta" -ForegroundColor Yellow
        Write-Host "3. Ejecuta este script desde esa carpeta`n" -ForegroundColor Yellow
        Read-Host "Presiona Enter para salir"
        exit 1
    }

    Write-Host "✅ Proyecto encontrado en: $projectPath`n" -ForegroundColor Green

    Write-Host "🔨 Compilando aplicación..." -ForegroundColor Yellow
    Write-Host "(Esto puede tomar varios minutos la primera vez)`n" -ForegroundColor Yellow

    # Compilar
    & .\gradlew.bat assembleDebug

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Compilación exitosa`n" -ForegroundColor Green
        Write-Host "📦 Instalando en emulador..." -ForegroundColor Yellow
        Write-Host "(Asegúrate de que el emulador está corriendo)`n" -ForegroundColor Yellow

        # Instalar
        & .\gradlew.bat installDebug

        if ($LASTEXITCODE -eq 0) {
            Show-Success
        } else {
            Write-Host "`n⚠️  Error instalando la app" -ForegroundColor Yellow
            Write-Host "Asegúrate de que:" -ForegroundColor Yellow
            Write-Host "1. El emulador está corriendo" -ForegroundColor Yellow
            Write-Host "2. Ejecutaste: adb devices`n" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n❌ Error durante la compilación" -ForegroundColor Red
        Write-Host "Intenta ejecutar manualmente:" -ForegroundColor Yellow
        Write-Host ".\gradlew.bat clean" -ForegroundColor Yellow
        Write-Host ".\gradlew.bat build`n" -ForegroundColor Yellow
    }
}

function Show-Success {
    Clear-Host
    Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║        ✅ ¡INSTALACIÓN EXITOSA! ✅               ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Green

    Write-Host "🎉 Movix está listo para usar`n" -ForegroundColor Cyan

    Write-Host "Próximos pasos:" -ForegroundColor White
    Write-Host "1. Abre el emulador si no está abierto" -ForegroundColor White
    Write-Host "2. Busca el icono de Movix" -ForegroundColor White
    Write-Host "3. ¡Haz click y disfruta!`n" -ForegroundColor White

    Write-Host "Características disponibles:" -ForegroundColor Cyan
    Write-Host "✅ Ver películas trending/popular/próximamente" -ForegroundColor Green
    Write-Host "✅ Buscar películas y series" -ForegroundColor Green
    Write-Host "✅ Ver detalles y cast" -ForegroundColor Green
    Write-Host "✅ Reproducir videos" -ForegroundColor Green
    Write-Host "✅ Guardar favoritos`n" -ForegroundColor Green
}

function Show-Manual {
    Clear-Host
    Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║      INSTRUCCIONES DE INSTALACIÓN MANUAL          ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

    Write-Host "PASO 1: Instalar Android Studio" -ForegroundColor White
    Write-Host "────────────────────────────────" -ForegroundColor White
    Write-Host "1. Descarga desde: https://developer.android.com/studio" -ForegroundColor Yellow
    Write-Host "2. Ejecuta el instalador" -ForegroundColor Yellow
    Write-Host "3. Selecciona 'Next' hasta completar`n" -ForegroundColor Yellow

    Write-Host "PASO 2: Crear Emulador" -ForegroundColor White
    Write-Host "──────────────────────" -ForegroundColor White
    Write-Host "1. Abre Android Studio" -ForegroundColor Yellow
    Write-Host "2. Menú: Tools → Device Manager" -ForegroundColor Yellow
    Write-Host "3. Click 'Create Device'" -ForegroundColor Yellow
    Write-Host "4. Selecciona 'Pixel 4'" -ForegroundColor Yellow
    Write-Host "5. Selecciona 'Android 12' o superior" -ForegroundColor Yellow
    Write-Host "6. Click 'Finish'`n" -ForegroundColor Yellow

    Write-Host "PASO 3: Clonar el Proyecto" -ForegroundColor White
    Write-Host "──────────────────────────" -ForegroundColor White
    Write-Host "1. Abre PowerShell" -ForegroundColor Yellow
    Write-Host "2. Ejecuta:" -ForegroundColor Yellow
    Write-Host "   git clone https://github.com/Nametechdevz/webplayer.git" -ForegroundColor Cyan
    Write-Host "   cd webplayer`n" -ForegroundColor Cyan

    Write-Host "PASO 4: Compilar e Instalar" -ForegroundColor White
    Write-Host "────────────────────────────" -ForegroundColor White
    Write-Host "Opción A - Comando único:" -ForegroundColor Yellow
    Write-Host "   .\gradlew.bat run`n" -ForegroundColor Cyan

    Write-Host "Opción B - Pasos separados:" -ForegroundColor Yellow
    Write-Host "   .\gradlew.bat assembleDebug" -ForegroundColor Cyan
    Write-Host "   .\gradlew.bat installDebug`n" -ForegroundColor Cyan

    Read-Host "Presiona Enter para volver al menú"
    Show-Menu
}

# MAIN
Show-Header
Check-Admin
Check-Requirements

while ($true) {
    $option = Show-Menu

    switch ($option) {
        "1" {
            Install-AndroidStudio
            Setup-Emulator
            Compile-App
            Read-Host "`nPresiona Enter para salir"
            exit 0
        }
        "2" {
            Compile-App
            Read-Host "`nPresiona Enter para salir"
            exit 0
        }
        "3" {
            Write-Host "`n📥 Abre: https://github.com/Nametechdevz/webplayer/releases" -ForegroundColor Yellow
            Write-Host "   Descarga el APK pre-compilado`n" -ForegroundColor Yellow
            Read-Host "Presiona Enter para volver al menú"
        }
        "4" {
            Show-Manual
        }
        "0" {
            Write-Host "`n¡Hasta luego! 👋`n" -ForegroundColor Yellow
            exit 0
        }
        default {
            Write-Host "`n❌ Opción inválida`n" -ForegroundColor Red
            Read-Host "Presiona Enter para continuar"
        }
    }
}

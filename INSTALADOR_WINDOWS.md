# 📥 INSTALADOR MOVIX PARA WINDOWS

## Opción 1: Instalador Automático (RECOMENDADO) ⭐

### Requisitos Previos
- Windows 10/11 (64-bit)
- 4GB RAM mínimo
- 10GB espacio libre en disco
- Conexión a internet

### Pasos:

1. **Descargar el script instalador**
   - Guarda el archivo `instalar-movix.bat` en tu computadora

2. **Ejecutar como Administrador**
   - Click derecho en `instalar-movix.bat`
   - Selecciona "Ejecutar como administrador"

3. **Seguir las instrucciones**
   - El script descargará e instalará automáticamente:
     - Android Studio
     - Android Emulator
     - La app Movix

4. **¡Listo!**
   - La app se ejecutará automáticamente en el emulador

---

## Opción 2: Instalación Manual paso a paso

### Paso 1: Instalar Android Studio

```
1. Descarga desde: https://developer.android.com/studio
2. Ejecuta el instalador (.exe)
3. Selecciona "Next" hasta completar la instalación
4. Abre Android Studio después de instalar
```

### Paso 2: Crear un Emulador Virtual

```
1. En Android Studio: Tools → Device Manager
2. Click en "Create Device"
3. Selecciona "Pixel 4" (o cualquier modelo)
4. Selecciona Android 12 o superior
5. Click "Finish"
6. Click en el play ▶️ para iniciar el emulador
```

### Paso 3: Clonar el Proyecto

```bash
# Abre PowerShell o CMD en la carpeta donde quieras el proyecto

git clone https://github.com/Nametechdevz/webplayer.git
cd webplayer

# O descarga ZIP desde GitHub y descomprime
```

### Paso 4: Compilar e Instalar

```bash
# En la carpeta del proyecto:

# Compilar APK
./gradlew assembleDebug

# Instalar en emulador (debe estar corriendo)
./gradlew installDebug

# O compilar y ejecutar en uno solo:
./gradlew run
```

---

## Opción 3: Usar BlueStacks (MÁS FÁCIL)

### Alternativa rápida sin Android Studio

**BlueStacks** es un emulador Android más ligero para Windows:

### Pasos:

1. **Descargar BlueStacks**
   ```
   https://www.bluestacks.com/
   ```

2. **Instalar**
   - Click en el instalador descargado
   - Siguiente → Siguiente → Instalar

3. **Instalar APK**
   - Descarga el APK compilado: `app-debug.apk`
   - Arrastra el APK a BlueStacks
   - ¡La app se instalará automáticamente!

4. **Ejecutar**
   - Click en el icono de Movix en BlueStacks
   - ¡A disfrutar!

---

## Opción 4: Descargar APK Pre-compilada

Si no quieres compilar nada:

1. **Descargar APK**
   ```
   https://github.com/Nametechdevz/webplayer/releases/download/v1.0.0/movix-v1.0.0.apk
   ```

2. **Instalar con ADB (si tienes emulador)**
   ```bash
   adb install movix-v1.0.0.apk
   ```

3. **O con BlueStacks**
   - Arrastra y suelta el APK

---

## 🐛 SOLUCIONAR PROBLEMAS EN WINDOWS

### Problema: "Java no está instalado"

**Solución:**
```bash
# Descarga Java 17
https://www.oracle.com/java/technologies/downloads/

# O usa el JDK incluido con Android Studio
```

### Problema: "Gradle build failed"

**Solución:**
```bash
# Limpiar caché
./gradlew clean

# Volver a compilar
./gradlew build
```

### Problema: "Emulador no inicia"

**Solución:**
```bash
# Verificar que está habilitada la virtualización
# Reinicia y entra a BIOS (F2, Del, F10 según marca)
# Busca "Virtualization" y actívalo

# O usa BlueStacks que no requiere virtualización
```

### Problema: "adb: comando no encontrado"

**Solución:**
```bash
# Agregar Android SDK tools al PATH

# 1. Android Studio → Settings → SDK Manager
# 2. Copia la ruta del Android SDK
# 3. Clic derecho en "Este equipo" → Propiedades
# 4. Editar las variables de entorno del sistema
# 5. Variables de entorno → Path → Nuevo
# 6. Agrega: C:\Users\[TuUsuario]\AppData\Local\Android\Sdk\platform-tools
# 7. Reinicia PowerShell/CMD
```

### Problema: "Insufficient disk space"

**Solución:**
```
- Libera al menos 10GB de espacio
- Desinstala aplicaciones innecesarias
- Ejecuta "Disk Cleanup"
```

---

## ✅ VERIFICAR INSTALACIÓN

### Probar que funciona:

```bash
# Desde la carpeta del proyecto:

# Ver dispositivos conectados/emuladores
adb devices

# Ejecutar tests
./gradlew test

# Si ves "BUILD SUCCESSFUL" ✅ todo está bien
```

---

## 📊 COMPARATIVA DE MÉTODOS

| Método | Dificultad | Velocidad | Recursos | Recomendado |
|--------|-----------|-----------|----------|------------|
| Instalador Automático | Muy Fácil ⭐ | Rápido | Medio | ✅ SI |
| Manual (Android Studio) | Difícil | Lento | Alto | Desarrolladores |
| BlueStacks | Muy Fácil | Rápido | Bajo | ✅ SI |
| APK Pre-compilada | Fácil | Muy Rápido | Muy Bajo | ✅ SI |

---

## 🚀 DESPUÉS DE INSTALAR

### Usar la app:

1. **Abre Movix** en el emulador/BlueStacks
2. **Verás la Home** con películas
3. **Toca una película** para ver detalles
4. **Presiona Reproducir** para ver el video
5. **Busca películas** en la pestaña Search
6. **Guarda favoritos** en tu biblioteca

### Características disponibles:

✅ Ver películas trending
✅ Buscar cualquier película/serie
✅ Ver detalles y cast
✅ Reproducir videos con ExoPlayer
✅ Guardar favoritos
✅ Historial de búsqueda
✅ Configuración de usuario

---

## 📞 SOPORTE

### Si algo no funciona:

1. **Lee SETUP.md** - Guía detallada
2. **Revisa los logs** en Android Studio
3. **Busca en Google** el error exacto
4. **Abre una Issue** en GitHub

---

## 💾 ARCHIVOS NECESARIOS

Después de descargar, necesitarás:

```
webplayer/
├── app/
├── core/
├── feature/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── SETUP.md
├── INSTALADOR_WINDOWS.md
└── instalar-movix.bat ← EL SCRIPT INSTALADOR
```

---

## 🎉 ¡LISTO!

Cuando veas la app corriendo en tu Windows:

✅ Instalación exitosa
✅ Emulador funcionando
✅ App compilada correctamente
✅ A disfrutar viendo películas y series

**¿Necesitas ayuda en algún paso? No dudes en preguntar.**

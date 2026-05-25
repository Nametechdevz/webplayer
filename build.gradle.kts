plugins {
    id("com.android.application") version "8.2.0" apply false
    id("com.android.library") version "8.2.0" apply false
    kotlin("android") version "1.9.20" apply false
    kotlin("jvm") version "1.9.20" apply false
    kotlin("plugin.serialization") version "1.9.20" apply false
    id("com.google.dagger.hilt.android") version "2.50" apply false
}

ext {
    // Project
    set("projectGroup", "com.movix")

    // SDK
    set("compileSdk", 34)
    set("minSdk", 26)
    set("targetSdk", 34)

    // Versions
    set("kotlinVersion", "1.9.20")
    set("composeVersion", "1.6.0")
    set("material3Version", "1.1.2")
    set("retrofitVersion", "2.10.0")
    set("okhttpVersion", "4.11.0")
    set("roomVersion", "2.6.1")
    set("datastoreVersion", "1.0.0")
    set("hiltVersion", "2.50")
    set("media3Version", "1.2.0")
    set("coilVersion", "2.5.0")
    set("kotlinxSerializationVersion", "1.6.0")
    set("coroutinesVersion", "1.7.3")
    set("leanbackVersion", "1.2.0")
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}

plugins {
    id("com.android.library")
    kotlin("android")
    kotlin("plugin.serialization")
    kotlin("kapt")
    id("com.google.dagger.hilt.android")
}

android {
    namespace = "com.movix.core.network"
    compileSdk = rootProject.ext.get("compileSdk") as Int

    defaultConfig {
        minSdk = rootProject.ext.get("minSdk") as Int
        targetSdk = rootProject.ext.get("targetSdk") as Int
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(project(":core:common"))
    implementation(project(":core:model"))

    // Retrofit & OkHttp
    val retrofitVersion = rootProject.ext.get("retrofitVersion") as String
    val okhttpVersion = rootProject.ext.get("okhttpVersion") as String
    implementation("com.squareup.retrofit2:retrofit:$retrofitVersion")
    implementation("com.squareup.retrofit2:converter-kotlinx-serialization:$retrofitVersion")
    implementation("com.squareup.okhttp3:okhttp:$okhttpVersion")
    implementation("com.squareup.okhttp3:logging-interceptor:$okhttpVersion")

    // Kotlin Serialization
    val kotlinxSerializationVersion = rootProject.ext.get("kotlinxSerializationVersion") as String
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:$kotlinxSerializationVersion")

    // Hilt
    val hiltVersion = rootProject.ext.get("hiltVersion") as String
    implementation("com.google.dagger:hilt-android:$hiltVersion")
    kapt("com.google.dagger:hilt-compiler:$hiltVersion")

    // Coroutines
    val coroutinesVersion = rootProject.ext.get("coroutinesVersion") as String
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:$coroutinesVersion")
}

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven("https://jitpack.io")
    }
}

rootProject.name = "movix"

// Core modules
include(":core:common")
include(":core:network")
include(":core:data")
include(":core:model")
include(":core:ui")

// Feature modules
include(":feature:home")
include(":feature:search")
include(":feature:details")
include(":feature:player")
include(":feature:favorites")
include(":feature:settings")

// App module
include(":app")

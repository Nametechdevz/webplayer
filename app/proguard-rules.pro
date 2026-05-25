# Retrofit
-keep class retrofit2.** { *; }
-keep interface retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# OkHttp
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Kotlin Serialization
-keepclassmembers class * {
    *** Companion;
}
-keepclasseswithmembers class * {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class * implements kotlinx.serialization.KSerializer
-keep class kotlinx.serialization.** { *; }

# Room
-keep class androidx.room.** { *; }
-keep interface androidx.room.** { *; }
-keepclasseswithmembers class * {
    @androidx.room.* <methods>;
}
-keepclasseswithmembers class * {
    @androidx.room.* <fields>;
}

# Hilt
-keep class ** implements dagger.internal.Factory

# ViewModel
-keepclasseswithmembers class * {
    @androidx.lifecycle.HiltViewModel <init>(...);
}

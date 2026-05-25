package com.movix.core.network.api.interceptor

import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Named
import com.movix.core.common.constant.ApiConstants

class ApiKeyInterceptor @Inject constructor() : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val url = originalRequest.url.newBuilder()
            .addQueryParameter("api_key", ApiConstants.TMDB_API_KEY)
            .build()

        val newRequest = originalRequest.newBuilder()
            .url(url)
            .addHeader("Accept", "application/json")
            .build()

        return chain.proceed(newRequest)
    }
}

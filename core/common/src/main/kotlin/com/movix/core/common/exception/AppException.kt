package com.movix.core.common.exception

sealed class AppException(
    override val message: String? = null,
    override val cause: Throwable? = null
) : Exception(message, cause) {

    data class Unauthorized(
        override val message: String = "Unauthorized access"
    ) : AppException(message)

    data class NotFound(
        override val message: String = "Resource not found"
    ) : AppException(message)

    data class RateLimited(
        override val message: String = "Rate limit exceeded. Please try again later."
    ) : AppException(message)

    data class ServerError(
        val code: Int,
        override val message: String = "Server error: $code"
    ) : AppException(message)

    data class NetworkError(
        override val cause: Throwable? = null,
        override val message: String = "Network error"
    ) : AppException(message, cause)

    data class UnknownError(
        override val cause: Throwable? = null,
        override val message: String = "Unknown error occurred"
    ) : AppException(message, cause)

    data class InvalidData(
        override val message: String = "Invalid data received"
    ) : AppException(message)
}

package com.movix.core.data.local.dao

import androidx.room.*
import com.movix.core.data.local.entity.SearchHistoryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SearchHistoryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSearch(search: SearchHistoryEntity)

    @Query("SELECT query FROM search_history ORDER BY timestamp DESC LIMIT :limit")
    fun getSearchHistory(limit: Int = 50): Flow<List<String>>

    @Query("DELETE FROM search_history")
    suspend fun deleteAll()

    @Query("DELETE FROM search_history WHERE query = :query")
    suspend fun deleteQuery(query: String)
}

package com.movix.core.ui.component

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.movix.core.common.constant.ApiConstants
import com.movix.core.model.Cast

@Composable
fun CastSection(
    cast: List<Cast>,
    modifier: Modifier = Modifier
) {
    if (cast.isEmpty()) return

    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "Reparto",
            style = MaterialTheme.typography.titleMedium,
            color = Color.White,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
        )

        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(cast.take(10)) { actor ->
                CastCard(actor = actor)
            }
        }
    }
}

@Composable
fun CastCard(actor: Cast) {
    Card(
        modifier = Modifier
            .width(100.dp),
        shape = MaterialTheme.shapes.medium,
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (actor.profilePath != null) {
                AsyncImage(
                    model = "${ApiConstants.TMDB_IMAGE_BASE_URL}${ApiConstants.TMDB_IMAGE_SIZE_PROFILE}${actor.profilePath}",
                    contentDescription = actor.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(Color.Gray),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Sin foto", color = Color.White, style = MaterialTheme.typography.labelSmall)
                }
            }

            Text(
                text = actor.name,
                style = MaterialTheme.typography.labelSmall,
                color = Color.White,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(top = 8.dp)
            )

            Text(
                text = actor.character,
                style = MaterialTheme.typography.labelSmall,
                color = Color.Gray,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

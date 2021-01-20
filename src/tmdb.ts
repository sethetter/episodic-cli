import fetch from "node-fetch";
import URI from "urijs";
import { find } from "lodash";

const tmdbBase = (apiKey: string, path: string): URI => {
  let uri = URI(`https://api.themoviedb.org/3/${path}`);
  return uri.addQuery("api_key", apiKey);
};

interface SearchTvResponse {
  results: SearchTvItem[];
}

interface SearchTvItem {
  id: number;
  name: string;
}

interface TvShow {
  id: number;
  name: string;
  number_of_seasons: number;
  seasons: {
    season_number: number;
    episode_count: number;
  }[];
}

interface TvSeason {
  season_number: number;
  episodes: {
    air_date: string;
    episode_number: number;
  }[];
}

interface TvShowEpisode {
  name: string;
  season: number;
  number: number;
  air_date: string;
}

export async function searchTv(
  apiKey: string,
  query: string
): Promise<SearchTvResponse> {
  let uri = tmdbBase(apiKey, "search/tv");
  uri = uri.addQuery("query", query);

  const resp = await fetch(uri.toString());
  if (!resp.ok) throw new Error("Response not ok!");

  return await resp.json();
}

export async function getTv(apiKey: string, tmdbId: number): Promise<TvShow> {
  let uri = tmdbBase(apiKey, `tv/${tmdbId}`);

  const resp = await fetch(uri.toString());
  if (!resp.ok) throw new Error("Response not ok!");

  return await resp.json();
}

export async function nextEpisodeForShow(
  apiKey: string,
  tmdbId: number,
  currentSeason: number,
  currentEpisode: number
): Promise<TvShowEpisode | null> {
  let show = await getTv(apiKey, tmdbId);

  let season = find(show.seasons, (s) => s.season_number === currentSeason);
  if (!season) throw new Error("Current season not valid");

  if (season.episode_count <= currentEpisode) {
    currentSeason++;
    currentEpisode = 0;
  } else {
    currentEpisode++;
  }

  if (currentSeason > show.number_of_seasons) {
    return null;
  }

  let uri = tmdbBase(apiKey, `tv/${tmdbId}/season/${currentSeason}`);
  const resp = await fetch(uri.toString());
  if (!resp.ok) throw new Error("Response not ok!");
  let seasonJson: TvSeason = await resp.json();

  let episode = find(
    seasonJson.episodes,
    (e) => e.episode_number === currentEpisode + 1
  );
  if (!episode) throw new Error("Failed to find episode in season");

  return {
    name: show.name,
    air_date: episode.air_date,
    number: currentEpisode,
    season: currentSeason,
  };
}

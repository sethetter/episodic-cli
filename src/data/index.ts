import { padStart } from "lodash";

export { makeFsRepo } from "./fs";
// export { makeRedisRepo } from "./redis";

export interface UserData {
  tmdbApiKey: string;
  shows: TvShow[];
  watchList: WatchItem[];
}

export interface TvShow {
  tmdbId: number;
  name: string;
  current: {
    season: number;
    episode: number;
  };
}

export interface WatchItem {
  showTmdbId?: number;
  airDate?: string;
  name: string;
}

export function emptyData(): UserData {
  return {
    tmdbApiKey: "",
    shows: [],
    watchList: [],
  };
}

export interface DataRepo {
  loadData: () => Promise<UserData>;
  saveData: (data: UserData) => Promise<UserData>;
}

export function watchListItemFromShow(
  tmdbId: number,
  name: string,
  season: number,
  episode: number,
  airDate?: string
): WatchItem {
  const pad = (n: number): string => padStart(n.toString(), 2, "0");
  return {
    showTmdbId: tmdbId,
    airDate: airDate,
    name: `${name} (S${pad(season)}E${pad(episode)})`,
  };
}

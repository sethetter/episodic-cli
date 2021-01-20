import { promisify } from 'util'
import fs from 'fs'
import { padStart } from 'lodash'

const fileExists = promisify(fs.exists)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

interface UserData {
  tmdbApiKey: string,
  shows: TvShow[],
  watchList: WatchItem[],
}

export interface TvShow {
  tmdbId: number,
  name: string,
  current: {
    season: number,
    episode: number,
  },
}

interface WatchItem {
  showTmdbId?: number,
  airDate?: string,
  name: string,
}

export async function loadData(
  configPath: string
): Promise<UserData> {
  if (!(await fileExists(configPath))) {
    await saveData(configPath, emptyData())
  }

  let fileContents = await readFile(configPath)
  let data = JSON.parse(fileContents.toString())

  return data
}

export async function saveData(
  configPath: string,
  newData: UserData,
): Promise<UserData> {
  await writeFile(configPath, JSON.stringify(newData))
  return loadData(configPath)
}

function emptyData(): UserData {
  return {
    tmdbApiKey: '',
    shows: [],
    watchList: [],
  }
}

export function watchListItemFromShow(
  tmdbId: number,
  name: string,
  season: number,
  episode: number,
  airDate?: string,
): WatchItem {
  const pad = (n: number): string => padStart(n.toString(), 2, '0')
  return {
    showTmdbId: tmdbId,
    airDate: airDate,
    name: `${name} (S${pad(season)}E${pad(episode)})`
  }
}

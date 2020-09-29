import { promisify } from 'util'
import fs from 'fs'

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
  tmdbId?: number,
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

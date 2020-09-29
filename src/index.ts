import { program } from 'commander'
import { uniqBy, filter } from 'lodash'
import * as path from 'path'
import * as tmdb from './tmdb'
import * as appData from './data'

const CONFIG_PATH = path.join(process.env.HOME || '', '.episodic.json')

program.version('0.0.1')

program
  .command('set-key <apiKey>')
  .description('Set your TMDB API key')
  .action(async (key: string) => {
    let data = await appData.loadData(CONFIG_PATH)
    data.tmdbApiKey = key
    await appData.saveData(CONFIG_PATH, data)
  })

program
  .command('search <query>')
  .description('Search TMDB for a TV show')
  .action(async (query: string) => {
    let { tmdbApiKey } = await appData.loadData(CONFIG_PATH)
    const resp = await tmdb.searchTv(tmdbApiKey, query)
    resp.results.forEach(item => console.log(`${item.name} (${item.id})`))
  })

program
  .command('shows')
  .description('List all subscribed shows')
  .action(async () => {
    let { shows } = await appData.loadData(CONFIG_PATH)
    shows.forEach(s => console.log(
      `${s.name} (${s.tmdbId}) (S${s.current.season}E${s.current.episode})`
    ))
  })

program
  .command('sub <tmdbId> [season] [episode]')
  .description('Subscribe to a TV show by TMDB ID')
  .action(async (
    tmdbId: number,
    season: number | undefined,
    episode: number | undefined
  ) => {
    let data = await appData.loadData(CONFIG_PATH)
    let { id, name } = await tmdb.getTv(data.tmdbApiKey, tmdbId)

    if (!season) season = 1
    if (!episode) episode = 1

    let show: appData.TvShow = {
      tmdbId: id,
      name: name,
      current: { season, episode }
    }

    // TODO: This currently will overwrite an already subscribed show, which means
    // it could lose the current season/episode. Fix that!
    data.shows = uniqBy([show, ...data.shows], (i) => i.tmdbId)
    await appData.saveData(CONFIG_PATH, data)
  })

program
  .command('unsub <tmdbId>')
  .description('Remove a show from subscribe list by TMDB ID')
  .action(async (tmdbId: number) => {
    let data = await appData.loadData(CONFIG_PATH)
    data.shows = filter(data.shows, s => s.tmdbId !== tmdbId)
    await appData.saveData(CONFIG_PATH, data)
  })

program
  .command('list')
  .description('Show entire watchlist')
  .action(async () => {
    let { watchList } = await appData.loadData(CONFIG_PATH)
    watchList.forEach(i => console.log(i.name))
  })

program
  .command('add <name>')
  .description('Add an arbitrary item to the watchlist')
  .action(async (name: string) => {
    let data = await appData.loadData(CONFIG_PATH)
    data.watchList.push({ name })
    await appData.saveData(CONFIG_PATH, data)
  })

program
  .command('refresh')
  .description('Adds next episodes of subscribed shows, if available')
  .action(async () => {
    // TODO
  })

program.parse(process.argv)


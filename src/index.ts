import { program } from 'commander'
import { uniqBy, filter, findIndex } from 'lodash'
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
    tmdbIdStr: string,
    seasonStr: string | undefined,
    episodeStr: string | undefined
  ) => {
    let tmdbId = parseInt(tmdbIdStr)
    let season, episode

    let data = await appData.loadData(CONFIG_PATH)
    let { id, name } = await tmdb.getTv(data.tmdbApiKey, tmdbId)

    if (seasonStr) {
      season = parseInt(seasonStr)
    } else {
      season = 1
    }
    if (episodeStr) {
      episode = parseInt(episodeStr)
    } else {
      episode = 1
    }

    let show: appData.TvShow = {
      tmdbId: id,
      name: name,
      current: { season, episode }
    }

    // TODO: This currently will overwrite an already subscribed show, which means
    // it could lose the current season/episode. Fix that!
    data.shows = uniqBy([show, ...data.shows], (i) => i.tmdbId)

    data.watchList = data.watchList.filter(i => !i.showTmdbId || i.showTmdbId !== id)
    data.watchList.push(
      appData.watchListItemFromShow(show.tmdbId, show.name, season, episode)
    )

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
    watchList.forEach((i, idx)  => console.log(`[${idx}] ${i.name}`))
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
    // TODO: For each show without an unwatched item in the list,
    // check for a next episode and add if available
  })

program
  .command('watched <idx>')
  .description('Mark an item from the watch list as watched, grab next episode if applicable')
  .action(async (idxStr: string) => {
    let data = await appData.loadData(CONFIG_PATH)

    let idx = parseInt(idxStr)
    let ep = data.watchList[idx]

    data.watchList.splice(idx, 1)

    if (ep.showTmdbId) {
      let showIdx = findIndex(data.shows, s => s.tmdbId == ep.showTmdbId)
      let { current: { season, episode } } = data.shows[showIdx]

      let show = await tmdb.getTv(data.tmdbApiKey, ep.showTmdbId!)
      let next = await tmdb.nextEpisodeForShow(data.tmdbApiKey, show.id, season, episode)

      data.shows[showIdx].current.season = next.season
      data.shows[showIdx].current.episode = next.number

      data.watchList.push(
        appData.watchListItemFromShow(show.id, show.name, next.season, next.number)
      )
    }

    await appData.saveData(CONFIG_PATH, data)
  })

program.parse(process.argv)

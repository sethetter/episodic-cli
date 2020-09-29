import fetch from 'node-fetch'
import URI from 'urijs'

const tmdbBase = (apiKey: string, path: string): URI => {
  let uri = URI(`https://api.themoviedb.org/3/${path}`)
  return uri.addQuery('api_key', apiKey)
}

interface SearchTvResponse {
  results: SearchTvItem[],
}

interface SearchTvItem {
  id: number,
  name: string,
}

interface TvShow {
  id: number,
  name: string,
}

export async function searchTv(
  apiKey: string,
  query: string
): Promise<SearchTvResponse> {
  let uri = tmdbBase(apiKey, 'search/tv')
  uri = uri.addQuery('query', query)

  const resp = await fetch(uri.toString())
  if (!resp.ok) throw new Error('Response not ok!')

  return await resp.json()
}

export async function getTv(
  apiKey: string,
  tmdbId: number,
): Promise<TvShow> {
  let uri = tmdbBase(apiKey, `tv/${tmdbId}`)

  const resp = await fetch(uri.toString())
  if (!resp.ok) throw new Error('Response not ok!')

  return await resp.json()
}

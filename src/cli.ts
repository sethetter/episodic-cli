import { program } from "commander";
import { uniqBy, filter, findIndex } from "lodash";
import * as path from "path";
import * as TMDB from "./services/tmdb";
import * as Data from "./data/index";

const CONFIG_PATH = path.join(process.env.HOME || "", ".episodic.json");
const fsRepo = Data.makeFsRepo(CONFIG_PATH);

program.version("0.0.1");

// TODO: Convert these to API endpoints?!

program
  .command("set-key <apiKey>")
  .description("Set your TMDB API key")
  .action(async (key: string) => {
    let data = await fsRepo.loadData();
    data.tmdbApiKey = key;
    await fsRepo.saveData(data);
  });

program
  .command("search <query>")
  .description("Search TMDB for a TV show")
  .action(async (query: string) => {
    let { tmdbApiKey } = await fsRepo.loadData();
    const resp = await TMDB.searchTv(tmdbApiKey, query);
    resp.results.forEach((item) => console.log(`${item.name} (${item.id})`));
  });

program
  .command("shows")
  .description("List all subscribed shows")
  .action(async () => {
    let { shows } = await fsRepo.loadData();
    shows.forEach((s) =>
      console.log(
        `${s.name} (${s.tmdbId}) (S${s.current.season}E${s.current.episode})`
      )
    );
  });

program
  .command("sub <tmdbId> [season] [episode]")
  .description("Subscribe to a TV show by TMDB ID")
  .action(
    async (
      tmdbIdStr: string,
      seasonStr: string | undefined,
      episodeStr: string | undefined
    ) => {
      let tmdbId = parseInt(tmdbIdStr);
      let season = seasonStr ? parseInt(seasonStr) : 1;
      let episode = episodeStr ? parseInt(episodeStr) : 1;

      let data = await fsRepo.loadData();
      let { id, name } = await TMDB.getTv(data.tmdbApiKey, tmdbId);

      let show: Data.TvShow = {
        tmdbId: id,
        name: name,
        current: { season, episode },
      };

      // TODO: This currently will overwrite an already subscribed show, which means
      // it could lose the current season/episode. Fix that!
      data.shows = uniqBy([show, ...data.shows], (i) => i.tmdbId);

      data.watchList = data.watchList.filter(
        (i) => !i.showTmdbId || i.showTmdbId !== id
      );
      data.watchList.push(
        Data.watchListItemFromShow(show.tmdbId, show.name, season, episode)
      );

      await fsRepo.saveData(data);
    }
  );

program
  .command("unsub <tmdbId>")
  .description("Remove a show from subscribe list by TMDB ID")
  .action(async (tmdbId: number) => {
    let data = await fsRepo.loadData();
    data.shows = filter(data.shows, (s) => s.tmdbId !== tmdbId);
    await fsRepo.saveData(data);
  });

program
  .command("list")
  .description("Show entire watchlist")
  .action(async () => {
    let { watchList } = await fsRepo.loadData();
    watchList.forEach((i, idx) => console.log(`[${idx}] ${i.name}`));
  });

program
  .command("add <name>")
  .description("Add an arbitrary item to the watchlist")
  .action(async (name: string) => {
    let data = await fsRepo.loadData();
    data.watchList.push({ name });
    await fsRepo.saveData(data);
  });

program
  .command("refresh")
  .description("Adds next episodes of subscribed shows, if available")
  .action(async () => {
    // TODO: For each show without an unwatched item in the list,
    // check for a next episode and add if available
  });

program
  .command("watched <idx>")
  .description(
    "Mark an item from the watch list as watched, grab next episode if applicable"
  )
  .action(async (idxStr: string) => {
    let data = await fsRepo.loadData();

    let idx = parseInt(idxStr);
    let ep = data.watchList[idx];

    data.watchList.splice(idx, 1);

    if (ep.showTmdbId) {
      let showIdx = findIndex(data.shows, (s) => s.tmdbId == ep.showTmdbId);
      let {
        current: { season, episode },
      } = data.shows[showIdx];

      let show = await TMDB.getTv(data.tmdbApiKey, ep.showTmdbId!);
      let next = await TMDB.nextEpisodeForShow(
        data.tmdbApiKey,
        show.id,
        season,
        episode
      );

      if (next) {
        data.shows[showIdx].current.season = next.season;
        data.shows[showIdx].current.episode = next.number;

        data.watchList.push(
          Data.watchListItemFromShow(
            show.id,
            show.name,
            next.season,
            next.number,
            next.air_date
          )
        );
      }
    }

    await fsRepo.saveData(data);
  });

module.exports = () => program.parse(process.argv);

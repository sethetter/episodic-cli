# episodic-cli

A CLI version of the episodic project.

## Commands

```
Options:
  -V, --version                    output the version number
  -h, --help                       display help for command

Commands:
  set-key <apiKey>                 Set your TMDB API key
  search <query>                   Search TMDB for a TV show
  shows                            List all subscribed shows
  sub <tmdbId> [season] [episode]  Subscribe to a TV show by TMDB ID
  unsub <tmdbId>                   Remove a show from subscribe list by TMDB ID
  list                             Show entire watchlist
  add <name>                       Add an arbitrary item to the watchlist
  refresh                          Adds next episodes of subscribed shows, if available
  help [command]                   display help for command
```

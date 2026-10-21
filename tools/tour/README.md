# README tour

Films the animated tour (`docs/media/tour.webp`) and takes the phone screens (`docs/media/screen-*.png`) of the root README, from the real app on fictitious offers.

```bash
tools/tour/tour.sh
```

About two minutes. Then look at the new media and commit them.

## What it needs

- `make setup` done once: dependencies, contract, Prisma client.
- The development PostgreSQL of `backend/.env` running, with a role allowed to create databases (the native one, or `make db`), and `psql` on the path.
- Playwright's Chromium (`cd frontend && npx playwright install chromium`).
- Python 3 with Pillow, built with WebP support.
- Ports 3101 and 4301 free. A running `make dev` can stay up on its own ports, but `tour.sh` rebuilds `backend/dist` under it.

## What it does

1. Creates a throwaway `jobfinder_tour` database next to the development one, migrates it, sets a password.
2. Starts the API on 3101 (no crawl, no heartbeat, no sign-in throttle) and the app on 4301.
3. Seeds `seed.sql`, then `record.mjs` films `stage.html`: title cards, captions, and the app in a phone and a browser, clicked through like a visitor would. `encode_tour.py` turns the frames into a 15 fps WebP, about 2 MB.
4. Seeds again, then `shots.mjs` takes the phone screens and `frame_screens.py` draws the phone around them.
5. Stops everything and drops the database, even on a failure (the logs of a failed run are kept, the path is printed).

The development database is never written to.

## Changing it

| To change                        | Edit                                                                     |
| -------------------------------- | ------------------------------------------------------------------------ |
| The offers, companies, sources   | `seed.sql` (fictitious only: the media are public)                       |
| The scenes, captions, clicks     | `record.mjs`, and `stage.html` for the cards and the look                |
| Which screens the README shows   | `shots.mjs`, then the `<img>` strip of the root README                   |
| Frame rate, quality, phone shape | the constants at the top of `encode_tour.py` and `frame_screens.py`      |
| Ports, password, sizes           | `tour.constants.mjs`, and the matching variables at the top of `tour.sh` |

The scenes click through the app's own classes (`.job-row__title`, `.job-row__star`, `.job-tabs__item`...): a renamed class breaks the take, and the error names it.

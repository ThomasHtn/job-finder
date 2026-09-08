# Job Finder

Agrégateur personnel d'offres d'emploi en CDI. Le métier, les mots-clés et la zone de trajet
sont décrits dans le `.env` : l'interface se contente de lister les offres, d'ouvrir leur
détail et de rebondir vers l'annonce d'origine (pas de formulaire de recherche).

- API NestJS + Prisma + PostgreSQL (`apps/api`), front Angular (`apps/web`), types partagés
  (`packages/shared`).
- Trois onglets : zone de trajet, full remote, favoris.
- Sources : France Travail et Adzuna (clés requises), ATS d'entreprises et EURES (sans clé).
  Une source sans clé est simplement sautée. Les offres publiées sur plusieurs sources sont
  fusionnées, celles non revues depuis `INGESTION_STALE_DAYS` jours (30 par défaut) sont
  purgées sauf les favoris.
- L'ingestion tourne en cron (`INGESTION_CRON`, 2 h par défaut) et se déclenche aussi à la main.

## Configuration

Tout part du `.env` : `cp .env.example .env`, puis renseigner les clés et le profil de
recherche. `.env.example` est commenté et contient un profil complet (développeur
Angular/Java autour du Havre) qui sert de référence pour chaque variable.

Clés API optionnelles : `FT_CLIENT_ID`/`FT_CLIENT_SECRET`
([francetravail.io](https://francetravail.io), souscrire à « Offres d'emploi v2 »),
`ADZUNA_APP_ID`/`ADZUNA_APP_KEY` ([developer.adzuna.com](https://developer.adzuna.com)),
`ORS_API_KEY` ([openrouteservice.org/dev](https://openrouteservice.org/dev)).

La zone de trajet est un polygone isochrone figé dans le dépôt
(`apps/api/src/geo/isochrone.geojson`). Après un changement de `SEARCH_AREA_CENTER` ou
`SEARCH_AREA_DRIVE_MINUTES` : `npm run geo:isochrone` (nécessite `ORS_API_KEY`), puis
commiter le fichier. Sans ce fichier, l'API retombe sur un rayon à vol d'oiseau.

## Lancement en local

Prérequis : Node >= 22 et un PostgreSQL installé sur la machine (pas de Docker en dev).

```bash
npm install
npm run setup      # build du package partagé, création du rôle et de la base, migrations
npm run dev        # API sur :3001, front sur :4201
```

La base est vide au premier lancement (`INGESTION_ON_STARTUP=false` en dev), il faut lancer
une première ingestion (header `x-app-token` seulement si un mot de passe est défini, avec
le jeton renvoyé par `POST /api/auth/login`) :

```bash
curl -X POST http://localhost:3001/api/ingestion/run
```

## Lancement avec Docker

```bash
cp .env.example .env    # clés, profil, et un vrai POSTGRES_PASSWORD
docker compose up -d --build
```

L'app est servie sur `http://localhost:8480` (`HTTP_PORT`). C'est le seul port publié :
l'API et PostgreSQL restent sur le réseau Docker du projet (deux blocs `ports` commentés
dans `docker-compose.yml` permettent de les exposer ponctuellement). `CORS_ORIGIN` doit
pointer vers l'URL réellement servie, port compris.

Les migrations Prisma s'appliquent au démarrage du conteneur API et une première ingestion
se lance toute seule (`INGESTION_ON_STARTUP=true`).

Mise à jour : `git pull && docker compose up -d --build`.

## Commandes

```bash
npm run setup          # première installation : shared, rôle + base Postgres, migrations
npm run dev            # API + front en watch
npm run build          # build des trois workspaces
npm test               # tests de l'API
npm run test -w web    # tests du front
npm run lint           # oxlint sur l'API
npm run db:migrate     # migrations Prisma
npm run db:studio      # explorateur de base Prisma
npm run geo:isochrone  # régénère l'isochrone depuis le .env
```

## API

| Route | Description |
|---|---|
| `GET /api/config` | label de l'onglet local et présence d'un mot de passe (public) |
| `POST /api/auth/login` | vérifie le mot de passe (public) |
| `GET /api/jobs?tab=local\|remote\|favorites` | liste avec compteurs et date de dernière ingestion |
| `GET /api/jobs/:id` | détail, marque l'offre comme consultée |
| `PATCH /api/jobs/:id/favorite` | bascule le favori |
| `PATCH /api/jobs/:id/hide` | masque l'offre de tous les onglets |
| `POST /api/ingestion/run` | déclenche une ingestion |
| `GET /api/ingestion/status` | état du dernier run de chaque source |
| `GET /api/health` | état de l'API et de la base (public) |

L'accès peut être protégé par un mot de passe unique, stocké hashé (scrypt) en base :

```bash
npm run auth:set-password -- "mon-mot-de-passe"   # au moins 8 caractères
npm run auth:set-password -- --clear              # retire le mot de passe : app ouverte
```

Sous Docker : `docker compose exec api npm run auth:set-password -- "..."`. Le front affiche
alors un écran de connexion ; `POST /api/auth/login` renvoie un jeton de session aléatoire
(valide 30 jours, stocké hashé en base) que le front envoie dans le header `x-app-token`.
Changer le mot de passe révoque toutes les sessions. Sans mot de passe en base, aucune
authentification. La route de connexion est limitée à 5 essais par quart d'heure et par adresse.

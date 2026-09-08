<p align="center">
  <img src="docs/assets/hero.svg" width="900"
    alt="Job Finder : trois onglets, une liste d'offres déjà triée" />
</p>

<p align="center">
  <b>Un agrégateur d'offres d'emploi pour une seule personne : vous.</b><br />
  Uniquement des CDI, uniquement votre métier, uniquement là où vous acceptez d'aller
  travailler.<br />
  Pas de formulaire, pas de filtres à recocher, pas d'alertes mail à trier.
</p>

<br />

## Le problème

Chercher un poste, c'est refaire la même tournée tous les jours. France Travail le matin,
Adzuna le midi, l'APEC le soir, Free-Work quand on y pense, et les pages « Carrières » des
entreprises qu'on aimerait bien. Chaque fois : retaper le métier, recocher CDI, relimiter la
zone, refaire défiler les annonces d'hier, tomber trois fois sur la même offre republiée par
trois plateformes, et perdre celle qu'on avait repérée la veille.

Une heure par jour de manutention, pour trois offres réellement nouvelles.

## La tournée est faite avant que vous n'arriviez

<img src="docs/assets/pipeline.svg" width="900"
  alt="Entonnoir : 51 sources, filtre métier, filtre CDI, filtre zone,
    fusion des doublons, votre liste" />

Job Finder interroge cinquante et une sources toutes les deux heures et ne garde que ce qui
vous concerne. Une annonce publiée sur trois plateformes n'apparaît qu'une fois : la version
la plus complète est conservée, les liens vers chacune sont réunis sur la même ligne. Une
offre retirée des sites disparaît de la liste. Vos favoris, eux, restent.

## Trois onglets, rien d'autre

<p>
  <img src="docs/assets/icons/pin.svg" width="20" align="middle" alt="" />
  <b> Votre région</b><br />
  Les postes réellement accessibles depuis chez vous, mesurés en temps de trajet routier.
</p>

<p>
  <img src="docs/assets/icons/remote.svg" width="20" align="middle" alt="" />
  <b> Full remote</b><br />
  Les postes cent pour cent à distance, où qu'ils soient.
</p>

<p>
  <img src="docs/assets/icons/star.svg" width="20" align="middle" alt="" />
  <b> Favoris</b><br />
  Ce que vous avez mis de côté. Protégé, jamais purgé.
</p>

Sur chaque ligne : le badge **Nouveau** sur ce qui est arrivé depuis votre dernière visite, une
étoile pour garder, une croix pour ne plus jamais revoir l'annonce. Un clic ouvre le détail à
côté de la liste, sans la faire disparaître ; un second vous envoie sur l'annonce d'origine
pour postuler.

## Une zone de trajet, pas un rayon

<img src="docs/assets/zone.svg" width="900"
  alt="Le contour de temps de trajet garde un poste à 100 km par l'autoroute
    et écarte un poste à 60 km de départementales" />

La zone est un vrai contour de temps de conduite, calculé une fois puis vérifié offre par
offre. Un poste à 100 km par l'autoroute rentre, un poste à 60 km de départementales ne rentre
pas. Quand la source ne précise pas la commune, l'offre est gardée et signalée plutôt
qu'écartée en silence.

## Ce qui la distingue

<p>
  <img src="docs/assets/icons/filter.svg" width="20" align="middle" alt="" />
  <b> Le tri est strict</b><br />
  Les alternances, stages, missions freelance et postes de « business developer » ne
  franchissent jamais la porte. Une annonce qui ne mentionne aucune technologie de votre stack
  non plus.
</p>

<p>
  <img src="docs/assets/icons/shield.svg" width="20" align="middle" alt="" />
  <b> Rien ne bouge sans vous</b><br />
  Aucune candidature automatique, aucun message envoyé en votre nom, aucun profil déposé nulle
  part. L'application lit les offres publiques et vous les présente.
</p>

<p>
  <img src="docs/assets/icons/lock.svg" width="20" align="middle" alt="" />
  <b> C'est chez vous</b><br />
  L'application tourne sur votre machine ou votre serveur, derrière un mot de passe unique. Vos
  favoris, vos offres masquées et votre historique ne quittent pas votre base. Aucun traqueur
  n'est chargé, aucune donnée n'est revendue.
</p>

<p>
  <img src="docs/assets/icons/sliders.svg" width="20" align="middle" alt="" />
  <b> Ça s'adapte à vous</b><br />
  Le métier, les mots-clés, les technologies, la ville de référence et le temps de trajet
  tiennent dans une page de configuration. Développeur Angular au Havre aujourd'hui, ingénieur
  d'affaires à Nantes demain : la même application, un fichier modifié.
</p>

## Une journée type

| | |
|---|---|
| **8 h 02** | Vous ouvrez l'application depuis l'icône de votre écran d'accueil. |
| **8 h 03** | Quatre offres marquées Nouveau. Deux ne vous parlent pas : croix, croix. |
| **8 h 05** | Une troisième vous intéresse : étoile. Vous postulez sur la quatrième. |
| **8 h 06** | C'est fini. La veille de la journée est faite. |

## Les sources couvertes

France Travail, Adzuna, l'APEC, EURES, Free-Work, et 46 sites carrière d'entreprises
interrogés directement (Doctolib, Dataiku, Mirakl, Algolia, Alan, Qonto, Swile et les autres).
Une source indisponible ou non configurée est simplement sautée : les autres continuent de
remplir la liste.

## Où elle vit

Installée sur un serveur, elle s'ouvre depuis n'importe quel navigateur, sur ordinateur comme
sur téléphone. Ajoutée à l'écran d'accueil, elle se comporte comme une application native :
plein écran, sa propre icône, thème clair ou sombre selon votre système.

<br />

---

<br />

# Documentation technique

<img src="docs/assets/stack.svg" width="820"
  alt="apps/web parle à apps/api, qui écrit dans PostgreSQL ;
    packages/shared porte les types communs" />

Monorepo npm workspaces, Node 22 ou plus.

| Workspace | Contenu |
|---|---|
| `apps/api` | NestJS 12, Prisma 7, PostgreSQL |
| `apps/web` | Angular 22, standalone, signals |
| `packages/shared` | Les types d'API partagés par les deux (`@job-finder/shared`) |

`packages/shared` est consommé compilé : `npm run build -w @job-finder/shared` doit avoir tourné
au moins une fois avant le premier `npm run dev`.

## Démarrer

PostgreSQL sur la machine, pas de Docker en développement.

```bash
cp .env.example .env   # clés d'API et profil de recherche
npm install
npm run setup          # build shared, création du rôle et de la base, migrations
npm run dev            # api sur :3001, web sur :4201
curl -X POST http://localhost:3001/api/ingestion/run   # la base est vide au départ
```

## Les commandes

```bash
npm run build                        # shared, puis api, puis web
npm test                             # tests api (vitest)
npm run test -w web                  # tests front
npm run lint                         # oxlint sur l'api
npm run db:migrate                   # migrations, puis régénération du client Prisma
npm run db:studio                    # Prisma Studio
npm run geo:isochrone                # régénère la zone depuis le .env
npm run auth:set-password -- <pwd>   # --clear pour retirer le mot de passe
```

## Comment ça marche

**Tout le domaine est dans le `.env`** : métier, mots-clés, stack, zone. Le fichier est validé
par zod et exposé comme un `SearchProfile` injectable. Changer de métier ne demande aucun code.

**Les sources** (`apps/api/src/sources/`) partagent un contrat : `name`, `isEnabled()`,
`fetchJobs(): Promise<RawJob[]>`. Clés absentes, source sautée, pas en échec. Les 46 boards ATS
passent par un seul connecteur qui itère `sources/ats/companies.config.ts`.

**L'ingestion** (`ingestion/ingestion.service.ts`) tourne sur cron et sur
`POST /api/ingestion/run` : filtres (titre, stack, CDI, remote, zone), puis upsert sur
`(source, sourceId)` avec fusion des doublons inter-sources via un `dedupeHash` (titre,
entreprise, lieu), puis purge des offres non revues depuis trente jours, favoris exclus.

**La zone de trajet** est un polygone isochrone généré une fois par OpenRouteService et commité
(`geo/isochrone.geojson`) : à l'ingestion, un simple point-in-polygon, aucun appel réseau. Le
géocodage est mis en cache en base, échecs compris.

**L'authentification** repose sur un seul mot de passe partagé, hashé en scrypt, avec un token
de session dans l'en-tête `x-app-token`. Sans mot de passe en base, l'api passe tout en
développement et répond 503 en production.

**Le front** garde `job-list` monté en permanence ; `job-detail` est une route enfant rendue
dans son `<router-outlet>`, colonne ou feuille selon la largeur, décidé en CSS. Les changements
faits dans le panneau remontent à la liste par `JobPatchBus` plutôt que par un rechargement.

## Routes

| Route | |
|---|---|
| `GET /api/config` | Libellé de l'onglet local, présence d'un mot de passe (public) |
| `POST /api/auth/login` | Renvoie un token de session (public, 5 essais par 15 min) |
| `GET /api/jobs?tab=local\|remote\|favorites` | Liste, compteurs, dernière ingestion |
| `GET /api/jobs/:id` | Détail, marque l'offre consultée |
| `PATCH /api/jobs/:id/favorite` et `/hide` | Favori, masquage |
| `POST /api/ingestion/run` | Ingestion manuelle |
| `GET /api/ingestion/status` | État par source |
| `GET /api/health` | Api et base (public) |

## Déploiement

`docker-compose.yml` ne sert qu'au déployé : Nginx sert le build Angular et proxifie `/api`.
Migrations et première ingestion se lancent au démarrage du conteneur api.

```bash
cp .env.example .env   # + vrai POSTGRES_PASSWORD, CORS_ORIGIN = URL publique https
docker compose up -d --build
docker compose exec api npm run auth:set-password -- "<mot de passe>"
```

Seul `127.0.0.1:8480` est publié : un reverse proxy sur l'hôte termine le TLS, par exemple avec
Caddy (`jobs.exemple.fr { reverse_proxy 127.0.0.1:8480 }`). Avec Nginx, poser `X-Forwarded-For` :
c'est de cet en-tête que dépend la limitation des essais de connexion.

Repasser ensuite `INGESTION_ON_STARTUP=false` pour ne pas rejouer une ingestion complète à chaque
redémarrage. Mise à jour : `git pull && docker compose up -d --build`.

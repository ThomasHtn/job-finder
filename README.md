# Job Finder

**Votre veille emploi, déjà triée quand vous ouvrez l'application.**

Un seul écran, uniquement des CDI, uniquement votre métier, uniquement là où vous acceptez
d'aller travailler. Pas de formulaire, pas de filtres à re-cocher, pas d'alertes mail à
trier : la sélection est faite avant que vous n'arriviez.

---

## Le problème

Chercher un poste aujourd'hui, c'est répéter la même corvée site après site :

> France Travail le matin, Adzuna le midi, l'APEC le soir, Free-Work quand on y pense,
> et les pages « Carrières » des entreprises qu'on aimerait bien. Chaque fois : retaper le
> métier, recocher « CDI », relimiter la zone, refaire défiler les mêmes annonces que
> hier, tomber trois fois sur la même offre republiée par trois plateformes, et perdre
> celle qu'on avait repérée la veille.

Une heure par jour de manutention, pour trois offres réellement nouvelles.

## La réponse

Job Finder fait cette tournée à votre place, toutes les deux heures, et ne garde que ce qui
vous concerne :

```
  5 plateformes  ──┐
                   ├──►  filtrage métier  ──►  filtrage CDI  ──►  filtrage zone  ──►  ┐
 46 sites carrière ┘                                                                  │
                                                                                      ▼
                                                              dédoublonnage entre sources
                                                                                      │
                                                                                      ▼
                                                                    votre liste, déjà triée
```

Une annonce publiée sur trois plateformes n'apparaît qu'une fois, avec la description la
plus complète des trois et les liens vers chaque version. Les offres qui disparaissent des
sites disparaissent de votre liste. Vos favoris, eux, restent.

## Ce que vous voyez

Trois onglets, rien d'autre :

```
┌──────────────────────────────────────────────────────────────┐
│ Job Finder             Normandie · Full remote · Favoris (7) │
│                                    Synchronisé il y a 40 min │
├──────────────────────────────────────────────────────────────┤
│ Développeur Full Stack Angular / Java             45 - 55 k€ │
│ Doctolib · Rouen                                     [x] [*] │
│ Rejoignez une équipe de 8 personnes sur le socle...          │
│ Site carrière · il y a 2 h · NOUVEAU                         │
├──────────────────────────────────────────────────────────────┤
│ Ingénieur d'études logiciel (H/F)                            │
│ Segula Technologies · Le Havre                       [x] [*] │
│ Au sein du bureau d'études, vous participerez...             │
│ France Travail · hier                                        │
├──────────────────────────────────────────────────────────────┤
│ Développeur Node.js — 100 % télétravail                      │
│ Alan · Remote                                        [x] [*] │
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

- **Normandie** (ou le nom de votre région) : les postes réellement accessibles depuis chez
  vous, calculés en temps de trajet routier réel, pas en distance à vol d'oiseau.
- **Full remote** : les postes 100 % à distance, où qu'ils soient.
- **Favoris** : ce que vous avez mis de côté. Protégé, jamais purgé.

Sur chaque ligne : le badge **NOUVEAU** sur ce qui est arrivé depuis votre dernière
visite, une **étoile** (`[*]`) pour garder, une **croix** (`[x]`) pour ne plus jamais
revoir l'annonce. Un clic ouvre le détail à côté de la liste, sans la faire disparaître ;
un second clic vous envoie sur l'annonce d'origine pour postuler.

## Une journée type

| | |
|---|---|
| **8 h 02** | Vous ouvrez l'application depuis l'icône de votre écran d'accueil. |
| **8 h 03** | 4 offres marquées NOUVEAU. Deux ne vous parlent pas : croix, croix. |
| **8 h 05** | Une troisième vous intéresse : étoile. Vous postulez sur la quatrième. |
| **8 h 06** | C'est fini. La veille de la journée est faite. |

## Ce qui la distingue

**Le filtre géographique est honnête.** La zone est un vrai contour de temps de trajet en
voiture, pas un rayon de X km sur une carte. Un poste à 100 km par l'autoroute rentre, un
poste à 60 km par des départementales ne rentre pas. Quand la source ne précise pas la
commune, l'offre est gardée et signalée plutôt qu'écartée en silence.

**Le tri est strict.** Les alternances, stages, missions freelance et postes de
« business developer » ne franchissent jamais la porte. Une annonce qui ne mentionne aucune
technologie de votre stack non plus.

**Rien ne bouge sans vous.** Aucune candidature automatique, aucun message envoyé en votre
nom, aucun profil déposé nulle part. L'application lit les offres publiques et vous les
présente. Rien de plus.

**C'est chez vous.** L'application tourne sur votre machine ou votre serveur, derrière un
mot de passe unique. Vos favoris, vos offres masquées et votre historique ne quittent pas
votre base de données. Aucun recruteur ne sait que vous regardez, aucun traqueur n'est
chargé, aucune donnée n'est revendue.

**Ça s'adapte à vous.** Le métier, les mots-clés, les technologies, la ville de référence et
le rayon de trajet se décrivent en une page de configuration. Développeur Angular au Havre
aujourd'hui, ingénieur d'affaires à Nantes demain : la même application, un fichier modifié.

## Où elle vit

Installée sur un serveur, elle s'ouvre depuis n'importe quel navigateur, sur ordinateur
comme sur téléphone. Ajoutée à l'écran d'accueil, elle se comporte comme une application
native : plein écran, sa propre icône, thème clair ou sombre selon votre système.

## Les sources couvertes

France Travail · Adzuna · APEC · EURES · Free-Work · et 46 sites carrière d'entreprises
interrogés directement (Doctolib, Dataiku, Mirakl, Algolia, Alan, Qonto, Swile...).

Une source indisponible ou non configurée est simplement sautée : les autres continuent de
remplir la liste.

---

# Documentation technique

Monorepo npm workspaces, Node >= 22 :

| Workspace | Contenu |
|---|---|
| `apps/api` | NestJS 12 + Prisma 7 + PostgreSQL |
| `apps/web` | Angular 22 (standalone, signals) |
| `packages/shared` | les types d'API partagés par les deux (`@job-finder/shared`) |

`packages/shared` est consommé compilé : `npm run build -w @job-finder/shared` doit avoir
tourné au moins une fois avant le premier `npm run dev`.

## Démarrer

PostgreSQL sur la machine, pas de Docker en dev.

```bash
cp .env.example .env   # clés + profil de recherche
npm install
npm run setup          # build shared, création rôle + base, migrations
npm run dev            # api :3001, web :4201
curl -X POST http://localhost:3001/api/ingestion/run   # la base est vide au départ
```

```bash
npm run build                        # shared, puis api, puis web
npm test / npm run test -w web       # tests api (vitest) / tests front
npm run lint                         # oxlint sur l'api
npm run db:migrate / npm run db:studio
npm run geo:isochrone                # régénère la zone depuis le .env
npm run auth:set-password -- <pwd>   # --clear pour retirer le mot de passe
```

## Comment ça marche

**Tout le domaine est dans le `.env`** (métier, mots-clés, stack, zone), validé par zod et
exposé comme un `SearchProfile` injectable. Changer de métier ne demande aucun code.

**Sources** (`apps/api/src/sources/`) : un contrat commun, `name` / `isEnabled()` /
`fetchJobs(): Promise<RawJob[]>`. Clés absentes = source sautée, pas en échec. Les 46 boards
ATS passent par un seul connecteur qui itère `sources/ats/companies.config.ts`.

**Ingestion** (`ingestion/ingestion.service.ts`), sur cron et sur `POST /api/ingestion/run` :
filtres (titre, stack, CDI, remote, zone) → upsert sur `(source, sourceId)`, avec fusion des
doublons inter-sources via un `dedupeHash` (titre + entreprise + lieu) → purge des offres
non revues depuis 30 jours, favoris exclus.

**Zone de trajet** : un polygone isochrone généré une fois par OpenRouteService et commité
(`geo/isochrone.geojson`), donc un simple point-in-polygon à l'ingestion. Le géocodage est
caché en base, échecs compris.

**Auth** : un seul mot de passe partagé, hashé (scrypt) en base, token de session dans le
header `x-app-token`. Sans mot de passe en base, l'API passe tout en dev et répond 503 en
production.

**Front** : `job-list` porte les onglets et reste monté ; `job-detail` est une route enfant
rendue dans son `<router-outlet>` (colonne ou feuille, décidé en CSS). Les changements faits
dans le panneau remontent à la liste par `JobPatchBus` plutôt que par un rechargement.

## Routes

| Route | |
|---|---|
| `GET /api/config` | label de l'onglet local, présence d'un mot de passe (public) |
| `POST /api/auth/login` | renvoie un token de session (public, 5 essais / 15 min) |
| `GET /api/jobs?tab=local\|remote\|favorites` | liste + compteurs + dernière ingestion |
| `GET /api/jobs/:id` | détail, marque l'offre consultée |
| `PATCH /api/jobs/:id/favorite` · `/hide` | favori, masquage |
| `POST /api/ingestion/run` · `GET /api/ingestion/status` | ingestion manuelle, état par source |
| `GET /api/health` | api + base (public) |

## Déploiement

`docker-compose.yml` ne sert qu'au déployé : nginx sert le build Angular et proxifie `/api`.
Migrations et première ingestion se lancent au démarrage du conteneur api.

```bash
cp .env.example .env   # + vrai POSTGRES_PASSWORD, CORS_ORIGIN = URL publique https
docker compose up -d --build
docker compose exec api npm run auth:set-password -- "<mot de passe>"
```

Seul `127.0.0.1:8480` est publié, donc un reverse proxy sur l'hôte termine le TLS (Caddy :
`jobs.exemple.fr { reverse_proxy 127.0.0.1:8480 }`). Avec nginx, poser `X-Forwarded-For` :
c'est de cet en-tête que dépend la limitation des essais de connexion.

Ensuite, repasser `INGESTION_ON_STARTUP=false` pour ne pas rejouer une ingestion complète à
chaque redémarrage. Mise à jour : `git pull && docker compose up -d --build`.

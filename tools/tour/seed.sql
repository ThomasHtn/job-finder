-- Fictitious offers and source runs filmed by the tour, on the throwaway database of tour.sh.
-- Replayed before each take: starring and hiding during a take change the rows.

-- Starts from an empty list, sessions kept so a signed-in browser stays signed in.
TRUNCATE "Job", "IngestionRun";

-- One line per offer; pub_h and seen_h are hours before now, so "new" always means today.
CREATE TEMP TABLE offer (
  n int, source text, label text, title text, company text, city text, pc text,
  remote bool, approx bool, fav bool, full_desc bool, salary text,
  pub_h int, seen_h int, alts text[], descr text, cdescr text
);

-- Eleven offers in the area, six of them seen in the last eight hours; three full remote; three starred.
INSERT INTO offer VALUES
(1,'FRANCE_TRAVAIL','France Travail','Angular / Java developer','Portline Logistics','Le Havre','76600',false,false,false,true,'€42k - €48k a year',2,2,
 ARRAY['https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/demo-1','https://fr.indeed.com/viewjob?jk=demo1'],
 E'Join the IT team behind the container tracking platform used on every quay of the port.\n\nYou will build new screens in Angular, extend the Spring Boot services and keep an eye on the PostgreSQL queries that feed the live dashboards.\n\nWhat we offer: a team of six, a release every two weeks, two remote days a week and a sea view from the coffee machine.',
 'Portline Logistics runs the digital side of container handling in the port of Le Havre: 300 people, 40 of them in IT.'),
(2,'ATS','Tidewave Energy (Greenhouse)','Software engineer, TypeScript','Tidewave Energy','Rouen','76000',false,false,false,true,'€45k - €55k a year',4,3,
 ARRAY[]::text[],
 E'Design the tools that steer offshore wind farms in the Channel.\n\nStack: NestJS and Angular on top of a time-series database, deployed on Kubernetes. You will own features end to end, from the API contract to the operator screens.',
 'Tidewave Energy builds and runs offshore wind farms off the Normandy coast.'),
(3,'APEC','APEC','Lead developer .NET','Mutuelle des Falaises','Caen','14000',false,false,false,false,'€50k - €58k a year',6,5,
 ARRAY['https://fr.indeed.com/viewjob?jk=demo3'],
 E'You lead a team of five developers on the member portal: C#, ASP.NET Core, Blazor...',
 NULL),
(4,'ADZUNA','Adzuna','Full stack developer Vue.js / Node.js','Cidre & Code','Honfleur','14600',false,false,false,true,NULL,8,6,
 ARRAY[]::text[],
 E'A small product studio looking for its fourth developer.\n\nVue 3 and Nuxt on the front, Node.js and PostgreSQL on the back. Code reviews, pair programming, and Friday afternoons for side projects.',
 NULL),
(5,'EURES','EURES','Backend developer Java','Alabaster Industries','Haute-Normandie',NULL,false,true,false,true,'€40k - €46k a year',10,7,
 ARRAY[]::text[],
 E'Plant in Haute-Normandie, exact town shared at the interview.\n\nYou maintain the production planning services: Java 21, Spring Boot, Kafka, microservices.',
 NULL),
(6,'FREE_WORK','Free-Work','Ingénieur études et développement PHP Symfony','Agence Galet','Fécamp','76400',false,false,false,true,'€38k - €44k a year',9,8,
 ARRAY[]::text[],
 E'Web agency, twelve people, one hundred clients across the coast.\n\nYou build and maintain Symfony applications and their API REST, with a bit of Vue.js on the side.',
 NULL),
(7,'ATS','Mapfolk (Lever)','Senior frontend engineer','Mapfolk',NULL,NULL,true,false,false,true,'€60k - €70k a year',5,4,
 ARRAY[]::text[],
 E'Fully remote across France.\n\nMapfolk draws the maps of tomorrow''s cycling routes. You will shape the route planner in Angular and TypeScript, with a strong focus on performance and accessibility.',
 'Mapfolk is a 40-person, remote-first company building route planning for cyclists.'),
(8,'JOOBLE','Jooble','Python developer, Django / FastAPI','Seagull Analytics',NULL,NULL,true,false,false,true,NULL,30,28,
 ARRAY[]::text[],
 E'Remote position. You build the data APIs of a weather routing product with Python, Django and FastAPI.',
 NULL),
(9,'ATS','Brightdesk (Ashby)','Full stack engineer','Brightdesk',NULL,NULL,true,false,true,true,'€55k - €65k a year',50,48,
 ARRAY[]::text[],
 E'Remote in Europe. TypeScript everywhere: React on the front, Node.js and NestJS on the back.',
 NULL),
(10,'FRANCE_TRAVAIL','France Travail','Développeur full stack Angular / Node.js','Normandie Rail Services','Rouen','76100',false,false,true,true,'€40k - €47k a year',26,24,
 ARRAY['https://www.hellowork.com/fr-fr/emplois/demo10.html'],
 E'You develop the passenger information tools of the regional network.\n\nAngular, Node.js, TypeScript and PostgreSQL, deployed twice a week.',
 NULL),
(11,'APEC','APEC','Software engineer Kotlin','Harbor & Byte','Le Havre','76600',false,false,true,true,'€46k - €52k a year',52,50,
 ARRAY[]::text[],
 E'Mobile and backend for a port community app: Kotlin, Spring Boot, API REST.',
 NULL),
(12,'ADZUNA','Adzuna','Développeur Java / Spring','Évreux Assurances','Évreux','27000',false,false,false,true,'€39k - €45k a year',75,72,
 ARRAY[]::text[],
 E'Claims management platform: Java, Spring Boot, Hibernate, Angular.',
 NULL),
(13,'ATS','Calvados Cloud (SmartRecruiters)','Développeur TypeScript','Calvados Cloud','Lisieux','14100',false,false,false,true,NULL,100,96,
 ARRAY[]::text[],
 E'Hosting company, you build the customer console: TypeScript, Angular, Node.js.',
 NULL),
(14,'FRANCE_TRAVAIL','France Travail','Analyste programmeur C#','Dieppe Marine','Dieppe','76200',false,false,false,true,'€35k - €40k a year',124,120,
 ARRAY[]::text[],
 E'Fleet management software: C#, .NET, SQL Server.',
 NULL);

-- The offers as the ingestion would have stored them.
INSERT INTO "Job" (
  id, source, "sourceId", "sourceLabel", title, company, "companyDescription", description,
  "hasFullDescription", "contractLabel", salary, city, "postalCode", "isRemote",
  "isLocationApproximate", "isFavorite", url, "alternativeUrls", "publishedAt", "firstSeenAt",
  "dedupeHash"
)
SELECT 'tour-' || n, source::"JobSourceType", 'tour-' || n, label, title, company, cdescr, descr,
  full_desc, 'CDI', salary, city, pc, remote, approx, fav, 'https://jobs.example/tour-' || n, alts,
  now() - make_interval(hours => pub_h), now() - make_interval(hours => seen_h), 'tour-' || n
FROM offer;

-- Every board healthy, two runs each, so the sources tab reads green.
INSERT INTO "IngestionRun" (id, source, "startedAt", "finishedAt", fetched, kept, inserted, error)
SELECT 'run-' || s || '-' || k, s, now() - make_interval(hours => 2 * k, mins => 26),
  now() - make_interval(hours => 2 * k, mins => 25), f, kept, ins, NULL
FROM (VALUES ('FRANCE_TRAVAIL', 412, 9, 2), ('ADZUNA', 268, 4, 1), ('ATS', 1530, 11, 3),
             ('EURES', 85, 2, 1), ('APEC', 190, 5, 1), ('FREE_WORK', 140, 3, 1), ('JOOBLE', 220, 2, 1))
  AS b(s, f, kept, ins), generate_series(0, 1) AS k;

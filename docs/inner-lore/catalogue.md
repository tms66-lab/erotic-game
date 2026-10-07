# Catalogue @inner.lore — contenu des images

Référence de travail : ce que montrent et disent les slides du compte. Les noms,
textes et personnages appartiennent à leur créateur ; Valombre s'en **inspire**
(formats, ton, types de concepts) sans les recopier. Le compte est étiqueté
« Contenu IA » sur Instagram.

Version machine : [`catalogue.json`](catalogue.json).

Sources : captures envoyées le 7 oct. 2026. Statut : **2 posts, 8 slides sur 24**.
La suite viendra du téléchargement complet de l'export (voir `tools/fetch_insta_images.py`).

---

## Post « Choose Your Fantasy Job » — 13 slides · 63,6 k likes · 1 077 commentaires
Légende : *The Realm is hiring…* · 1er commentaire épinglé : *Find someone in the comments with the same job. Congratulations. You're business partners now.*

| # | Titre | Texte de la slide | Ce que montre l'image |
|---|---|---|---|
| 1 | **Choose Your Fantasy Job** | — (couverture) | Étal d'alchimiste dans une rue de marché : un personnage encapuchonné violet verse une potion verte lumineuse ; étagères de fioles multicolores, herbes séchées, chaudron. Auvents roses et violets, château blanc sur une falaise boisée en fond. Un aventurier en manteau de fourrure bleu-vert regarde. |
| 2 | **Dragon Dentist** | *The pay is incredible. There is a reason.* | Vue depuis l'intérieur de la gueule d'un dragon (crocs au premier plan). Un énorme dragon rouge couché, gueule ouverte ; un chevalier sur un échafaudage en bois frappe une dent avec un marteau. Nains avec chaînes, maillets géants, tonneaux. Forteresse sur des pics rocheux, dragons dans le ciel. |
| 3 | **Pastry Chef** | *Fresh pastries every morning. Adventurers line up before sunrise.* | Boulangerie en plein air sous une halle en bois : un pâtissier à fourrure blanche (créature) enfourne dans un four en pierre. Tartes, choux, gâteaux aux baies, **pâtisseries en forme de dragon**. File d'aventuriers, deux petites créatures (renardeau, bébé dragon) qui chapardent. Village aux toits d'ardoise bleue, auvents de marché colorés, collines vertes, château au loin. |
| 4 | **Tavern Keeper** | *Good food. Better stories. You know everyone in town.* | Taverne en **vue isométrique**, de nuit, pluie dehors sur une ville bleutée. Tavernier hilare au comptoir tendant une chope, chevalier en armure, bardes, grandes tablées, cheminée en pierre flamboyante, bougies, escalier, fourrures suspendues. |
| 5–13 | *à extraire* | | |

## Post « Earth gets ONE new element » — 11 slides · 21,5 k likes · 872 commentaires
Légende : *The old table was never complete…* · Commentaire : *Those interested in Nullium… You may want to take a second look at the Nu slide. 🥚*

| # | Titre | Texte de la slide | Ce que montre l'image |
|---|---|---|---|
| 1 | **Earth gets ONE new element. You decide which one.** | — (couverture) | Silhouette encapuchonnée sur une colline, consultant un **tableau périodique lumineux** sur une tablette. Crépuscule turquoise/violet, nuages pêche, étoiles filantes, cathédrale lointaine, **île flottante**, rivière sinueuse, lucioles. |
| 2 | **Aetherium [Ae]** | *Manipulates gravity. Flight just became possible.* | 4 vignettes : cristal cyan flottant au-dessus d'une falaise ; îlots qui lévitent près d'une cascade ; chevalier soulevé dans une caverne ; **navire volant** porté par des cristaux. |
| 3 | **Chronite [Ch]** | *Break it to rewind time. You choose how far back.* | 4 vignettes : disque ambré en anneaux concentriques qui se fissure ; arbre aux quatre saisons autour du disque ; personnage qui brise le disque, flèches figées en l'air ; ruines baignées d'or. |
| 4 | **Mendrium [Me]** | *Regenerates anything living. Wounds heal. Forests regrow.* | 4 vignettes : cristal vert veiné de lumière d'où poussent des branches fleuries ; forêt luxuriante ; jeune fille soignant un chevalier contre un arbre ; aqueduc en ruine envahi de végétation. |
| 5–11 | *à extraire* (dont **Nullium [Nu]**, avec un secret lié à un œuf 🥚) | | |

---

## Format récurrent des posts

1. **Couverture** = une question ou un défi (*Choose your…*, *Your month…*, *Earth gets ONE…*).
2. **10 à 12 options**, une par slide : un **titre** en haut, et en bas **une ou deux phrases** dont la seconde est une chute ironique (*The pay is incredible. There is a reason.*).
3. **Engagement** : appel à commenter son choix ou à taguer quelqu'un ; parfois un secret caché dans une slide.
4. Typo : sans-serif gras, italique, blanc avec contour noir.

## Style visuel

- **Pixel art « HD »** : illustrations détaillées, petits personnages dans de grands décors, souvent en **vue isométrique** ou plongeante.
- **Éclairage** : forts contrastes chaud/froid, intérieurs ambrés contre extérieurs bleus pluvieux ; lueurs magiques saturées (cyan, vert, ambre).
- **Le « charme »** : créatures mignonnes cachées dans les scènes (renardeau, bébé dragon), humour visuel (des dents de dragon soignées au marteau).

### Palettes extraites des captures

| Scène | Couleurs dominantes |
|---|---|
| Taverne (nuit) | `#101823` `#242330` `#283b57` `#392934` `#4c6487` `#5e4049` `#719ec8` |
| Pâtissier (jour) | `#cc886d` `#cdc5c7` `#bbad9d` `#905746` `#37514d` `#2b362c` |
| Dentiste (jour) | `#8ac3e5` `#a56265` `#c69e95` `#d5cfcc` `#745f5e` `#3b3640` |
| Aetherium | `#0d3739` `#285965` `#367482` `#6ebbd6` `#9eb3d0` `#bdcee7` |
| Chronite | `#f9eaa8` `#ec9d49` `#e2be7c` `#b35d34` `#734c3e` `#2a3235` |
| Mendrium | `#144330` `#2c6c4d` `#4c9a74` `#78c47d` `#d0ce8c` |
| Couverture éléments | `#0f2d2c` `#2a545d` `#4c7489` `#917886` `#b6948a` `#c2c4b0` |

➡️ Appliqué dans `src/world/palette.js` : toits en **ardoise bleue**, eau et ciel azur,
bois brun-prune, lanternes ambre `#ec9d49`, nuit **bleu-pétrole**, ciel du titre
qui passe du turquoise au pêche.

---

## Pistes pour Valombre (concepts originaux inspirés de ces formats)

### Métiers du Royaume (format « Choose your job »)
Au lieu d'un simple écran de choix, ce sont des **PNJ qui exercent des métiers absurdes**, avec des quêtes liées.
Idées originales :
- **Tondeur de griffons** : *Les griffons adorent être tondus. Pendant les dix premières secondes.*
- **Facteur des Profondeurs** : *Personne n'a jamais signé l'accusé de réception.*
- **Allumeur de lanternes** : un métier central à la Halte (lien avec la nuit).
- **Accordeur de cloches** : *Le lac te paie bien. Ne demande pas avec quoi.*

### Éléments oubliés (format « nouvel élément »)
Une **Table des éléments de Valombre** incomplète, à remplir en explorant. Chaque
élément trouvé débloque un pouvoir sur la carte. Équivalents originaux, pas les leurs :
- **Lumen [Lu]** : *Garde la lumière d'une journée. La rend la nuit.* Lien direct avec le cycle jour/nuit.
- **Pesantine [Pe]** : *Rend une chose plus lourde. Ou un problème plus léger.* Pour pousser des blocs et ouvrir des passages.
- **Écholithe [Ec]** : *Rejoue les sons du passé.* Pour entendre la Cloche sous le lac.
- **Germine [Ge]** : *Fait pousser un pont de racines.* Pour traverser l'eau.

### Scènes à reproduire en jeu
- **Taverne de nuit sous la pluie** : ajouter la pluie et les ondes sur les pavés à la Halte.
- **Boulangerie de l'aube** : un étal qui n'ouvre qu'au lever du soleil, avec une file de PNJ.
- **Créatures cachées** : petites bêtes à trouver dans chaque zone (collection).

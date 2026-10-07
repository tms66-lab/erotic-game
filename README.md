# Valombre

RPG mobile en pixel art, jouable dans le navigateur (portrait, manette tactile).
*Chaque route a deux visages.*

L'univers est décrit dans [`docs/UNIVERS.md`](docs/UNIVERS.md).

## Le jeu

1. **Choisis ton mois de naissance** : ton identité. Il donne un titre, une chance (★) et un **Signe**, bonus passif permanent (lumière, esquive, or, boussole…).
   Ce qui change à chaque partie : à chaque descente, un **Présage** est tiré (la chance pèse sur le tirage) et tu **choisis 1 don de combat parmi 3** aux étages 1, 4 et 7.
2. **Halte-Lanterne** : village avec cycle jour/nuit. La nuit, Nyx tient boutique. L'auberge de Maëlle soigne (10 or).
3. **Le vieux puits** descend dans **les Profondeurs** : 10 étages générés au hasard (Racines, Forêt-Champignon, Cavernes de Cristal), dans le noir, avec coffres, fontaines bénies ou maudites, et 9 monstres + 1 rare.
4. **Combats au tour par tour avec timing** : vise le centre de la jauge pour un coup parfait, appuie sur A au « ! » pour parer.
5. **Étage 10, le Noyau** : le Glas, la cloche sous le lac. Le vaincre fait taire le lac (fin du chapitre).
6. Verdicts **VIT / MEURT / MAUDIT**, montée de niveau, Mousse qui se bat avec toi, chiptune généré en direct.

Raccourcis du puits : les étages 4, 7 et 10 se débloquent quand on les a atteints.

## Lancer

```bash
npm install
npm run dev      # http://localhost:5173 (accessible aussi depuis le téléphone sur le même réseau)
npm run build    # version de production dans dist/
```

## Commandes

| Action | Tactile | Clavier |
|---|---|---|
| Se déplacer | croix | flèches / WASD |
| Parler, valider | A | Z / Espace |
| Courir, accélérer le texte | B (maintenu) | X / Maj |
| Menu | START | Entrée / Échap |

## Structure

```
src/
  main.js            démarrage, mise à l'échelle entière, boucle à pas fixe
  config.js          résolution, taille des tuiles, durée du jour
  engine/            entrées (clavier + tactile), boucle de scènes, sauvegarde
  audio/             bruitages et musiques chiptune (WebAudio, aucun fichier)
  gfx/               rendu : palette jour/nuit, tuiles, personnages (dessinés en code)
  scenes/            titre, destin, monde, combat, verdicts, dialogues et menus
  world/             DONNÉES : palette, zones, PNJ, destins, dons, monstres, donjon, règles RPG
```

Tout le contenu se trouve dans `src/world/`. Pour ajouter une zone, un PNJ ou une
page de carnet, il suffit de modifier ces fichiers ; le moteur n'a pas besoin de changer.
La légende des cartes ASCII est en tête de `src/world/zones.js`.

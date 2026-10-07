# Valombre

RPG mobile en pixel art, jouable dans le navigateur (portrait, manette tactile).
*Chaque route a deux visages.*

L'univers est décrit dans [`docs/UNIVERS.md`](docs/UNIVERS.md).

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
  gfx/               rendu : palette jour/nuit, tuiles, personnages (dessinés en code)
  scenes/            écran titre, choix du destin, monde, dialogues et menus
  world/             DONNÉES de l'univers : palette, zones, PNJ, destins, carnet
```

Tout le contenu se trouve dans `src/world/`. Pour ajouter une zone, un PNJ ou une
page de carnet, il suffit de modifier ces fichiers ; le moteur n'a pas besoin de changer.
La légende des cartes ASCII est en tête de `src/world/zones.js`.

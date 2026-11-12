# TP 2 — Gestion et suivi des tickets de maintenance (Vue.js 3)

Application web Vue.js 3 de suivi de tickets de maintenance réalisée avec **Vue 3 (`<script setup>`)**, **Vue Router**, **Axios**, **Tailwind CSS** et une API REST persistant les données dans `db.json` (compatible **JSON Server**).

## Prérequis et installation

- **Node.js** 18+ et **npm**

```bash
npm install
```

## Exécution

Lancement combiné du serveur API REST (`db.json`) et de l'application Vue 3 sur le port `3000` :

```bash
npm run dev
```

Pour utiliser **JSON Server** séparément sur un autre port (par exemple `3001`) :

```bash
npx json-server db.json --port 3001
VITE_API_URL=http://localhost:3001 npm run dev
```

Pour compiler le projet en production :

```bash
npm run build
```

## Fonctionnalités réalisées

- **Liste des tickets (`/tickets`)** :
  - Tableau de bord interactif par statut (`Ouvert`, `En cours`, `Résolu`, `Fermé`) avec filtrage au clic.
  - Recherche en direct (titre, description, demandeur, `#id`, insensible aux accents et vidable avec `Échap`) + filtres par statut et priorité.
  - Changement rapide de statut (`Ouvert → En cours → Résolu → Fermé`) via `PATCH`.
  - Suppression sécurisée par boîte de confirmation modale (`DELETE`).
  - Bascule de thème **Sombre / Clair**.
- **Création d'un ticket (`/tickets/nouveau`)** :
  - Formulaire validé (`titre`, `description`, `demandeur`, `priorite`) empêchant l'envoi si invalide.
  - Initialisation automatique du statut à `Ouvert` et de `dateCreation` à la date du jour via `POST`.
  - Bouton désactivé pendant la requête pour éviter les doublons.
- **Détail, édition et commentaires (`/tickets/:id`)** :
  - Affichage complet des propriétés du ticket et gestion dédiée des erreurs **404 (ticket introuvable)** et pannes réseau.
  - Édition complète via `PUT` et changement rapide de statut via `PATCH`.
  - Section **Commentaires d'intervention** liée par `ticketId` (`GET` et `POST /comments`).

---

## Questions théoriques

### 1. Quelle est la différence entre `POST`, `PUT` et `PATCH` ?
- **`POST`** : crée une **nouvelle ressource** sur le serveur (ex. `POST /tickets` ajoute un nouveau ticket et le serveur lui attribue un `id`). Non idempotent : deux appels identiques créent deux tickets distincts.
- **`PUT`** : remplace **intégralement** une ressource existante identifiée par son URL (ex. `PUT /tickets/1`). Tous les champs de la ressource doivent être envoyés. Idempotent.
- **`PATCH`** : modifie **partiellement** une ressource existante en n'envoyant que les champs à mettre à jour (ex. `PATCH /tickets/1` avec `{ "statut": "En cours" }`). Idéal pour le changement rapide de statut.

### 2. Pourquoi afficher une confirmation avant un `DELETE` ?
La requête `DELETE` est une opération **destructive et irréversible** : une fois confirmée, la ressource (et ici ses commentaires associés) est supprimée de `db.json`. Demander une confirmation explicite via une boîte modale protège l'utilisateur contre un clic accidentel.

### 3. Quel est le rôle de Vue Router ?
**Vue Router** gère la navigation côté client (*Single Page Application*) en associant chaque chemin URL (`/tickets`, `/tickets/nouveau`, `/tickets/:id`) à une vue Vue sans recharger la page complète. Il permet également de lire les paramètres dynamiques (`route.params.id`), de naviguer par programme (`router.push`) et de gérer l'historique du navigateur.

### 4. Comment éviter les doublons lors de l'enregistrement ?
On désactive le bouton de soumission (`:disabled="enCoursEnvoi"`) et on ignore toute nouvelle soumission tant que la requête `POST` est en cours (`if (enCoursEnvoi.value) return`). Dès que la promesse se termine (`finally`), le bouton est réactivé ou l'utilisateur est redirigé vers la liste.

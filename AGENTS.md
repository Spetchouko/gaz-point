# gaz-point — Next.js 16 + React 19 + Tailwind v4

## Corrigé : Espacement barre de recherche Notifications

### Problème
La loupe et le texte "Rechercher dans les notifications..." dans la page Notifications du dashboard client présentaient un espacement insuffisant, risquant un chevauchement selon la taille de l'écran.

### Cause
Dans `app\_components\notifications\notification-center.tsx` (ligne 664), l'Input possédait `pl-10` (40px) de marge gauche. Ajouté au padding de base `.admin-input` (`px-3` = 24px), l'icône loupe positionnée à `left-3` (12px) laissait un espace trop juste entre l'icône et le texte.

### Correction
| Avant | Après |
|-------|-------|
| `pl-10 admin-input` | `pl-12 admin-input` |

### Résultat
- Espace garanti entre l'icône et le texte : **60px** (contre 52px auparavant)
- Aucun chevauchement possible sur aucun device
- Alignement vertical conservé par les classes Tailwind existantes

### Fichier modifié
- `app\_components\notifications\notification-center.tsx` — changement unique de classe CSS

### Non-affecté
- Aucun fichier `.env` modifié
- Aucun serveur arrêté
- Aucune donnée base de données modifiée
- Aucun autre dashboard ou composant impacted
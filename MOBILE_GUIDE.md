# 📱 FermeGest PRO - Guide de Déploiement Mobile (iOS & Android)

Ce projet est désormais entièrement configuré pour fonctionner à la fois comme **Application Mobile Native (Android & iOS via Capacitor)** et comme **Progressive Web App (PWA 100% hors-ligne)**.

---

## 🚀 Capacités Natives Intégrées

1. **Retour Haptique & Vibrations (`@capacitor/haptics`)** :
   - Vibrations tactiles au toucher des boutons d'action (sauvegardes, validations, suppressions, onglets).
2. **Barre d'État Dynamique (`@capacitor/status-bar`)** :
   - S'adapte automatiquement au thème Sombre (`#0b1120`) ou Clair (`#ffffff`).
3. **Écran de Démarrage (`@capacitor/splash-screen`)** :
   - Transition fluide au lancement avec le logo officiel de FermeGest Pro.
4. **Notifications Locales Programmées (`@capacitor/local-notifications`)** :
   - Alertes automatiques pour l'incubateur (jour d'éclosion, mirage des œufs) directement sur le smartphone même si l'application est fermée.
5. **Gestion du Bouton Retour Physique Android (`@capacitor/app`)** :
   - Fermeture automatique des fenêtres modales et menus déroulants avant de quitter l'application.
6. **Partage Natif (`@capacitor/share`)** :
   - Export et partage instantané de vos sauvegardes ou rapports via WhatsApp, Gmail, Google Drive, AirDrop, etc.
7. **Prise en compte des encoches iPhone (Safe Area Insets)** :
   - Support complet de `viewport-fit=cover`, Dynamic Island, encoches et barre de balayage d'iOS.

---

## 🛠️ Commandes Disponibles

| Commande | Action |
| :--- | :--- |
| `npm run build` | Prépare les fichiers web dans le dossier `www/` |
| `npm run sync` | Compile et synchronise le code web avec les projets Android et iOS |
| `npm run open:android` | Ouvre le projet dans **Android Studio** |
| `npm run open:ios` | Ouvre le projet dans **Xcode** (sur Mac) |
| `npm run build:apk` | Compile l'APK de débogage Android directement en ligne de commande |

---

## 🤖 Comment Tester & Compiler sur Android

### Option A : Avec Android Studio (Recommandé)
1. Installez [Android Studio](https://developer.android.com/studio) si ce n'est pas encore fait.
2. Exécutez :
   ```bash
   npm run open:android
   ```
3. Android Studio s'ouvre avec le dossier `android/`.
4. Connectez votre téléphone Android via câble USB (avec le débogage USB activé) ou lancez un émulateur.
5. Cliquez sur le bouton vert **Run ▶** pour installer l'application sur votre téléphone.

### Option B : Générer l'APK directement
```bash
npm run build:apk
```
Le fichier `.apk` sera généré dans :
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🍏 Comment Tester & Compiler sur iOS

1. Transférez le dossier sur un Mac ou utilisez le workflow GitHub Actions (ci-dessous).
2. Exécutez :
   ```bash
   npm run open:ios
   ```
3. Xcode s'ouvre avec le projet `ios/App/App.xcworkspace`.
4. Sélectionnez votre iPhone ou le simulateur iOS dans la barre d'outils, puis cliquez sur **Run ▶**.

---

## ☁️ Compilation Automatique dans le Cloud (Sans Mac ni Android Studio !)

Un workflow d'intégration continue **GitHub Actions** est déjà configuré dans [`.github/workflows/build-mobile.yml`](.github/workflows/build-mobile.yml).

### Comment en profiter :
1. Créez un dépôt GitHub et poussez votre code (`git init`, `git add .`, `git commit -m "mobile"`, `git push`).
2. Rendez-vous dans l'onglet **Actions** de votre dépôt GitHub.
3. Chaque commit déclenche automatiquement la compilation :
   - **Android APK** (téléchargeable directement dans les artefacts)
   - **iOS Build**
4. Vous pouvez télécharger le fichier APK directement sur votre smartphone Android sans rien installer sur votre PC !

---

## 📲 Alternative Immédiate : Installation PWA (Sans compilation)

L'application fonctionne également sans aucune installation d'outils de compilation :

- **Sur iPhone (Safari)** :
  1. Ouvrez l'application dans Safari.
  2. Appuyez sur le bouton **Partager** (icône carré avec flèche vers le haut).
  3. Faites défiler et appuyez sur **"Sur l'écran d'accueil"**.
  4. L'application s'installe comme une véritable app native en plein écran !

- **Sur Android (Chrome)** :
  1. Ouvrez l'application dans Google Chrome.
  2. Appuyez sur les 3 points en haut à droite.
  3. Appuyez sur **"Ajouter à l'écran d'accueil"** ou **"Installer l'application"**.

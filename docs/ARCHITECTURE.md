# Architecture

The app uses file-based routing with Expo Router. Screens are kept independent so features can be added and tested without the monolithic navigation used by the legacy app.

Data access will be introduced behind dedicated services when Firebase is added. UI screens must not depend directly on Firestore calls.

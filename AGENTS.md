# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

Syro Library is a church library management web app for St. Thomas Syro Malabar Church, Fremont. It is a **static HTML/CSS/JS** site (no build step, no package manager) backed by **Firebase Firestore** and **Firebase Auth**. It is hosted on GitHub Pages and deployed automatically on push to `main`.

## Common commands

**Local development** — there is no build. Serve the repo root with any static server:
```sh
python3 -m http.server 8080
# or
npx serve .
```
Open `http://localhost:8080/catalog.html` (or just `/`).

**Deploy Firestore rules** (after editing `firestore.rules`):
```sh
firebase deploy --only firestore:rules
```

**Deploy Firestore indexes** (after editing `firestore.indexes.json`):
```sh
firebase deploy --only firestore:indexes
```

**App deployment** — push to `main`; GitHub Actions (`/.github/workflows/deploy.yml`) uploads the entire repo root to GitHub Pages automatically.

There are no tests and no linter configured in this repository.

## Architecture

### No bundler — Firebase loaded via importmap
Every HTML page declares an `<script type="importmap">` that maps `firebase/app`, `firebase/auth`, and `firebase/firestore` to the Firebase 10.14.1 CDN URLs. All page-level scripts use `<script type="module">` and import directly from `./js/*.js`. There is no npm, no Webpack, no Vite — adding a new Firebase import means adding it to the importmap block in every page that needs it.

### JS module responsibilities (`js/`)
| File | Purpose |
|---|---|
| `firebase-config.js` | Initialises Firebase, exports `db` (Firestore) and `auth` |
| `auth.js` | Google Sign-In, invitation-to-user first-login flow, `initAuth()` / `requireAuth()` page guards |
| `books.js` | Real-time Firestore subscription (`subscribeToBooks`), client-side search, CRUD; `availableCopies` is recalculated on `totalCopies` edits |
| `checkouts.js` | Checkout and check-in using `writeBatch` to atomically update both `checkouts` and `books.availableCopies`; overdue badge logic |
| `students.js` | In-memory cache of active students loaded once per session; `invalidateStudentCache()` must be called after any mutation |
| `volunteers.js` | Reads `users` (role=volunteer) and `invitations` collections; creates/revokes invitations and user docs |
| `ui.js` | `showToast`, `openModal`/`closeModal`/`initModalDismiss`, `escHtml` (safe innerHTML), `formatDate` |

### Pages
- `catalog.html` — public book catalog; doubles as the staff dashboard. Auth is non-blocking: public visitors see the catalog, staff get additional nav and checkout controls.
- `login.html` — Google Sign-In only; redirects to `catalog.html` on success.
- `books.html` — admin: add/edit/delete books.
- `students.html` — admin: add/edit/delete students.
- `volunteers.html` — admin: manage volunteer accounts and pending invitations.
- `index.html` — immediate redirect to `catalog.html`.

### Auth and access model
Access is invitation-based. An admin pre-creates a `/invitations/{email}` document. On the user's first Google sign-in, `auth.js` reads the invitation, creates `/users/{uid}` with the assigned role (`admin` or `volunteer`), and deletes the invitation. Subsequent logins only update `lastLoginAt`.

Roles:
- **admin** — full CRUD on all collections, manages volunteers.
- **volunteer** — can check out and check in books; read-only on students and checkouts; cannot create/delete books or students.

### Firestore data model
- `/books/{bookId}` — `title`, `author`, `isbn`, `category`, `summary`, `imageUrl`, `labels[]`, `totalCopies`, `availableCopies`
- `/checkouts/{checkoutId}` — `bookId`, `bookTitle`, `studentId`, `studentName`, `studentGrade`, `checkedOutAt`, `dueDate`, `returnedAt`, `status` (`active`|`returned`), `checkedOutBy`, `checkedOutByName`
- `/students/{studentId}` — `name`, `grade`, `familyId`, `parentEmail`, `active`
- `/users/{uid}` — `email`, `name`, `role`, `createdAt`, `lastLoginAt`
- `/invitations/{email}` — `name`, `email`, `role`, `addedBy`, `createdAt`

`firestore.indexes.json` defines three composite indexes on `checkouts`: `(status, dueDate)`, `(studentId, status, checkedOutAt DESC)`, and `(bookId, status)`. Any new compound query that isn't covered by these indexes will fail in production and requires a new entry there.

### CSS
- `css/main.css` — CSS custom properties (colors, radii, shadows), reset, nav, login page, buttons, utilities.
- `css/components.css` — reusable components: badges, form inputs, modals, toasts, spinners, typeahead dropdown.
- Page-specific styles are written in `<style>` blocks inside each HTML file.
- The `[hidden]` attribute is enforced with `display: none !important` in the reset so it always overrides flex/grid display rules — use `el.hidden = true/false` rather than toggling CSS classes for visibility.

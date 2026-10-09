# sbeyes notes

People write notes on any device; they autosave to the server. The admin page
shows every note from every writer, live, with saved versions (progress history).

## Run

```sh
npm install
ADMIN_PASSWORD=pick-something npm start
```

- Writers: http://localhost:3000/
- Admin (you): http://localhost:3000/admin

Requires Node 22.13+ (uses the built-in `node:sqlite`). Data lives in `data/notes.db`.

## How it works

- Each writer gets a private key stored in their browser. "Use on another device"
  copies a link that signs that device in as the same writer.
- Edits save ~1s after typing stops. A version snapshot is kept at most every 30s
  per note, plus whenever the writer switches notes or leaves.
- The admin page refreshes every 5s.

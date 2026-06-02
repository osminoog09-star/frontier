# Deploy FRONTIER to GitHub Pages

Target static entry:

- Game: `frontier.html`
- Optional project page: `index.html`
- Local HTTP test: `node server.js`

## Expected public URL

If the repository is `osminoog09-star/frontier`, GitHub Pages URL will be:

`https://osminoog09-star.github.io/frontier/frontier.html`

## Manual fallback

```powershell
git remote add origin https://github.com/osminoog09-star/frontier.git
git push -u origin main
```

Then enable GitHub Pages:

- Repository Settings
- Pages
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

## Notes

- `.nojekyll` is included so GitHub Pages serves files exactly as static assets.
- `frontier.html` is the current playable build.
- `server.js` is only for local/LAN phone testing; GitHub Pages does not run it.


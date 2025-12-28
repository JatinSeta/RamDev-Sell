GitHub upload server for Ramdev-hardware admin panel

Overview

This small Node server accepts an uploaded image and metadata and creates two files in your GitHub repository under the `Imges/` folder:
 - the image file (binary)
 - a metadata JSON file (same name + `.json`) containing title, price, description and uploadedAt

Why a server?

Uploading directly from browser to GitHub would require embedding a Personal Access Token (PAT) in client-side code which is insecure. This server keeps the PAT on the server side and performs the GitHub API calls safely.

Setup

1) Create a GitHub Personal Access Token (PAT):
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
   - Give it a name and grant the `repo` scope (this allows creating content in private/public repos of your user account)
   - Copy the token — you will not be able to see it again.

2) Put the token in your environment and start the server:

   Windows PowerShell (example):

   $env:GITHUB_TOKEN = 'ghp_yourtoken'
   npm install
   npm start

   Linux/macOS (example):

   export GITHUB_TOKEN='ghp_yourtoken'
   npm install
   npm start

3) Optional environment variables:
   - GITHUB_OWNER (default: JatinSeta)
   - GITHUB_REPO (default: Ramdev-hardware)
   - GITHUB_BRANCH (default: main)
   - GITHUB_BASE_PATH (default: Imges)

Using the admin panel

1) Open `AdminePanel.html` in your browser (or visit http://localhost:3000/Admine%20Panel/AdminePanel.html if you run the server from the repo root and keep the files in place).
2) Choose an image, enter Title, Price, Description and click Upload. The frontend will POST to `/upload` on this server.
3) After success you will see the image in the preview and the files will be added to the GitHub repository under `Imges/`.

Notes & troubleshooting

- Make sure the repo `JatinSeta/Ramdev-hardware` exists and you have push rights.
- Ensure `GITHUB_TOKEN` has repo permissions.
- If you receive GitHub API errors, check server logs (console) for details.
- This server uses the GitHub contents API; it will create or update files. If you need more advanced workflows (branches, PRs), we can update the server to create a branch and open a PR.

Security reminder

Do NOT place your personal access token in client-side code or commit it to the repository. Keep the token as an environment variable on your server or CI environment.

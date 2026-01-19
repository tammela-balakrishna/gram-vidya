# Deployment (Docker)

This project can be deployed with Docker. The repository includes a `Dockerfile` and `docker-compose.yml` for a simple production-ready setup.

Prerequisites
- Docker and Docker Compose installed on the host
- Valid environment variables in `.env` (do NOT commit your `.env` to source control). Required keys:
  - `MONGO_URI` (Atlas) or use the provided local `mongo` service in `docker-compose.yml`
  - `JWT_SECRET`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (or `CLOUDINARY_URL`)

Quickstart (use Atlas):

1. Ensure `MONGO_URI` in `.env` points to your Atlas connection string and that Atlas allows your host IP (or 0.0.0.0/0 for testing).

2. Build and run the container:

```bash
cd gram-vidya
docker build -t gram-vidya:latest .
docker run -d --env-file .env -p 5000:5000 --name gram-vidya gram-vidya:latest
```

Quickstart (use local Mongo via docker-compose):

```bash
cd gram-vidya
docker compose up -d --build
```

Notes
- If you use Atlas and DNS SRV resolution is blocked on your network, use the "standard" connection string (non-SRV) from Atlas and set `MONGO_URI` accordingly.
- Do NOT store `.env` in git. Use your cloud provider's secret management for production deployments.
- To view logs:

```bash
docker compose logs -f app
```

Stopping and removing containers:

```bash
docker compose down
```

If you want, I can also add a GitHub Actions workflow to build and push the image to Docker Hub or GitHub Container Registry.
 - GitHub Actions: a workflow is included at `.github/workflows/docker-publish.yml` to build and push the Docker image to Docker Hub.
   Required repository secrets:
   - **DOCKERHUB_USERNAME** : your Docker Hub username
   - **DOCKERHUB_TOKEN** : a Docker Hub personal access token (or password)
   - **DOCKERHUB_REPO** : target repo (example: `youruser/gram-vidya`)

   After adding these secrets in the GitHub repository Settings → Secrets, push to `main` or manually trigger 'Run workflow' from the Actions tab.

GHCR (GitHub Container Registry) publishing
-------------------------------------------

There's also a workflow to publish to GitHub Container Registry (GHCR): `.github/workflows/ghcr-publish.yml`.

Key notes for GHCR:

- No extra secrets are strictly required for basic publishing: the workflow uses the built-in `GITHUB_TOKEN` with `packages: write` permission. When the workflow runs it will push images to `ghcr.io/<owner>/<repo>`.
- Ensure repository settings allow GitHub Actions to write packages: go to Settings → Actions → General → Workflow permissions and enable "Read and write permissions" for `GITHUB_TOKEN` (this is necessary to push to GHCR).
- The workflow publishes two tags: `ghcr.io/<owner>/<repo>:<sha>` and `ghcr.io/<owner>/<repo>:latest`.

Triggering:
- Push to `main` or create/publish a GitHub Release — the workflow runs on those events.

If you prefer Docker Hub or another registry, use the previously added `docker-publish.yml` (Docker Hub) or tell me which registry to target and I will add/modify a workflow.

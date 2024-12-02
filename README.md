# Lumina Monorepo

## Github Workflow

1. Pull the latest changes from `main`.

```bash
git switch main && git pull
```

2. Do some work on the `main` branch.

3. Create a new branch for your changes.

```bash
git switch -c feature/my-changes
```

4. Commit your changes.

```bash
git add . && git commit -m "feat: my changes"
```

5. Push your changes and create a PR

```bash
#Using the github cli this pushes the branch and creates a PR
gh pr create

#Or you can use git and manually create the PR
git push -u origin feature/my-changes
```

## Publishing to NPM

Follow the GitHub workflow, and add a changeset to your PR.

```bash
npx changeset
```

Then merge your PR. Publishing to NPM is automated with GitHub Actions.

## Formatting

You'll need to install [dprint](https://dprint.dev/install/) to get the vscode extension working.

```bash
curl -fsSL https://dprint.dev/install.sh | sh
```

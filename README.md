# Lumina Monorepo

Monorepo for Lumina, a dex for the Mina Blockchain.

## Install

- [Moon](https://moonrepo.dev/moon) is a task runner and monorepo management tool for the web ecosystem, written in Rust.
- [Proto](https://moonrepo.dev/proto) is a version manager for all web languages and tools. A unified toolchain.

> [!TIP]
> Proto is not necessary, but extremely convenient as it take cares of installing the correct version of Moon, Node, pnpm and Bun.

1. Install Proto (https://moonrepo.dev/docs/proto/install)

```bash
# macOS
brew install git unzip gzip xz

# Ubuntu / Debian
apt-get install git unzip gzip xz-utils

# RHEL-based / Fedora
dnf install git unzip gzip xz

# Linux, macOS, WSL
curl -fsSL https://get.prototools.dev | sh
```

```powershell
# Windows (PowerShell)
irm https://moonrepo.dev/install/proto.ps1 | iex
Set-ExecutionPolicy RemoteSigned
# Without admin privileges
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

2. Install Moon

```bash
proto install moon
```

3. Use Moon to run tasks from the repo root. All tools and dependencies will be installed automatically.

```bash
moon <project>:<task>
```

or within a project:

```bash
moon run <task>
```

## Projects and common tasks

To find out which tasks are available, look at the `moon.yml` files in each project folder.
The tasks in the root `.moon/tasks.yaml` are available to all projects.

## Formatting and checks

- Format entire workspace: `moon run format-all-fix`

## Discover and diagnose tasks (optional)

Here are some useful commands to explore the monorepo structure and tasks.

```bash
moon task <task>
moon project <project>
moon query projects
```

### Git Hooks

We use [lefthook](https://github.com/evilmartians/lefthook) to manage githooks. It should work out of the box, but after running `pnpm i`, you should run `pnpm lefthook install` to ensure it's set up correctly.

### Github Workflow

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

### Creating Releases

We use [changesets](https://github.com/changesets/changesets) to manage releases.
Follow the GitHub workflow, and add a changeset to your PR to create a new release.

```bash
moon changeset
```

Then merge your PR. Publishing to NPM will be automated with GitHub Actions.

### Formatting

You might need to install [dprint](https://dprint.dev/install/) globally to get the vscode extension working.

```bash
curl -fsSL https://dprint.dev/install.sh | sh
```

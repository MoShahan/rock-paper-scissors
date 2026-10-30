# Rock Paper Scissors

A vanilla HTML, CSS, and JavaScript game. There are two versions of the same project: the original first-website look, and a newer match with custom rounds and object-shaped buttons.

**Demo:** [https://moshahan.github.io/rock-paper-scissors/](https://moshahan.github.io/rock-paper-scissors/)

| Version | Page | Demo |
| --- | --- | --- |
| Modern | `index.html` | [Live](https://moshahan.github.io/rock-paper-scissors/) |
| Classic | `classic.html` | [Live](https://moshahan.github.io/rock-paper-scissors/classic.html) |

Use the **Classic / Modern** control in the top-right to switch.

## How to play (modern)

1. Pick **Best of 3 / 5 / 7**, **5 rounds**, **10 rounds**, or type a custom match (`best of 9`, `12 rounds`, `first to 4`).
2. Click the **stone**, **paper**, or **scissors**. The clickable area follows the outline of the object, including the holes in the scissor handles.
3. Keyboard: `R`, `P`, `S`.

Best-of matches go to the majority (best of 5 is first to 3). Fixed round matches play every round, ties included, then compare scores.

Classic is the original 10-move game on the wooden table photo.

## Run locally

The modern object-shaped click targets read pixel data from the images, so serve the folder over HTTP instead of opening the file directly:

```bash
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## GitHub Pages without a workflow

This is the **Deploy from a branch** option (GitHub also calls it “Build from a branch”). No GitHub Actions file is required.

1. Open the repo **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Pick the branch (`main`) and the folder (`/` for the repo root, or `/docs` if the site lives there).
4. Save. GitHub copies those static files and hosts them.

For this project repo, the URL is always:

`https://<username>.github.io/<repository-name>/`

Here that is [https://moshahan.github.io/rock-paper-scissors/](https://moshahan.github.io/rock-paper-scissors/). Every push to `main` republishes the site after a minute or two.

Notes:

- This only works for static files (HTML, CSS, JS, images). There is no Node or Python server on Pages.
- GitHub runs Jekyll on branch deploys unless the site has a `.nojekyll` file. This repo includes `.nojekyll` so files are published as-is.
- Paths in the HTML should be relative (`modern.css`, `assets/rock.png`), not rooted at `/`, so the game still works under `/rock-paper-scissors/`.
- The first time Pages is turned on, GitHub may show a 404 until the first publish finishes.

## GitHub Pages with Actions (optional)

`.github/workflows/pages.yml` can publish the same files through **GitHub Actions**. Because this repository is named `rock-paper-scissors`, the live URL is still:

[https://moshahan.github.io/rock-paper-scissors/](https://moshahan.github.io/rock-paper-scissors/)

1. **Settings → Pages → Source:** GitHub Actions.
2. Push to `main`, or run **Deploy GitHub Pages** by hand.
3. Approve the `github-pages` environment if GitHub asks.

## Lint

The **Lint** workflow checks HTML, CSS, and JavaScript on every push and pull request. You can run the same checks locally after `npm install --no-save htmlhint stylelint stylelint-config-standard eslint`:

```bash
npx htmlhint "**/*.html"
npx stylelint "**/*.css"
npx eslint "**/*.js"
```

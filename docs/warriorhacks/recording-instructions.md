# Recording on a Mac and finishing the submission video

## Retrieve the branch

From an existing repository checkout:

```sh
git fetch origin
git switch --track origin/docs/warriorhacks-submission-media
```

If the branch already exists locally, switch to it and pull normally. Alternatively clone the repository directly on this branch:

```sh
git clone --branch docs/warriorhacks-submission-media https://github.com/LouisRodriguez12101815/comptia-a-plus-review.git
cd comptia-a-plus-review
```

Open `docs/warriorhacks/`. The branch contains individual PNGs and Markdown, not a redundant ZIP. Do not use Git LFS for these assets. File size and video availability are recorded in [README](README.md).

## Use the captured footage

If `video/guided-demo-raw.mp4` is present, it is a silent raw recording of the actual local browser. It has no narration, title cards, music or edited presentation. It was transcoded to H.264 and only 1.4 seconds of trailing still time was trimmed; gameplay order is unchanged. It is 2:59. Import it into your preferred Mac editor, record your voice using [demo-script.md](demo-script.md), and align speech with its timed actions. Do not call it a finished narrated video until you have completed that edit.

Keep explanations readable. Captions such as “Solo Guided Demo — local capture” can be added in your finished edit; do not relabel it as multiplayer. Export a 2–3 minute narrated H.264 MP4, then play it from beginning to end before uploading to your Devpost-supported video host. Save/upload the final video yourself; this branch does not claim a completed narrated submission.

## Record a new take manually

1. Use an authorized deployed URL, or run locally with the repository's supported Node version (22.18+; 24 recommended):

   ```sh
   npm ci
   npm run build -- --webpack
   npm run start -- --hostname 127.0.0.1 --port 3040
   ```

   The Webpack option is supported by Next and was used for the local capture. Guided Demo needs no Twilio credentials. Do not add an environment file to the submission branch. If using a deployed URL, record its build separately; the supplied footage is local.
2. Open a clean browser profile at `http://127.0.0.1:3040/`. Close developer tools, password-manager popups and unrelated tabs; hide notifications. Use no personal player names. Guided Demo does not ask for a nickname.
3. Set the browser content viewport to **1440 × 960**, with normal 100% zoom. OBS window/region capture or QuickTime (Shift-Command-5 / selected portion) can capture that region. Browser chrome may increase the window size; measure the content area, not the entire window. A PNG's dimensions can be checked in Preview's Inspector. Do not record developer tools while measuring.
4. Select the microphone in your recording app and test a short audio sample. Use the timed script, navigating by exact answer labels because their positions shuffle. Begin on the review homepage, show `/game`, then select **Begin training**.
5. Follow all five rounds, including the deliberate wrong router reboot and **Try again** recovery. Read supplied evidence rather than pretending to click a discovery card. Scroll naturally to keep diagrams and feedback readable.
6. Reach the debrief, show the mistake/review links, and open the source lab. Do not omit a failed or blocked step and claim it passed. The game chooses tests/repairs; it does not execute commands on your Mac.
7. Stop around 2:57. Trim only dead time if necessary, preserving the visible cause/effect sequence. Label any edits clearly in your working notes; never composite a different result into gameplay.
8. Check audio, readability, aspect ratio, start/end, and absence of private information. Export the narrated MP4. For Git, check its size first; do not commit a large final export or configure Git LFS without approval.

## If recording cannot be completed

Use the PNGs and this exact script to record manually later. Do not describe unrecorded narration, an interrupted take, or an unuploaded video as finished. A browser websocket closing after a saved PASS and intentional cleanup is not proof a game step failed; check the recording and logs before deciding to rerun.

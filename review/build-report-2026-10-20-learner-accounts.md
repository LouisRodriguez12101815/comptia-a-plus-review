# Build report: learner accounts with Twilio (2026-10-20)

Branch `learner-accounts-twilio`, commit d0261e1 on main cddff11 (after PRs #74 and #75). Delivered as `learner-accounts-twilio.patch`. Not pushed: this session can't push to the repo.

## Added
- Phone sign-in with Twilio Verify (SMS code) and a signed HttpOnly session cookie that lasts 30 days.
- One Twilio Sync Map per learner, named from an HMAC of the phone number. The number itself is never stored, only its last 4 digits. Items: profile, progress, schedules-0…n (split under 16 KiB), history (100 events), run:<key> (30 runs).
- Saved: flashcard counts and FSRS schedules, quiz and test-mode attempts, an activity history, a display name, and practice-game, mission and Subnet Architect runs.
- Signing in merges both devices: the newest review of each card wins, attempts and history are combined without duplicates, and the newer game run wins.
- A "Save your progress across devices" panel on the track hubs, a /history page, sign out, and delete my data. Text in all four languages.
- Limits: per IP and per phone on code requests, per IP on code checks, and per learner on saves. Texts stop when the existing daily spend latch trips.
- Setup guide: docs/learner-accounts.md. It adds 2 new environment variables: TWILIO_VERIFY_SERVICE_SID and LEARNER_SESSION_SECRET.

## Verified
- 16 new learner tests run with fake Verify and Sync. The other suites pass: outage-ops 95, practice 24, subnet 24, report 7, schedule 6, content 2, objectives 11, exam 6. Content check has 0 errors and the visual audit passes.
- Typecheck is clean, ESLint has 0 errors (4 warnings that were already there), and `next build` passes with Google Fonts stubbed locally.
- Browser run at 1280 and 390 px with the Twilio API mocked: a bad phone number lists both problems, a code is sent, a wrong code is reported, sign-in merges local and remote cards and keeps this device's study focus, a saved run is restored, the push includes progress, history and runs, the history page lists the remote quiz, and delete signs out. No console errors and no overflow.
- With no Twilio variables on the real server, the panel is hidden.
- axe: 0 serious or critical issues on /networking and /history, signed in and signed out.

## Not verified
- Real Twilio calls: actual SMS delivery, Sync Map creation, and the Verify error codes in production. Test on a Vercel preview with the variables set.
- Node 22 was used, not the repo's Node 24.

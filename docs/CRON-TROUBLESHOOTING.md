# Launchd troubleshooting (this site was migrated from cron to launchd)

**Heads up (2026-05-18 update):** the actual daily publisher uses **launchd**, not `cron`. This doc still mentions `cron` and `crontab` in places that haven't been migrated yet. If a section talks about `crontab`, mentally substitute `launchctl list / launchctl load / launchctl start`. Full migration is on the to-do.

**Hard rule discovered the painful way (2026-05-18):** macOS TCC sandbox blocks launchd from executing scripts that live inside `~/Desktop/`, `~/Documents/`, or `~/Downloads/`. If a launchd job is failing with **exit 126** and the stderr says **"Operation not permitted"**, the script path is the problem. Fix: move the script to `~/Scripts/` (or anywhere outside TCC-protected folders) and update the plist's `ProgramArguments` to point there.

Even after the script moves out of `~/Desktop/`, if the script READS files inside `~/Desktop/.../krista-mashore-content-site/`, those reads can ALSO be TCC-blocked depending on which specific folders the system has granted access to. Two long-term fixes for the read problem:

1. **Move `krista-mashore-content-site/` out of `~/Desktop/`** — the original docs say `~/Sites/krista-mashore-content-site/`. Relocating restores the intended architecture.
2. **Grant Full Disk Access to `/bin/bash`** in System Settings → Privacy & Security → Full Disk Access. One-time setup, fixes all similar issues for any future launchd jobs. Security tradeoff: every launchd-invoked bash script gets unrestricted file access.

---

When the daily publish stops working. Run through these in order.

## 1. Did the launchd job actually fire?

```bash
tail -50 ~/Library/Logs/krista-content-publish.log
```

- **If the log has recent timestamps but errors:** skip to step 4.
- **If the log is empty or has nothing recent:** keep going.

## 2. Is the launchd job registered?

```bash
launchctl list | grep daily-articles
```

You should see a line like:

```
-	0	com.kristamashore.daily-articles
```

- The first column is the PID (currently running) or `-` (idle, scheduled).
- The second column is the last exit code. `0` = clean. `126` = "Operation not permitted" (TCC issue — see top of doc). `1` = script ran but exited with an error.
- The third column is the label.

If nothing appears: the job isn't loaded. Run:

```bash
launchctl load ~/Library/LaunchAgents/com.kristamashore.daily-articles.plist
```

Or to test-fire immediately:

```bash
launchctl start com.kristamashore.daily-articles
```

To pause publishing: `launchctl unload ~/Library/LaunchAgents/com.kristamashore.daily-articles.plist`. To resume: `launchctl load ...`.

## 3. Does the wrapper script run manually?

```bash
~/Scripts/krista-content-publish.sh
echo "exit: $?"
```

- **If it prints output and exit 0:** cron exists but isn't firing. See step 5.
- **If it errors:** read the error. Common ones:
  - `node: command not found` → the script is using the wrong Node path. Fix in `~/Scripts/krista-content-publish.sh` to use `/Users/kristamashore/.local/node/bin/node`.
  - `permission denied` → `chmod +x ~/Scripts/krista-content-publish.sh`
  - `git push failed` → `cd ~/Sites/krista-mashore-content-site && git push` to see the real error.

## 4. Cron fires but the publish errors

Look at the log error message. Common ones:

- **"queue is empty"** — not an error. The script ran, queue was empty, exited cleanly. Refill the queue.
- **"git push failed: authentication"** — your GitHub credentials expired. Run `gh auth login` to refresh, then retry.
- **"git commit failed: nothing to commit"** — the queue had an article but writing to posts.json didn't change anything. Usually means the article was already published. Check `data/blog/queue.json` and `data/blog/posts.json` for duplicates.
- **"ENOENT: no such file or directory"** — node can't find a path. Usually the working directory in the wrapper script is wrong. Should be `cd "$HOME/Sites/krista-mashore-content-site"`.

## 5. Cron is registered but never fires

This is the macOS Privacy framework. Cron needs Full Disk Access on modern macOS.

1. Open **System Settings → Privacy & Security → Full Disk Access**
2. Click the **+** button
3. Press **Cmd+Shift+G**
4. Type `/usr/sbin/cron` and press Enter
5. Click **Open** and toggle the switch on

Restart your Mac (cron loads at boot). After reboot, watch the log for the next scheduled run.

## 6. The publish succeeded but Vercel didn't deploy

```bash
cd ~/Sites/krista-mashore-content-site
git log --oneline | head -5
```

You should see a recent `publish: 1 article(s) on YYYY-MM-DD ...` commit. If yes:

- Open Vercel dashboard → Deployments. Was a deploy triggered? If yes but failed, click into the failure log.
- If no deploy was triggered, your GitHub → Vercel webhook is broken. Reconnect via Vercel dashboard → Settings → Git → Disconnect → Reconnect.

## 7. Pause publishing temporarily

If Krista is on vacation or the queue needs cleanup, pause the cron:

```bash
crontab -e
```

Editor opens. Put a `#` in front of the publishing line. Save. Cron now skips it.

To resume, remove the `#`.

## 8. Permanent fixes

If you've troubleshooted the same issue twice, fix it in code. Common improvements:

- **Add notification on failure:** edit `scripts/publish-batch.cjs` to send email via Resend/SendGrid on errors. Email goes to `doit@kristamashore.com`.
- **Add a Slack alert** on failure if Krista uses Slack.
- **Add a heartbeat ping** to a service like dead-mans-snitch.com so you get alerted if cron stops running entirely.

## Quick health check (run this monthly)

```bash
crontab -l                                    # confirm cron registered
tail -30 ~/Library/Logs/krista-content-publish.log  # see recent runs
ls -la ~/Sites/krista-mashore-content-site/data/blog/queue.json  # queue exists
node -e "console.log(require('/Users/kristamashore/Sites/krista-mashore-content-site/data/blog/queue.json').length, 'articles in queue')"
```

If queue is under 7, refill before the cron runs you dry.

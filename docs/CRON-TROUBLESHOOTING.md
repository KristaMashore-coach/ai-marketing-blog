# Cron troubleshooting

When the daily publish stops working. Run through these in order.

## 1. Did the cron actually fire?

```bash
tail -50 ~/Library/Logs/krista-content-publish.log
```

- **If the log has recent timestamps but errors:** skip to step 4.
- **If the log is empty or has nothing recent:** keep going.

## 2. Is cron registered?

```bash
crontab -l
```

You should see a line like:

```
0 6,9,12,15,18 * * * /Users/kristamashore/Scripts/krista-content-publish.sh
```

- **If empty:** cron got cleared. Re-add it. See `BUILD-DECISIONS.md` for the exact pattern.
- **If commented out (line starts with #):** publishing was paused. Uncomment and save.
- **If present:** keep going.

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

# Teaching notes for unwritten chapters

This is a reference for Krista when writing Chapters 6 and 12 (and any future chapter that touches file paths or scheduling). Captures the rules learned the hard way on 2026-05-18 so students don't repeat the trap.

**Not student-facing. Leave this file out of any export to students.**

---

## Hard rule #1 — Project goes in `~/Sites/`, NEVER `~/Desktop/`

When Chapter 6 ("Get the site code") tells the student where to clone the repo, the path MUST be:

```
~/Sites/your-content-site/
```

NOT:

```
~/Desktop/your-content-site/
```

### Why this matters

macOS has a security system called **TCC** (Transparency, Consent, and Control) that locks down access to certain folders: `~/Desktop/`, `~/Documents/`, and `~/Downloads/`. Any program that wants to read or write files in those folders has to be granted permission first.

When a scheduled task (cron or launchd) tries to access a TCC-protected folder, it gets blocked silently. The script fails with `Operation not permitted` (exit code 126 from bash, or `cat: Operation not permitted` for file reads).

**`~/Sites/` is NOT a TCC-protected folder.** Programs can access it freely without granting permission.

### How to teach this

In Chapter 6, after the student creates the project folder, say:

> Open Terminal and run:
> ```
> mkdir -p ~/Sites
> cd ~/Sites
> ```
> 
> Your site lives in `~/Sites/`. NOT on your Desktop. macOS will block scheduled tasks from reading your Desktop, so projects that need to run on a schedule live here instead. You can still open the folder anytime: in Finder, hit `Cmd + Shift + G`, type `~/Sites`, hit Enter.

If a student says "but I want it on my Desktop so I can see it" — give them this:

> You can put a shortcut to it on your Desktop. In Finder, navigate to `~/Sites/your-content-site`, right-click, hold Option, and select "Make Alias." Drag the alias to your Desktop. Now you have one-click access without storing the real files there.

---

## Hard rule #2 — Wrapper scripts go in `~/Scripts/`, never inside the project folder

When Chapter 12 ("Set up daily auto-publishing") teaches the launchd job, the wrapper script the student creates MUST be at:

```
~/Scripts/daily-article-writer.sh
```

NOT at:

```
~/Sites/your-content-site/scripts/daily-article-writer.sh
```

(Even though `~/Sites/` itself is fine for the project, putting the launchd-invoked script INSIDE a project subfolder is fragile because the project may move, change names, or get reorganized. `~/Scripts/` is a stable home for launchd-callable scripts.)

### How to teach this

In Chapter 12:

> Open Terminal and run:
> ```
> mkdir -p ~/Scripts
> ```
> 
> This is where your scheduled scripts live. Separate from your project so you can move the project around without breaking the schedule.

Then walk them through creating the wrapper script in `~/Scripts/` and the plist in `~/Library/LaunchAgents/`.

---

## Hard rule #3 — Use launchd, NOT cron, on modern macOS

The site started with `cron` but had to be migrated to `launchd` because:
- cron is deprecated on macOS Sequoia (it'll stop working entirely soon)
- launchd has better logging, better restart-on-fail behavior, and survives reboots cleanly
- macOS TCC also blocks cron from many folders, so cron has the same trap

Teach launchd. Don't teach `crontab` even though some tutorials online still do.

### Chapter 12 plist template

The plist file students create at `~/Library/LaunchAgents/com.STUDENT_NAME.daily-articles.plist` should look like:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.STUDENT_NAME.daily-articles</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/STUDENT_USERNAME/Scripts/daily-article-writer.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>5</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/STUDENT_USERNAME/Library/Logs/daily-articles.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/STUDENT_USERNAME/Library/Logs/daily-articles.stderr.log</string>
    <key>RunAtLoad</key>
    <false/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/Users/STUDENT_USERNAME/.local/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>/Users/STUDENT_USERNAME</string>
    </dict>
</dict>
</plist>
```

Then to activate:

```
launchctl load ~/Library/LaunchAgents/com.STUDENT_NAME.daily-articles.plist
```

To verify it's loaded:

```
launchctl list | grep daily-articles
```

To test-fire immediately (without waiting for 5 AM):

```
launchctl start com.STUDENT_NAME.daily-articles
```

---

## Article approval workflow (important context)

Make sure Chapter 12 explains: **articles do NOT auto-publish.** The 5 AM job writes drafts to a queue folder. The student reads each draft, approves it (drag to "ready-to-publish" folder), and only then does the separate publish job send it to the live site.

This two-step workflow is the safety net. The launchd job generates → the student reviews → the publish job pushes only approved content. Students should be told this explicitly in Chapter 12 so they don't worry about robot articles going live unreviewed.

---

## Common student traps to address in Chapters 6 and 12

1. **"I cloned to Desktop because that's where I always put things."** → Tell them the TCC reason. Show them how to make an alias instead.
2. **"My scheduled task fails with 'Operation not permitted'."** → Their script is in a TCC-protected folder. Move it to `~/Scripts/`.
3. **"I followed an online tutorial that uses crontab."** → Show them how to migrate to launchd. Cron is dead on modern Mac.
4. **"The script runs manually but launchd never fires it."** → Common causes: plist syntax error (run `plutil -lint ~/Library/LaunchAgents/com.X.plist`), the script path in the plist is wrong, or the script doesn't have execute permission (`chmod +x ~/Scripts/script.sh`).
5. **"How do I know launchd is working?"** → `launchctl list | grep their-label-here`. PID column = currently running. Second column = last exit code (0 = success, anything else = error). Stderr log in `~/Library/Logs/` shows what went wrong.

---

## Reference

These rules were discovered during Krista's own setup on 2026-05-18. Full details in:
- `Krista-OS/_Operations-Log.md` (the 2026-05-18 13:30 entry)
- `Krista-OS/12-Compound-Learning/Applied-Changes-Log.md` (the 2026-05-18 Proposal 4 entry)
- This content-site repo's `docs/CRON-TROUBLESHOOTING.md` (updated with the launchd reality + TCC trap)

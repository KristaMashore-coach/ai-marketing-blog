# Chapter 5 — Set up GitHub (free code storage)

**Time: ~10 minutes**
**Cost: $0**

## What you're doing

GitHub is where your site's code lives. Two reasons we need it:

1. **Vercel watches it.** When your team adds a new article and the cron pushes it to GitHub, Vercel automatically rebuilds your site. No manual deploys ever again.
2. **It's a backup.** If something goes wrong with your Mac, your code is safe in the cloud.

You only have to set this up once. After that it runs itself.

## Step 1: Create a GitHub account (if you don't have one)

If you already have a GitHub account, skip to Step 2.

If you don't:
1. Open https://github.com/signup in your browser
2. Use your business email (`doit@yourcompany.com` style)
3. Pick a username — your name plus your business is a good pattern. Examples: `[your-name]-coach`, `[your-name]-realtor`, or just `[your-name]`. This will be in your repo URLs forever, so pick something professional.
4. Use a strong password. Write it down somewhere safe (1Password recommended).
5. Verify your email when GitHub sends you a link.

## Step 2: Open Terminal

On your Mac:
- Press **Cmd + Space** to open Spotlight
- Type **"Terminal"**
- Press **Enter**

A window pops up with white text on dark background (or black on white, depending on your settings). This is your command line.

> 📸 **Screenshot moment:** Empty Terminal window, ready for commands.

## Step 3: Authenticate GitHub from your Terminal

Paste this command and press Enter:

```
gh auth login
```

It'll start asking you a series of questions. Use these exact answers:

**Q: "Where do you use GitHub?"**
- Just press **Enter** (default is GitHub.com — what you want)

**Q: "What is your preferred protocol for Git operations on this host?"**
- Press the **down arrow** if needed to highlight **HTTPS**
- Press **Enter**
- ⚠️ **Watch out:** if you accidentally type a letter, it filters the list. Backspace until clean, then use arrow keys.

**Q: "Authenticate Git with your GitHub credentials?"**
- Press **Y** then **Enter** (yes)

**Q: "How would you like to authenticate GitHub CLI?"**
- Highlight **"Login with a web browser"** (default)
- Press **Enter**

## Step 4: Use the one-time code in your browser

Terminal will show you something like:

```
! First copy your one-time code: ABCD-1234
Press Enter to open https://github.com/login/device in your browser...
```

> 📸 **Screenshot moment:** Terminal showing the one-time code.

**Copy the code first** (highlight in Terminal, Cmd+C, or just memorize the 8 characters).

**Then press Enter.** Your browser will open to `github.com/login/device`.

Paste the code into the box. Click Continue.

Click **"Authorize github"** when GitHub asks if you want to give the CLI access.

## Step 5: Confirm your password (sudo mode)

GitHub will ask you to confirm your account password one more time. This is a security check — they want to be sure it's actually you authorizing a new app.

Type your GitHub password. Click the green **Confirm** button.

> 📸 **Screenshot moment:** "Confirm access" page with password field.

You'll land on a "Congratulations, you're all set" page with a green checkmark.

> 📸 **Screenshot moment:** Green checkmark, "Your device is now connected."

## Step 6: Back to Terminal — push your code

Switch back to your Terminal window. You should see green checkmarks confirming auth complete.

Now paste this single command, **replacing `[your-content-site]` with the name you want for your repo** (something like `your-name-content-site` or `your-business-blog`):

```
gh repo create [your-content-site] --private --source=. --push
```

The repo name should match the project folder name from Chapter 6. Use lowercase letters, numbers, and hyphens — no spaces, no special characters.

This command does three things:
1. Creates a private repo on your GitHub
2. Links your local folder to that repo
3. Pushes all your code up

You'll see output like:

```
✓ Created repository YourUsername/your-repo-name on github.com
✓ Added remote https://github.com/YourUsername/your-repo-name.git
Enumerating objects: 74, done.
Counting objects: 100% (74/74), done.
...
✓ Pushed commits to https://github.com/YourUsername/your-repo-name.git
```

> 📸 **Screenshot moment:** Terminal showing the success output and the GitHub URL.

**Save that GitHub URL.** You'll need it in the next chapter for Vercel.

## Step 7: Verify in your browser

Open the GitHub URL it gave you (something like `https://github.com/[your-username]/[your-content-site]`).

You should see all your project files listed. Folders like `data`, `scripts`, `src`, files like `package.json`, `README.md`, etc.

If you see them, GitHub is all set.

---

## If something went wrong

**"gh: command not found"** — the GitHub CLI didn't install in Chapter 1. Go back to Chapter 1 and complete the install.

**"You were already logged in to this account"** — that's fine, you're authenticated. Move to Step 6.

**"Repo name already taken"** — pick a slightly different name like `[your-name]-content-site-2026` or `[your-business]-blog`.

**"Permission denied (publickey)"** — you picked SSH instead of HTTPS in Step 3. Re-run `gh auth login` and pick HTTPS.

**"Authentication failed"** — your one-time code expired (they only last 5 minutes). Run `gh auth login` again.

---

**Next: [Chapter 6 — Get the site code](06-get-the-site-code.md)**

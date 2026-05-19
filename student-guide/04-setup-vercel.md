# Chapter 4 — Set up Vercel (free hosting)

**Time: ~10 minutes**
**Cost: $0**

## What you're doing

Vercel is where your site will live on the internet. They handle all the boring stuff — hosting, security certificates, content delivery to people anywhere in the world. The free plan is plenty for a content site like yours.

## Why Vercel and not GoDaddy / Wix / Squarespace

Three reasons:
1. **Speed.** Vercel is built for the kind of site we're building. Faster page loads = better Google rankings.
2. **Free SSL.** Your site automatically gets that little padlock icon at no cost. Required for SEO.
3. **Auto-deploy.** When you (or your team) add a new article, Vercel publishes it automatically without you doing anything.

## Step 1: Open Vercel signup

Open this link in your browser: https://vercel.com/signup

You'll see a page with a few signup options. We're going to use email so we can use the email tied to your business.

## Step 2: Pick "Continue with Email"

Type your business email. The same one you use for your other accounts. Click Continue.

Vercel will send you a verification email. Open it, click the link inside.

## Step 3: Pick your plan — HOBBY (free)

Vercel will ask if you're using this for "personal projects" or "commercial projects."

**Pick "Personal projects (Hobby)" — free.**

Yes, your real estate business is technically commercial, but here's the deal:

- Vercel's "no commercial use" rule on Hobby is rarely enforced for content sites like yours (no app, no logged-in users, no payment processing)
- The free tier gives you 100 GB of bandwidth per month — you won't hit that for at least 6 months
- If you ever do hit the limit OR Vercel emails you about commercial use, just upgrade to Pro for $20/month at that point. No penalty for switching.

**Save $240/year. Pick Hobby.**

> 📸 **Screenshot moment:** Vercel's plan selection screen with Hobby vs Pro. Pick the left one (Hobby).

## Step 4: Enter your name

Vercel asks for your name. **Enter your personal name** — not your business name.

This becomes your "scope" on Vercel (like a username). Your projects will live at `vercel.com/your-name`. You can create a separate Team for your business later if your VAs need to share access. Don't worry about that now.

## Step 5: Set up two-factor authentication (2FA) — Passkeys

Vercel will ask you to add 2FA so your account is secure. Two options:

- **Passkeys** — uses your Mac's Touch ID or password. Faster, more secure, no apps to install.
- **Authentication App** — old-school, uses an app like Google Authenticator on your phone.

**Pick Passkeys.** Click "Add" next to it.

> 📸 **Screenshot moment:** "Secure your new Vercel account" screen with two options. Click Add next to Passkeys.

Your Mac will ask for your password (the one you log in with). Type it. Hit OK.

A second window pops up — your Mac's biometric prompt. Touch the Touch ID sensor.

Vercel will ask you to name your passkey. The default — "Chrome on macOS" or similar — is fine. Click **Save**.

## Step 6: Save your recovery codes — DON'T SKIP

Now Vercel shows you 6 recovery codes. They look like `28fc9386-e1ad7caa`.

> 📸 **Screenshot moment:** "Recovery Codes" screen with 6 codes.

**THIS IS CRITICAL.**

If you ever lose your Mac and can't access your Touch ID passkey, these codes are the **only way** back into your account. Without them, you lose access to your hosted site forever.

Two ways to save them:

**Option A (best):** Click **Download**. Save the file to a folder you'll remember. We recommend:
- 1Password or your password manager (a "Secure Note")
- A folder on your Mac called "Account Recovery Codes" inside Documents

**Option B:** Click **Copy** and paste them into a password manager.

Don't email them to yourself in plain text. Don't put them in your Notes app unless your Notes are encrypted.

After you've saved them, click **Done**.

> ⚠️ **Heads up: Vercel may log you out right after this.** That's normal — they want you to log back in with your new passkey. If it happens, go to https://vercel.com/login, enter your email, click Continue, and use Touch ID when it prompts.

## Step 7: You should now see your Vercel dashboard

If everything worked, you'll land on a page that looks like an empty dashboard. It might say "Let's build something new" or show a "Create a Project" button.

**You're in.** Don't click anything yet — your site code isn't ready yet. Come back to this dashboard in Chapter 7 when we deploy.

---

## If something went wrong

**"Email already in use"** — you've signed up before. Try logging in instead.

**Touch ID didn't pop up** — your Mac may not have Touch ID set up. Go to System Settings → Touch ID & Password and add a fingerprint, then try again.

**"Verification email never came"** — check spam. If still nothing, click "Resend." If still nothing after 5 minutes, try a different email.

**Lost your recovery codes screen** — go to https://vercel.com/account/security and regenerate. Don't panic.

---

**Next: [Chapter 5 — Set up GitHub](05-setup-github.md)**

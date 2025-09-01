# 🚀 GitHub Auto-Deploy Setup Guide

## 📋 Stap-voor-stap instructies

### 1. GitHub Repository aanmaken
```bash
# Initialiseer git (als nog niet gedaan)
git init

# Voeg remote repository toe
git remote add origin https://github.com/jouw-username/chatguuspt.git

# Push eerste commit
git add .
git commit -m "🎉 Initial commit: ChatGuusPT Enterprise Chatbot Platform"
git push -u origin main
```

### 2. Netlify Secrets configureren in GitHub

Ga naar je GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Voeg de volgende **Repository secrets** toe:

#### 🔑 **NETLIFY_AUTH_TOKEN**
1. Ga naar [Netlify Dashboard](https://app.netlify.com/user/applications)
2. Klik op **New access token**
3. Geef een naam: `GitHub Actions ChatGuusPT`
4. Kopieer de token en voeg toe als secret

#### 🆔 **NETLIFY_SITE_ID**
1. Ga naar je Netlify site dashboard
2. Ga naar **Site settings** → **General**
3. Kopieer de **Site ID** (bijvoorbeeld: `5b3a46e0-6761-0c7c-64db-b824`)
4. Voeg toe als secret

### 3. GitHub Actions activeren

✅ **Automatisch geactiveerd** zodra je de workflow file pusht!

### 4. Branch Protection (optioneel maar aanbevolen)

Ga naar **Settings** → **Branches** → **Add rule**:

- **Branch name pattern**: `main`
- ✅ **Require status checks to pass**
- ✅ **Require branches to be up to date**
- ✅ **Require pull request reviews**
- ✅ **Dismiss stale reviews**

---

## 🔄 Hoe het werkt

### **Auto-Deploy Triggers:**

| Event | Action | Deploy Target |
|-------|--------|---------------|
| Push to `main` | 🚀 **Production Deploy** | https://chatguuspt.netlify.app |
| Push to `develop` | 🔍 **Preview Deploy** | https://deploy-preview-xxx--chatguuspt.netlify.app |
| Pull Request | 🔍 **Preview Deploy** | https://deploy-preview-PR-xxx--chatguuspt.netlify.app |

### **Workflow Features:**

- 🧪 **Automated Testing** - Runs `npm test`
- 🔍 **Code Linting** - Runs `npm run lint`
- 🏗️ **Build Verification** - Ensures clean build
- 📊 **Build Size Report** - Shows file sizes in GitHub
- 🔒 **Security Scanning** - npm audit + CodeQL
- 📈 **Performance Audit** - Lighthouse CI (production only)
- 💬 **Deploy Comments** - Automatic PR comments with preview links

---

## 🎯 Deployment Status

Na setup kun je de deployment status zien:

- **GitHub**: Repository → **Actions** tab
- **Netlify**: [Site Dashboard](https://app.netlify.com/sites/chatguuspt/deploys)
- **Badge**: ![Netlify Status](https://api.netlify.com/api/v1/badges/3cc03a30-096a-450b-a099-f94a61e2b82e/deploy-status)

---

## 🐛 Troubleshooting

### ❌ "NETLIFY_AUTH_TOKEN not found"
- Controleer of de secret correct is toegevoegd in GitHub
- Token moet beginnen met `nfp_`

### ❌ "Site not found"  
- Controleer of NETLIFY_SITE_ID correct is
- Site ID vind je in Netlify → Site settings → General

### ❌ Build fails
- Check GitHub Actions logs
- Run `npm run build` lokaal om te testen
- Controleer of alle dependencies in package.json staan

---

## 🔧 Geavanceerde configuratie

### Custom domain instellen:
1. Netlify Dashboard → **Domain settings**
2. **Add custom domain**
3. Update DNS records bij je provider
4. SSL certificaat wordt automatisch aangemaakt

### Environment variables:
- Alle environment variables zijn al geconfigureerd via Netlify CLI
- Zie `netlify.toml` voor overzicht
- Productie secrets worden automatisch gebruikt

### Branch-based deploys:
- `main` → Production (chatguuspt.netlify.app)
- `develop` → Staging preview  
- `feature/*` → Feature preview
- Pull Requests → PR preview

---

## ✅ Verificatie

Test je setup:

1. **Maak kleine wijziging** in README.md
2. **Commit en push** naar main branch
3. **Check GitHub Actions** - moet groen worden
4. **Check Netlify** - nieuwe deploy moet zichtbaar zijn
5. **Test live site** - wijziging moet zichtbaar zijn

🎉 **Gefeliciteerd! Auto-deploy is nu actief!**

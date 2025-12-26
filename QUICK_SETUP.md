# ✅ FIXED! Quick Setup Guide

## 🔧 What Was Fixed:

1. **Extension Icon Not Opening** - Fixed Vite build to copy manifest.json correctly
2. **Shortcut Conflict** - Changed from `Ctrl+Shift+T` → **`Ctrl+Shift+A`** (no conflict!)

---

## 🚀 Quick Setup (3 Steps):

### Step 1: Reload Extension in Chrome

The extension was just rebuilt with fixes!

1. Go to **chrome://extensions/**
2. Find "DoneOne - Project Management"
3. Click the **🔄 Reload** button (circular arrow icon)

✅ Extension is now updated!

---

### Step 2: Run SQL Migration (One Time Only)

Copy and paste this in Supabase SQL Editor:

```sql
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS captured_url TEXT,
ADD COLUMN IF NOT EXISTS captured_text TEXT, ADD COLUMN IF NOT EXISTS captured_screenshot TEXT,
ADD COLUMN IF NOT EXISTS saved_tabs JSONB;
```

Click **Run**

✅ Database is ready!

---

### Step 3: Test It!

#### Test Extension Icon:
1. Click the **DoneOne extension icon** in Chrome toolbar
2. ✅ **DoneOne should open in a new tab**

#### Test Quick-Add Shortcut:
1. Go to **any website** (e.g., google.com)
2. Press **`Ctrl+Shift+A`** (A for "Add")
3. ✅ **Beautiful modal should appear!**

#### Test Right-Click Menu:
1. On any webpage, **right-click**
2. ✅ **See "📋 Add to DoneOne"**
3. Click it
4. ✅ **Modal appears!**

---

## 📝 New Keyboard Shortcut:

**Old:** ~~`Ctrl+Shift+T`~~ (conflicted with Chrome's "Reopen Tab")  
**New:** **`Ctrl+Shift+A`** (A = Add task) ✅

Easy to remember: **A** for **Add** task!

---

## 🎯 Quick Test Checklist:

- [ ] Extension icon opens DoneOne in new tab
- [ ] `Ctrl+Shift+A` shows quick-add modal
- [ ] Right-click shows "📋 Add to DoneOne"
- [ ] Can create task from any website
- [ ] Task appears in DoneOne with captured URL

---

## ❓ Still Having Issues?

**Extension icon does nothing:**
- Make sure you reloaded the extension (Step 1)
- Check Chrome DevTools console for errors (F12)

**Shortcut doesn't work:**
- Go to chrome://extensions/shortcuts
- Verify "Quick add task" is set to `Ctrl+Shift+A`
- If not, click the pencil icon and set it manually

**Tasks not appearing:**
- Make sure you ran the SQL migration (Step 2)
- Check if you have a project created in DoneOne

---

### 🎉 You're All Set!

Now you can add tasks from anywhere on the web with **`Ctrl+Shift+A`**!

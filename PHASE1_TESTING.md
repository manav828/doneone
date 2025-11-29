# Phase 1 Testing Guide - Browser-Native Features

## Prerequisites
1. Run the SQL migration in Supabase
2. Build the extension
3. Load the extension in Chrome

---

## Step 1: Run SQL Migration in Supabase

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Phase 1: Add captured webpage data columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS captured_url TEXT,
ADD COLUMN IF NOT EXISTS captured_text TEXT,
ADD COLUMN IF NOT EXISTS captured_screenshot TEXT,
ADD COLUMN IF NOT EXISTS saved_tabs JSONB;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('captured_url', 'captured_text', 'captured_screenshot', 'saved_tabs');
```

5. Click **Run** button
6. ✅ Verify you see 4 rows in the results showing the new columns

---

## Step 2: Build the Extension

In your terminal, run:
```bash
cd "d:\Manav\premium extension\flowboard_5"
npm run build
```

✅ Build should complete successfully with no errors

---

## Step 3: Load Extension in Chrome

1. Open Chrome browser
2. Go to chrome://extensions/
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Navigate to: `d:\Manav\premium extension\flowboard_5\dist`
6. Click **Select Folder**
7. ✅ FlowBoard extension should appear in your extensions list

---

## Test 1: Right-Click Context Menu

**Steps:**
1. Open FlowBoard extension and create a project (click extension icon, create a project with a name)
2. Navigate to **any website** (e.g., google.com, youtube.com, news article)
3. **Right-click** anywhere on the page
4. ✅ **VERIFY**: You see "📋 Add to FlowBoard" in the context menu

5. Select some text on the page (e.g., a headline or paragraph)
6. Right-click on the selected text
7. ✅ **VERIFY**: You still see "📋 Add to FlowBoard" in the context menu

8. Click "📋 Add to FlowBoard"
9. ✅ **VERIFY**: A beautiful modal appears with:
   - Title: "📋 Add Task to FlowBoard"
   - Task title input (pre-filled with selected text or page title)
   - Description textarea
   - Captured info showing the URL
   - Cancel and "Add Task" buttons

10. Modify the task title if needed
11. Click "Add Task"
12. ✅ **VERIFY**: You see a green success toast: "✅ Task added to FlowBoard!"
13. ✅ **VERIFY**: Toast disappears after 3 seconds

14. Click the FlowBoard extension icon to open the main app
15. ✅ **VERIFY**: The task appears in the first column of your project
16. Click on the task to open details
17. ✅ **VERIFY**: The task description or captured URL is visible

---

## Test 2: Keyboard Shortcut (Ctrl+Shift+T)

**Steps:**
1. Navigate to **any website** (e.g., github.com, twitter.com)
2. Press `Ctrl+Shift+T` on your keyboard
3. ✅ **VERIFY**: The quick-add modal appears instantly

4. Type a task title (e.g., "Review this article")
5. Press `Enter` key
6. ✅ **VERIFY**: Task is created and success toast appears

7. Open FlowBoard main app
8. ✅ **VERIFY**: The task appears with the website URL captured

---

## Test 3: Modal Functionality

**Steps:**
1. On any webpage, press `Ctrl+Shift+T`
2. Press `Escape` key
3. ✅ **VERIFY**: Modal closes

4. Press `Ctrl+Shift+T` again
5. Click outside the modal (on the darkened background)
6. ✅ **VERIFY**: Modal closes

7. Press `Ctrl+Shift+T` again
8. Click **Cancel** button
9. ✅ **VERIFY**: Modal closes

10. Press `Ctrl+Shift+T` again
11. Leave the title field empty
12. Click "Add Task"
13. ✅ **VERIFY**: Nothing happens (empty tasks not created)

---

## Test 4: Multiple Websites

**Test on different types of websites to ensure compatibility:**

| Website | Test Action | Expected Result |
|---------|-------------|-----------------|
| Google.com | Right-click context menu | ✅ Works |
| YouTube.com | Ctrl+Shift+T shortcut | ✅ Works |
| GitHub.com | Select code, right-click | ✅ Selected code in title |
| Twitter/X.com | Right-click on tweet | ✅ Tweet text captured |
| News article | Select paragraph, Ctrl+Shift+T | ✅ Paragraph in title |
| Gmail | Right-click | ✅ Works |
| Local HTML file | Any method | ✅ Works |

---

## Test 5: Task Data Verification in Database

**Steps:**
1. Create a task from a webpage using either method
2. Go to Supabase → **Table Editor** → **tasks** table
3. Find the task you just created
4. ✅ **VERIFY** these columns have data:
   - `captured_url`: Should contain the webpage URL
   - `captured_text`: Should contain selected text (if any)
   - `title`: Should be the task title you entered
   - `description`: Should be empty or have description you entered

---

## Test 6: Offline Behavior (Optional)

**Steps:**
1. Disconnect from internet
2. Try pressing `Ctrl+Shift+T`
3. ✅ **VERIFY**: Modal still appears (offline graceful handling)
4. Add a task
5. ✅ **VERIFY**: Success message appears (task queued locally)
6. Reconnect to internet
7. ✅ **VERIFY**: Task syncs to database automatically

---

## Test 7: Edge Cases

### Test 7a: Very Long URLs
1. Navigate to a page with a very long URL (e.g., Google search results)
2. Add task via `Ctrl+Shift+T`
3. ✅ **VERIFY**: URL is captured without breaking the UI

### Test 7b: Special Characters in Title
1. Select text with emojis, symbols, quotes
2. Add task
3. ✅ **VERIFY**: Special characters are preserved

### Test 7c: Multiple Quick Tasks
1. Press `Ctrl+Shift+T`
2. Add task 1
3. Immediately press `Ctrl+Shift+T` again
4. Add task 2
5. ✅ **VERIFY**: Both tasks are created successfully

---

## Troubleshooting

### Issue: Context menu doesn't appear
**Solution:**
- Reload the extension: chrome://extensions/ → click refresh icon
- Reload the webpage you're testing on
- Check browser console for errors (F12 → Console tab)

###  Issue: Modal doesn't appear
**Solution:**
- Check if content script is injected: F12 → Console → look for "FlowBoard content script loaded"
- Ensure you're not on chrome:// pages (extensions can't run there)
- Reload extension and webpage

### Issue: Tasks not appearing in FlowBoard
**Solution:**
- Open FlowBoard → check if you have an active project
- Check browser console for errors
- Verify SQL migration ran successfully
- Check Supabase → Table Editor → tasks table manually

### Issue: "chrome is not defined" error
**Solution:**
- This should not happen after build
- If it does, check that `declare var chrome: any;` is in store.ts
- Rebuild: `npm run build`

---

## Expected Behavior Summary

✅ **Context Menu**: Appears on all non-chrome:// pages  
✅ **Keyboard Shortcut**: Works globally on all pages  
✅ **Modal Design**: Beautiful, modern, glassmorphism style  
✅ **Task Creation**: Instant with success feedback  
✅ **URL Capture**: Automatic for every task created via browser  
✅ **Text Capture**: When text is selected before right-click  
✅ **Responsive**: Modal works on any screen sizePerfect! ✅ **Sync**: Tasks appear in main FlowBoard app within 2 seconds  

---

## Next Steps After Testing

Once all tests pass:
1. Mark Phase 1 complete in task.md
2. Proceed to Phase 2: Templates System
3. Report any bugs or issues found

---

**Done with Phase 1 testing? Great! You now have browser-native superpowers! 🚀**

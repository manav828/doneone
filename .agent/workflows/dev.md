---
description: Development workflow for DoneOne Chrome Extension with auto-run commands and safety rules
---

// turbo-all

# DoneOne Development Workflow

## 🚀 Quick Commands (Auto-Run Enabled)

1. Start development server:
   ```
   npm run dev
   ```

2. Check TypeScript errors:
   ```
   npx tsc --noEmit
   ```

3. Build for production:
   ```
   npm run build
   ```

4. Check git status:
   ```
   git status
   ```

5. View recent git log:
   ```
   git log -n 5 --oneline
   ```

---

# 🛡️ DEVELOPMENT RULES - DO NOT BREAK FUNCTIONALITY

## Rule 1: Database Schema Safety
- **NEVER** drop or alter existing columns without migration plan
- **ALWAYS** use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for new fields
- **ALWAYS** check RLS policies after schema changes
- **NEVER** hardcode IDs in migrations

## Rule 2: Type Safety
- **ALWAYS** update `types.ts` when adding new fields to database
- **ALWAYS** use snake_case for database columns, camelCase for TypeScript
- **ALWAYS** run `npx tsc --noEmit` before committing to catch type errors
- **NEVER** use `any` type unless absolutely necessary

## Rule 3: Store.ts Modifications
- **ALWAYS** add optimistic updates before async database calls
- **ALWAYS** handle errors gracefully with try-catch
- **ALWAYS** refresh relevant data after mutations (fetchProjects, fetchTasks, etc.)
- **NEVER** remove existing functions without checking all usages first
- **ALWAYS** check for circular dependencies when adding imports

## Rule 4: Component Changes
- **ALWAYS** test dark mode compatibility when changing styles
- **ALWAYS** preserve existing props when modifying component interfaces
- **NEVER** remove event handlers without verifying they are unused
- **ALWAYS** use the design system variables from index.css (--primary, --slate-*, etc.)

## Rule 5: Premium/Free Feature Gating
- **ALWAYS** check `canProjectUsePremium()` for premium features
- **ALWAYS** ensure free users have a working baseline experience
- **NEVER** break free tier functionality when adding premium features

## Rule 6: Role-Based Access
- **ALWAYS** respect the hierarchy: Owner > DeptHead > Manager > Lead > Resource
- **ALWAYS** check permissions before showing sensitive UI elements
- **NEVER** expose admin-only data to regular users

## Rule 7: Backward Compatibility
- **ALWAYS** keep deprecated fields for at least one release cycle
- **ALWAYS** handle missing/null data gracefully (use default values)
- **NEVER** rename database columns without a migration strategy

## Rule 8: Testing Before Commit
- Run TypeScript check: `npx tsc --noEmit`
- Verify dev server runs: `npm run dev`
- Test build succeeds: `npm run build`
- Manually test the changed feature in the extension

---

# 📁 Key Files Reference

| File | Purpose | Modify With Caution |
|------|---------|---------------------|
| `store.ts` | All state logic and API calls | ⚠️ HIGH |
| `types.ts` | TypeScript interfaces | ⚠️ HIGH |
| `supabaseClient.ts` | Database connection | 🔴 CRITICAL |
| `index.css` | Design system tokens | ⚠️ MEDIUM |
| `App.tsx` | Main routing | ⚠️ MEDIUM |

---

# 🔄 Before Making Changes Checklist

- [ ] Understand the current implementation (read the file first)
- [ ] Identify all files that import/use the code being changed
- [ ] Preserve existing functionality while adding new features
- [ ] Add proper error handling
- [ ] Test with both free and premium user scenarios
- [ ] Verify dark mode looks correct
- [ ] Run TypeScript check
- [ ] Test in the actual Chrome extension

---

# 📊 Current Architecture Summary

## Hierarchy Levels
1. **Organization (Team/Workspace)** - Company level
2. **Department** - Division within organization
3. **Project** - Work container
4. **Task** - Individual work item

## User Roles
1. **DeptHead** - Full access to department
2. **Manager** - Project owner, full project access
3. **Lead** - Team lead, manages resources
4. **Resource** - Individual contributor

## Data Flow
- Supabase (Database) → store.ts (State) → Components (UI)
- Real-time updates via Supabase subscriptions
- Offline queue for disconnected operations

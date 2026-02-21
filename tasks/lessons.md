# Lessons Learned

## Initial (Empty)
- No lessons yet. Will append on failures.- Failure: npm ci without package-lock.json. Root: Missing lockfile in local Replit sync. Prevention: Check 'ls package-lock.json' before ci; use 'npm install' first.
- Failure: Local Replit folder not a Git repo. Root: Sync without .git. Prevention: Init git + add Replit remote before edits; escalate for URL.
- Failure: git add . on node_modules without .gitignore. Root: No ignore file, staged deps. Prevention: Create .gitignore before add; use git add src/ package.json etc.

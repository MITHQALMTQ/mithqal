# MITHQAL — Branch Protection Rules
#
# This file documents the REQUIRED GitHub branch protection rules for the main branch.
# These MUST be configured in GitHub Settings → Branches → Branch protection rules.
#
# Rule name: MITHQAL Main Branch Protection
# Applies to: main
#
# Required settings:
#   ✅ Require a pull request before merging
#      - Required approvals: 1 (increase to 2 for production)
#      - Dismiss stale approvals when new commits are pushed
#      - Require review from Code Owners
#   ✅ Require status checks to pass before merging
#      - Require branches to be up to date before merging
#      - Required checks: ESLint Check, Constitutional Invariants, E2E Workflows, Security Checks
#   ✅ Require conversation resolution before merging
#   ✅ Do not allow bypassing the above settings
#   ✅ Restrict who can push to matching branches (only admins)
#   ✅ Allow force pushes: NEVER
#   ✅ Allow deletions: NEVER
#
# Additional rules:
#   - Require signed commits (Settings → Branches → Require signed commits)
#   - Require linear history (merge commits not allowed — use squash or rebase)
#   - Require deployment approvals (Vercel: require approvals for production deployments)
#
# Tag protection:
#   - Only admins can create/delete tags
#   - Tags must follow semantic versioning (vMAJOR.MINOR.PATCH)
#   - Release tags must be signed (git tag -s)

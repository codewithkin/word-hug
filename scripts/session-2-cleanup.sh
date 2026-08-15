echo "Removing the Better-T-Stack boilerplate navigation…"
echo "Removing session 1's capability probe…"
echo
<#
PowerShell version of session-2-cleanup.

Session 2 cleanup — deletions the agent could not perform itself.

`rm` returned "Operation not permitted" inside the repo from the agent
sandbox on some environments; this script attempts removals using
PowerShell's Remove-Item. Run from the repo root or execute this script
directly; it will resolve its location and operate relative to the repo root.
#>

$ErrorActionPreference = 'Stop'

# Resolve repo root (parent of this script's directory)
$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
$repoRoot = Resolve-Path (Join-Path $scriptDir '..')
Set-Location $repoRoot

Write-Output "Removing the Better-T-Stack boilerplate navigation…"
# The starter drawer + tabs routes. Replaced by the real route shape in
# apps/native/app/. Moved out of app/ first so expo-router stopped serving
# them immediately.
try {
	Remove-Item -LiteralPath (Join-Path $repoRoot 'apps\native\.trash-session-2') -Recurse -Force -ErrorAction Stop
} catch {
	Write-Output "  (not present or could not remove: apps/native/.trash-session-2)"
}

Write-Output "Removing session 1's capability probe…"
try {
	Remove-Item -LiteralPath (Join-Path $repoRoot 'designs\_probe2') -Recurse -Force -ErrorAction Stop
} catch {
	Write-Output "  (not present or could not remove: designs/_probe2)"
}

Write-Output ""
Write-Output "Done. Remaining boilerplate that is still WIRED and left on purpose:"
Write-Output "  apps/native/components/container.tsx    — generic, may still be useful"
Write-Output "  apps/native/components/theme-toggle.tsx — used by nothing yet; the"
Write-Output "                                            token probe has its own toggle"
Write-Output "  apps/native/app/+not-found.tsx          — keep"
Write-Output ""
Write-Output "Delete those yourself if you would rather start clean."

# ── Session 3 ────────────────────────────────────────────────────────────────
# Transfer scaffolding: everything in .trash-session-3/ is a tarball used to
# get files across and is safe to go.
try {
	Remove-Item -LiteralPath (Join-Path $scriptDir '..' | Resolve-Path | ForEach-Object { Join-Path $_ '.trash-session-3' }) -Recurse -Force -ErrorAction Stop
} catch {
	Write-Output "  (not present or could not remove: .trash-session-3)"
}

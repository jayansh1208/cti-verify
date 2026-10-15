$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$stage = Join-Path $root '.release-staging'
$zipPath = Join-Path $root 'cti-verify-final.zip'

Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage -Force | Out-Null

Copy-Item (Join-Path $root 'backend') (Join-Path $stage 'backend') -Recurse -Force
Copy-Item (Join-Path $root 'frontend') (Join-Path $stage 'frontend') -Recurse -Force
Copy-Item (Join-Path $root 'README.md') (Join-Path $stage 'README.md') -Force
Copy-Item (Join-Path $root 'VIVA.md') (Join-Path $stage 'VIVA.md') -Force
Copy-Item (Join-Path $root 'docker-compose.yml') (Join-Path $stage 'docker-compose.yml') -Force
Copy-Item (Join-Path $root 'docs') (Join-Path $stage 'docs') -Recurse -Force
Copy-Item (Join-Path $root '.github') (Join-Path $stage '.github') -Recurse -Force

Get-ChildItem $stage -Recurse -Force | Where-Object {
  $_.PSIsContainer -and (
    $_.Name -eq '.git' -or
    $_.Name -eq 'node_modules' -or
    $_.Name -eq 'dist' -or
    $_.Name -eq '.vite' -or
    $_.Name -eq '__pycache__' -or
    $_.Name -eq '.cache'
  )
} | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Get-ChildItem $stage -Recurse -Force -File | Where-Object {
  $_.Name -eq '.env' -or
  $_.Name -eq '.env.local' -or
  $_.Name -eq '.DS_Store' -or
  ($_.Name -like '.env.*' -and $_.Name -ne '.env.example')
} | Remove-Item -Force -ErrorAction SilentlyContinue

$manifest = @(
  'CTI Verify final ZIP evidence',
  '============================',
  '',
  'Included files:',
  '- backend/',
  '- frontend/',
  '- docs/',
  '- README.md',
  '- VIVA.md',
  '- docker-compose.yml',
  '- .github/',
  '',
  'Excluded from the final ZIP:',
  '- .git/',
  '- node_modules/',
  '- .env and .env.local files',
  '- build caches and dist folders',
  '',
  'Preserved intentionally:',
  '- package-lock.json files',
  '- .env.example files',
  '',
  ('Generated on: ' + (Get-Date).ToUniversalTime().ToString('o'))
)
Set-Content -Path (Join-Path $stage 'release-evidence.txt') -Value $manifest

$items = Get-ChildItem $stage -Force | ForEach-Object { $_.FullName }
Compress-Archive -Path $items -DestinationPath $zipPath -Force
Write-Host "Created $zipPath"
Write-Host "Evidence file included: $((Join-Path $stage 'release-evidence.txt'))"

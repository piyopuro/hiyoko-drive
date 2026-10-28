$ErrorActionPreference = "Stop"

# Place both make-share-zip.bat and make-share-zip.ps1 in the hiyoko-drive folder.
$projectRoot = $PSScriptRoot
$projectName = Split-Path $projectRoot -Leaf
$parentFolder = Split-Path $projectRoot -Parent
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipPath = Join-Path $parentFolder "$projectName-share-$timestamp.zip"
$tempRoot = Join-Path $env:TEMP ("hiyoko-drive-share-" + [guid]::NewGuid().ToString("N"))
$stageRoot = Join-Path $tempRoot $projectName

try {
    New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

    foreach ($folder in @("src", "public", "scripts")) {
        $source = Join-Path $projectRoot $folder
        if (Test-Path $source -PathType Container) {
            Copy-Item -Path $source -Destination $stageRoot -Recurse -Force
        }
    }

    foreach ($file in @(
        "package.json",
        "package-lock.json",
        "index.html",
        "vite.config.js",
        "eslint.config.js",
        "README.md"
    )) {
        $source = Join-Path $projectRoot $file
        if (Test-Path $source -PathType Leaf) {
            Copy-Item -Path $source -Destination $stageRoot -Force
        }
    }

    if (-not (Test-Path (Join-Path $stageRoot "src") -PathType Container)) {
        throw "The src folder was not found. Put both helper files directly inside the hiyoko-drive project folder."
    }

    Compress-Archive -Path (Join-Path $stageRoot "*") -DestinationPath $zipPath -CompressionLevel Optimal

    $sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Host ""
    Write-Host "Share ZIP created successfully!" -ForegroundColor Green
    Write-Host $zipPath
    Write-Host "Size: $sizeMB MB"
    Write-Host ""
    Write-Host "Included: src, public, scripts, and key project files"
    Write-Host "Excluded: node_modules, dist, .git, .vscode, and other nonessential files"
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "Failed to create the ZIP." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
finally {
    if (Test-Path $tempRoot) {
        Remove-Item $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Build the Ring compiler from the tracked C bootstrap anchor.
# Usage: .\compiler\scripts\build_native.ps1 [-Stats]

param([switch]$Stats)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$anchorPath = Join-Path $repoRoot "compiler\dist-c\main.c"
$compilerObject = Join-Path $repoRoot "ring_compiler.o"
$runtimeSource = Join-Path $repoRoot "ring_runtime.cpp"
$runtimeObject = Join-Path $repoRoot "ring_runtime.o"
$outputPath = Join-Path $repoRoot "ring.exe"

if (-not (Test-Path -LiteralPath $anchorPath -PathType Leaf)) {
    throw "Tracked compiler anchor not found: $anchorPath"
}

$clang = Get-Command clang -CommandType Application -ErrorAction SilentlyContinue |
    Select-Object -First 1
if ($null -eq $clang) {
    throw "clang was not found on PATH"
}

$clangxx = Get-Command clang++ -CommandType Application -ErrorAction SilentlyContinue |
    Select-Object -First 1
if ($null -eq $clangxx) {
    throw "clang++ was not found on PATH"
}

Write-Host "Step 1/3: Compiling tracked C bootstrap with clang ..."
& $clang.Source -c $anchorPath -o $compilerObject -std=c11 -O2
if ($LASTEXITCODE -ne 0) {
    throw "clang compiler-anchor compilation failed with exit code $LASTEXITCODE"
}

Write-Host "Step 2/3: Compiling native runtime with clang++ ..."
$runtimeFlags = @(
    "-c",
    $runtimeSource,
    "-o",
    $runtimeObject,
    "-O2",
    "-std=c++17",
    "-D_CRT_SECURE_NO_WARNINGS"
)
if ($Stats) { $runtimeFlags += "-DRING_ALLOC_STATS" }
& $clangxx.Source @runtimeFlags
if ($LASTEXITCODE -ne 0) {
    throw "clang++ runtime compilation failed with exit code $LASTEXITCODE"
}

Write-Host "Step 3/3: Linking compiler from tracked C anchor ..."
& $clang.Source $compilerObject $runtimeObject -o $outputPath -lmsvcrt "-Wl,/STACK:536870912" "-Wl,/MANIFEST:EMBED" "-Wl,/MANIFESTUAC:level='asInvoker'"
if ($LASTEXITCODE -ne 0) {
    throw "clang link failed with exit code $LASTEXITCODE"
}

Write-Host "Built: $outputPath"

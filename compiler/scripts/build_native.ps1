# Build Ring compiler to native binary
# Usage: .\compiler\scripts\build_native.ps1 [-Stats]

param([switch]$Stats)

$ErrorActionPreference = "Stop"

# Step 1: Compile to LLVM .o
Write-Host "Step 1/3: Compiling to LLVM .o ..."
node compiler/dist/main.js build compiler/main.ring --target=llvm --out-dir=compiler/dist-llvm

# Step 2: Compile runtime
Write-Host "Step 2/3: Compiling runtime ..."
$runtimeFlags = @("-c", "ring_runtime.cpp", "-o", "ring_runtime.o", "-O2", "-std=c++17")
if ($Stats) { $runtimeFlags += "-DRING_ALLOC_STATS" }
clang $runtimeFlags

# Step 3: Link
Write-Host "Step 3/3: Linking ..."
clang compiler/dist-llvm/main.o ring_runtime.o -o ring.exe -lmsvcrt "-Wl,/STACK:536870912" "-Wl,/MANIFEST:EMBED" "-Wl,/MANIFESTUAC:level='asInvoker'" "-LD:/software/Scoop/apps/llvm/current/lib" -lLLVM-C

Write-Host "Built: ring.exe"

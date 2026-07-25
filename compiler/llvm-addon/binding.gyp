{
  "variables": {
    "llvm_include_dir%": "<!(node resolve_llvm.js --include-dir)",
    "llvm_lib_dir%": "<!(node resolve_llvm.js --lib-dir)",
    "llvm_library%": "<!(node resolve_llvm.js --library)"
  },
  "targets": [
    {
      "target_name": "llvm_addon",
      "sources": ["llvm_addon.cpp"],
      "include_dirs": [
        "<(llvm_include_dir)"
      ],
      "library_dirs": [
        "<(llvm_lib_dir)"
      ],
      "libraries": [
        "<(llvm_library)"
      ],
      "conditions": [
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "AdditionalOptions": ["/std:c++17"],
              "ExceptionHandling": 1
            }
          },
          "defines": [
            "_CRT_SECURE_NO_WARNINGS",
            "NOMINMAX"
          ]
        }]
      ]
    }
  ]
}

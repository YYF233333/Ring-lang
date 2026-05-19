// Multi-module support: inject_module_exports + resolve_uses.
// Extracted from InferEngine — all functions take `ctx: InferCtx` as first parameter.

import type { UseDecl } from "../ast/index.js";
import { make_diagnostic } from "../diagnostics/index.js";
import { E } from "../diagnostics/codes.js";
import type { EnumDef, StructDef } from "./env.js";
import type { ModuleExports } from "../modules/exports.js";
import type { InferCtx } from "./infer-ctx.js";

/**
 * Inject type definitions from dependency modules into this module's type environment.
 * Registers struct/enum/effect/trait definitions and impl entries so they are available
 * for type checking. Called BEFORE check().
 */
export function inject_module_exports(ctx: InferCtx, exports: ModuleExports[]): void {
  for (const mod of exports) {
    // Register struct and enum type definitions
    for (const [name, def] of mod.types) {
      if ("fields" in def && !("variants" in def)) {
        // StructDef
        ctx.env.structs.set(name, def as StructDef);
      } else if ("variants" in def) {
        // EnumDef
        const edef = def as EnumDef;
        ctx.env.enums.set(name, edef);
        // Register variant -> enum mapping
        for (const variant of edef.variants) {
          ctx.env.variant_to_enum.set(variant.name, name);
        }
      }
    }

    // Register effect definitions
    for (const [name, effdef] of mod.effects) {
      ctx.env.effects.set(name, effdef);
    }

    // Register trait definitions
    for (const [name, tdef] of mod.traits) {
      ctx.env.traits.set(name, tdef);
    }

    // Register trait impls
    for (const impl of mod.trait_impls) {
      ctx.env.trait_impls.push(impl);
    }

    // Merge impl_methods
    for (const [type_name, methods] of mod.impl_methods) {
      const existing = ctx.env.impl_methods.get(type_name);
      if (existing) {
        for (const [method_name, scheme] of methods) {
          existing.set(method_name, scheme);
        }
      } else {
        ctx.env.impl_methods.set(type_name, new Map(methods));
      }
    }
  }
}

/**
 * Resolve use declarations: bind imported symbols into the current scope.
 * Called AFTER inject_module_exports() and BEFORE check().
 */
export function resolve_uses(ctx: InferCtx, uses: UseDecl[], available_modules: ModuleExports[]): void {
  // Build module_key -> ModuleExports lookup
  const module_map = new Map<string, ModuleExports>();
  for (const mod of available_modules) {
    module_map.set(mod.module_key, mod);
  }

  for (const use_decl of uses) {
    const module_key = use_decl.path.segments.join("::");
    const mod = module_map.get(module_key);

    if (!mod) {
      const diag = make_diagnostic(
        E.E0702,
        "error",
        `Module '${module_key}' not found`,
        use_decl.path.span,
        { kind: "other", detail: `available modules: ${[...module_map.keys()].join(", ")}` },
      );
      ctx.sink.report(diag);
      continue;
    }

    if (use_decl.imports.kind === "named") {
      for (const { name, alias, span } of use_decl.imports.names) {
        const local_name = alias ?? name;
        let found = false;

        // Check values (functions, variant constructors)
        const val_scheme = mod.values.get(name);
        if (val_scheme) {
          ctx.env.bind(local_name, val_scheme);
          found = true;
        }

        // Check types (struct/enum)
        const type_def = mod.types.get(name);
        if (type_def) {
          found = true;
          // For enums, also bind variant constructors
          if ("variants" in type_def) {
            const edef = type_def as EnumDef;
            for (const variant of edef.variants) {
              const vscheme = mod.values.get(variant.name);
              if (vscheme) {
                ctx.env.bind(variant.name, vscheme);
              }
            }
          }
        }

        // Check effects
        if (mod.effects.has(name)) {
          found = true;
        }

        // Check traits
        if (mod.traits.has(name)) {
          found = true;
        }

        if (!found) {
          const diag = make_diagnostic(
            E.E0703,
            "error",
            `Symbol '${name}' not found in module '${module_key}'`,
            span,
            { kind: "other", detail: `exported symbols: ${[...mod.values.keys(), ...mod.types.keys(), ...mod.effects.keys(), ...mod.traits.keys()].join(", ")}` },
          );
          ctx.sink.report(diag);
        }
      }
    } else {
      // kind === "module": import all exported values directly
      for (const [name, scheme] of mod.values) {
        ctx.env.bind(name, scheme);
      }
      // Also bind enum variant constructors for all exported enum types
      for (const [, type_def] of mod.types) {
        if ("variants" in type_def) {
          const edef = type_def as EnumDef;
          for (const variant of edef.variants) {
            const vscheme = mod.values.get(variant.name);
            if (vscheme) {
              ctx.env.bind(variant.name, vscheme);
            }
          }
        }
      }
    }
  }
}

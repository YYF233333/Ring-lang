// Ring-lang Module Exports — extracted public interface of a checked module

import { TypeScheme, StructDef, EnumDef, EffectDef, TraitDef, ImplEntry } from "../checker/env.js";
import { Program } from "../ast/index.js";
import { HProgram } from "../hir/index.js";
import { TypeEnv } from "../checker/env.js";

// ============================================================
// ModuleExports — the public interface of a compiled module
// ============================================================

export interface ModuleExports {
  module_key: string;              // "parser" or "checker::env"
  module_prefix: string;           // "parser" or "checker$env" (for JS codegen naming)
  values: Map<string, TypeScheme>;         // pub fn names -> their types
  types: Map<string, StructDef | EnumDef>; // pub struct/enum names -> definitions
  effects: Map<string, EffectDef>;         // pub effects
  traits: Map<string, TraitDef>;           // pub traits
  trait_impls: ImplEntry[];                // trait impls (for dict resolution)
  impl_methods: Map<string, Map<string, TypeScheme>>;  // type -> method name -> scheme
  struct_field_orders: Map<string, string[]>;           // struct name -> field names in order
  extern_values: Set<string>;              // extern fn names (not module-prefixed in JS)
}

// ============================================================
// extract_exports — collect pub symbols from a checked module
// ============================================================

export function extract_exports(
  module_key: string,
  module_prefix: string,
  program: Program,
  _hprogram: HProgram,
  env: TypeEnv,
): ModuleExports {
  const values = new Map<string, TypeScheme>();
  const types = new Map<string, StructDef | EnumDef>();
  const effects = new Map<string, EffectDef>();
  const traits = new Map<string, TraitDef>();
  const impl_methods = new Map<string, Map<string, TypeScheme>>();
  const struct_field_orders = new Map<string, string[]>();
  const extern_values = new Set<string>();

  // Track which type names are declared in this module (for filtering impls)
  const module_type_names = new Set<string>();

  for (const decl of program.decls) {
    switch (decl.kind) {
      case "fn_decl": {
        if (!decl.is_pub) break;
        const scheme = env.lookup(decl.name);
        if (scheme) {
          values.set(decl.name, scheme);
        }
        break;
      }

      case "struct_decl": {
        module_type_names.add(decl.name);
        if (!decl.is_pub) break;
        const sdef = env.structs.get(decl.name);
        if (sdef) {
          types.set(decl.name, sdef);
          struct_field_orders.set(decl.name, sdef.fields.map(f => f.name));
        }
        break;
      }

      case "enum_decl": {
        module_type_names.add(decl.name);
        if (!decl.is_pub) break;
        const edef = env.enums.get(decl.name);
        if (edef) {
          types.set(decl.name, edef);
          // Export variant constructors as values
          for (const variant of edef.variants) {
            const vscheme = env.lookup(variant.name);
            if (vscheme) {
              values.set(variant.name, vscheme);
            }
          }
        }
        break;
      }

      case "effect_decl": {
        if (!decl.is_pub) break;
        const effdef = env.effects.get(decl.name);
        if (effdef) {
          effects.set(decl.name, effdef);
        }
        break;
      }

      case "trait_decl": {
        if (!decl.is_pub) break;
        const tdef = env.traits.get(decl.name);
        if (tdef) {
          traits.set(decl.name, tdef);
        }
        break;
      }

      case "impl_decl": {
        // Export impl methods for pub types
        const target = decl.target_type;
        const methods = env.impl_methods.get(target);
        if (methods) {
          // Only export if the target type is a pub type from this module
          // or it's an impl for an external type (trait impl)
          const target_type_decl = program.decls.find(
            d => (d.kind === "struct_decl" || d.kind === "enum_decl" || d.kind === "extern_type_decl") && d.name === target,
          );
          const is_pub_type = target_type_decl && "is_pub" in target_type_decl && target_type_decl.is_pub;
          if (is_pub_type || decl.trait_name) {
            impl_methods.set(target, new Map(methods));
          }
        }
        break;
      }

      case "test_decl":
        break;

      case "extern_fn_decl": {
        extern_values.add(decl.name);
        if (!decl.is_pub) break;
        const scheme = env.lookup(decl.name);
        if (scheme) {
          values.set(decl.name, scheme);
        }
        break;
      }

      case "extern_type_decl": {
        module_type_names.add(decl.name);
        if (!decl.is_pub) break;
        const sdef = env.structs.get(decl.name);
        if (sdef) {
          types.set(decl.name, sdef);
        }
        break;
      }

      case "type_alias_decl":
        break;
    }
  }

  // Filter trait_impls for impls from this module
  const trait_impls: ImplEntry[] = [];
  for (const impl of env.trait_impls) {
    // An impl belongs to this module if its target type is declared here
    // or if the impl's trait is declared here (orphan rule approximation)
    if (module_type_names.has(impl.target_type_name) || traits.has(impl.trait_name)) {
      trait_impls.push(impl);
    }
  }

  // Handle pub use re-exports
  for (const use_decl of program.uses) {
    if (!use_decl.is_pub) continue;
    if (use_decl.imports.kind === "named") {
      for (const { name, alias } of use_decl.imports.names) {
        const local_name = alias ?? name;
        // Re-export values
        const scheme = env.lookup(local_name);
        if (scheme) {
          values.set(local_name, scheme);
        }
        // Re-export types (struct or enum)
        const sdef = env.structs.get(local_name);
        if (sdef) {
          types.set(local_name, sdef);
          struct_field_orders.set(local_name, sdef.fields.map(f => f.name));
        }
        const edef = env.enums.get(local_name);
        if (edef) {
          types.set(local_name, edef);
        }
        // Re-export effects
        const effdef = env.effects.get(local_name);
        if (effdef) {
          effects.set(local_name, effdef);
        }
        // Re-export traits
        const tdef = env.traits.get(local_name);
        if (tdef) {
          traits.set(local_name, tdef);
        }
      }
    }
  }

  return {
    module_key,
    module_prefix,
    values,
    types,
    effects,
    traits,
    trait_impls,
    impl_methods,
    struct_field_orders,
    extern_values,
  };
}

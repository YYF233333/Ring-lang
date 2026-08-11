use types::{Type}

// ============================================================
// Union-Find substitution for O(alpha(n)) type variable resolution
// Replaces plain Map<Int, Type> substitution
// ============================================================

pub struct UnionFind {
    pub parent: Map<Int, Int>,
    pub rank: Map<Int, Int>,
    pub types: Map<Int, Type>
}

pub fn new_union_find() -> UnionFind {
    UnionFind {
        parent: map_new(),
        rank: map_new(),
        types: map_new()
    }
}

// Unification is transactional: callers only receive this scratch copy after
// every ordinary-type and callable-ownership preflight succeeds. Map fields
// are reference values, so copying the UnionFind struct itself is insufficient.
pub fn clone_union_find(uf: UnionFind) -> UnionFind {
    UnionFind {
        parent: map_clone(uf.parent),
        rank: map_clone(uf.rank),
        types: map_clone(uf.types)
    }
}

// Preserve the historical observable API of unify(): successful calls commit
// even when a legacy caller ignores the returned value. The public unifier
// invokes this only after both ordinary and ownership preflights succeed.
pub fn commit_union_find(mut target: UnionFind, source: UnionFind) {
    target.parent = source.parent
    target.rank = source.rank
    target.types = source.types
}

// Find the root representative for a type variable id.
// Performs path compression for amortized O(alpha(n)) performance.
// Note: path compression mutates parent map (reference type) in-place.
pub fn uf_find(mut uf: UnionFind, id: Int) -> Int {
    match uf.parent.get(id) {
        none => id,
        some(p) => {
            if p == id { return id }
            let parent_id = p
            let root = uf_find(uf, parent_id)
            // Path compression: point directly to root
            let compressed_id = id
            let compressed_root = root
            uf.parent.insert(compressed_id, compressed_root)
            root
        }
    }
}

// Bind a type variable to a type. Binds at the root representative.
pub fn uf_bind(mut uf: UnionFind, id: Int, ty: Type) {
    let root = uf_find(uf, id)
    let root_key = root
    let stored_ty = ty
    uf.types.insert(root_key, stored_ty)
}

// Look up the type bound to a type variable. Returns the type at the root representative.
pub fn uf_lookup(mut uf: UnionFind, id: Int) -> Type? {
    let root = uf_find(uf, id)
    uf.types.get(root)
}

// Union two type variable equivalence classes by rank.
pub fn uf_union(mut uf: UnionFind, a: Int, b: Int) {
    let ra = uf_find(uf, a)
    let rb = uf_find(uf, b)
    if ra == rb { return }
    let rank_a = match uf.rank.get(ra) { some(r) => r, none => 0 }
    let rank_b = match uf.rank.get(rb) { some(r) => r, none => 0 }
    if rank_a < rank_b {
        let parent_ra = ra
        let parent_rb = rb
        uf.parent.insert(parent_ra, parent_rb)
        // Transfer type binding if only ra had one
        match uf.types.get(ra) {
            some(ty) => match uf.types.get(rb) {
                none => {
                    let type_rb = rb
                    let stored_ty = ty
                    uf.types.insert(type_rb, stored_ty)
                },
                some(existing) => {
                    panic("unreachable: uf_union both nodes have type bindings")
                }
            },
            none => {}
        }
    } else {
        let parent_rb = rb
        let parent_ra = ra
        uf.parent.insert(parent_rb, parent_ra)
        // Transfer type binding if only rb had one
        match uf.types.get(rb) {
            some(ty) => match uf.types.get(ra) {
                none => {
                    let type_ra = ra
                    let stored_ty = ty
                    uf.types.insert(type_ra, stored_ty)
                },
                some(existing) => {
                    panic("unreachable: uf_union both nodes have type bindings")
                }
            },
            none => {}
        }
        if rank_a == rank_b {
            let rank_ra = ra
            uf.rank.insert(rank_ra, rank_a + 1)
        }
    }
}

// Insert a binding directly (for row variable bindings, effect row bindings, etc.)
// This performs find first, then inserts at the root.
pub fn uf_insert(mut uf: UnionFind, id: Int, ty: Type) {
    let root = uf_find(uf, id)
    let root_key = root
    let stored_ty = ty
    uf.types.insert(root_key, stored_ty)
}

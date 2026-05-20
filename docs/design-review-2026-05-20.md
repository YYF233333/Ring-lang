# Ring-lang 设计评审 — 最小惊讶原则审查

Claude Opus × DeepSeek V4 Pro 交叉验证，2026-05-20。
仅从 docs/design.md + .ring 文件的用户视角审查，不涉及编译器实现。
标记 [共识] = 双方独立发现，[C] = Claude独有，[DS] = DeepSeek独有。

---

## 已修复/已实现

- examples/effects.ring `fail.fail(e)` → `fail.raise(e)`（规范一致性）
- **P0-1 sort 词典序** → ✅ 运行时注入数值比较器 + 新增 `sort_by(cmp)` HOF 方法
- **P1-2 Enum::Variant** → ✅ 支持 `Enum::Variant` 限定语法（表达式 + 模式匹配），checker 验证 qualifier
- **P1-4 concat/extend** → ✅ `concat` 返回新 List，新增 `extend` 原地追加

## 已决策（不改）

- **P0-2 stdlib 无 effect** → 选 C：暂不标注，等 effect system 成熟后统一。
- **P1-1 `or` 双重语义** → 选 C：保持现状，文档明确说明为设计哲学。
- **P1-3 Range 是否一等值** → 选 C：当前作为 for 语法糖，将来升级为一等值。
- **P1-5 Struct 字段可见性** → 暂选 C：struct = data class，后续可重新讨论。

---

## 待实现（本 session 不做）

### P2 — API 补齐

- **P2-1** [共识]: 缺 list_clone / set_clone（Map 有 map_clone）
- **P2-2** [共识]: Option\<T\> 无方法（is_some/map/and_then）
- **P2-3** [DS]: 缺 pop() 方法（只有 shift）
- **P2-4** [DS]: pad_start 存在但无 pad_end
- **P2-5** [C]: 重复的 exit 函数（io.ring + process.ring）
- **P2-6** [DS]: 缺集合 clear() 方法
- **P2-7** [C]: print\<T\> 对自定义类型输出 [object Object]
- **P2-8** [C]: assert(cond, msg) 强制要求 message

### P3 — 一致性 / 文档

- **P3-1** [共识]: 集合构造语法碎片化（[], map_from, set_from）
- **P3-2** [共识]: 集合 HOF 方法命名不一致（map vs map_values, contains vs contains_key）
- **P3-3** [C]: Map/Set HOF 回调需要类型标注，List 不需要
- **P3-4** [C]: `impl<T> List` vs `impl<T> List<T>` 语法不明确
- **P3-5** [DS]: Str.replace 全替换语义（JS 用户可能意外）
- **P3-6** [DS]: assert 放在 io.ring 模块归属不合理
- **P3-7** [DS]: 闭包内 return 语义未文档化
- **P3-8** [C]: Enum 单元变体语法不一致（`red()` vs `Point` 两种形式）

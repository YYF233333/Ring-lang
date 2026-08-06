# Repository Steward Inbox

> 用户低频 check-in 收件箱；仅允许 `[决策]`、最多五条 `[里程碑]` 和 `[全局阻塞]`。完整规则见 `docs/workflow.md` §3。

---

## D-002 `v0.1` 是否采用 `MIT OR Apache-2.0` 双许可并以 `Yufeng Ying` 为权利人 [决策]

- 影响：B-175 的公开 candidate packaging、外部试用/贡献许可、runtime/std 随包分发与机构采用；不影响私有构建、critical 修复和 B-176/B-180。
- 事实：当前公开仓库没有 LICENSE/NOTICE；GitHub 明确说明无许可证时默认版权法适用，外部没有一般性的复制、修改和分发许可（仅保留平台条款下的查看/fork）：[GitHub licensing docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)。
- 事实：MIT 提供简短、宽泛的使用/修改/分发许可并要求保留 notice；Apache-2.0 另含明确专利授权/终止、贡献与再分发条款：[MIT/OSI](https://opensource.org/license/mit)、[Apache-2.0/ASF](https://www.apache.org/licenses/LICENSE-2.0)。SPDX 的 `OR` 表示下游可任选其一，而非同时遵守：[SPDX expressions](https://spdx.github.io/spdx-spec/v3.0.1/annexes/spdx-license-expressions/)。
- 事实：当前 Git 历史出现 `Yufeng Ying` 与 `Yyf2333` 两个 author identity，仓库未发现第三方 LICENSE/NOTICE；落地前需确认二者权利均可由同一 holder 授权，并完成 compiler/runtime/std/generated-template provenance inventory。
- 推荐：采用 `MIT OR Apache-2.0`，copyright holder 写 `Yufeng Ying`；加入两份官方原文、SPDX expression、NOTICE/provenance 清单与“提交即按同一双许可提供”的贡献说明。产品政策是不对纯用户源码生成物主张额外许可；若产物实际复制或链接 Ring runtime/std/template，则 manifest 明示其许可证与 notice。理由是兼顾最小采用阻力、明确专利授权选项和未来贡献治理。
- 备选：① Apache-2.0 单许可：专利与贡献边界最清楚，但再分发义务更重；② MIT 单许可：最简单、识别最好，但没有同等明确的专利授权/终止条款。
- 延迟期间：Steward 可准备 provenance/license layout 与私有 candidate pipeline；不得创建对外 release、宣称 open-source 许可已经生效或分发无许可证 candidate。若两个 author identity 并非同一权利人，必须先取得授权，不得直接落地推荐方案。

- `[里程碑]` 2026-08-06：B-163 已收官。exact compiler snapshot `50a96a` 的 clean clone 全量 ×3 每轮 1551 pass，tracked anchor SHA-256 固定为 `60fc53609c5e4f48abc0638bd6e7bbb3e865aa014b8eaeb4332fa9b7cfc01e9e`；10 个历史本地资源回归 fixture ×3 的生成 C 均跨轮稳定且无 sanitizer 诊断；远端 CI run `31107890823` 的 check/test/bootstrap 全绿，`llvm-c-backend-final` tag 与旧 worktree/branch 已核对收官。

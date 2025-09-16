---
title: Layout Algebra
tags:
  - mlsys/cute
---
给出了[[Layout]]的基本描述后，我们定义一些对layout的操作：
## Coalesce
回忆[[Layout#Layout 也是整数到整数的函数]]，实际上在有层级的layout中我们只关注其 $[0, "size") -> ZZ$ 的对应关系，我们希望coalesce能够简化计算。形式上说，coalesce操作：
- 输入一个可能层次化的layout，输出一个“更简单”的 Layout（更少的 mode、更浅的层级）
- 保证不变性：
	- 大小不变 `size(result) == size(layout)`
	- 语义不变：在定义域（shape给出的size范围）上使得化简前后layout作为 $ZZ->ZZ$ 的函数相同。
> [!question] 为什么可行？
> 我们可以发现以下合并规则：
> - 如果某一维的 shape = 1，那么这维度上索引只能是 0，stride 再怎么写都不会被用到 → **可以忽略**。
> 
> - 如果一维的 stride 恰好等于前一维的 $"shape" times "stride"$，说明它们已经“对齐”到索引空间里 → **可以合并**。

Coalesce要做的事就是将原layout展平（flatten），然后依次考虑有没有上述情况出现。我们称对应维度上的shape $s$和stride $d$的组合为*mode*（e.g. $angle.l s, d angle.r$），则考虑flatten后不断对相邻mode应用上述规则，最后就得到了标准型。

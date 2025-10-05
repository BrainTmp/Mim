---
title: Layout Algebra
tags:
  - mlsys/cute
---
给出了[[Layout]]的基本描述后，我们定义一些对layout的操作，称为layout algebra。
> [!abstract] 我们为什么需要/需要什么样的Layout Algebra？
> 值得注意的是，我们并不是在凭空定义一类抽象对象和其上的操作，形式化并非我们的目的。
> 
> [[Layout#Basics|前面]]已经提到，引入layout是为了描述进行tensor core计算时数据在内存（或寄存器）中需要的复杂排布（可参考[NVIDIA PTX 文档中的 `mma`](https://docs.nvidia.com/cuda/parallel-thread-execution/index.html#warp-level-matrix-fragment-mma-884-f16)）。为了使thread协作完成计算，每个thread需要持有矩阵的一个tile，因此需要“根据原始layout，切分出per-thread tile layout”的能力。这是我们定义layout algebra的动机。
> 
> 上述tiling背后对应了[[Layout Algebra#Division - Tiling Layouts|Division]]和[[Layout Algebra#Product - Replicating Tiles|Product]]操作。为了实现它们，同时引入了[[Layout Algebra#Coalesce|Coalesce]]用来化简，以及[[Layout Algebra#Composition|Composition]]和[[Layout Algebra#Complement|Complement]]作为tiling操作的基本单位。

在开始之前，我们以一种更实用的
> [!tip] Layout的实用视角
> 
> 

## Coalesce
回忆[[Layout#Layout 也对应一个整数到整数的函数]]，实际上在有层级的layout中我们只关注其 $[0, "size") -> ZZ$ 的对应关系，我们希望coalesce能够简化计算。形式上说，coalesce操作：
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

## Complement



## Composition

## Division - Tiling Layouts
### Logical Division

## Product - Replicating Tiles
### 2D Logical Product (Counterintuitive)
2D Logical 

---
title: Layout
tags:
  - "#mlsys/cute"
---
# Basics
在常见的Tensor的机器表示中，我们经常使用行优先、列优先等方法描述 **nD坐标** $->$ **1D顺序索引的物理内存** 的映射。CuTe把这一想法抽象为更一般的Layout，以支持复杂的内部结构，从而描述Tensor Core指令要求的输入矩阵的排布（据说由于硬件上的systolic array导致）。
- 在这种抽象中，一个Tensor 即其 Layout（如何解释坐标）+ 对应数据的物理存储。
## Natural Coordinates
相较于常见的定长列表描述的坐标，CuTe考虑的是一种*层级化（Hierarchical）* 的坐标，以其`IntTuple`描述：`IntTuple`递归定义，可以是一个`int`和`IntTuple`作为元素的tuple：

```cpp
# IntTuple (2, (3, 5))
cute::make_coord(Int<2>{}, cute::make_coord(Int<3>{}, Int<5>{}))
```
在本系列中我们记natural coordinates的集合为 $cal(N)_((\_, (\_, \_)))$ 或者 $"Natural"_((\_, (\_, \_)))$，`IntTuple`的形状 $(\_, (\_, \_))$ 视上下文而定。
## Layout 即整数线性映射

^444228

我们首先给出CuTe中描述Layout的方式：
```
Layout = Tuple<Shape, Stride>
```
其中 Shape, Stride 是`IntTuple`。它们都可以有层级，形成所谓Hierarchical Layout。
### Stride
Stride抽象了坐标到线性存储地址的*整数线性映射*（严格说是某种$ZZ$-模同态）。其作用在**索引空间**（忽略层次的话可以理解为 $ZZ^h$）上，形如一个内积：
$$
f_"stride" : cal(N) -> ZZ \
(i, (j, k)) |-> s_1 i + s_2 j + s_3 k
$$

> [!note] 理解Stride：
> 在某一维度的索引增加1，物理存储的变化量即这一维度的stride（也即上述表示中的系数 $s_i$）
> - LayoutLeft{}: 广义列优先表示，对于shape $(s_1, ..., s_n)$ 生成 stride $(1, s_1, ..., product_(i=1)^(n-1) s_i)$.

^20b1bb

### Shape
Stride本身给出的其实是：给整个无限整数模中的每个格点标一个整数编号。实际我们的tensor有大小限制，这就是shape：
- Shape $s$ (e.g. $(2, (3, 5))$) 规定了一个离散高维长方体样的 **有限区域**：
$$
D = {(i_1, ..., i_n): 0 <= i_k < N_k}
$$
- 实际存储访问时，我们只在 $D$ 上取值。
这样的语义要求合法的tensor的shape和stride必须是*congruent*的，也即它们的`IntTuple`都是同一种（例如 $(ZZ, (ZZ, ZZ))$） 形状的类型。

> [!note] Layout 作为整数线性映射
> 概括来看，layout诱导了一个
> $$
> "Layout" : (D supset cal(N)) ->^f ZZ 
> $$
> 其中stride决定了同态 $f$，shape限制了定义域 $D$. 

## Layout Coordinates
### 1D Coordinate 标准型
对于任意的shape $s = (s_1, ..., s_n)$ （可任意增加括号来制造层级，这里略去），我们人为规定一个标准的stride，就按照列优先（按照NVIDIA文档的说法， 是co-lexicographical，从右向左）的stride $d_i = product_(k=1)^(i-1) s_k$，则我们得到了 $hat(f): cal(N) -> ZZ$ 的标准同态：
$$
cal(N) in.rev bold(x) = (x_1, ..., x_n) |-> sum_(i=1)^n d_i x_i.
$$
这一标准形式的好处是：考虑列优先的张量描述，上述$hat(f)$在shape描述的$hat(f)(bold(x)) in [0, "size")$范围内是一一对应。因此，我们可以用 $n in [0, "size") subset ZZ$ 来索引坐标，就像natural coordinates一样。这样的 $n in ZZ$就是CuTe的1D coordinate。

### nD Coordinate
推广上述想法，这时我们针对hierarchical layout，展开shape的最外面一层：
$$
"shape" = (S_1, ..., S_n)
$$
其中 $S_i$ 也是子shape。nD coordinate就是一个 $n$-tuple，每个位置由 shape $S_i$ 的 1D coordinate 索引。

### Layout 也是整数到整数的函数
取定co-lexicographical的标准表示，我们就有了 1D coordiante。此时对于任何layout都可以统一成 $hat("Layout"): [0, op("size")("Layout") ) -> ZZ$ 的函数：
$$
"1D Coordinate" n |->^(hat(f)^(-1)) "Natural Coordinate" |->^"Layout" "Memory Index" ZZ \
hat("Layout") = "Layout" compose hat(f)^(-1)
$$
这样的表示消去了具体的形状，使得我们可以忽略层级，比较任何具有相同 $"size"$ 的layout是否*本质相同*。这是[[Layout Algebra#Coalesce]] 操作化简的判断依据。

### Example
nD coordinate是 `cute::print(...)` 的展示形式：

> [!example] Layout Coordinates
> $$
> (i, (j,k)) &|->^"2D" (i, j + N_j dot k), \
> &|->^"1D" i + N_i dot j + N_i N_j dot k
> $$
> ```
> (_2,(_3,_5)):(_1,(_10,_2))
>       0    1    2    3    4    5    6    7    8    9   10   11   12   13   14 
>    +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
> 0  |  0 | 10 | 20 |  2 | 12 | 22 |  4 | 14 | 24 |  6 | 16 | 26 |  8 | 18 | 28 |
>    +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
 > 1  |  1 | 11 | 21 |  3 | 13 | 23 |  5 | 15 | 25 |  7 | 17 | 27 |  9 | 19 | 29 |
>    +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
>```
>首先解释Layout本身
> - 行方向 shape 表示有 $2$ 行，沿行方向变动时只增加 stride $1$
> - 列方向注意层次：*CuTe的表格描述的行列坐标就是上面提到的 2D 标准型*
> 	- 例如在shape为_3分量的维度上，可以看到$+1$使得列号$+1$（列优先描述），物理内存变动了stride $s_2 = 10 - 0 = 10$.
> 
> 2D Coordinates：
> - 列上的形状层次结构为 $(3,5)$，按照列优先方式计算列索引：$(j, k) |-> j + 3k$。这解释了$0-14$ 共15列分别对应哪l列




---
tags:
  - PL/types
title: Recursive Types
---
从函数式语言出发，我们熟悉的 ADT (Algebraic Data Type) 是用构造子组成的数据类型定义：
```haskell
data List a = Nil | Cons a (List a)
```
- 它由一组构造子组成 (`Nil`, `Cons`)，是一个 sum-of-products 结构（借助模式匹配（`case` / `match`），我们可以给出该类型的 eliminator）；
- 每个构造子指定了一个“形状”，并可引用自身作为子结构。

这样的定义是自指的。形式上，我们以如下的同构方程来精确描述 `List` 的自引用：
$$
mono("List") a tilde.equiv bold(1) + a times mono("List") a
$$
Recursive Types 给出了一种在基本的类型系统中构造能实现上述自指的类型。
## 类型方程与不动点
进一步抽象，如果我们定义如下的 type operator
$$
F(X) = 1 + a times X
$$
则上面提到的 $mono("List") a$ 即上述 $F$ 的一个不动点，记为
$$
mono("List") a ::= mu X. (1 + a times X)
$$
## Iso-recursive Types
对于
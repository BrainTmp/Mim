---
tags:
  - PL
  - PL/effects
---
# Continuation 与经典逻辑：时光倒流

考虑我们要证明排中律 $forall P. P or not P$，我们要构造一个项 $e : P or not P$。
1.  要么返回 $P$（左），要么返回 $not P$（右）。对于参数化的 $P$ ，我们完全不知道 $P, not P$ 哪个是真的。
2. 由于没有办法直接构造一个 $P$，只能**尝试**：先猜“右边是真的”（$not P$）。
    - 使用 `letcc` 保存当前执行上下文 $k : mono("cont")(P)$（以便后面回到这里纠正错误）；
    - 返回 `Right k`。即：声称我们无法提供 $P$，但如果得到一个 $P$，我们会处理它。
3. **外部世界的反应**：
    - 外部世界想要利用我们证明的排中律，拿走了返回的 `Right` 值。
    - 如果外部世界没有证明 $P$，那么谁也不会发现我们直接给出 $not P$ 会导致矛盾！
    - 但是如果外部世界*证明了* $P$ （找到了一个 $P$ 的证据）呢？它会尝试用我们给出的 $not P$ 构造矛盾。此时我们必须解决这个矛盾。实际上，这是通过把 $P$ `throw` 到我们在 `Right` 中提供的那个 continuation $k$实现的。
4. **时光倒流**：
    - 一旦外部世界 `throw`，我们立刻跳回到第 2 步保存的执行上下文。
5. **第二次尝试（改变历史）**：
    - 既然我们手里现在有了外部世界刚刚喂给我们的那个 $P$（这就是“从未来带回来的证据”）。我们这次不再返回 `Right` 了，直接返回 `Left P`。

```scheme
#lang racket

(define (excluded-middle)
  (call/cc
   (lambda (k)
     ;; 第一次执行：
     ;; 我们手里没有 P。所以我们要假装返回 "Right (Not P)"。
     ;; "Not P" 表现为一个接受 P 的函数。
     (k (list 'right 
              (lambda (witness-of-p)
                ;; 陷阱触发！如果有人调用了这个函数，说明他们找到了 P。
                ;; 我们拿着这个 P，利用时光机 k 跳回开头。
                ;; 但这一次，我们把结果改成 "Left P"。
                (k (list 'left witness-of-p))))))))

(define (usage)
  (display "1. 开始证明\n")
  
  (let ([proof (excluded-middle)])
    (match proof
      [(list 'left p)
       (printf "3. [时间回溯后] 竟然得到了 P！值为: ~a\n" p)]
      [(list 'right refute-func)
       (display "2. [初次尝试] 只能得到 (Not P)。\n")
       (display "   也就是一个反驳函数。现在我要‘攻击’这个函数，给它一个值 42\n")
       (refute-func 42)])))

(usage)
```

既然假设 $not P$ 导致了矛盾（我们不得不跳回过去），那么矛盾需要在另一个地方用某个外部的 $P$ 的证明和 $not P$ 的假设导出。我们的假设可以把这个 $P$ 的证明偷走，既通过控制流转移解决了矛盾处要返回 $bot$ 的问题，又成功修改了世界线，让我们能够输出正确的判断 $P$ 成立以及证明。在这次新的执行中，外部不再有 $not P$，因此根本不会再进入为 $not P$ 提供 $P$ 的分支。
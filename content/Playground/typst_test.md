---
title: Test Typst
---
# Some random math:
Choose a parameter $u$ and denote $Y = X - EE[X]$. Follow the idea used in Chebyshev's inequality, we have:

$$
P(X-EE[X] >= lambda) &= P(Y+u >= lambda + u) \
&<= P((Y+u)^2 >= (lambda + u)^2) \
&<= EE[(Y+u)^2]/(lambda + u)^2 \
&= (sigma^2 + u^2) / (lambda + u)^2 \
&=^(u = sigma^2/lambda) sigma^2 / (sigma^2 + lambda^2).
$$

The choice of $u$ above minimizes the right-hand side of the inequality.
Equality holds when:
- $Pr[Y<= -lambda - 2u] = 0$,
- Markov's inequality: equality when $EE[X] = a P(X>=a) <=> EE[X - X dot bold(1)_{X>=a}] = 0$, and since $X, bold(1)_{X>=a} >= 0$, this means $X = X dot bold(1)_{X>=a}$ almost surely.
- Further, $Pr(X>a) !=0$ violates $EE[X] = a P(X>=a)$, so $Pr(X>a) = 0$.
- This means that $X$ follows a two-point distribution almost surely.
- In this case, $(Y+u)^2$ follows a two-point distribution as well, at $Y = -u$ and $Y = lambda or -lambda - 2u$. $-lambda - 2u$ is not possible since $Pr(Y<= -lambda - 2u) = 0$.
In simple terms, the equality holds when $X$ is a two-point distribution, where $Pr[X = EE[X]-sigma^2/lambda] = lambda^2/(lambda^2+sigma^2) space (1-"RHS")$ and $Pr[X = EE[X]+lambda] = sigma^2/(lambda^2+sigma^2) space ("RHS")$.
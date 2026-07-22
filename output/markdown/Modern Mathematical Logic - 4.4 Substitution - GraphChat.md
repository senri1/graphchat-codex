an arbitrary atomic formula with (at most) one free variable, say \(x\). Since there are no quantifiers in our formula, \(x\) is the only possible occurring variable. Now a term is built up from the constant symbols and variables using the function symbols. If we think about what we can obtain from \(0\), \(1\), and \(x\) by repeatedly applying \(+\), \(-\), and \(\cdot\), we see that every term corresponds to an element in \(\mathbb Z[x]\), that is, to a polynomial over \(x\) with integer coefficients. Now the language does not have any relation symbols, so the only atomic formulas are the formulas \(t_1=t_2\) for some terms \(t_1\) and \(t_2\). Thus, the subsets of \(\mathbb C\) that are definable by atomic formulas are exactly the sets that can be written as \(\{z\in\mathbb C:f(z)=g(z)\}\) for some polynomials \(f,g\in\mathbb Z[x]\). By bringing one of the polynomials over to the other side, a subset of \(\mathbb C\) is definable by an atomic formula exactly when it is the set of roots of a polynomial with integer coefficients.

We know that every nonzero polynomial has finitely many roots, so every subset of \(\mathbb C\) that is definable by an atomic formula must be either finite or all of \(\mathbb C\) (the latter corresponds to the zero polynomial, or arises from the formula \(\top\)). Note that we are *not* claiming that all finite sets are definable in this way, and indeed this statement is not true. But we have established some important restrictions. From here, one can argue that every subset of \(\mathbb C\) that is definable by a quantifier-free formula must be either finite or cofinite (i.e. its complement in \(\mathbb C\) is finite), because the set \(\{X\in\mathbb C:X\text{ is finite or cofinite}\}\subseteq\mathcal P(\mathbb C)\) is closed under finite unions, finite intersections, and complements.

That was a nontrivial amount of work to determine the sets that are definable by quantifier-free formulas in the given structure, but the process illustrates a general technique that can be applied to many natural structures. However, everything becomes much more challenging when we start to consider quantifiers. Suppose that we have a formula \(\varphi(x)\) that starts with \(\exists y\) and then is followed by a quantifier-free formula \(\psi(x,y)\). Now \(\varphi(x)\) defines a subset of \(M\), but \(\psi(x,y)\) defines a subset of \(M^2\). Thus, to understand a definable subset of \(M\) we need to move up a dimension to understand a definable subset of \(M^2\), and then determine the *projection* of that subset onto \(M\) in order to determine what \(\varphi(x)\) defines. If we have multiple quantifiers, then there are multiple projections from higher-dimensional spaces, perhaps mixed in with unions, intersections, and complements (from the propositional symbols). We can simplify some of these intertwined operations using the results from Section 4.5, but the projections are still an issue that must be grappled with.

Eventually we will discuss *quantifier elimination* (see Section 7.4), which can resolve these issues in some structures. In particular, we will use that technique to show the surprising and mathematically useful result that every definable subset of \(\mathbb C\) in the structure \((\mathbb C,0,1,+,-,\cdot)\) is either finite or cofinite. Contrast this situation with the fact that many exotic subsets of \(\mathbb N\) are definable in \((\mathbb N,0,1,+,\cdot)\). The fact that \((\mathbb N,0,1,+,\cdot)\) has so many interesting definable subsets plays an essential role in the Incompleteness Theorems (see Chapter 12).

## 4.4 Substitution

In the previous section, we introduced definability and talked about its fundamental role in many things to come. With all of that tantalizing foreshadowing in place, we will spend the the rest of this chapter performing some technical, but important, work on the interplay between syntactic manipulations and truth in a structure. Many of the results in this section (and the next) are reasonably intuitive, but there is one subtle point that we will encounter soon. We will set up a few delicate definitions and give several careful inductive proofs to show how one can prove everything carefully, but feel free to skip over a few of the details on a first pass. After completing the proof of the Substitution Theorem, we also leave some natural and very important generalizations as exercises. These take some effort to work out in detail, and again it is completely reasonable (and even encouraged) to move on after becoming convinced that the core results are true.

With those caveats in place, let's talk about substitution. Given an \(\mathcal L\)-structure together with a variable assignment \(s:\mathrm{Var}\to M\), we know that every term names an element of \(M\). Specifically, the term \(u\) names the element \(\overline{s}(u)\in M\). In normal mathematical practice, if we know that a given statement is true for all elements of a set, then we can invoke the universal quantifier on any specific element. To formalize this idea in our syntax, we need to think about what it means to substitute a term \(u\) for a variable \(y\) in a formula. One might naturally think that if \(\forall y\varphi\) is true in \((\mathcal M,s)\), then upon taking a term \(u\) and substituting it in for \(y\) in the formula \(\varphi\), the resulting formula would also be true in \((\mathcal M,s)\). In order to prove such a result, we need a way to relate the truth of \(\varphi\) in a structure to the truth of a different formula (after substitution) in the same structure. The hope would be the following, where we use the notation \(\varphi_y^u\) to mean that we substitute \(u\) for all *free* occurrences of \(y\).

**Hope 4.4.1** &nbsp; *Let \(\mathcal M\) be an \(\mathcal L\)-structure, let \(s:\mathrm{Var}\to M\), let \(u\in\mathrm{Term}_{\mathcal L}\), and let \(y\in\mathrm{Var}\). For all \(\varphi\in\mathrm{Form}_{\mathcal L}\), we have \((\mathcal M,s)\models\varphi_y^u\) if and only if \((\mathcal M,s[y\rightsquigarrow\overline{s}(u)])\models\varphi\).*

However, even with the correct definition of substitution, the above statement is not true. To see the fundamental issue, consider the language \(\mathcal L=\varnothing\), and let \(\varphi(y)\in\mathrm{Form}_{\mathcal L}\) be the formula \(\exists x\neg(x=y)\). For any \(\mathcal L\)-structure \(\mathcal M\) and any \(s:\mathrm{Var}\to M\), we have \((\mathcal M,s)\models\varphi\) if and only if \(|M|\geq 2\). The formula \(\varphi_y^x\) is equal to \(\exists x\neg(x=x)\), so for any \(\mathcal L\)-structure \(\mathcal M\) and any \(s:\mathrm{Var}\to M\), we have \((\mathcal M,s)\not\models\varphi_y^x\). Therefore, the above hope fails whenever \(\mathcal M\) is an \(\mathcal L\)-structure with \(|M|\geq 2\). The problem is that the term we substituted (in this case \(x\)) had a variable that became *captured* by a quantifier, resulting in a fundamental change in the meaning of the formula.

Before diving into how to avoid the underlying issue that manifests itself in the preceding example, we first formally define substitution for terms (rather than formulas) and show that it behaves as expected.

**Definition 4.4.2** &nbsp; Let \(\mathcal L\) be a language, let \(u\in\mathrm{Term}_{\mathcal L}\), and let \(y\in\mathrm{Var}\). Define a function \(\mathrm{Subst}_y^u:\mathrm{Term}_{\mathcal L}\to\mathrm{Term}_{\mathcal L}\), where we use \(t_y^u\) to denote \(\mathrm{Subst}_y^u(t)\), as follows:

1. \(c_y^u=c\) for all \(c\in\mathrm{ConSym}\).
2. For all \(x\in\mathrm{Var}\),

   \[
   x_y^u=
   \begin{cases}
   u & \text{if }x=y,\\
   x & \text{otherwise.}
   \end{cases}
   \]

3. \((ft_1\cdots t_k)_y^u=f(t_1)_y^u\cdots(t_k)_y^u\) for all \(f\in\mathrm{FuncSym}_k\) and all \(t_1,\ldots,t_k\in\mathrm{Term}_{\mathcal L}\).

When substituting a term for a variable, here is the key lemma relating how to interpret a term before substitution to the interpretation after substitution.

**Lemma 4.4.3** &nbsp; *Let \(\mathcal M\) be an \(\mathcal L\)-structure, let \(s:\mathrm{Var}\to M\), let \(u\in\mathrm{Term}_{\mathcal L}\), and let \(y\in\mathrm{Var}\). For all \(t\in\mathrm{Term}_{\mathcal L}\), we have \(\overline{s}(t_y^u)=\overline{s[y\rightsquigarrow\overline{s}(u)]}(t)\).*

Although the statement of the lemma might look inscrutable due to the heavy notation, it expresses something quite natural. In order to determine the value of the term \(t_y^u\) according to the variable assignment \(s\), we need only change \(s\) so that \(y\) is now sent to \(\overline{s}(u)\), which is the value of \(u\) assigned by \(s\), and then evaluate \(t\) using this new variable assignment.

*Proof.* &nbsp; The proof is by induction on \(\mathrm{Term}_{\mathcal L}\). For any \(c\in\mathrm{ConSym}\), we have

\[
\begin{aligned}
\overline{s}(c_y^u)
&=\overline{s}(c)\\
&=c^{\mathcal M}\\
&=\overline{s[y\rightsquigarrow\overline{s}(u)]}(c)\\
&=\overline{s[y\rightsquigarrow\overline{s}(u)]}(c).
\end{aligned}
\]

We now handle the case where \(t\in\mathrm{Var}\). If \(t=y\in\mathrm{Var}\), then

\[
\begin{aligned}
\overline{s}(y_y^u)
&=\overline{s}(u)\\
&=s[y\rightsquigarrow\overline{s}(u)](y)\\
&=\overline{s[y\rightsquigarrow\overline{s}(u)]}(y).
\end{aligned}
\]

On the other hand, if \(t=x\in\mathrm{Var}\) where \(x\neq y\), then we have

\[
\begin{aligned}
\overline{s}(x_y^u)
&=\overline{s}(x)\\
&=s(x)\\
&=x\\
&=s[y\rightsquigarrow\overline{s}(u)](x)\\
&=\overline{s[y\rightsquigarrow\overline{s}(u)]}(x).
\end{aligned}
\]

Finally, let \(f\in\mathrm{FuncSym}_k\) be arbitrary, and assume that the statement is true for \(t_1,\ldots,t_k\in\mathrm{Term}_{\mathcal L}\). We then have

\[
\begin{aligned}
\overline{s}((ft_1\cdots t_k)_y^u)
&=\overline{s}(f(t_1)_y^u\cdots(t_k)_y^u)\\
&=f^{\mathcal M}(\overline{s}((t_1)_y^u),\ldots,\overline{s}((t_k)_y^u))\\
&=f^{\mathcal M}(\overline{s[y\rightsquigarrow\overline{s}(u)]}(t_1),\ldots,\overline{s[y\rightsquigarrow\overline{s}(u)]}(t_k)) && \text{(by induction)}\\
&=\overline{s[y\rightsquigarrow\overline{s}(u)]}(ft_1\cdots t_k).
\end{aligned}
\]

Therefore, the statement is true for \(ft_1\cdots t_k\). \(\square\)

Now that we have defined \(t_y^u\) for terms \(t\), we move on to define \(\varphi_y^u\) for formulas \(\varphi\). In the case of terms, we naturally replaced every occurrence of \(y\) with the term \(u\). However, we do have to be a bit more discerning when faced with formulas. For example, we certainly do not want to change \(\forall y\varphi\) into \(\forall u\varphi\), which would not even be a formula if \(u\notin\mathrm{Var}\), nor do we want to mess with an instance of \(y\) inside the scope of such a quantifier. We thus make the following recursive definition. Intuitively, we want to replace each *free* occurrence of \(y\) with the variable \(u\). When we turn that intuition into a precise recursive definition, we simply stop the recursion when we arrive at a formula of the form \(Qy\varphi\).

**Definition 4.4.4** &nbsp; Let \(\mathcal L\) be a language, let \(u\in\mathrm{Term}_{\mathcal L}\), and let \(y\in\mathrm{Var}\). Define \(\mathrm{FreeSubst}_y^u:\mathrm{Form}_{\mathcal L}\to\mathrm{Form}_{\mathcal L}\), again denoted \(\varphi_y^u\), as follows:

1. \(\top_y^u=\top\) and \(\bot_y^u=\bot\).
2. \((Rt_1\cdots t_k)_y^u=R(t_1)_y^u\cdots(t_k)_y^u\) for all \(R\in\mathrm{RelSym}_k\) and all \(t_1,\ldots,t_k\in\mathrm{Term}_{\mathcal L}\).
3. We define \((t_1=t_2)_y^u\) to be \((t_1)_y^u=(t_2)_y^u\) for all \(t_1,t_2\in\mathrm{Term}_{\mathcal L}\).
4. \((\neg\varphi)_y^u=\neg(\varphi_y^u)\) for all \(\varphi\in\mathrm{Form}_{\mathcal L}\).
5. \((\varphi\diamond\psi)_y^u=\varphi_y^u\diamond\psi_y^u\) for all \(\varphi,\psi\in\mathrm{Form}_{\mathcal L}\) and all \(\diamond\in\{\wedge,\vee,\to\}\).
6. For all \(\varphi\in\mathrm{Form}_{\mathcal L}\), \(x\in\mathrm{Var}\), and \(Q\in\{\exists,\forall\}\),

   \[
   (Qx\varphi)_y^u=
   \begin{cases}
   Qx\varphi & \text{if }x=y,\\
   Qx(\varphi_y^u) & \text{otherwise.}
   \end{cases}
   \]

Our first very intuitive result states that if \(y\) does not occur as a free variable in the objects under consideration, then substituting for \(y\) does nothing. It can be shown using a straightforward induction.

**Proposition 4.4.5** &nbsp; *Let \(u\in\mathrm{Term}_{\mathcal L}\) and \(y\in\mathrm{Var}\).*

1. *For all \(t\in\mathrm{Term}_{\mathcal L}\) with \(y\notin\mathrm{OccurVar}(t)\), we have \(t_y^u=t\).*
2. *For all \(\varphi\in\mathrm{Form}_{\mathcal L}\) with \(y\notin\mathrm{FreeVar}(\varphi)\), we have \(\varphi_y^u=\varphi\).*

*Proof.* &nbsp; Exercise. \(\square\)

Now that we have formally defined (free) substitution, we can turn our attention to the issue raised by the example at the beginning of this section. When we substitute a term \(u\) for the free occurrences of a variable \(y\), it is possible that a variable appearing in \(u\) will become captured by a quantifier. We will now define a function that indicates when such a capture occurs.

**Definition 4.4.6** &nbsp; Let \(\mathcal L\) be a language, let \(u\in\mathrm{Term}_{\mathcal L}\), and let \(y\in\mathrm{Var}\). We define \(\mathrm{VarCaptured}_y^u:\mathrm{Form}_{\mathcal L}\to\{0,1\}\) as follows:

1. \(\mathrm{VarCaptured}_y^u(\varphi)=0\) for all \(\varphi\in\mathrm{AtomicForm}_{\mathcal L}\cup\{\top,\bot\}\).
2. \(\mathrm{VarCaptured}_y^u(\neg\varphi)=\mathrm{VarCaptured}_y^u(\varphi)\) for all \(\varphi\in\mathrm{Form}_{\mathcal L}\).
3. For all \(\varphi,\psi\in\mathrm{Form}_{\mathcal L}\) and all \(\diamond\in\{\wedge,\vee,\to\}\),

   \[
   \mathrm{VarCaptured}_y^u(\varphi\diamond\psi)=
   \begin{cases}
   1 & \text{if }\mathrm{VarCaptured}_y^u(\varphi)=1\text{ or }\mathrm{VarCaptured}_y^u(\psi)=1,\\
   0 & \text{otherwise.}
   \end{cases}
   \]

4. For all \(\varphi\in\mathrm{Form}_{\mathcal L}\), \(x\in\mathrm{Var}\), and \(Q\in\{\forall,\exists\}\),

   \[
   \mathrm{VarCaptured}_y^u(Qx\varphi)=
   \begin{cases}
   1 & \begin{array}{l}
       \text{if either }(y\in\mathrm{FreeVar}(Qx\varphi)\text{ and }x\in\mathrm{OccurVar}(u))\\
       \text{or }(y\neq x\text{ and }\mathrm{VarCaptured}_y^u(\varphi)=1),
       \end{array}\\
   0 & \text{otherwise.}
   \end{cases}
   \]

Before proving the fundamental Substitution Theorem, we first establish a natural result to demonstrate how we can work with the various recursive definitions. Intuitively, if we are forming \(\varphi_y^u\), and either \(u\) contains no bound variables of \(\varphi\), or the only bound variable of \(\varphi\) that occurs in \(u\) is \(y\) itself, then no variable of \(u\) will become captured when we do the substitution.

**Proposition 4.4.7** &nbsp; *Let \(\mathcal L\) be a language, let \(u\in\mathrm{Term}_{\mathcal L}\), and let \(y\in\mathrm{Var}\). For all \(\varphi\in\mathrm{Form}_{\mathcal L}\) with \(\mathrm{OccurVar}(u)\cap\mathrm{BoundVar}(\varphi)\subseteq\{y\}\), we have \(\mathrm{VarCaptured}_y^u(\varphi)=0\).*

*Proof.* &nbsp; The proof is by induction on \(\varphi\):

- For the base case when \(\varphi\in\mathrm{AtomicForm}_{\mathcal L}\cup\{\top,\bot\}\), we trivially have \(\mathrm{VarCaptured}_y^u(\varphi)=0\) by definition.
- Suppose that the statement is true for \(\varphi\) and that \(\mathrm{OccurVar}(u)\cap\mathrm{BoundVar}(\neg\varphi)\subseteq\{y\}\). By definition, we have \(\mathrm{BoundVar}(\neg\varphi)=\mathrm{BoundVar}(\varphi)\), and hence \(\mathrm{OccurVar}(u)\cap\mathrm{BoundVar}(\varphi)\subseteq\{y\}\). By induction, we know that \(\mathrm{VarCaptured}_y^u(\varphi)=0\), so \(\mathrm{VarCaptured}_y^u(\neg\varphi)=0\) by definition.
- Suppose that the statement is true for both \(\varphi\) and \(\psi\), that \(\diamond\in\{\wedge,\vee,\to\}\), and that \(\mathrm{OccurVar}(u)\cap\mathrm{BoundVar}(\varphi\diamond\psi)\subseteq\{y\}\). By definition, we have \(\mathrm{BoundVar}(\varphi\diamond\psi)=\mathrm{BoundVar}(\varphi)\cup\mathrm{BoundVar}(\psi)\), and hence both \(\mathrm{OccurVar}(u)\cap\mathrm{BoundVar}(\varphi)\subseteq\{y\}\) and \(\mathrm{OccurVar}(u)\cap\mathrm{BoundVar}(\psi)\subseteq\{y\}\). By induction, we know that both \(\mathrm{VarCaptured}_y^u(\varphi)=0\) and \(\mathrm{VarCaptured}_y^u(\psi)=0\), so \(\mathrm{VarCaptured}_y^u(\varphi\diamond\psi)=0\) by definition.
- Suppose that the statement is true for \(\varphi\) and that \(\mathrm{OccurVar}(u)\cap\mathrm{BoundVar}(Qx\varphi)\subseteq\{y\}\), where \(x\in\mathrm{Var}\) and \(Q\in\{\forall,\exists\}\). We show that \(\mathrm{VarCaptured}_y^u(Qx\varphi)=0\) by showing that each of the two clauses that appear in the "or" statement for the definition of \(\mathrm{VarCaptured}_y^u(Qx\varphi)=1\) are not satisfied:

  - Suppose that \(x\in\mathrm{OccurVar}(u)\). Since \(x\in\mathrm{BoundVar}(Qx\varphi)\), it follows by assumption that \(x\in\{y\}\), and hence \(x=y\). Now \(x\notin\mathrm{FreeVar}(Qx\varphi)\) by definition, so \(y\notin\mathrm{FreeVar}(Qx\varphi)\). Thus, the first clause is false.
  - We have \(\mathrm{BoundVar}(\varphi)\subseteq\mathrm{BoundVar}(Qx\varphi)\) by definition, so \(\mathrm{OccurVar}(u)\cap\mathrm{BoundVar}(\varphi)\subseteq\{y\}\) also, and hence \(\mathrm{VarCaptured}_y^u(\varphi)=0\) by induction. Thus, the second clause is false.

  Therefore, by definition, we have \(\mathrm{VarCaptured}_y^u(Qx\varphi)=0\). \(\square\)

We now prove the corrected version of the hope expressed at the beginning of the section. That is, we show that under the assumption that \(\mathrm{VarCaptured}_y^u(\varphi)=0\), we can directly relate the truth of \(\varphi_y^u\) in a structure to the truth of \(\varphi\) in the same structure, via an appropriate change to the variable assignment.

**Theorem 4.4.8 (Substitution Theorem)** &nbsp; *Let \(\mathcal M\) be an \(\mathcal L\)-structure, let \(s:\mathrm{Var}\to M\), let \(u\in\mathrm{Term}_{\mathcal L}\), and let \(y\in\mathrm{Var}\). For all \(\varphi\in\mathrm{Form}_{\mathcal L}\) with \(\mathrm{VarCaptured}_y^u(\varphi)=0\), we have \((\mathcal M,s)\models\varphi_y^u\) if and only if \((\mathcal M,s[y\rightsquigarrow\overline{s}(u)])\models\varphi\).*

*Proof.* &nbsp; The proof is by induction on \(\varphi\). The statement is trivial for \(\top\) and \(\bot\).

- Suppose that \(R\in\mathrm{RelSym}_k\) and that \(t_1,\ldots,t_k\in\mathrm{Term}_{\mathcal L}\). We then have

  \[
  \begin{aligned}
  (\mathcal M,s)\models(Rt_1\cdots t_k)_y^u
  &\Longleftrightarrow(\mathcal M,s)\models R(t_1)_y^u\cdots(t_k)_y^u\\
  &\Longleftrightarrow(\overline{s}((t_1)_y^u),\ldots,\overline{s}((t_k)_y^u))\in R^{\mathcal M}\\
  &\Longleftrightarrow(\overline{s[y\rightsquigarrow\overline{s}(u)]}(t_1),\ldots,\overline{s[y\rightsquigarrow\overline{s}(u)]}(t_k))\in R^{\mathcal M}
    && \text{(by Lemma 4.4.3)}\\
  &\Longleftrightarrow(\mathcal M,s[y\rightsquigarrow\overline{s}(u)])\models Rt_1\cdots t_k.
  \end{aligned}
  \]

- For any \(t_1,t_2\in\mathrm{Term}_{\mathcal L}\), we have

  \[
  \begin{aligned}
  (\mathcal M,s)\models(t_1=t_2)_y^u
  &\Longleftrightarrow(\mathcal M,s)\models(t_1)_y^u=(t_2)_y^u\\
  &\Longleftrightarrow\overline{s}((t_1)_y^u)=\overline{s}((t_2)_y^u)\\
  &\Longleftrightarrow\overline{s[y\rightsquigarrow\overline{s}(u)]}(t_1)=\overline{s[y\rightsquigarrow\overline{s}(u)]}(t_2)
    && \text{(by Lemma 4.4.3)}\\
  &\Longleftrightarrow(\mathcal M,s[y\rightsquigarrow\overline{s}(u)])\models t_1=t_2.
  \end{aligned}
  \]

We turn now to the inductive steps:

- Suppose that the statement is true for \(\varphi\) and that \(\mathrm{VarCaptured}_y^u(\neg\varphi)=0\). We then have that \(\mathrm{VarCaptured}_y^u(\varphi)=0\) by definition, and hence

  \[
  \begin{aligned}
  (\mathcal M,s)\models(\neg\varphi)_y^u
  &\Longleftrightarrow(\mathcal M,s)\models\neg(\varphi_y^u)\\
  &\Longleftrightarrow(\mathcal M,s)\not\models\varphi_y^u\\
  &\Longleftrightarrow(\mathcal M,s[y\rightsquigarrow\overline{s}(u)])\not\models\varphi && \text{(by induction)}\\
  &\Longleftrightarrow(\mathcal M,s[y\rightsquigarrow\overline{s}(u)])\models\neg\varphi.
  \end{aligned}
  \]

  The connectives \(\wedge\), \(\vee\), and \(\to\) are similarly uninteresting.

- We next handle existential quantifiers. Suppose that the statement is true for \(\varphi\), that \(x\in\mathrm{Var}\), and that \(\mathrm{VarCaptured}_y^u(\exists x\varphi)=0\). If \(y\notin\mathrm{FreeVar}(\exists x\varphi)\), then

  \[
  \begin{aligned}
  (\mathcal M,s)\models(\exists x\varphi)_y^u
  &\Longleftrightarrow(\mathcal M,s)\models\exists x\varphi && \text{(by Proposition 4.4.5)}\\
  &\Longleftrightarrow(\mathcal M,s[y\rightsquigarrow\overline{s}(u)])\models\exists x\varphi && \text{(by Proposition 4.2.7)}.
  \end{aligned}
  \]

  Suppose then that \(y\in\mathrm{FreeVar}(\exists x\varphi)\). Now \(\mathrm{VarCaptured}_y^u(\exists x\varphi)=0\), so we must have \(x\notin\mathrm{OccurVar}(u)\), and hence \(\overline{s[x\rightsquigarrow a]}(u)=\overline{s}(u)\) by Proposition 4.2.7. Since \(x\notin\mathrm{FreeVar}(\exists x\varphi)\) by definition, we also must have \(y\neq x\), and hence \(\mathrm{VarCaptured}_y^u(\varphi)=0\). Therefore,

  \[
  \begin{aligned}
  (\mathcal M,s)\models(\exists x\varphi)_y^u
  &\Longleftrightarrow(\mathcal M,s)\models\exists x(\varphi_y^u) && \text{(since }y\neq x\text{)}\\
  &\Longleftrightarrow\text{There exists }a\in M\text{ with }(\mathcal M,s[x\rightsquigarrow a])\models\varphi_y^u\\
  &\Longleftrightarrow\text{There exists }a\in M\text{ with }(\mathcal M,(s[x\rightsquigarrow a])[y\rightsquigarrow\overline{s[x\rightsquigarrow a]}(u)])\models\varphi
    && \text{(by induction)}\\
  &\Longleftrightarrow\text{There exists }a\in M\text{ with }(\mathcal M,(s[x\rightsquigarrow a])[y\rightsquigarrow\overline{s}(u)])\models\varphi
    && \text{(from above)}\\
  &\Longleftrightarrow\text{There exists }a\in M\text{ with }(\mathcal M,(s[y\rightsquigarrow\overline{s}(u)])[x\rightsquigarrow a])\models\varphi
    && \text{(since }y\neq x\text{)}\\
  &\Longleftrightarrow(\mathcal M,s[y\rightsquigarrow\overline{s}(u)])\models\exists x\varphi.
  \end{aligned}
  \]

  The argument for universal quantifiers is completely analogous. \(\square\)

As mentioned at the beginning of the section, it is natural to think that if \(\forall x\varphi\) is true in \((\mathcal M,s)\), then upon taking a term \(u\) and substituting it in for \(x\) in the formula \(\varphi\), the resulting formula will also be true in \((\mathcal M,s)\). Using the Substitution Theorem, we can prove this result, as well as a corresponding result about existential quantifiers, under the assumption that \(\mathrm{VarCaptured}_x^u(\varphi)=0\).

**Corollary 4.4.9** &nbsp; *Let \(\mathcal M\) be an \(\mathcal L\)-structure, let \(s:\mathrm{Var}\to M\) be a variable assignment, let \(x\in\mathrm{Var}\), and let \(u\in\mathrm{Term}_{\mathcal L}\).*

1. *If \((\mathcal M,s)\models\forall x\varphi\) and \(\mathrm{VarCaptured}_x^u(\varphi)=0\), then \((\mathcal M,s)\models\varphi_x^u\).*
2. *If \((\mathcal M,s)\models\varphi_x^u\) and \(\mathrm{VarCaptured}_x^u(\varphi)=0\), then \((\mathcal M,s)\models\exists x\varphi\).*

*Proof.*

1. Assume that \((\mathcal M,s)\models\forall x\varphi\) and \(\mathrm{VarCaptured}_x^u(\varphi)=0\). Since \((\mathcal M,s)\models\forall x\varphi\), we know by the recursive definition of \(\models\) that \((\mathcal M,s[x\rightsquigarrow a])\models\varphi\) for all \(a\in M\). In particular, since \(\overline{s}(u)\in M\), it follows that \((\mathcal M,s[x\rightsquigarrow\overline{s}(u)])\models\varphi\). Using the Substitution Theorem, we conclude that \((\mathcal M,s)\models\varphi_x^u\).
2. Assume that \((\mathcal M,s)\models\varphi_x^u\) and \(\mathrm{VarCaptured}_x^u(\varphi)=0\). Using the Substitution Theorem, we conclude that \((\mathcal M,s[x\rightsquigarrow\overline{s}(u)])\models\varphi\). Since \(\overline{s}(u)\in M\), it follows that there exists \(a\in M\) with \((\mathcal M,s[x\rightsquigarrow a])\models\varphi\). Therefore, \((\mathcal M,s)\models\exists x\varphi\). \(\square\)

What if we want to substitute several terms \(u_1,\ldots,u_n\) for several (distinct) variables \(y_1,\ldots,y_n\)? We can, of course, accomplish this in stages by first substituting \(u_1\) for \(y_1\), then substituting \(u_2\) for \(y_2\), and so on. Although this is a perfectly reasonable approach, one issue is that the order in which we perform this iterated substitution can matter. To see how, notice that if \(y_2\in\mathrm{OccurVar}(u_1)\), then after substituting \(u_1\) for \(y_1\), we have introduced new occurrences of \(y_2\), which will then be replaced by \(u_2\) under the next substitution. For example, consider the language \(\mathcal L=\{c,R\}\) where \(c\) is a constant symbol and \(R\) is a binary relation symbol, and let \(\varphi\) be the formula \(Ry_1y_2\). Let \(u_1=y_2\) and let \(u_2=c\). We then have

\[
((Ry_1y_2)_{y_1}^{y_2})_{y_2}^{c}=(Ry_2y_2)_{y_2}^{c}=Rcc,
\]

while

\[
((Ry_1y_2)_{y_2}^{c})_{y_1}^{y_2}=(Ry_1c)_{y_1}^{y_2}=Ry_2c.
\]

In order to avoid this problem, we instead think about performing *simultaneous* substitution rather than *iterative* substitution. That is, we think about instantly replacing each (free occurrence of) \(y_i\) by the corresponding \(u_i\). For our purposes, simultaneous substitution will be more natural and elegant, although we will typically use it in the case where the \(u_i\) do not contain any variables, in which case simultaneous and iterative approaches would lead to the same result.

We now formally define this idea by starting with a function \(\alpha:\mathrm{Var}\to\mathrm{Term}_{\mathcal L}\), which we think of as coding the simultaneous substitution of replacing each variable \(y\) by the term \(\alpha(y)\). This approach permits the simultaneous substitution of infinitely many variables (although any given formula will only contain finitely many). We do want to allow the possibility of *not* substituting for some variables, but we can accomplish that by simply letting \(\alpha(y)=y\) in the case where we do not want to substitute anything for \(y\).

**Definition 4.4.10** &nbsp; Let \(\mathcal L\) be a language and let \(\alpha:\mathrm{Var}\to\mathrm{Term}_{\mathcal L}\) be a function. We define a function \(\mathrm{Subst}^{\alpha}:\mathrm{Term}_{\mathcal L}\to\mathrm{Term}_{\mathcal L}\), where we use \(t^{\alpha}\) to denote \(\mathrm{Subst}^{\alpha}(t)\), as follows:

1. \(c^{\alpha}=c\) for all \(c\in\mathrm{ConSym}\).
2. \(x^{\alpha}=\alpha(x)\) for all \(x\in\mathrm{Var}\).
3. \((ft_1\cdots t_k)^{\alpha}=f(t_1)^{\alpha}\cdots(t_k)^{\alpha}\) for all \(f\in\mathrm{FuncSym}_k\) and all \(t_1,\ldots,t_k\in\mathrm{Term}_{\mathcal L}\).

We now state the analogue of Lemma 4.4.3. To think through the appropriate statement, consider having a function \(\alpha:\mathrm{Var}\to\mathrm{Term}_{\mathcal L}\) together with a variable assignment \(s:\mathrm{Var}\to M\). Notice that \(\overline{s}:\mathrm{Term}_{\mathcal L}\to M\), so \(\overline{s}\circ\alpha:\mathrm{Var}\to M\) is a variable assignment that takes an input \(y\), replaces it by the corresponding term, and then evaluates the result according to the variable assignment \(s\). Since \(\overline{s}\circ\alpha\) is a variable assignment, we can form \(\overline{\overline{s}\circ\alpha}:\mathrm{Term}_{\mathcal L}\to M\), which extends \(\overline{s}\circ\alpha\) from variables to terms. Putting these ideas together, we arrive at the following result.

**Lemma 4.4.11** &nbsp; *Let \(\mathcal M\) be an \(\mathcal L\)-structure, let \(s:\mathrm{Var}\to M\), and let \(\alpha:\mathrm{Var}\to\mathrm{Term}_{\mathcal L}\). For all \(t\in\mathrm{Term}_{\mathcal L}\), we have \(\overline{s}(t^{\alpha})=\overline{\overline{s}\circ\alpha}(t)\).*

*Proof.* &nbsp; See Exercise 25. \(\square\)

We now extend our definition of simultaneous substitution to formulas. The key part of the definition is how to handle quantifiers. When faced with \((Qx\varphi)^{\alpha}\), we want to leave the occurrences of \(x\) inside of \(\varphi\) alone, and we accomplish this task by changing \(\alpha\) to a new function that sends \(x\) to itself, that is, by recursing using the function \(\alpha[x\rightsquigarrow x]\) instead of \(\alpha\).

**Definition 4.4.12** &nbsp; Let \(\mathcal L\) be a language and let \(\alpha:\mathrm{Var}\to\mathrm{Term}_{\mathcal L}\). We define \(\mathrm{FreeSubst}^{\alpha}:\mathrm{Form}_{\mathcal L}\to\mathrm{Form}_{\mathcal L}\), again denoted \(\varphi^{\alpha}\), as follows:

- \(\top^{\alpha}=\top\) and \(\bot^{\alpha}=\bot\).
- \((Rt_1\cdots t_k)^{\alpha}=R(t_1)^{\alpha}\cdots(t_k)^{\alpha}\) for all \(R\in\mathrm{RelSym}_k\) and all \(t_1,\ldots,t_k\in\mathrm{Term}_{\mathcal L}\).
- We define \((t_1=t_2)^{\alpha}\) to be \((t_1)^{\alpha}=(t_2)^{\alpha}\) for all \(t_1,t_2\in\mathrm{Term}_{\mathcal L}\).
- \((\neg\varphi)^{\alpha}=\neg(\varphi^{\alpha})\) for all \(\varphi\in\mathrm{Form}_{\mathcal L}\).
- \((\varphi\diamond\psi)^{\alpha}=\varphi^{\alpha}\diamond\psi^{\alpha}\) for all \(\varphi,\psi\in\mathrm{Form}_{\mathcal L}\) and all \(\diamond\in\{\wedge,\vee,\to\}\).
- \((Qx\varphi)^{\alpha}=Qx(\varphi^{\alpha[x\rightsquigarrow x]})\) for all \(\varphi\in\mathrm{Form}_{\mathcal L}\), \(x\in\mathrm{Var}\), and \(Q\in\{\exists,\forall\}\).

Finally, we extend our definition of \(\mathrm{VarCaptured}\) to our more general concept of substitution.

**Definition 4.4.13** &nbsp; Let \(\mathcal L\) be a language and let \(\alpha:\mathrm{Var}\to\mathrm{Term}_{\mathcal L}\). We define \(\mathrm{VarCaptured}^{\alpha}:\mathrm{Form}_{\mathcal L}\to\{0,1\}\) as follows:

- \(\mathrm{VarCaptured}^{\alpha}(\varphi)=0\) for all \(\varphi\in\mathrm{AtomicForm}_{\mathcal L}\cup\{\top,\bot\}\).
- \(\mathrm{VarCaptured}^{\alpha}(\neg\varphi)=\mathrm{VarCaptured}^{\alpha}(\varphi)\) for all \(\varphi\in\mathrm{Form}_{\mathcal L}\).
- For all \(\varphi,\psi\in\mathrm{Form}_{\mathcal L}\) and all \(\diamond\in\{\wedge,\vee,\to\}\),

  \[
  \mathrm{VarCaptured}^{\alpha}(\varphi\diamond\psi)=
  \begin{cases}
  1 & \text{if }\mathrm{VarCaptured}^{\alpha}(\varphi)=1\text{ or }\mathrm{VarCaptured}^{\alpha}(\psi)=1,\\
  0 & \text{otherwise.}
  \end{cases}
  \]

- For all \(\varphi\in\mathrm{Form}_{\mathcal L}\), \(x\in\mathrm{Var}\), and \(Q\in\{\forall,\exists\}\),

  \[
  \mathrm{VarCaptured}^{\alpha}(Qx\varphi)=
  \begin{cases}
  1 & \begin{array}{l}
      \text{if either there exists }y\in\mathrm{FreeVar}(Qx\varphi)\text{ with }x\in\mathrm{OccurVar}(\alpha(y)),\\
      \text{or }\mathrm{VarCaptured}^{\alpha[x\rightsquigarrow x]}(\varphi)=1,
      \end{array}\\
  0 & \text{otherwise.}
  \end{cases}
  \]

We now state the analogue of Proposition 4.4.7 in the setting of multiple substitution. We simply change the assumption that \(\mathrm{OccurVar}(u)\cap\mathrm{BoundVar}(\varphi)\subseteq\{y\}\) for the one variable \(y\) and the one term \(u\) into an assumption about *every* variable \(y\) and corresponding term \(\alpha(y)\).

**Proposition 4.4.14** &nbsp; *Let \(\mathcal L\) be a language and let \(\alpha:\mathrm{Var}\to\mathrm{Term}_{\mathcal L}\). For all \(\varphi\in\mathrm{Form}_{\mathcal L}\) with the property that \(\mathrm{OccurVar}(\alpha(y))\cap\mathrm{BoundVar}(\varphi)\subseteq\{y\}\) for every \(y\in\mathrm{Var}\), we have \(\mathrm{VarCaptured}^{\alpha}(\varphi)=0\).*

*Proof.* &nbsp; Exercise. \(\square\)

It is also useful to keep track of the free variables that appear in a formula after a substitution. Consider a variable \(z\). If \(z\) does not occur in any term that we are substituting (with the possible exception of the term that we are substituting for \(z\) itself), then it is intuitively clear that \(z\) will not magically become free in the substituted formula. The next result just states this observation formally. Of course, one can give a careful proof by induction.

**Proposition 4.4.15** &nbsp; *Let \(\mathcal L\) be a language and let \(\alpha:\mathrm{Var}\to\mathrm{Term}_{\mathcal L}\). Suppose that \(z\notin\mathrm{OccurVar}(\alpha(y))\) for all \(y\in\mathrm{Var}\) with \(y\neq z\).*

1. *For all \(\varphi\in\mathrm{Form}_{\mathcal L}\) with \(z\notin\mathrm{FreeVar}(\varphi)\), we have \(z\notin\mathrm{FreeVar}(\varphi^{\alpha})\).*
2. *Suppose also that \(z\notin\mathrm{OccurVar}(\alpha(z))\). We then have that \(z\notin\mathrm{FreeVar}(\varphi^{\alpha})\) for all \(\varphi\in\mathrm{Form}_{\mathcal L}\).*

*Proof.* &nbsp; Exercise. \(\square\)

With all of the definitions and results in hand, we state the analogue of Theorem 4.4.8. The inductive proof is structurally similar, but we leave the details to any eager detail-oriented reader.

**Theorem 4.4.16 (Multiple Substitution Theorem)** &nbsp; *Let \(\mathcal M\) be an \(\mathcal L\)-structure, let \(s:\mathrm{Var}\to M\), and let \(\alpha:\mathrm{Var}\to\mathrm{Term}_{\mathcal L}\). For all \(\varphi\in\mathrm{Form}_{\mathcal L}\) with \(\mathrm{VarCaptured}^{\alpha}(\varphi)=0\), we have \((\mathcal M,s)\models\varphi^{\alpha}\) if and only if \((\mathcal M,\overline{s}\circ\alpha)\models\varphi\).*

*Proof.* &nbsp; Exercise. \(\square\)

While this version of the Multiple Substitution Theorem is elegant, general, and powerful, the complexity of the notation and the assumption about \(\mathrm{VarCaptured}\) (which has a complicated recursive definition) make it look somewhat intimidating. We first introduce some streamlined notation, and then extract a special case (using the new notation) that is much more intuitive to use, and that is sufficient for most of our purposes.

**Notation 4.4.17** &nbsp; Let \(\mathcal L\) be a language, let \(\varphi(y_1,\ldots,y_n)\in\mathrm{Form}_{\mathcal L}\), and let \(u_1,\ldots,u_n\in\mathrm{Term}_{\mathcal L}\). We write \(\varphi[u_1,\ldots,u_n]\) for the formula \(\varphi^{\alpha}\), where \(\alpha:\mathrm{Var}\to\mathrm{Term}_{\mathcal L}\) is the function with \(\alpha(y_i)=u_i\) for all \(i\), and where \(\alpha(z)=z\) for all \(z\in\mathrm{Var}\setminus\{y_1,\ldots,y_n\}\).

The special case that we will typically consider is when \(\alpha:\mathrm{Var}\to\mathrm{Term}_{\mathcal L}\) has the property that for all \(y\in\mathrm{Var}\), either \(\alpha(y)=y\), or \(\alpha(y)\) contains no variables. In other words, whenever \(\alpha\) encodes an actual change to a variable, it turns that variable into a term that is built up using only constant and function symbols. We give these types of terms a special name.

**Definition 4.4.18** &nbsp; Let \(\mathcal L\) be a language and let \(t\in\mathrm{Term}_{\mathcal L}\).

1. We say that \(t\) is a *closed term* if \(\mathrm{OccurVar}(t)=\varnothing\).
2. If \(t\) is a closed term and \(\mathcal M\) is an \(\mathcal L\)-structure, we use the notation \(t^{\mathcal M}\) for the value of \(\overline{s}(t)\) for some (any) variable assignment \(s:\mathrm{Var}\to M\) (which is well-defined by Proposition 4.2.7).

In other words, since a closed term does not contain any variables, we can unambiguously assign it a value in a given \(\mathcal L\)-structure without having a particular variable assignment around. In the situation where we substitute some of the free variables of a given formula with closed terms, and leave all other variables untouched, then we arrive at the following.

**Corollary 4.4.19** &nbsp; *Let \(\mathcal M\) be an \(\mathcal L\)-structure, let \(\varphi(x_1,\ldots,x_k,y_1,\ldots,y_n)\in\mathrm{Form}_{\mathcal L}\), and let \(t_1,\ldots,t_n\) be closed terms of \(\mathcal L\). We then have the following:*

1. *\(\mathrm{FreeVar}(\varphi[x_1,\ldots,x_k,t_1,\ldots,t_n])\subseteq\{x_1,\ldots,x_k\}\).*
2. *For all \(a_1,\ldots,a_k\in M\), we have*

   \[
   (\mathcal M,a_1,\ldots,a_k)\models\varphi[x_1,\ldots,x_k,t_1,\ldots,t_n]
   \quad\text{if and only if}\quad
   (\mathcal M,a_1,\ldots,a_k,t_1^{\mathcal M},\ldots,t_n^{\mathcal M})\models\varphi.
   \]

*Proof.* &nbsp; Let \(\alpha:\mathrm{Var}\to\mathrm{Term}_{\mathcal L}\) be the function where \(\alpha(y_j)=t_j\) for all \(j\), and where \(\alpha(z)=z\) for all \(z\in\mathrm{Var}\setminus\{y_1,\ldots,y_n\}\). The first claim follows from Proposition 4.4.15. Since the \(t_i\) are closed terms, we have \(\mathrm{OccurVar}(\alpha(y))\subseteq\{y\}\) for all \(y\in\mathrm{Var}\), so \(\mathrm{VarCaptured}^{\alpha}(\varphi)=0\) by Proposition 4.4.14.

Let \(a_1,\ldots,a_k\in M\) be arbitrary. Define a variable assignment \(s:\mathrm{Var}\to M\) be letting \(s(x_i)=a_i\) for all \(i\), and defining \(s\) on other inputs arbitrarily. We then have \((\overline{s}\circ\alpha)(x_i)=s(x_i)=a_i\) for all \(i\) and \((\overline{s}\circ\alpha)(y_j)=\overline{s}(t_j)=t_j^{\mathcal M}\) for all \(j\). Thus, the result follows from the Multiple Substitution Theorem, and the fact that \(\varphi^{\alpha}\) is equal to \(\varphi[x_1,\ldots,x_k,t_1,\ldots,t_n]\). \(\square\)

In the even more special case where we substitute a closed term for each free variable of \(\varphi\), that is, when \(k=0\) in the previous corollary, we obtain the following very streamlined version.

**Corollary 4.4.20** &nbsp; *Let \(\mathcal M\) be an \(\mathcal L\)-structure, let \(\varphi(y_1,\ldots,y_n)\in\mathrm{Form}_{\mathcal L}\), and let \(t_1,\ldots,t_n\) be closed terms of \(\mathcal L\). We then have the following:*

1. *\(\varphi[t_1,\ldots,t_n]\) is a sentence.*
2. *\((\mathcal M,t_1^{\mathcal M},\ldots,t_n^{\mathcal M})\models\varphi\) if and only if \(\mathcal M\models\varphi[t_1,\ldots,t_n]\).*

While I wish that I could say that we have now covered everything about substitution that we will need, there is one other type of substitution that will arise on a couple of occasions. Our definition of substitution replaces variables with terms, but it is also sometimes useful to replace constant symbols with variables. That is, given \(z\in\mathrm{Var}\) and \(c\in\mathrm{ConSym}\), we will occasionally want to consider \(t_c^z\) for terms \(t\), as well as \(\varphi_c^z\) for formulas \(\varphi\). The recursive definition of this new substitution follows the same outline as our original but is now easier because we can simply pass through quantifiers. It is reasonable to worry about the need to define \(\mathrm{VarCaptured}_c^z\), but we will only use variables \(z\) that do not occur in our formulas \(\varphi\), and so will never have to think about this particular issue. These substitutions will play an important role in our proof of the Completeness Theorem for first-order logic, and we will revisit this concept in Section 6.3.

Of course, we can also define a more general version where we substitute multiple variables simultaneously for constants. In this case, we would use a function \(\beta:\mathrm{ConSym}\to\mathrm{Var}\) to code the substitutions. Fortunately, we will only need one narrow and intuitive result that relies on the ability to perform such multiple substitutions, and hence we will not bother to define everything carefully. The situation that we will occasionally encounter is that we have a language \(\mathcal L\) sitting inside a larger language \(\mathcal L'\), but the only new symbols in \(\mathcal L'\) are constant symbols. Of course, there will now be elements of \(\mathrm{Form}_{\mathcal L'}\) that are not in \(\mathrm{Form}_{\mathcal L}\). However, our result says that every such formula arises via a (multiple) substitution from an element of \(\mathrm{Form}_{\mathcal L}\) using the new constant symbols.

**Proposition 4.4.21** &nbsp; *Let \(\mathcal L\subseteq\mathcal L'\) be languages with the property that every new element in \(\mathcal L'\) is a constant symbol. For all \(\varphi(x_1,\ldots,x_k)\in\mathrm{Form}_{\mathcal L'}\), there exists \(\psi(x_1,\ldots,x_k,y_1,\ldots,y_n)\in\mathrm{Form}_{\mathcal L}\) and \(c_1,\ldots,c_n\in\mathcal L'\setminus\mathcal L\) such that \(\varphi\) is equal to \(\psi[x_1,\ldots,x_k,c_1,\ldots,c_n]\).*

*Proof Sketch.* &nbsp; Let \(c_1,\ldots,c_n\) be the new constant symbols that occur in \(\varphi\). Fix distinct variables \(y_1,\ldots,y_n\) that do not occur in \(\varphi\). Let \(\psi\) be the result of substituting the \(y_j\) for the \(c_j\) in \(\varphi\), and leaving all other variables alone. We then have that \(\psi\in\mathrm{Form}_{\mathcal L}\), that \(\mathrm{FreeVar}(\psi)\subseteq\{x_1,\ldots,x_k,y_1,\ldots,y_n\}\), and that \(\varphi\) is equal to the result of substituting the \(c_j\) for the \(y_j\) in \(\psi\). \(\square\)

## 4.5 Semantic Equivalence

We can adapt Definition 3.2.5 to the first-order logic setting by changing truth assignments \(M\) to structures with variable assignments \((\mathcal M,s)\).

**Definition 4.5.1** &nbsp; Let \(\mathcal L\) be a language, and let \(\varphi,\psi\in\mathrm{Form}_{\mathcal L}\). We say that \(\varphi\) and \(\psi\) are *semantically equivalent* if for all \(\mathcal L\)-structures \(\mathcal M\) and all variable assignments \(s:\mathrm{Var}\to M\), we have \((\mathcal M,s)\models\varphi\) if and only if \((\mathcal M,s)\models\psi\).

Although this definition looks a bit different than Definition 3.2.5, that difference only arises from our change in notation. We could have written that \(\varphi\) and \(\psi\) are semantically equivalent if \(\upsilon_{(\mathcal M,s)}(\varphi)=\upsilon_{(\mathcal M,s)}(\psi)\) for all \(\mathcal L\)-structures \(\mathcal M\) and variable assignments \(s:M\to\mathrm{Var}\), but we have moved over to a different notation for semantic truth.

Since we include the propositional connectives, and we recursively define truth for these connectives in the exact same way as we did in propositional logic, we can carry over the basic results of Section 3.2, such as the fact that \(\varphi\) and \(\neg\neg\varphi\) are semantically equivalent for all \(\varphi\in\mathrm{Form}_{\mathcal L}\). But the addition of quantifiers allows us to say more interesting things.

**Proposition 4.5.2** &nbsp; *For any \(\varphi\in\mathrm{Form}_{\mathcal L}\), the formulas \(\forall x\varphi\) and \(\neg\exists x\neg\varphi\) are semantically equivalent.*

*Proof.* &nbsp; Let \(\varphi\in\mathrm{Form}_{\mathcal L}\). Consider an arbitrary \(\mathcal L\)-structure \(\mathcal M\) and variable assignment \(s:\mathrm{Var}\to M\). Using the recursive definition of \(\models\), we have

\[
\begin{aligned}
(\mathcal M,s)\models\forall x\varphi
&\Longleftrightarrow\text{For all }a\in M,\text{ we have }(\mathcal M,s[x\rightsquigarrow a])\models\varphi\\
&\Longleftrightarrow\text{For all }a\in M,\text{ we have }(\mathcal M,s[x\rightsquigarrow a])\not\models\neg\varphi
\end{aligned}
\]

carefully. The situation that we will occasionally encounter is that we have a language \(\mathcal L\) sitting inside a larger language \(\mathcal L'\), but the only new symbols in \(\mathcal L'\) are constant symbols. Of course, there will now be elements of \(\mathrm{Form}_{\mathcal L'}\) that are not in \(\mathrm{Form}_{\mathcal L}\). However, our result says that every such formula arises via a (multiple) substitution from an element of \(\mathrm{Form}_{\mathcal L}\) using the new constant symbols.

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
&\Longleftrightarrow\text{For all }a\in M,\text{ we have }(\mathcal M,s[x\rightsquigarrow a])\not\models\neg\varphi\\
&\Longleftrightarrow(\mathcal M,s)\not\models\exists x\neg\varphi\\
&\Longleftrightarrow(\mathcal M,s)\models\neg\exists x\neg\varphi.
\end{aligned}
\]

\(\square\)

Using this result, we can argue that \(\forall\) is unnecessary if all that we care about is pure expressive power. We first state the following analogue of Proposition 3.2.6, which forms the backbone of any inductive argument.

**Proposition 4.5.3** &nbsp; *Let \(\mathcal L\) be a language and let \(\varphi_1,\varphi_2,\psi_1,\psi_2\in\mathrm{Form}_{\mathcal L}\). Suppose that \(\varphi_1\) and \(\psi_1\) are semantically equivalent, and that \(\varphi_2\) and \(\psi_2\) are semantically equivalent. We have the following:*

1. *The formulas \(\neg\varphi_1\) and \(\neg\psi_1\) are semantically equivalent.*
2. *For all \(\diamond\in\{\wedge,\vee,\to\}\), the formulas \(\varphi_1\diamond\varphi_2\) and \(\psi_1\diamond\psi_2\) are semantically equivalent.*
3. *For all \(Q\in\{\exists,\forall\}\) and \(x\in\mathrm{Var}\), the formulas \(Qx\varphi\) and \(Qx\psi\) are semantically equivalent.*

*Proof.* &nbsp; As in Proposition 3.2.6, each of these follow directly from the recursive definition of truth in a structure together with a variable assignment. \(\square\)

Using the previous two results, together with a recursive construction, one can show that every formula in \(\mathrm{Form}_{\mathcal L}\) is semantically equivalent to one that does not use the quantifier \(\forall\). In fact, we can also throw out a few propositional connectives (via the results of Section 3.2), leading to the following analogue of Proposition 3.2.9.

**Proposition 4.5.4** &nbsp; *Let \(\mathcal L\) be a language. Let \(\mathrm{Form}_{\mathcal L}^{-}\) be the set of formulas obtained by starting with the atomic formulas together with \(\top\) and \(\bot\), and then generating using only \(\neg\), \(\wedge\), and \(\exists\). More formally,*

\[
\mathrm{Form}_{\mathcal L}^{-}
=G\left(\mathrm{Sym}_{\mathcal L}^{*},
\mathrm{AtomicForm}_{\mathcal L}\cup\{\top,\bot\},
\{h_{\neg},h_{\wedge}\}\cup\{h_{\exists,x}:x\in\mathrm{Var}\}\right).
\]

*For all \(\varphi\in\mathrm{Form}_{\mathcal L}\), there exists \(\psi\in\mathrm{Form}_{\mathcal L}^{-}\) such that \(\varphi\) and \(\psi\) are semantically equivalent.*

*Proof.* &nbsp; Exercise. \(\square\)

Alternatively, we could keep \(\forall\) and omit \(\exists\), since an argument completely analogous to the one in Proposition 4.5.2 shows that \(\exists x\varphi\) is semantically equivalent to \(\neg\forall x\neg\varphi\) for all \(\varphi\in\mathrm{Form}_{\mathcal L}\). We can instead keep both quantifiers around and create an analogue of negation normal form. We just need to be able to push negations inside of each of our two quantifiers, which we can accomplish by simply switching the quantifier.

**Proposition 4.5.5** &nbsp; *Let \(\varphi\in\mathrm{Form}_{\mathcal L}\) and \(x\in\mathrm{Var}\).*

1. *The formulas \(\neg(\exists x\varphi)\) and \(\forall x(\neg\varphi)\) are semantically equivalent.*
2. *The formulas \(\neg(\forall x\varphi)\) and \(\exists x(\neg\varphi)\) are semantically equivalent.*

*Proof.* &nbsp; Similar to the proof of Proposition 4.5.2. \(\square\)

Rather than state the analogue of negation normal form here, we will instead discuss several other syntactic manipulations that preserve semantic equivalence in order to establish a much stronger result. We start by talking about bound variables. When we have a quantified variable \(x\) in a formula, then the particular variable that we use does not affect the *meaning* of the formula. For example, suppose that we are working in the language of monoids. If we have distinct variables \(y,z\in\mathrm{Var}\), then the formulas \(\forall y(y\cdot y=e)\) and \(\forall z(z\cdot z=e)\) are semantically equivalent. That is, up to semantic equivalence, we can change the choice of bound variable along with all occurrences of the variable within the scope of the corresponding quantifier. Formally, we can codify this changing of names using substitution. In order to avoid a capture, we need to ensure that the new bounding variable does not appear as a free variable within the scope of the quantifier.

**Proposition 4.5.6** &nbsp; *For any \(\varphi\in\mathrm{Form}_{\mathcal L}\) and \(y,z\in\mathrm{Var}\), we have the following:*

1. *If \(z\notin\mathrm{OccurVar}(\varphi)\), then \(\exists y\varphi\) and \(\exists z(\varphi_y^z)\) are semantically equivalent.*
2. *If \(z\notin\mathrm{OccurVar}(\varphi)\), then \(\forall y\varphi\) and \(\forall z(\varphi_y^z)\) are semantically equivalent.*

*Proof.* &nbsp; Suppose that \(z\notin\mathrm{OccurVar}(\varphi)\). Note (see Exercise 4) that we have both \(z\notin\mathrm{BoundVar}(\varphi)\) and \(z\notin\mathrm{FreeVar}(\varphi)\). Let \(\mathcal M\) be an \(\mathcal L\)-structure and let \(s:\mathrm{Var}\to M\) be a variable assignment. If \(z=y\), then the statement is trivial, as \(\varphi_y^z\) is equal to \(\varphi\). Suppose then that \(z\neq y\). Since \(\mathrm{OccurVar}(z)=\{z\}\) and \(z\notin\mathrm{BoundVar}(\varphi)\), we can use Proposition 4.4.7 to conclude that \(\mathrm{VarCaptured}_y^z(\varphi)=0\). Using the Substitution Theorem, we have

\[
\begin{aligned}
(\mathcal M,s)\models\exists z(\varphi_y^z)
&\Longleftrightarrow\text{There exists }a\in M\text{ with }(\mathcal M,s[z\rightsquigarrow a])\models\varphi_y^z\\
&\Longleftrightarrow\text{There exists }a\in M\text{ with }(\mathcal M,(s[z\rightsquigarrow a])[y\rightsquigarrow\overline{s[z\rightsquigarrow a]}(z)])\models\varphi\\
&\Longleftrightarrow\text{There exists }a\in M\text{ with }(\mathcal M,(s[z\rightsquigarrow a])[y\rightsquigarrow a])\models\varphi\\
&\Longleftrightarrow\text{There exists }a\in M\text{ with }(\mathcal M,(s[y\rightsquigarrow a])[z\rightsquigarrow a])\models\varphi\\
&\Longleftrightarrow\text{There exists }a\in M\text{ with }(\mathcal M,s[y\rightsquigarrow a])\models\varphi,
\end{aligned}
\]

where the last line follows from Proposition 4.2.7 together with the fact that \(z\notin\mathrm{FreeVar}(\varphi)\). The proof of part (2) is completely analogous. \(\square\)

It is important to note that we cannot perform the same change for the *free* occurrences of a variable. Continuing to work in the language of monoids, if we have distinct variables \(y,z\in\mathrm{Var}\), then \(y\cdot y=e\) and \(z\cdot z=e\) are *not* semantically equivalent. To see this, let \(\mathcal M\) be a group with an element of order greater than \(2\), such as \(\mathbb Z/3\mathbb Z\), and let \(a\in M\) be such an element. Let \(e\) be the identity of the group. If we define \(s:\mathrm{Var}\to M\) by letting

\[
s(x)=
\begin{cases}
a & \text{if }x=z,\\
e & \text{otherwise},
\end{cases}
\]

then \((\mathcal M,s)\models y\cdot y=e\) but \((\mathcal M,s)\not\models z\cdot z=e\).

It is possible for the same variable to be simultaneously free and bound in the same formula, and it is also possible for a bound variable to occur paired with a quantifier in different places. For example,

\[
(y\cdot y\cdot y=y)\wedge\forall y(y=y\cdot e)\wedge\exists y(y\cdot x=x\cdot y)
\]

is a formula in the language of monoids. If we change all bound occurrences of \(y\) to \(z\), we obtain the semantically equivalent

\[
(y\cdot y\cdot y=y)\wedge\forall z(z=z\cdot e)\wedge\exists z(z\cdot x=x\cdot z).
\]

Again, it is essential that we keep the free occurrences of \(y\) untouched. In general, we can use a recursive construction to change *all* bound occurrences of \(y\) to another variable \(z\) that does not occur anywhere in the formula. Since \(\mathrm{Var}\) is infinite and each formula only has finitely many occurring variables, we can always pick \(z\) to be such a fresh variable, and so we can use Proposition 4.5.6 and induction to prove that the resulting formula is semantically equivalent. Such a construction changes the name of only one bound variable, but we can either induct on \(\lvert\mathrm{BoundVar}(\varphi)\cap\mathrm{FreeVar}(\varphi)\rvert\), or define and perform a multiple substitution for all bound variables, in order to prove the following result.

**Corollary 4.5.7** &nbsp; *For all \(\varphi\in\mathrm{Form}_{\mathcal L}\), there exists \(\psi\in\mathrm{Form}_{\mathcal L}\) with \(\mathrm{BoundVar}(\psi)\cap\mathrm{FreeVar}(\psi)=\varnothing\) such that \(\varphi\) and \(\psi\) are semantically equivalent.*

When we build up formulas from the atomic formulas, we might have a complicated intertwined nesting of the connectives and the quantifiers. We saw how to push negations inside quantifiers in Proposition 4.5.5, and we can do similar syntactic manipulations to bring \(\wedge\) and \(\vee\) inside of quantifiers. For these connectives, we do not change the type of the quantifier, but we do need to ensure that pushing one of these connectives inside the scope of the quantifier does not cause a variable capture. Thus, the corresponding result assumes that the quantified variable is not free in the other formula. Fortunately, we can use Proposition 4.5.6 to change the name of the quantified variable if this assumption is not satisfied.

**Proposition 4.5.8** &nbsp; *Let \(\varphi,\psi\in\mathrm{Form}_{\mathcal L}\), let \(Q\in\{\forall,\exists\}\), let \(\diamond\in\{\wedge,\vee\}\), and \(x\in\mathrm{Var}\).*

1. *If \(x\notin\mathrm{FreeVar}(\varphi)\), then \(\varphi\diamond(Qx\psi)\) and \(Qx(\varphi\diamond\psi)\) are semantically equivalent.*
2. *If \(x\notin\mathrm{FreeVar}(\psi)\), then \((Qx\varphi)\diamond\psi\) and \(Qx(\varphi\diamond\psi)\) are semantically equivalent.*

*Proof.* &nbsp; We prove the first of these in the case where \(Q=\exists\) and where \(\diamond=\wedge\). Let \((\mathcal M,s)\) be a structure together with a variable assignment. Since \(x\notin\mathrm{FreeVar}(\varphi)\), we can use Proposition 4.2.7 to conclude that for all \(a\in M\), we have \((\mathcal M,s)\models\varphi\) if and only if \((\mathcal M,s[x\rightsquigarrow a])\models\varphi\). Therefore,

\[
\begin{aligned}
(\mathcal M,s)\models\varphi\wedge(\exists x\psi)
&\Longleftrightarrow(\mathcal M,s)\models\varphi\text{ and }(\mathcal M,s)\models\exists x\psi\\
&\Longleftrightarrow(\mathcal M,s)\models\varphi\text{ and there exists }a\in M\text{ with }(\mathcal M,s[x\rightsquigarrow a])\models\psi\\
&\Longleftrightarrow\text{There exists }a\in M\text{ with both }(\mathcal M,s[x\rightsquigarrow a])\models\varphi\text{ and }(\mathcal M,s[x\rightsquigarrow a])\models\psi\\
&\Longleftrightarrow\text{There exists }a\in M\text{ with }(\mathcal M,s[x\rightsquigarrow a])\models\varphi\wedge\psi\\
&\Longleftrightarrow(\mathcal M,s)\models\exists x(\varphi\wedge\psi).
\end{aligned}
\]

The other cases are completely analogous. \(\square\)

It is important to note that the previous result does not include \(\to\) in its list of connectives. In fact, the formulas \((\exists x\varphi)\to\psi\) and \(\exists x(\varphi\to\psi)\) are *not* typically semantically equivalent, even when \(x\notin\mathrm{FreeVar}(\psi)\). It is possible to pull out the a quantifier that appears on the left of \(\to\), but we need to switch to the other quantifier in the process. In other words, the formulas \((\exists x\varphi)\to\psi\) and \(\forall x(\varphi\to\psi)\) are semantically equivalent. One can prove this directly, but it is easier to use the fact that \(\varphi\to\psi\) is semantically equivalent to \((\neg\varphi)\vee\psi\), and then use Proposition 4.5.5 and Proposition 4.5.8. Of course, we already know that we can eliminate \(\to\) anyway, but it is a useful connective to have around when we want to translate mathematical statements into natural formulas.

By combining the various results of this section, we can disentangle the quantifiers and the propositional connectives completely. That is, we can push all of the propositional connectives inside the scope of each quantifier, until we end up with a formula of the form \(Q_1x_1\cdots Q_mx_m\varphi\), where each \(Q_i\in\{\forall,\exists\}\) and where \(\varphi\) is a quantifier-free formula (see Definition 4.3.2). Formulas with all quantifiers at the front are called *prenex formulas*, but we can do even more. Although propositional logic started with the propositional symbols as the basic formulas, and first-order logic starts with atomic formulas, we can follow all of the arguments in Section 3.2, so long as we change the definition of a literal.

**Definition 4.5.9** &nbsp; Let \(\mathcal L\) be a language. A *literal* is an element of \(\mathrm{AtomicForm}_{\mathcal L}\cup\{\neg\varphi:\varphi\in\mathrm{AtomicForm}_{\mathcal L}\}\cup\{\top,\bot\}\). We denote the set of literals by \(\mathrm{Literal}_{\mathcal L}\).

We now have the following analogue of Proposition 3.2.15 saying that every quantifier-free formula is semantically equivalent to a formula in disjunctive normal form.

**Proposition 4.5.10** &nbsp; *Let \(\mathcal L\) be a language. For every quantifier-free \(\varphi(x_1,\ldots,x_k)\in\mathrm{Form}_{\mathcal L}\), there exist literals \(\pi_{i,j}(x_1,\ldots,x_k)\) such that \(\varphi\) and \(\bigvee_{i=1}^{n}\left(\bigwedge_{j=1}^{k_i}\pi_{i,j}\right)\) are semantically equivalent.*

We can put everything together to obtain the following result.

**Proposition 4.5.11** &nbsp; *Let \(\mathcal L\) be a language. For every \(\varphi(x_1,\ldots,x_k)\in\mathrm{Form}_{\mathcal L}\), there exist literals \(\pi_{i,j}(x_1,\ldots,x_k)\) and \(Q_k\in\{\forall,\exists\}\) such that \(\varphi\) and \(Q_1y_1\cdots Q_my_m\left(\bigvee_{i=1}^{n}\left(\bigwedge_{j=1}^{k_i}\pi_{i,j}\right)\right)\) are semantically equivalent.*

At the end of Section 3.2, we discussed the computational problem of determining whether two formulas in propositional logic were semantically equivalent. We mentioned that the simple method of truth tables does provide an algorithm to solve this problem, but the question of whether there is an *efficient* (i.e. polynomial-time) algorithm is a major open problem. In addition, we discussed how to translate the semantic equivalence problem into two other problems: one about satisfiability, and the other about tautologies.

We can naturally adapt the concepts of satisfiability and tautologies to the first-order logic setting. Given \(\varphi\in\mathrm{Form}_{\mathcal L}\), we say that \(\varphi\) is *satisfiable* if there exists an \(\mathcal L\)-structure \(\mathcal M\) together with a variable assignment \(s:\mathrm{Var}\to M\) such that \((\mathcal M,s)\models\varphi\), and that \(\varphi\) is a *tautology* if for every \(\mathcal L\)-structure \(\mathcal M\) together with a variable assignment \(s:\mathrm{Var}\to M\), we have \((\mathcal M,s)\models\varphi\). However, we should note that many sources use the term *valid* (or *logically valid*) instead of *tautology* in the context of first-order logic.

With these definitions, Proposition 3.2.17 is still true in the first-order logic setting, and hence we can directly translate between the three problems. However, in contrast to the situation in propositional logic, there is no clear method (even a terribly inefficient one) that we can employ to answer any of them. After all, there are infinitely many structures, so we cannot search through them all. Moreover, as we discussed in Section 4.2, it is not even clear how to computationally determine whether \((\mathcal M,s)\models\varphi\) when the universe \(M\) is infinite. So we seem to be piling infinities on top of infinities, which looks very bad from a computational perspective.

Although the three questions can be translated into each other, the tautology version of the problem was a focus for logicians in the early part of the twentieth century because it has a natural connection with syntactic implication (which we will study in Section 6.2). That is, we want to know whether there is some sort of procedure that will take as input a formula \(\varphi\in\mathrm{Form}_{\mathcal L}\) and will determine whether or not \(\varphi\) is true in every structure (together with a variable assignment). The previous paragraph might seem to suggest that the search for such a method is hopeless. However, it is certainly conceivable that there are some basic syntactic manipulations that we can perform on a formula \(\varphi\) (along the lines of our work throughout this section) that will produce a semantically equivalent "simple" formula \(\psi\) for which it is easy to determine whether or not it is a tautology. The question of the existence of such a method is known as the *Entscheidungsproblem*, which translates as *decision problem*. Church and Turing developed their rigorous definitions of computability in order to resolve this question. We will study precise definitions of computable sets and functions in Chapter 11 and will resolve the general Entscheidungsproblem in Section 12.5.

## Exercises

### Section 4.1

1. Let \(\mathcal L=\{c,P,R,i,f\}\), where \(c\) is a constant symbol, \(P\) is a unary relation symbol, \(R\) is a binary relation symbol, \(i\) is a unary function symbol, and \(f\) is a binary function symbol. Given \(x,y\in\mathrm{Var}\), determine whether each of the following is a term, an atomic formula, a general (non-atomic) formula, or none of the above.

   (a) \(R(i(f(x,c)),i(y))\).

   (b) \(\forall xR(P(x),y)\).

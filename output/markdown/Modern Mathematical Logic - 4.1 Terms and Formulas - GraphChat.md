# 4 First-Order Logic: Languages and Structures

Now that we have successfully worked through several important aspects of propositional logic, it is time to move on to a much more substantial and important logic: first-order logic. We gave a basic overview of the fundamental ideas in the introduction. Fundamentally, many areas of mathematics deal with mathematical structures consisting of special constants, relations, and functions, together with certain axioms that these structures obey. We want our logic to be able to handle different types of situations, so we allow ourselves to vary the number and types of these objects. For example, in group theory, we have a special identity element and a binary function corresponding to the group operation. If we want, we can also add in a unary function corresponding to the inverse operation. For ring theory, we have two constants for 0 and 1, along with two binary functions for addition and multiplication (and possibly a unary function for additive inverses). For partial orderings, we just have one binary relation. Any such choice gives rise to a *language*.

Once we fix such a language, we can build up formulas that will express meaningful mathematical statements. For example, we mentioned in the introduction that \(\forall x\forall y(f(x,y)=f(y,x))\) is a formula in the language of groups. Now, in isolation, this formula is neither true nor false, just like the propositional formula \(A\wedge(B\vee C)\) is neither true nor false without a truth assignment. The analogue to a truth assignment in first-order logic is called a *structure*. In this setting, a structure provides an interpretation for all of the symbols, and once we fix a structure (i.e. once we fix an actual group, ring, partial ordering, and so on), we can ask whether a formula is true in that world.

Building up the fundamental definitions (like formulas and structures) will take some time. Our experience with propositional logic will certainly help here, but the complexity is considerably higher now.

## 4.1 Terms and Formulas

Since our logic will have quantifiers, the first thing that we need is a collection of variables, like the \(x\) and \(y\) in the formula \(\forall x\forall y(f(x,y)=f(y,x))\). As our formulas will consist of only finitely many characters, and since we will want to ensure that we always have a fresh variable around if we need it, we start by fixing a large enough set.

**Definition 4.1.1** &nbsp; Fix a countably infinite set \(\mathrm{Var}\), and call the elements *variables*.

We now define a language \(\mathcal L\), which is the analogue of the set \(P\) from propositional logic. As mentioned, we want to allow flexibility in the number and types of symbols here, depending on what field of mathematics we want to model.

**Definition 4.1.2** &nbsp; A *first-order language*, or simply a *language*, consists of the following:

1. A set \(\mathrm{ConSym}\) of *constant symbols*.
2. A set \(\mathrm{FuncSym}\) of *function symbols* together with a function \(\mathrm{Arity}_{\mathrm{FuncSym}}:\mathrm{FuncSym}\to\mathbb N^+\).
3. A set \(\mathrm{RelSym}\) of *relation symbols* together with a function \(\mathrm{Arity}_{\mathrm{RelSym}}:\mathrm{RelSym}\to\mathbb N^+\).

We also assume that \(\mathrm{ConSym}\), \(\mathrm{RelSym}\), \(\mathrm{FuncSym}\), \(\mathrm{Var}\), and \(\{\top,\bot,\neg,\wedge,\vee,\to,\forall,\exists,=\}\) are pairwise disjoint. For each \(k\in\mathbb N^+\), we let

\[
\mathrm{FuncSym}_k=\{f\in\mathrm{FuncSym}:\mathrm{Arity}_{\mathrm{FuncSym}}(f)=k\},
\]

and we let

\[
\mathrm{RelSym}_k=\{R\in\mathrm{RelSym}:\mathrm{Arity}_{\mathrm{RelSym}}(R)=k\}.
\]

Finally, given a language \(\mathcal L\), we let

\[
\mathrm{Sym}_{\mathcal L}=\mathrm{ConSym}\cup\mathrm{RelSym}\cup\mathrm{FuncSym}\cup\mathrm{Var}\cup\{\top,\bot,\neg,\wedge,\vee,\to,\exists,\forall,=\}.
\]

Suppose that we want to create a language that is suitable for group theory. As described in the introduction, one option would be to let \(\mathrm{ConSym}=\{e\}\), let \(\mathrm{FuncSym}=\{f\}\) where \(f\) has arity 2, and let \(\mathrm{RelSym}=\varnothing\). Intuitively, the symbol \(e\) will represent the identity and \(f\) will represent the group operation. Alternatively, we could let \(\mathrm{ConSym}=\{e\}\), let \(\mathrm{FuncSym}=\{f,g\}\) where \(f\) has arity 2 and \(g\) has arity 1, and let \(\mathrm{RelSym}=\varnothing\). In this setting, \(g\) will represent the inverse operation in the group. In other words, even when we have an area of mathematics in mind, there may be several suitable languages that we will have to choose between. At this point, it may seem like a matter of taste. However, we will eventually see how the choice of language affects other concepts that we will define (see Section 4.3 and Section 5.2).

A set together with an associative binary operation and an identity element is called a *monoid*. Monoids form a wider class than groups because elements of a monoid need not have inverses. For example, the set \(\mathbb N\) with binary operation \(+\) and identity \(0\) is a monoid but not a group. Of the preceding two languages, the former is also suitable for the study of monoids, but the latter is not. After all, how would we interpret \(g\)? With this in mind, we will call the first language (the one with only one function symbol) the *language of monoids*, and we will call the other the *language of groups*. We certainly can (and will) use both languages to study groups, but it is useful to have a clear naming distinction between the two languages.

Note that the particular names for symbols do not matter much. In other words, we can use a binary function symbol \(h\) instead of \(f\) in the language of monoids. Alternatively, we can use a more natural binary function symbol, like \(\cdot\) or \(\star\), which is typically written as an infix operator. Thus, we might write “consider the language \(\{e,\cdot\}\) of monoids” or “consider the language \(\{e,\cdot,i\}\) of groups.” In the latter case, \(i\) is the unary function symbol that we intend to use for inversion.

Now consider the language where \(\mathrm{ConSym}=\varnothing\), \(\mathrm{FuncSym}=\varnothing\), and \(\mathrm{RelSym}=\{R\}\) where \(R\) has arity 2, so we have just one binary relation symbol. As mentioned in the introduction, this language is suitable for working with partial orderings. However, it would also serve as a language for working with equivalence relations or with (directed) graphs. Thus, one language can be repurposed for different areas of mathematics.

Once we have chosen a language, we have fixed the collection of symbols that are available. Now we need to determine how to generate formulas like \(\forall x\forall y(f(x,y)=f(y,x))\) in the language of monoids. But we first need a way to name elements. Intuitively, our constant symbols and variables name elements once we have fixed an interpretation (i.e. once we have fixed a *structure*, which we will define in the next section). However, we can form more complex names for elements when we have function symbols. For example, in our language \(\{e,f,g\}\) of groups, if \(x\) and \(y\) are variables, then the \(f(x,y)\) in the above formula would also name an element. We can then go on to form more complex names from here, such as \(f(f(x,y),x)\) or \(f(e,g(y))\). The idea therefore is to start with the constant symbols and variables, and then generate new names by repeatedly applying function symbols. As we have started to appreciate from our exposure to prefix notation, we can actually omit the parentheses and commas. Putting it all together, we obtain the following definition.

**Definition 4.1.3** &nbsp; Let \(\mathcal L\) be a language. For each \(f\in\mathrm{FuncSym}_k\), define

\[
h_f:(\mathrm{Sym}_{\mathcal L}^{*})^k\to\mathrm{Sym}_{\mathcal L}^{*}
\]

by letting

\[
h_f(\sigma_1,\ldots,\sigma_k)=f\sigma_1\cdots\sigma_k.
\]

We then define

\[
\mathrm{Term}_{\mathcal L}=G(\mathrm{Sym}_{\mathcal L}^{*},\mathrm{ConSym}\cup\mathrm{Var},\{h_f:f\in\mathrm{FuncSym}\}),
\]

and call the elements of \(\mathrm{Term}_{\mathcal L}\) the *terms* of the language.

Now that we have terms, which intuitively name elements once we have fixed an interpretation, we can start to think about formulas. In propositional logic, our most basic formulas were the symbols from \(P\) themselves (together with \(\top\) and \(\bot\)). In this new setting, the basic formulas are more interesting. The idea is that the most fundamental things that we can say are whether two elements are equal, and whether a given \(k\)-tuple of elements is in the interpretation of some relation symbol \(R\in\mathrm{RelSym}_k\).

**Definition 4.1.4** &nbsp; Let \(\mathcal L\) be a language. An *atomic formula* is an element of one of the following two sets:

- \(\{Rt_1\cdots t_k:k\in\mathbb N^+,R\in\mathrm{RelSym}_k,\text{ and }t_1,\ldots,t_k\in\mathrm{Term}_{\mathcal L}\}\).
- \(\{=t_1t_2:t_1,t_2\in\mathrm{Term}_{\mathcal L}\}\).

We let \(\mathrm{AtomicForm}_{\mathcal L}\) be the union of these two sets.

Starting with atomic formulas together with \(\top\) and \(\bot\), we now generate more complex formulas by introducing our old propositional logic connectives and by allowing the use of quantifiers.

**Definition 4.1.5** &nbsp; Let \(\mathcal L\) be a language. Define a unary function \(h_{\neg}\) and binary functions \(h_{\wedge}\), \(h_{\vee}\), and \(h_{\to}\) on \(\mathrm{Sym}_{\mathcal L}^{*}\) as follows:

\[
\begin{aligned}
h_{\neg}(\sigma)&=\neg\sigma\\
h_{\wedge}(\sigma,\tau)&=\wedge\sigma\tau\\
h_{\vee}(\sigma,\tau)&=\vee\sigma\tau\\
h_{\to}(\sigma,\tau)&=\to\sigma\tau.
\end{aligned}
\]

Also, for each \(x\in\mathrm{Var}\), define two unary functions \(h_{\forall,x}\) and \(h_{\exists,x}\) on \(\mathrm{Sym}_{\mathcal L}^{*}\) as follows:

\[
\begin{aligned}
h_{\forall,x}(\sigma)&=\forall x\sigma\\
h_{\exists,x}(\sigma)&=\exists x\sigma.
\end{aligned}
\]

We now define

\[
\mathrm{Form}_{\mathcal L}=G(\mathrm{Sym}_{\mathcal L}^{*},\mathrm{AtomicForm}_{\mathcal L}\cup\{\top,\bot\},\{h_{\neg},h_{\wedge},h_{\vee},h_{\to}\}\cup\{h_{\forall,x},h_{\exists,x}:x\in\mathrm{Var}\}).
\]

Elements of \(\mathrm{Form}_{\mathcal L}\) are called *formulas*.

As with propositional logic, we would like to be able to define things recursively, so we need to check that our generating systems are free. Notice that in the construction of formulas, we have two generating systems around. We first generate all terms. With terms in hand, we use them to define the atomic formulas, and from there we generate all formulas. Thus, we will need to prove that two generating systems are free. The general idea is to make use of the insights gained by proving the corresponding result for prefix notation in propositional logic, so we set up a system of weights so that completed objects have weight 1. We assign each of \(\wedge\), \(\vee\), and \(\to\) a weight of \(-1\), as they each anticipate two completed objects to come later. Analogously, if we have a function or relation symbol of arity 3, we should assign it a weight of \(-2\). If we pursue these ideas in full generality, we arrive at the following weight function.

**Definition 4.1.6** &nbsp; Let \(\mathcal L\) be a language. Define \(W:\mathrm{Sym}_{\mathcal L}^{*}\to\mathbb Z\) as follows. We first define \(w:\mathrm{Sym}_{\mathcal L}\to\mathbb Z\) as follows:

\[
\begin{aligned}
w(\top)&=1=w(\bot)\\
w(c)&=1 &&\text{for all }c\in\mathrm{ConSym}\\
w(f)&=1-k &&\text{for all }f\in\mathrm{FuncSym}_k\\
w(R)&=1-k &&\text{for all }R\in\mathrm{RelSym}_k\\
w(x)&=1 &&\text{for all }x\in\mathrm{Var}\\
w(=)&=-1\\
w(Q)&=-1 &&\text{for all }Q\in\{\forall,\exists\}\\
w(\neg)&=0\\
w(\diamond)&=-1 &&\text{for all }\diamond\in\{\wedge,\vee,\to\}.
\end{aligned}
\]

We then define \(W:\mathrm{Sym}_{P}^{*}\to\mathbb Z\) by letting \(W(\lambda)=0\) and letting

\[
W(\sigma)=\sum_{i<|\sigma|}w(\sigma(i))
\]

for all \(\sigma\in\mathrm{Sym}_{\mathcal L}^{*}\setminus\{\lambda\}\).

With this definition in hand, we can now prove that the generating system for terms is free by following the template in Section 3.1. We have the following analogues of Proposition 3.1.8 and Theorem 3.1.9. The proofs are direct generalizations of those arguments.

**Proposition 4.1.7** &nbsp; *Let \(\mathcal L\) be a language.*

1. *For all \(t\in\mathrm{Term}_{\mathcal L}\), we have \(W(t)=1\).*
2. *If \(t\in\mathrm{Term}_{\mathcal L}\) and \(\sigma\sqsubset t\), then \(W(\sigma)\leq 0\).*
3. *If \(t,u\in\mathrm{Term}_{\mathcal L}\), then \(t\not\sqsubset u\).*

**Theorem 4.1.8** &nbsp; *The generating system \((\mathrm{Sym}_{\mathcal L}^{*},\mathrm{ConSym}\cup\mathrm{Var},\{h_f:f\in\mathrm{FuncSym}\})\) is free.*

With terms taken care of, we can also prove the corresponding result about formulas. The statements and proofs are completely analogous.

**Proposition 4.1.9** &nbsp; *Let \(\mathcal L\) be a language.*

1. *For all \(\varphi\in\mathrm{Form}_{\mathcal L}\), we have \(W(\varphi)=1\).*
2. *If \(\varphi\in\mathrm{Form}_{\mathcal L}\) and \(\sigma\sqsubset\varphi\), then \(W(\sigma)\leq 0\).*
3. *If \(\varphi,\psi\in\mathrm{Form}_{\mathcal L}\), then \(\varphi\not\sqsubset\psi\).*

**Theorem 4.1.10** &nbsp; *The generating system \((\mathrm{Sym}_{\mathcal L}^{*},\mathrm{AtomicForm}_{\mathcal L}\cup\{\top,\bot\},\{h_{\neg},h_{\wedge},h_{\vee},h_{\to}\}\cup\{h_{\forall,x},h_{\exists,x}:x\in V\})\) is free.*

We have defined a formal syntax using prefix notation, but in the interest of human readability, we will often write our formulas informally using a more natural style. As in propositional logic, we will typically write \(\wedge\), \(\vee\), and \(\to\) using infix notation, that is, we will write \(\varphi\wedge\psi\) rather than \(\wedge\varphi\psi\). We will now extend that practice to our new equality symbol (so given terms \(t_1\) and \(t_2\), we will write \(t_1=t_2\) instead of \(=t_1t_2\)). As a result, we will sometimes need to use parentheses to clarify how to group terms. Moreover, for function symbols and relations symbols, we will sometimes choose to include parentheses in the interest of human readability. For example, if \(f\) is a binary function symbol, we will typically write \(\forall x\forall y(f(x,y)=f(y,x))\) instead of \(\forall x\forall y=fxyfyx\). In addition, we will often embrace infix notation when we choose an appropriate binary function or relation symbol. For example, if we use the binary function symbol \(\cdot\) instead of \(f\) in the language of monoids, we can informally write \(\cdot\) between two arguments. In other words, instead of writing the proper formula \(\forall x\forall y=\mathbin{\cdot}xy\mathbin{\cdot}yx\) in this language, we will simply write \(\forall x\forall y(x\cdot y=y\cdot x)\). Finally, we will use \(\varphi\leftrightarrow\psi\) as an abbreviation for \((\varphi\to\psi)\wedge(\psi\to\varphi)\).

We will use many different languages throughout our study, but we give names to some of the most important ones, so that we do not have to describe the arities in detail every time we use them as examples.

**Definition 4.1.11**

1. The *language of monoids* has one constant symbol and one binary function symbol. We will typically use \(\mathcal L=\{e,\cdot\}\), where \(e\) is a constant symbol and \(\cdot\) is a binary function symbol, but we will occasionally use \(f\) for the binary function symbol.
2. The *language of groups* has one constant symbol, one binary function symbol, and one unary function symbol (intended for inverses). Typically, we will use either \(\mathcal L=\{e,\cdot,i\}\) or \(\mathcal L=\{e,f,i\}\), where \(i\) is a unary function symbol. If we are focusing on abelian groups, we might use \(\mathcal L=\{0,+,-\}\), where \(-\) is a unary function symbol.
3. The *language of equivalence relations* has one binary relation symbol, which we typically write as either \(R\) or \(\sim\).
4. The *language of (strict) orderings* has one binary relation symbol, which we typically write as \(<\).
5. The *language of graphs* has one binary relation symbol, which we typically write as either \(R\) or \(E\).
6. The *language of semirings* has two constant symbols \(0\) and \(1\), and two binary relation symbols \(+\) and \(\cdot\).
7. The *language of ordered semirings* is the language of semirings together with a binary relation symbol \(<\).
8. The *language of rings* is the language of semirings together with a unary function symbol \(-\) (intended for additive inverses).
9. The *language of ordered rings* is the language of rings together with a binary relation symbol \(<\).

With our freeness results, we are now able to define functions recursively on \(\mathrm{Term}_{\mathcal L}\) and \(\mathrm{Form}_{\mathcal L}\). Since we use terms in our definition of atomic formulas, we will often need to make two recursive definitions (first on the terms, and then on formulas) in order to define a function on formulas. Here is an example of how to define a function that produces the set of variables that occur in a given formula.

**Definition 4.1.12** &nbsp; Let \(\mathcal L\) be a language.

1. We first define a function \(\mathrm{OccurVar}:\mathrm{Term}_{\mathcal L}\to\mathcal P(\mathrm{Var})\) recursively as follows:

   - \(\mathrm{OccurVar}(c)=\varnothing\) for all \(c\in\mathrm{ConSym}\).
   - \(\mathrm{OccurVar}(x)=\{x\}\) for all \(x\in\mathrm{Var}\).
   - \(\mathrm{OccurVar}(ft_1\cdots t_k)=\bigcup_{i=1}^{k}\mathrm{OccurVar}(t_i)\) for all \(f\in\mathrm{FuncSym}_k\) and \(t_1,\ldots,t_k\in\mathrm{Term}_{\mathcal L}\).

2. We then define a function \(\mathrm{OccurVar}:\mathrm{Form}_{\mathcal L}\to\mathcal P(\mathrm{Var})\) recursively as follows:

   - \(\mathrm{OccurVar}(\top)=\varnothing\) and \(\mathrm{OccurVar}(\bot)=\varnothing\).
   - \(\mathrm{OccurVar}(Rt_1\cdots t_k)=\bigcup_{i=1}^{k}\mathrm{OccurVar}(t_i)\) for all \(R\in\mathrm{RelSym}_k\) and \(t_1,\ldots,t_k\in\mathrm{Term}_{\mathcal L}\).
   - \(\mathrm{OccurVar}(t_1=t_2)=\mathrm{OccurVar}(t_1)\cup\mathrm{OccurVar}(t_2)\) for all \(t_1,t_2\in\mathrm{Term}_{\mathcal L}\).
   - \(\mathrm{OccurVar}(\neg\varphi)=\mathrm{OccurVar}(\varphi)\) for all \(\varphi\in\mathrm{Form}_{\mathcal L}\).
   - \(\mathrm{OccurVar}(\varphi\diamond\psi)=\mathrm{OccurVar}(\varphi)\cup\mathrm{OccurVar}(\psi)\) for each \(\diamond\in\{\wedge,\vee,\to\}\) and \(\varphi,\psi\in\mathrm{Form}_{\mathcal L}\).
   - \(\mathrm{OccurVar}(Qx\varphi)=\mathrm{OccurVar}(\varphi)\cup\{x\}\) for each \(Q\in\{\forall,\exists\}\), \(x\in\mathrm{Var}\), and \(\varphi\in\mathrm{Form}_{\mathcal L}\).

Technically, we should probably use two different names for these functions, since they have very different domains. However, there is little risk of confusion (since \(\mathrm{Term}_{\mathcal L}\cap\mathrm{Form}_{\mathcal L}=\varnothing\) by Exercise 3), so we just overload the function name. Although \(\mathrm{OccurVar}\) does produce the set of variables in a formula, a given variable can occur in different ways within a formula. For example, if we are working in the language of monoids, and we let \(\varphi\) be the formula \(\forall y(f(x,y)=f(y,x))\), then \(\mathrm{OccurVar}(\varphi)=\{x,y\}\), but these two variables “sit” differently within the formula. Intuitively, the occurrences of \(y\) are *bound* by the quantifier, while the occurrences of \(x\) are *free* (i.e. not bound). We will have a great deal more to say about the distinction between free and bound variables, but we first define the recursive functions that produce the corresponding sets of variables.

**Definition 4.1.13** &nbsp; Let \(\mathcal L\) be a language.

1. We define a function \(\mathrm{FreeVar}:\mathrm{Form}_{\mathcal L}\to\mathcal P(\mathrm{Var})\) recursively as follows.

   - \(\mathrm{FreeVar}(\top)=\varnothing\) and \(\mathrm{FreeVar}(\bot)=\varnothing\).
   - \(\mathrm{FreeVar}(Rt_1\cdots t_k)=\bigcup_{i=1}^{k}\mathrm{OccurVar}(t_i)\) for all \(R\in\mathrm{RelSym}_k\) and \(t_1,\ldots,t_k\in\mathrm{Term}_{\mathcal L}\).
   - \(\mathrm{FreeVar}(t_1=t_2)=\mathrm{OccurVar}(t_1)\cup\mathrm{OccurVar}(t_2)\) for all \(t_1,t_2\in\mathrm{Term}_{\mathcal L}\).
   - \(\mathrm{FreeVar}(\neg\varphi)=\mathrm{FreeVar}(\varphi)\) for all \(\varphi\in\mathrm{Form}_{\mathcal L}\).
   - \(\mathrm{FreeVar}(\varphi\diamond\psi)=\mathrm{FreeVar}(\varphi)\cup\mathrm{FreeVar}(\psi)\) for each \(\diamond\in\{\wedge,\vee,\to\}\) and \(\varphi,\psi\in\mathrm{Form}_{\mathcal L}\).
   - \(\mathrm{FreeVar}(Qx\varphi)=\mathrm{FreeVar}(\varphi)\setminus\{x\}\) for each \(Q\in\{\forall,\exists\}\), \(x\in\mathrm{Var}\), and \(\varphi\in\mathrm{Form}_{\mathcal L}\).

2. We define a function \(\mathrm{BoundVar}:\mathrm{Form}_{\mathcal L}\to\mathcal P(\mathrm{Var})\) recursively as follows.

   - \(\mathrm{BoundVar}(\top)=\varnothing\) and \(\mathrm{BoundVar}(\bot)=\varnothing\).
   - \(\mathrm{BoundVar}(Rt_1\cdots t_k)=\varnothing\) for all \(R\in\mathrm{RelSym}_k\) and \(t_1,\ldots,t_k\in\mathrm{Term}_{\mathcal L}\).
   - \(\mathrm{BoundVar}(t_1=t_2)=\varnothing\) for all \(t_1,t_2\in\mathrm{Term}_{\mathcal L}\).
   - \(\mathrm{BoundVar}(\neg\varphi)=\mathrm{BoundVar}(\varphi)\) for all \(\varphi\in\mathrm{Form}_{\mathcal L}\).
   - \(\mathrm{BoundVar}(\varphi\diamond\psi)=\mathrm{BoundVar}(\varphi)\cup\mathrm{BoundVar}(\psi)\) for each \(\diamond\in\{\wedge,\vee,\to\}\) and \(\varphi,\psi\in\mathrm{Form}_{\mathcal L}\).
   - \(\mathrm{BoundVar}(Qx\varphi)=\mathrm{BoundVar}(\varphi)\cup\{x\}\) for each \(Q\in\{\forall,\exists\}\), \(x\in\mathrm{Var}\), and \(\varphi\in\mathrm{Form}_{\mathcal L}\).

Returning to our example formula \(\varphi\) that is equal to \(\forall y(f(x,y)=f(y,x))\), in the language of monoids, we have that \(\mathrm{FreeVar}(\varphi)=\{x\}\) and \(\mathrm{BoundVar}(\varphi)=\{y\}\). However, notice that it is possible for a variable to be both free and bound in one formula. For example, if we continue to work in the same language, but consider the formula \(\psi\) equal to \((f(x,x)=x)\wedge\exists x\neg(x=e)\), then we have \(\mathrm{FreeVar}(\psi)=\{x\}=\mathrm{BoundVar}(\psi)\). In other words, some occurrences of \(x\) are free and others are bound.

**Definition 4.1.14** &nbsp; Let \(\mathcal L\) be a language and let \(\varphi\in\mathrm{Form}_{\mathcal L}\). We say that \(\varphi\) is an *\(\mathcal L\)-sentence*, or simply a *sentence*, if \(\mathrm{FreeVar}(\varphi)=\varnothing\). We let \(\mathrm{Sent}_{\mathcal L}\) be the set of sentences.

As we will see, sentences will play an important role for us, since they do not have any “hanging” variables that fail to be within the scope of a quantifier.

## 4.2 Structures

Up until this point, we have only defined certain special finite sequences of symbols. We have not attached any *meaning* to those sequences of symbols. Sure, our motivation was to capture important mathematical contexts with our various languages and the way we have chosen to define formulas, but we only described the grammar in the previous section. If we want a formula to actually express something, we need to set up a context in which to interpret it. In propositional logic, we needed a truth assignment on \(P\) to give a meaning to a formula. Since we have quantifiers now, the first thing we will need is a nonempty set \(M\) to serve as the domain of objects that the quantifiers range over. Once we have fixed that, we need to interpret the symbols of our language as actual elements of our set (in the case of constant symbols \(c\)), actual \(k\)-ary relations on \(M\) (in the case of \(k\)-ary relation symbols \(R\)), and actual \(k\)-ary functions on \(M\) (in the case of \(k\)-ary function symbols \(f\)).

**Definition 4.2.1** &nbsp; Let \(\mathcal L\) be a language. An *\(\mathcal L\)-structure*, or simply a *structure*, is a sequence

\[
\mathcal M=(M,g_{\mathrm{ConSym}},g_{\mathrm{FuncSym}},g_{\mathrm{RelSym}})
\]

where:

- \(M\) is a nonempty set, called the *universe* of \(\mathcal M\).
- \(g_{\mathrm{ConSym}}:\mathrm{ConSym}\to M\).
- \(g_{\mathrm{RelSym}}\) is a function on \(\mathrm{RelSym}\) such that \(g_{\mathrm{RelSym}}(R)\) is a subset of \(M^k\) for all \(R\in\mathrm{RelSym}_k\).
- \(g_{\mathrm{FuncSym}}\) is a function on \(\mathrm{FuncSym}\) such that \(g_{\mathrm{FuncSym}}(f)\) is a \(k\)-ary function on \(M\) for all \(f\in\mathrm{FuncSym}_k\).

We use the following notation:

- For each \(c\in\mathrm{ConSym}\), we use \(c^{\mathcal M}\) to denote \(g_{\mathrm{ConSym}}(c)\).
- For each \(R\in\mathrm{RelSym}_k\), we use \(R^{\mathcal M}\) to denote \(g_{\mathrm{RelSym}}(R)\).
- For each \(f\in\mathrm{FuncSym}_k\), we use \(f^{\mathcal M}\) to denote \(g_{\mathrm{FuncSym}}(f)\).

Unless otherwise noted, we will use the same letter for the structure and the underlying set, but with different styling (as we did for \(\mathcal M\) and \(M\) in the definition).

For example, let \(\mathcal L=\{e,f,i\}\) be the language of groups. To give an \(\mathcal L\)-structure, we need to provide a set of elements \(M\) to serve as the universe of discourse, pick an element of \(M\) to serve as

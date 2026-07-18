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

For example, let \(\mathcal L=\{e,f,i\}\) be the language of groups. To give an \(\mathcal L\)-structure, we need to provide a set of elements \(M\) to serve as the universe of discourse, pick an element of \(M\) to serve as the interpretation of \(e\), pick a function from \(M^2\) to \(M\) to serve as the interpretation of \(f\), and pick a function from \(M\) to \(M\) to serve as the interpretation of \(i\). Here are some examples of \(\mathcal L\)-structures:

1. \(M=\mathbb Z\), \(e^{\mathcal M}=3\), \(f^{\mathcal M}\) is the subtraction function \((m,n)\mapsto m-n\), and \(i^{\mathcal M}\) is the constant function \(m\mapsto 27\).
2. \(M=\mathbb Z\), \(e^{\mathcal M}=0\), \(f^{\mathcal M}\) is the addition function \((m,n)\mapsto m+n\), and \(i^{\mathcal M}\) is the function \(m\mapsto m\).
3. \(M=\mathbb R\), \(e^{\mathcal M}=\pi\), \(f^{\mathcal M}\) is the function \((a,b)\mapsto\sin(a\cdot b)\), and \(i^{\mathcal M}\) is the function \(a\mapsto a^2\).
4. For any group \((G,e,\cdot)\), we get an \(\mathcal L\)-structure by letting \(M=G\), \(e^{\mathcal M}=e\), \(f^{\mathcal M}\) is the group operation, and \(i^{\mathcal M}\) is the function that outputs the inverse of the input.

In particular, notice that in the language \(\mathcal L\) of groups, there are \(\mathcal L\)-structures that are not groups! And in the second example, we have a set with a valid group operation, but \(i^{\mathcal M}\) is *not* the inverse function. In other words, an \(\mathcal L\)-structure need not respect our intentions when writing down the symbols of \(\mathcal L\).

For another example, let \(\mathcal L=\{R\}\) where \(R\) is a binary relation symbol. Here are some examples of \(\mathcal L\)-structures:

1. \(M=\mathbb N\) and \(R^{\mathcal M}=\{(m,n)\in M^2:m\mid n\}\).
2. \(M=\{0,1\}^{*}\) and \(R^{\mathcal M}=\{(\sigma,\tau)\in M^2:\sigma\sqsubset\tau\}\).
3. \(M=\mathbb R^2\) and \(R^{\mathcal M}=\{((a_1,b_1),(a_2,b_2))\in M^2:a_1=a_2\}\).
4. \(M=\{0,1,2,3,4\}\) and \(R^{\mathcal M}=\{(0,2),(3,1),(4,1),(4,2),(4,3)\}\).

Again, structures need not respect our intention when writing down a language. If we wrote down \(\mathcal L\) with the goal of creating a language for (strict) partial orderings (see Section A.2), then only the second structure above conforms to our intention. If we were thinking of weak partial orderings, then only the first succeeds. The third structure is an equivalence relation, which is a another mathematical context where \(\mathcal L\) would be appropriate. The fourth structure could be interpreted as a directed graph.

Although writing out the underlying set and interpretations of each symbol in the above style is sometimes appropriate, we now introduce some streamlined notation in order to refer to a structure.

**Notation 4.2.2** &nbsp; Let \(\mathcal L\) be a language with finitely many constant, relation, and function symbols. Suppose that we list these symbols of \(\mathcal L\) as \(c_1,\ldots,c_k,R_1,\ldots,R_\ell,f_1,\ldots,f_n\). Given a nonempty set \(M\) together with \(a_1,\ldots,a_k\in M\), relations \(R_1,\ldots,R_\ell\) on \(M\) of the appropriate arity, and functions \(f_1,\ldots,f_n\) on \(M\) of the appropriate arity, we write

\[
(M,a_1,\ldots,a_k,R_1,\ldots,R_\ell,f_1,\ldots,f_n)
\]

for the corresponding structure.

For example, suppose that we are working with the language \(\mathcal L=\{e,f\}\) of monoids. Instead of saying “Consider the \(\mathcal L\)-structure \(\mathcal M\) with \(M=\mathbb Z\), with \(e^{\mathcal M}=0\), and with \(f^{\mathcal M}(a,b)=a+b\),” we can just say “consider the \(\mathcal L\)-structure \((\mathbb Z,0,+)\).” Similarly, we can write \((\mathbb Q\setminus\{0\},1,\cdot)\) or \((\mathbb Z,3,-)\) to refer to the corresponding structures.

As we have emphasized, an \(\mathcal L\)-structure is *any* way to pick a set and a way to interpret the symbols as constants, relations, and functions (in a manner that respects arities). It is possible to carve out special collections of structures by only looking at those structures that make certain special formulas true (as we will see in Section 5.1), but we first have to define an analogue of \(\upsilon_M\) from propositional logic, which we proceed to do now.

Initially, it may appear than an \(\mathcal L\)-structure provides a means to make sense out of any formula. However, this is not the case, as we can see by looking at the formula \(x=y\) where \(x,y\in\mathrm{Var}\). Even if we have an \(\mathcal L\)-structure \(\mathcal M\) in hand, we cannot say whether the formula \(x=y\) is true in \(\mathcal M\) until we know how to interpret both \(x\) and \(y\). For a more interesting example, consider the language \(\mathcal L=\{e,f\}\) of monoids. Let \(\mathcal M\) be the integers \(\mathbb Z\) with \(e^{\mathcal M}=0\) and with \(f^{\mathcal M}\) being addition. Consider the formula \(fxy=z\). If we interpret \(x\) as \(7\), \(y\) as \(-3\), and \(z\) as \(4\), then the formula \(fxy=z\) is true in \(\mathcal M\). However, if we interpret \(x\) as \(-2\), \(y\) as \(7\), and \(z\) as \(1\), then the formula \(fxy=z\) is false in \(\mathcal M\). Once we fix an \(\mathcal L\)-structure \(\mathcal M\), the need to interpret the elements of \(\mathrm{Var}\) as elements of \(M\) motivates the following definition.

**Definition 4.2.3** &nbsp; Let \(\mathcal M\) be an \(\mathcal L\)-structure. A function \(s:\mathrm{Var}\to M\) is called a *variable assignment* on \(\mathcal M\).

Recall that in propositional logic, every truth assignment \(M:P\to\{0,1\}\) gave rise to a function \(\upsilon_M:\mathrm{Form}_P\to\{0,1\}\) telling us how to assign a true/false value to every formula. In the first-order logic case, we need an \(\mathcal L\)-structure \(\mathcal M\) together with a variable assignment \(s:\mathrm{Var}\to M\) to make sense of things. We first explain how such an apparatus allows us to assign an element of \(M\) to every term. We need to extend our function \(s:\mathrm{Var}\to M\) to a function \(\overline{s}:\mathrm{Term}_{\mathcal L}\to M\), similar to how we extended a truth assignment \(M\) to a function \(\upsilon_M\). The distinction here is that \(s\) and \(\overline{s}\) each output elements of \(M\) rather than true/false values.

**Definition 4.2.4** &nbsp; Let \(\mathcal M\) be an \(\mathcal L\)-structure, and let \(s:\mathrm{Var}\to M\) be a variable assignment. By freeness, we define a unique \(\overline{s}:\mathrm{Term}_{\mathcal L}\to M\) recursively as follows:

- \(\overline{s}(x)=s(x)\) for all \(x\in\mathrm{Var}\).
- \(\overline{s}(c)=c^{\mathcal M}\) for all \(c\in\mathrm{ConSym}\).
- \(\overline{s}(ft_1\cdots t_k)=f^{\mathcal M}(\overline{s}(t_1),\ldots,\overline{s}(t_k))\) for all \(f\in\mathrm{FuncSym}_k\) and all \(t_1,\ldots,t_k\in\mathrm{Term}_{\mathcal L}\).

There is nothing particularly deep going on in this definition. Given an \(\mathcal L\)-structure \(\mathcal M\) and a variable assignment \(s\), to apply \(\overline{s}\) to a term, we simply unravel the term and attach *meaning* to each symbol (using \(\mathcal M\) and \(s\)) as we bottom out through the recursion. For example, assume that \(\mathcal L=\{c,f\}\) where \(c\) is a constant symbol and \(f\) is a binary function symbol. Given an \(\mathcal L\)-structure \(\mathcal M\) and a variable assignment \(s:\mathrm{Var}\to M\), then working through the definitions, we have

\[
\begin{aligned}
\overline{s}(ffczfxffczy)
&=f^{\mathcal M}(\overline{s}(fcz),\overline{s}(fxffczy))\\
&=f^{\mathcal M}(f^{\mathcal M}(\overline{s}(c),\overline{s}(z)),f^{\mathcal M}(\overline{s}(x),\overline{s}(ffczy)))\\
&=f^{\mathcal M}(f^{\mathcal M}(\overline{s}(c),\overline{s}(z)),f^{\mathcal M}(\overline{s}(x),f^{\mathcal M}(\overline{s}(fcz),\overline{s}(y))))\\
&=f^{\mathcal M}(f^{\mathcal M}(\overline{s}(c),\overline{s}(z)),f^{\mathcal M}(\overline{s}(x),f^{\mathcal M}(f^{\mathcal M}(\overline{s}(c),\overline{s}(z)),\overline{s}(y))))\\
&=f^{\mathcal M}(f^{\mathcal M}(c^{\mathcal M},s(z)),f^{\mathcal M}(s(x),f^{\mathcal M}(f^{\mathcal M}(c^{\mathcal M},s(z)),s(y)))).
\end{aligned}
\]

In other words, we are taking the *syntactic* formula \(ffczfxffczy\) and assigning a *semantic* meaning to it by returning the element of \(\mathcal M\) described in the last line. For a specific example of how this would be interpreted, let \(\mathcal M=(\mathbb Z,5,+)\), that is, we have universe \(\mathbb Z\), \(c^{\mathcal M}=5\), and \(f^{\mathcal M}\) equal to the addition function. Let \(s:\mathrm{Var}\to M\) be an arbitrary variable assignment with \(s(x)=3\), \(s(y)=-11\), and \(s(z)=2\). We then have \(\overline{s}(ffczfxffczy)=6\), because

\[
\begin{aligned}
\overline{s}(ffczfxffczy)
&=f^{\mathcal M}(f^{\mathcal M}(c^{\mathcal M},s(z)),f^{\mathcal M}(s(x),f^{\mathcal M}(f^{\mathcal M}(c^{\mathcal M},s(z)),s(y))))\\
&=f^{\mathcal M}(f^{\mathcal M}(5,2),f^{\mathcal M}(3,f^{\mathcal M}(f^{\mathcal M}(5,2),-11)))\\
&=((5+2)+(3+((5+2)+(-11))))\\
&=6.
\end{aligned}
\]

Now we can actually define the analogue of \(\upsilon_M\) in first-order logic. Given an \(\mathcal L\)-structure \(\mathcal M\) and variable assignment \(s:\mathrm{Var}\to M\), we should be able to assign a truth value to every \(\varphi\in\mathrm{Form}_{\mathcal L}\). In other words, we should be able to define a function \(\upsilon_{(\mathcal M,s)}:\mathrm{Form}_{\mathcal L}\to\{0,1\}\), where the value \(0\) corresponds to false and the value \(1\) corresponds to true. Of course, the definition is recursive. In order to handle quantifiers, we will need to change the value of our variable assignment on one input. Given a function \(f:A\to B\) together with \(c\in A\) and \(d\in B\), we let \(f[c\rightsquigarrow d]\) denote the function that agrees with \(f\) everywhere, except it sends \(c\) to \(d\) (see Notation 1.5.10).

**Definition 4.2.5** &nbsp; Let \(\mathcal M\) be an \(\mathcal L\)-structure. We recursively define a function \(\upsilon_{(\mathcal M,s)}:\mathrm{Form}_{\mathcal L}\to\{0,1\}\) for all \(\varphi\in\mathrm{Form}_{\mathcal L}\) and all variable assignments \(s\) as follows:

- \(\upsilon_{(\mathcal M,s)}(\top)=1\) and \(\upsilon_{(\mathcal M,s)}(\bot)=0\).
- If \(R\in\mathrm{RelSym}_k\), and \(t_1,\ldots,t_k\in\mathrm{Term}_{\mathcal L}\), we let

  \[
  \upsilon_{(\mathcal M,s)}(Rt_1\cdots t_k)=
  \begin{cases}
  1 & \text{if }(\overline{s}(t_1),\ldots,\overline{s}(t_k))\in R^{\mathcal M},\\
  0 & \text{otherwise.}
  \end{cases}
  \]

- If \(t_1,t_2\in\mathrm{Term}_{\mathcal L}\), we let

  \[
  \upsilon_{(\mathcal M,s)}(t_1=t_2)=
  \begin{cases}
  1 & \text{if }\overline{s}(t_1)=\overline{s}(t_2),\\
  0 & \text{otherwise.}
  \end{cases}
  \]

- For any \(s\), we let

  \[
  \upsilon_{(\mathcal M,s)}(\neg\varphi)=
  \begin{cases}
  1 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=0,\\
  0 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=1.
  \end{cases}
  \]

- For any \(s\), we let

  \[
  \upsilon_{(\mathcal M,s)}(\varphi\wedge\psi)=
  \begin{cases}
  0 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=0\text{ and }\upsilon_{(\mathcal M,s)}(\psi)=0,\\
  0 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=0\text{ and }\upsilon_{(\mathcal M,s)}(\psi)=1,\\
  0 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=1\text{ and }\upsilon_{(\mathcal M,s)}(\psi)=0,\\
  1 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=1\text{ and }\upsilon_{(\mathcal M,s)}(\psi)=1.
  \end{cases}
  \]

- For any \(s\), we let

  \[
  \upsilon_{(\mathcal M,s)}(\varphi\vee\psi)=
  \begin{cases}
  0 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=0\text{ and }\upsilon_{(\mathcal M,s)}(\psi)=0,\\
  1 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=0\text{ and }\upsilon_{(\mathcal M,s)}(\psi)=1,\\
  1 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=1\text{ and }\upsilon_{(\mathcal M,s)}(\psi)=0,\\
  1 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=1\text{ and }\upsilon_{(\mathcal M,s)}(\psi)=1.
  \end{cases}
  \]

- For any \(s\), we let

  \[
  \upsilon_{(\mathcal M,s)}(\varphi\to\psi)=
  \begin{cases}
  1 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=0\text{ and }\upsilon_{(\mathcal M,s)}(\psi)=0,\\
  1 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=0\text{ and }\upsilon_{(\mathcal M,s)}(\psi)=1,\\
  0 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=1\text{ and }\upsilon_{(\mathcal M,s)}(\psi)=0,\\
  1 & \text{if }\upsilon_{(\mathcal M,s)}(\varphi)=1\text{ and }\upsilon_{(\mathcal M,s)}(\psi)=1.
  \end{cases}
  \]

- For any \(s\), we let

  \[
  \upsilon_{(\mathcal M,s)}(\exists x\varphi)=
  \begin{cases}
  1 & \text{if there exists }a\in M\text{ with }\upsilon_{(\mathcal M,s[x\rightsquigarrow a])}(\varphi)=1,\\
  0 & \text{otherwise.}
  \end{cases}
  \]

- For any \(s\), we let

  \[
  \upsilon_{(\mathcal M,s)}(\forall x\varphi)=
  \begin{cases}
  1 & \text{if for all }a\in M,\text{ we have }\upsilon_{(\mathcal M,s[x\rightsquigarrow a])}(\varphi)=1,\\
  0 & \text{otherwise.}
  \end{cases}
  \]

Our recursive definition does not strictly fit within our framework from Chapter 2, because some recursive calls change the variable assignment. If desired, we can provide an alternative (but slightly less intuitive) formulation that avoids this issue. Definition 4.2.5 tried to fix one \(\mathcal L\)-structure \(\mathcal M\) together with one variable assignment \(s\) on \(\mathcal M\), and then perform a recursive definition on \(\varphi\in\mathrm{Form}_{\mathcal L}\) to output a truth value in \(\{0,1\}\). Since we change variable assignments, we can bake that into the recursion. That is, we fix an \(\mathcal L\)-structure \(\mathcal M\), and perform a recursive definition on \(\varphi\in\mathrm{Form}_{\mathcal L}\) to output the set of all variable assignments that make \(\varphi\) true. More formally, fix an \(\mathcal L\)-structure \(\mathcal M\), and let \(\mathrm{VarAssign}_{\mathcal M}\) be the set of all variable assignments on \(\mathcal M\). We then define a function \(g_{\mathcal M}:\mathrm{Form}_P\to\mathcal P(\mathrm{VarAssign}_{\mathcal M})\) recursively using the above rules as guides, with the intention that \(\upsilon_{(\mathcal M,s)}(\varphi)=1\) means that \(s\in g_{\mathcal M}(\varphi)\). Here are three representative examples of how to define \(g_{\mathcal M}\):

\[
\begin{aligned}
g_{\mathcal M}(Rt_1\cdots t_k)
  &=\{s\in\mathrm{VarAssign}_{\mathcal M}:(\overline{s}(t_1),\ldots,\overline{s}(t_k))\in R^{\mathcal M}\}\\
g_{\mathcal M}(\varphi\wedge\psi)
  &=g_{\mathcal M}(\varphi)\cap g_{\mathcal M}(\psi)\\
g_{\mathcal M}(\exists x\varphi)
  &=\bigcup_{a\in M}\{s\in\mathrm{VarAssign}_{\mathcal M}:s[x\rightsquigarrow a]\in g_{\mathcal M}(\varphi)\}.
\end{aligned}
\]

From here, we then *define* \(\upsilon_{(\mathcal M,s)}(\varphi)=1\) to mean that \(s\in g_{\mathcal M}(\varphi)\), and check that it has the properties just described.

Let’s consider a simple example. Let \(\mathcal L=\{R,f\}\), where \(R\) is a unary relation symbol and \(f\) is a unary function symbol. Let \(\mathcal M\) be the following \(\mathcal L\)-structure:

- \(M=\{0,1,2,3\}\).
- \(R^{\mathcal M}=\{1,3\}\).
- \(f^{\mathcal M}:M\to M\) is the function defined by

  \[
  f^{\mathcal M}(0)=3\qquad
  f^{\mathcal M}(1)=1\qquad
  f^{\mathcal M}(2)=0\qquad
  f^{\mathcal M}(3)=3.
  \]

We now evaluate \(\upsilon_{(\mathcal M,s)}(\varphi)\) for various choices of variable assignments \(s\) and formulas \(\varphi\).

1. For any variable assignment \(s:\mathrm{Var}\to M\), we have

   \[
   \begin{aligned}
   \upsilon_{(\mathcal M,s)}(\neg Rx)=1
   &\Longleftrightarrow \upsilon_{(\mathcal M,s)}(Rx)=0\\
   &\Longleftrightarrow \overline{s}(x)\notin R^{\mathcal M}\\
   &\Longleftrightarrow \overline{s}(x)=0\text{ or }\overline{s}(x)=2.
   \end{aligned}
   \]

2. For any variable assignment \(s:\mathrm{Var}\to M\), we have

   \[
   \begin{aligned}
   \upsilon_{(\mathcal M,s)}(\exists xRx)=1
   &\Longleftrightarrow \text{There exists }a\in M\text{ with }\upsilon_{(\mathcal M,s[x\rightsquigarrow a])}(Rx)=1\\
   &\Longleftrightarrow \text{There exists }a\in M\text{ with }\overline{s[x\rightsquigarrow a]}(x)\in R^{\mathcal M}\\
   &\Longleftrightarrow \text{There exists }a\in M\text{ with }s[x\rightsquigarrow a](x)\in R^{\mathcal M}\\
   &\Longleftrightarrow \text{There exists }a\in M\text{ with }a\in R^{\mathcal M}.
   \end{aligned}
   \]

   Since \(R^{\mathcal M}\neq\varnothing\), it follows that \(\upsilon_{(\mathcal M,s)}(\exists xRx)=1\) for all variable assignments \(s:\mathrm{Var}\to M\).

3. For any variable assignment \(s:\mathrm{Var}\to M\), we have

   \[
   \begin{aligned}
   &\upsilon_{(\mathcal M,s)}(\forall x(Rx\to(fx=x)))=1\\
   &\quad\Longleftrightarrow \text{For all }a\in M,\text{ we have }\upsilon_{(\mathcal M,s[x\rightsquigarrow a])}((Rx\to(fx=x)))=1\\
   &\quad\Longleftrightarrow \text{For all }a\in M,\text{ we have either}\\
   &\qquad\qquad \upsilon_{(\mathcal M,s[x\rightsquigarrow a])}(Rx)=0
      \text{ or }\upsilon_{(\mathcal M,s[x\rightsquigarrow a])}(fx=x)=1\\
   &\quad\Longleftrightarrow \text{For all }a\in M,\text{ we have either}\\
   &\qquad\qquad \overline{s[x\rightsquigarrow a]}(x)\notin R^{\mathcal M}
      \text{ or }\overline{s[x\rightsquigarrow a]}(fx)=\overline{s[x\rightsquigarrow a]}(x)\\
   &\quad\Longleftrightarrow \text{For all }a\in M,\text{ we have either}\\
   &\qquad\qquad s[x\rightsquigarrow a](x)\notin R^{\mathcal M}
      \text{ or }f^{\mathcal M}(\overline{s[x\rightsquigarrow a]}(x))=\overline{s[x\rightsquigarrow a]}(x)\\
   &\quad\Longleftrightarrow \text{For all }a\in M,\text{ we have either}\\
   &\qquad\qquad s[x\rightsquigarrow a](x)\notin R^{\mathcal M}
      \text{ or }f^{\mathcal M}(s[x\rightsquigarrow a](x))=s[x\rightsquigarrow a](x)\\
   &\quad\Longleftrightarrow \text{For all }a\in M,\text{ we have either }a\notin R^{\mathcal M}\text{ or }f^{\mathcal M}(a)=a.
   \end{aligned}
   \]

   Since \(0\notin R^{\mathcal M}\), \(f^{\mathcal M}(1)=1\), \(2\notin R^{\mathcal M}\), and \(f^{\mathcal M}(3)=3\), it follows that \(\upsilon_{(\mathcal M,s)}(\forall x(Rx\to(fx=x)))=1\) for all variable assignments \(s:\mathrm{Var}\to M\).

While we have carefully unwound the recursion in these simple examples, rest assured that we will not be working at this level of detail when we have concrete structures and formulas. For example, if we are working in the language of groups and we have a structure \(\mathcal M\) that is a group, we will simply assert that \(\upsilon_{(\mathcal M,s)}(\forall y(f(x,y)=f(y,x)))=1\) exactly when \(s(x)\) is in the center of the group. The formalism that we have established is wonderful because it provides a way to mathematically reason about formulas. It should not be used to turn simple things into complicated, notationally dense arguments.

We introduced the notation \(\upsilon_{(\mathcal M,s)}(\varphi)\) to correspond to our old notation \(\upsilon_M(\varphi)\). In propositional logic, we needed a truth assignment \(M:P\to\{0,1\}\) in order to assign true/false values to all formulas. In first-order logic, we need both an \(\mathcal L\)-structure \(\mathcal M\) and a variable assignment \(s:\mathrm{Var}\to M\) in order to assign true/false values to all formulas. Despite the advantages of the similar notation, it is tiresome to keep writing so much in the subscripts, and so people who work in mathematical logic have adopted other standard notation, which we now introduce.

**Notation 4.2.6** &nbsp; Let \(\mathcal L\) be a language, let \(\mathcal M\) be an \(\mathcal L\)-structure, let \(s:\mathrm{Var}\to M\) be a variable assignment, and let \(\varphi\in\mathrm{Form}_{\mathcal L}\). We write \((\mathcal M,s)\models\varphi\) to mean that \(\upsilon_{(\mathcal M,s)}(\varphi)=1\), and write \((\mathcal M,s)\not\models\varphi\) to mean that \(\upsilon_{(\mathcal M,s)}(\varphi)=0\).

In some ways, using the symbol \(\models\) is natural, because we are defining the semantic notion that \(\varphi\) is *true* in \((\mathcal M,s)\). However, in other ways, this notation is incredibly confusing. In propositional logic, we used the symbol \(\models\) only in \(\Gamma\models\varphi\), where \(\Gamma\subseteq\mathrm{Form}_P\) and \(\varphi\in\mathrm{Form}_P\). That is, we used \(\models\) for *semantic implication*, not semantic truth. Our new first-order logic notation would be akin to also writing \(M\models\varphi\) in propositional logic to mean that \(\upsilon_M(\varphi)=1\). Although we could have done that in Chapter 3, we avoided the temptation to overload the notation at that stage. We will eventually define \(\Gamma\models\varphi\) in first-order logic when \(\Gamma\subseteq\mathrm{Form}_{\mathcal L}\) and \(\varphi\in\mathrm{Form}_{\mathcal L}\) (see Section 6.1), and at that point we will just have to know which version of \(\models\) we are using based on what type of object appears on the left. Consider yourself warned!

With this new notation in hand, we can rewrite the recursive definition of \(\upsilon_{(\mathcal M,s)}\) in the following way:

- \((\mathcal M,s)\models\top\) and \((\mathcal M,s)\not\models\bot\).
- \((\mathcal M,s)\models Rt_1\cdots t_k\) if and only if \((\overline{s}(t_1),\ldots,\overline{s}(t_k))\in R^{\mathcal M}\).
- \((\mathcal M,s)\models t_1=t_2\) if and only if \(\overline{s}(t_1)=\overline{s}(t_2)\).
- For any \(s\), we have \((\mathcal M,s)\models\neg\varphi\) if and only if \((\mathcal M,s)\not\models\varphi\).
- For any \(s\), we have \((\mathcal M,s)\models\varphi\wedge\psi\) if and only if \((\mathcal M,s)\models\varphi\) and \((\mathcal M,s)\models\psi\).
- For any \(s\), we have \((\mathcal M,s)\models\varphi\vee\psi\) if and only if either \((\mathcal M,s)\models\varphi\) or \((\mathcal M,s)\models\psi\).
- For any \(s\), we have \((\mathcal M,s)\models\varphi\to\psi\) if and only if either \((\mathcal M,s)\not\models\varphi\) or \((\mathcal M,s)\models\psi\).
- For any \(s\), we have \((\mathcal M,s)\models\exists x\varphi\) if and only if there exists \(a\in M\) such that \((\mathcal M,s[x\rightsquigarrow a])\models\varphi\).
- For any \(s\), we have \((\mathcal M,s)\models\forall x\varphi\) if and only if for all \(a\in M\), we have \((\mathcal M,s[x\rightsquigarrow a])\models\varphi\).

In the preceding examples where we computed \(\upsilon_{(\mathcal M,s)}\), notice that only the values of \(s\) on the free variables in \(\varphi\) affected the value of \(\upsilon_{(\mathcal M,s)}(\varphi)\), that is, whether or not \((\mathcal M,s)\models\varphi\). In general, this seems intuitively clear, and we now state the corresponding precise result, which is the first-order analogue of Proposition 3.2.3.

**Proposition 4.2.7** &nbsp; *Let \(\mathcal M\) be an \(\mathcal L\)-structure.*

1. *Suppose that \(t\in\mathrm{Term}_{\mathcal L}\) and \(s_1,s_2:\mathrm{Var}\to M\) are two variable assignments such that \(s_1(x)=s_2(x)\) for all \(x\in\mathrm{OccurVar}(t)\). We then have \(\overline{s_1}(t)=\overline{s_2}(t)\).*
2. *Suppose that \(\varphi\in\mathrm{Form}_{\mathcal L}\) and \(s_1,s_2:\mathrm{Var}\to M\) are two variable assignments such that \(s_1(x)=s_2(x)\) for all \(x\in\mathrm{FreeVar}(\varphi)\). We then have \((\mathcal M,s_1)\models\varphi\) if and only if \((\mathcal M,s_2)\models\varphi\).*

*Proof.* &nbsp; Each of these is a straightforward induction, the first on \(t\in\mathrm{Term}_{\mathcal L}\) and the second on \(\varphi\in\mathrm{Form}_{\mathcal L}\). \(\square\)

In light of this result, we now introduce some streamlined notation that allows us to focus on the free variables of a formula in a given variable assignment.

**Notation 4.2.8** &nbsp; Let \(\mathcal L\) be a language.

1. When we write a formula \(\varphi(x_1,\ldots,x_n)\in\mathrm{Form}_{\mathcal L}\), we mean that \(\varphi\in\mathrm{Form}_{\mathcal L}\), that \(x_1,\ldots,x_n\in\mathrm{Var}\) are distinct variables, and that \(\mathrm{FreeVar}(\varphi)\subseteq\{x_1,\ldots,x_n\}\).
2. Suppose that \(\mathcal M\) is an \(\mathcal L\)-structure, \(\varphi(x_1,\ldots,x_n)\in\mathrm{Form}_{\mathcal L}\), and \(a_1,\ldots,a_n\in M\). We write \((\mathcal M,a_1,\ldots,a_n)\models\varphi\) to mean that \((\mathcal M,s)\models\varphi\) for some (any) \(s:\mathrm{Var}\to M\) with \(s(x_i)=a_i\) for all \(i\).
3. As a special case of (2), we have the following. Suppose that \(\mathcal M\) is an \(\mathcal L\)-structure and \(\sigma\in\mathrm{Sent}_{\mathcal L}\). We write \(\mathcal M\models\sigma\) to mean that \((\mathcal M,s)\models\sigma\) for some (any) \(s:\mathrm{Var}\to M\).

Suppose that we have two \(\mathcal L\)-structures \(\mathcal M\) and \(\mathcal N\). Given a general formula \(\varphi\in\mathrm{Form}_{\mathcal L}\), we cannot compare the truth of \(\varphi\) in \(\mathcal M\) to the truth of \(\varphi\) in \(\mathcal N\) because we need variable assignments. However, a variable assignment \(s_{\mathcal M}:\mathrm{Var}\to M\) on \(\mathcal M\) has no relationship to a variable assignment \(s_{\mathcal N}:\mathrm{Var}\to N\) on \(\mathcal N\), as they have different codomains. Fortunately, if \(\sigma\) is a *sentence*, then by Proposition 4.2.7, we do not need a variable assignment in order to determine whether \(\sigma\) is true in a structure. In other words, the fact that a given sentence can be evaluated to a true/false value without a variable assignment is precisely what allows us to compare sentences across structures with different underlying sets. With this background, we now introduce one of the central definitions in logic.

**Definition 4.2.9** &nbsp; Let \(\mathcal L\) be a language, and let \(\mathcal M\) and \(\mathcal N\) be \(\mathcal L\)-structures. We write \(\mathcal M\equiv\mathcal N\), and say that \(\mathcal M\) and \(\mathcal N\) are *elementarily equivalent*, if for all \(\sigma\in\mathrm{Sent}_{\mathcal L}\), we have \(\mathcal M\models\sigma\) if and only if \(\mathcal N\models\sigma\).

In other words, two structures are elementarily equivalent if the same sentences are true in each structure. Given two \(\mathcal L\)-structures \(\mathcal M\) and \(\mathcal N\), we can show that \(\mathcal M\not\equiv\mathcal N\) by giving an example of a sentence that is true in one structure but not true in the other. For example, let \(\mathcal L=\{<\}\) be the language of orderings. Consider the following four \(\mathcal L\)-structures:

- Let \(\mathcal M_1\) be \((\mathbb N,<)\), where \(<\) is the usual ordering.
- Let \(\mathcal M_2\) be \((\mathbb Z,<)\), where \(<\) is the usual ordering.
- Let \(\mathcal M_3\) be \((\mathbb Q,<)\), where \(<\) is the usual ordering.
- Let \(\mathcal M_4\) be \((\mathbb R,<)\), where \(<\) is the usual ordering.

Let \(\sigma\) be the sentence \(\exists x\forall y(x=y\vee x<y)\) saying that there exists a smallest element. We have that \(\mathcal M_1\models\sigma\), but \(\mathcal M_i\not\models\sigma\) for all \(i\in\{2,3,4\}\). Thus, \(\mathcal M_1\not\equiv\mathcal M_i\) for all \(i\in\{2,3,4\}\). We can also find a sentence that distinguishes \(\mathcal M_2\) from the last two structures. Let \(\tau\) be the sentence \(\forall x\forall y(x<y\to\exists z(x<z\wedge z<y))\) saying that the ordering is *dense* (i.e. that between any two elements we can find another element). We then have that \(\mathcal M_2\not\models\tau\), but \(\mathcal M_i\models\tau\) for each \(i\in\{3,4\}\). Thus, \(\mathcal M_2\not\equiv\mathcal M_i\) for each \(i\in\{3,4\}\). If we try to find a sentence that distinguishes between \(\mathcal M_3\) and \(\mathcal M_4\), we will run into problems, because we will show (see Corollary 6.5.22) that \(\mathcal M_3\equiv\mathcal M_4\).

When we include additional symbols in our language, then we have additional formulas that can express more interesting things. For example, suppose that we work in the language \(\mathcal L=\{0,1,+,\cdot,<\}\) of ordered semirings. Let \(\mathcal M'_3\) be the structure \((\mathbb Q,0,1,+,\cdot,<)\) and let \(\mathcal M'_4\) be the structure \((\mathbb R,0,1,+,\cdot,<)\). In this case, we have \(\mathcal M'_3\not\equiv\mathcal M'_4\) because if we let \(\sigma\) be the sentence \(\exists x(x\cdot x=1+1)\), then \(\mathcal M'_3\not\models\sigma\) but \(\mathcal M'_4\models\sigma\).

As illustrated in this example, we will often have occasion to expand/restrict the language under consideration in order to alter the expressive power of our formulas. When we have a structure in the larger language, and we simply forget about a few of the symbols and their interpretations, then we obtain a structure in the smaller language. Here is the formal definition.

**Definition 4.2.10** &nbsp; Let \(\mathcal L\) and \(\mathcal L'\) be languages. Assume that \(\mathcal L\subseteq\mathcal L'\), by which we mean that every symbol in \(\mathcal L\) is a symbol in \(\mathcal L'\), and that the arities of the common relation and function symbols are preserved. Let \(\mathcal M'\) be an \(\mathcal L'\)-structure and let \(\mathcal M\) be an \(\mathcal L\)-structure. We say that \(\mathcal M\) is the *restriction* (or *reduct*) of \(\mathcal M'\) to \(\mathcal L\), and that \(\mathcal M'\) is an *expansion* of \(\mathcal M\) to \(\mathcal L'\), if the following conditions hold:

- \(M=M'\).
- \(c^{\mathcal M}=c^{\mathcal M'}\) for all \(c\in\mathrm{ConSym}\).
- \(R^{\mathcal M}=R^{\mathcal M'}\) for all \(R\in\mathrm{RelSym}\).
- \(f^{\mathcal M}=f^{\mathcal M'}\) for all \(f\in\mathrm{FuncSym}\).

In this case, we write \(\mathcal M=\mathcal M'\mathbin{\upharpoonright}\mathcal L\).

In the above situation, we had the language \(\mathcal L=\{<\}\) of orderings and the language \(\mathcal L'=\{0,1,+,\cdot,<\}\) of ordered semirings. The structure \(\mathcal M_3=(\mathbb Q,<)\) is the restriction of the \(\mathcal L'\)-structure \(\mathcal M'_3\) to the language \(\mathcal L\), and similarly for \(\mathcal M_4\). For another example, if we are working in the language \(\mathcal L'=\{0,1,+,-,\cdot\}\) of rings, and we have an \(\mathcal L'\)-structure \(\mathcal M'\), then we can form a restriction of \(\mathcal M'\) by keeping the same underlying set and same interpretations of \(0\), \(+\), and \(-\), but by also forgetting about \(1\) and \(\cdot\). In this case, we are restricting to the language \(\mathcal L=\{0,+,-\}\), which is the language of groups (albeit with different names for the constant and function symbols, but the names of the symbols do not really matter). Notice that if \(\mathcal M'\) happened to be a ring, then the restriction \(\mathcal M\) will be an abelian group.

It is intuitively clear that the truth of any formula in the restricted language is preserved between a structure and its restriction. The first thing to note is that if \(\mathcal L\subseteq\mathcal L'\), then \(\mathrm{Form}_{\mathcal L}\subseteq\mathrm{Form}_{\mathcal L'}\), which is just the analogue of part (1) of Proposition 3.1.11 in the first-order logic setting. Formally, we have the following analogue of Proposition 3.2.4.

**Proposition 4.2.11** &nbsp; *Let \(\mathcal L\subseteq\mathcal L'\) be languages, let \(\mathcal M'\) be an \(\mathcal L'\)-structure, and let \(\mathcal M=\mathcal M'\mathbin{\upharpoonright}\mathcal L\) be the restriction of \(\mathcal M'\) to \(\mathcal L\). For all \(\varphi\in\mathrm{Form}_{\mathcal L}\) and all \(s:\mathrm{Var}\to M\), we have \((\mathcal M,s)\models\varphi\) if and only if \((\mathcal M',s)\models\varphi\).*

*Proof.* &nbsp; By a straightforward (and boring) induction. \(\square\)

Before moving on, we note a fundamental difference between the world of propositional logic and the world of first-order logic. In the former case, suppose that we are working with a set \(P\) and we have a truth assignment \(M:P\to\{0,1\}\). Now \(P\) might be infinite, and hence \(M\) might be complicated, but if we have a given \(\varphi\in\mathrm{Form}_P\) together with the values of \(M\) on the finite set \(\mathrm{OccurVar}(\varphi)\), then we can easily compute the value of \(\upsilon_M(\varphi)\). Fundamentally, we just need to break down \(\varphi\) into its constituent pieces, recursively compute \(\upsilon_M\) on those pieces, and then use the rules to output \(\upsilon_M(\varphi)\).

While it is natural to believe that the same principle applies to first-order logic, the introduction of quantifiers changes the game. An \(\mathcal L\)-structure \(\mathcal M\) might contain infinitely many elements, and the quantifiers range over the elements of the set \(M\). If we follow the direct recursive definition, then in order to determine whether \((\mathcal M,s)\models\exists x\psi\), we need to check whether any of the values \(a\in M\) are such that \((\mathcal M,s[x\rightsquigarrow a])\models\psi\). Now if \(\mathcal L\) and \(M\) are both finite, and we know the value of the variable assignment on the finite set \(\mathrm{FreeVar}(\varphi)\), then we can exhaustively check everything by looping over all values (perhaps recursively) in order to determine whether \((\mathcal M,s)\models\varphi\). However, if \(M\) is infinite, then even if we have a way to compute the underlying set \(M\) together with interpretations of the relation and function symbols, and we know the value of the variable assignment on the finite set \(\mathrm{FreeVar}(\varphi)\), it is not at all clear whether we can computably determine whether or not \((\mathcal M,s)\models\varphi\).

For example, consider the structure \(\mathcal M=(\mathbb N,0,1,+,\cdot)\) in the language \(\mathcal L\) of semirings. Suppose that we even restrict to sentences. Is there an algorithm that will take as input an element \(\sigma\in\mathrm{Sent}_{\mathcal L}\) and will determine whether or not \(\mathcal M\models\sigma\)? We can express many interesting number-theoretic statements using such sentences, such as the twin prime conjecture (see Exercise 7) and the statement that Fermat’s Last Theorem holds for a given fixed exponent \(n\). Thus, if we had such a method, we could task a computer to determine the truth of various interesting problems (some of which are unsolved), and then just sit back and publish a paper when the computer finishes. Of course, there are some efficiency concerns (will the computer stop in a reasonable amount of time?), but in principle we would have reduced a great deal of number theory to a purely mechanistic process. And we can handle many other areas of mathematics by simply changing the language and the structure.

Fortunately (for the job prospects of mathematicians), we will eventually prove that there is no such algorithm for the structure \(\mathcal M=(\mathbb N,0,1,+,\cdot)\). Perhaps surprisingly, there are many important structures where such algorithms do exist, such as \((\mathbb R,0,1,+,\cdot)\) and \((\mathbb C,0,1,+,\cdot)\). We will address such questions in Chapter 12, but an important dividing line here is related to the concept of *definability*.

## 4.3 Introduction to Definability

A wonderful side effect of developing a formal language is the ability to talk about which subsets of a given structure can be described using only the symbols from that language.

**Definition 4.3.1** &nbsp; Let \(\mathcal M\) be an \(\mathcal L\)-structure, let \(k\in\mathbb N^+\), and let \(X\subseteq M^k\). We say that \(X\) is *definable* in \(\mathcal M\) if there exists \(\varphi(x_1,\ldots,x_k)\in\mathrm{Form}_{\mathcal L}\) such that

\[
X=\{(a_1,\ldots,a_k)\in M^k:(\mathcal M,a_1,\ldots,a_k)\models\varphi\}.
\]

In other words, a set \(X\subseteq M^k\) is definable in \(\mathcal M\) if we can find a formula \(\varphi\) with \(k\) free variables such that the formula is true in \(\mathcal M\) when we interpret the free variables as a \(k\)-tuple in \(X\), and is false when the \(k\)-tuple is not in \(X\). We consider several examples in the language \(\mathcal L=\{0,1,+,\cdot\}\) of semirings:

- The set \(X=\{1,-1\}\) is definable in the structure \((\mathbb Z,0,1,+,\cdot)\) as witnessed by the formula \(\varphi(x)\) given by \(x\cdot x=1\). Alternatively, we can use the formula \(\psi(x)\) given by \((x=1)\vee(x+1=0)\).
- The set \(X=\{n\in\mathbb N:n\text{ is prime}\}\) is definable in the structure \((\mathbb N,0,1,+,\cdot)\) as witnessed by the formula \(\varphi(x)\):

  \[
  \neg(x=1)\wedge\forall y\forall z(x=y\cdot z\to(y=1\vee z=1)).
  \]

- The set \(X=\{r\in\mathbb R:r\geq 0\}\) is definable in the structure \((\mathbb R,0,1,+,\cdot)\) as witnessed by the formula \(\varphi(x)\) given by \(\exists y(y\cdot y=x)\).
- The set \(X=\{(m,n)\in\mathbb N^2:m<n\}\) is definable in the structure \((\mathbb N,0,1,+,\cdot)\) as witnessed by the formula \(\varphi(x,y)\) given by \(\exists z(\neg(z=0)\wedge(x+z=y))\).

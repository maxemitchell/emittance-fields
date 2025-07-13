A Challenge around authorization

# Goal

<aside>
👉

**Implement a small software system, design an authorization layer around it, and document the process and the result.**

</aside>

This challenge is split into 3 parts:

1. **Build a simple system that does any type of work that has an inherent need for an authorization layer on top of it, ideally with collaboration in mind.**
2. **Design and build the authorization layer on top.**
3. **Document _what_ the system does (user POV), how it does it (engineering POV), and why it was designed that way (software designer POV) or the trade-offs behind most high-level decisions.**

An example of such systems is a personal digital bookshelf. There are many _authy_ actions: “<add> <book>”; “<edit> <review>”; “<delete> <book>”; and even collaborative ones like “<share> <book> with <person b>”.

## Challenge focus

The challenge, while generic, is centered around authorization within the context of a system. You should spend at least 50% of the time you allocate to this project designing, implementing, and reviewing the authorization component.

<aside>
⚠️

**In other words, this challenge will be evaluated holistically with a focus on authorization.**

</aside>

# On authorization

The best problems are easy to state but hard to implement.

Authorization is one of those problems.

Authorization is about determining someone’s **abilities** within an _operating system_[1].

Note, however, that I’m using the literal definition of “operating system”—as opposed to the connotative one that refers to Windows or GNU/Linux. The root word “_operat-_”[2] comes from the Latin verb “opus” or “oper-” which means “work”; the word “system” is a set of pieces working together as part of a mechanism. So, in our case, an operating system can be defined as follows:

> Operating System: a set of interconnected components that perform useful work*.*

With that definition in mind we could say that all modern digital systems are operating systems.

As such, when building your system, I recommend you draw inspiration from the greats and understand how authorization works in—and now I _am_ using the connotative definition—computer operating systems like UNIX or Windows NT for users, roles, and groups. You can find interesting articles in the [Recommended Resources](https://www.notion.so/Recommended-Resources-22f805facfb780778be7e0fb7133aa73?pvs=21) section below.

# Design, implementation, and review

As you can see, this challenge is quite open-ended.

This is by design.

There are no directions about what the system should be about as a way to (try to) measure your creativity; there are no directions around what libraries to use either as a way to assess how you solve the decision trade-off problem of _build versus ~~buy~~ import._

**You should expect to go over this challenge with me over a call after I have reviewed your code and writing asynchronously.**

## Implementation constraints

Having said that, there are some constraints to facilitate the review of this project:

1. Write this challenge in **JavaScript/TypeScript.**
2. If you want to use an authorization service for the auth layer, integrate with [**Supabase**](https://supabase.com)[3]**.**
3. If you will build a UI for the system, either use Vanilla JS or Svelte as most of the work should be around authorization around the system.

**Good luck.**

— Diego

---

# Footnotes

1. Not to be confused with authentication or the action of verifying someone’s _identity_, as opposed to their _abilities_, within a system.
2. _“done by labor”._
3. Technically you can do this challenge fully offline using only files or a local database. Up to you.

# Recommended Resources

- [CASL - an isomorphic auth js lib](https://casl.js.org/v6/en/)
- [Awesome authorization repository, by casbin](https://github.com/casbin/awesome-auth)
- [`node-casbin` or, an authorization library that supports many access control paradigms](https://github.com/casbin/node-casbin?tab=readme-ov-file)
- [Computer Security Model article via Wikipedia](https://en.wikipedia.org/wiki/Computer_security_model)
- [Access control in UNIX and Windows NT by Prof. Fred B. Schneider](https://www.cs.cornell.edu/courses/cs513/2005fa/L07.html)
- [ACLs wikipedia article](https://en.wikipedia.org/wiki/Access-control_list#POSIX_ACL)
- [RBAC wikipedia article](https://en.wikipedia.org/wiki/Role-based_access_control)

### [Parent README](https://github.com/jacomyal/sigma.js/blob/main/README.md)

***
___
---

## :books: Graph renderer (Sigma.js meta example)
This project is aimed to serve as an intermediate layer between your project and useful graph representation. Right now it ships as a full-stack application with TypeScript frontend and Flask backend and only serves as a representation.

---
---

### :construction: Under development!
Not even alpha. Supports only chromium for the moment!

---
---

### :pushpin: Initial roadmap:
1. Implement golden layout like there https://godbolt.org/
2. Add layers with filter masks
3. Move construction of diff to the server microservice

---
---

### :sparkles: Features:
#### :art: Feature 1: Rendering of clang AST and valgrind with UI

![Loading_AST](gif/loading-ast.gif)

---

![Loading_Callgrind](gif/callgrind-loading.gif)

---

#### :bar_chart: Feature 2: Getting histogram of tokens in file by count

![Histogram](gif/hist.gif)

---

#### :arrow_double_down: Feature 3: Getting all paths from one point to another

![Paths](gif/paths.gif)

---

#### :mag_right: Feature 4: Searching and filtering by nodes' attributes

  a) Let's say we want to delete functions from callgrind that appear to have no name:

  ![Filter1](gif/callgrind-filter-1.gif)

---

  b) Now let's delete leafs

  ![Filter2](gif/callgrind-filter-2.gif)

---

#### :balance_scale: Feature 5: Getting diff of revisions with locations for every node in each file

![Diff](gif/diff.gif)

---


#### :notebook: Feature 6: Searching AST by code

![Code](gif/code-search.gif)

---
---

### :gear: Setup
```bash
npm i \
&& cd examples/chrome_deps \
&& npm i
```
then probably
```bash
chmod +x replace-server-address.sh \
&& ./replace-server-address.sh localhost your_server_address.com
```
then
```bash
npm start
```
You're all set!
```bash
firefox localhost:3000
```

![Radius](gif/radius.gif)
# OUT path note

Repo validator computes `OUT = join(process.cwd(), process.env.HCDP_OUT_DIR)`.
On this Node runtime, an absolute `HCDP_OUT_DIR` is joined as a relative segment
(leading `/` stripped), which would nest under the worktree.

Wrapper `../run-matrix.mjs` therefore passes a **cwd-relative** `HCDP_OUT_DIR`
(`../ui-batch1-vf-fixes/docs/.../agent-regression/prod-matrix`) so evidence lands here.

Repo script was not modified. Historical `prod-matrix-v3` was not overwritten.

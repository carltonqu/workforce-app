import { createClient } from "@libsql/client";

const db = createClient({
  url: "https://clockroster-clockroster.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM3MzcwNDAsImlkIjoiMDE5Y2ZhZjYtZTkwMS03MzhhLTgxMTEtYzQyNmI2NDJmNDAxIiwicmlkIjoiYThmMjg3NmItNmU5MC00MjYyLWFmNzctOTg0NWU4ZDdlODRhIn0.zhvAe951oDBiMF_N2z-6iCnF7oCkyXPPVOoAVRj3k6CYp0WqfcLpbU0vyJFZK1GCunUcojO3jEoyjzgB_EOGBQ",
});

const r = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
console.log("Tables:", r.rows.map(x => x.name).join(", "));
process.exit(0);

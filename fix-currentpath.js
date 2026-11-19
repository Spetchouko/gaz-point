const fs = require("fs");
const files = [
  "/home/solomon/gaz-point/app/dashboard/admin/utilisateurs/vendeurs/page.tsx",
  "/home/solomon/gaz-point/app/dashboard/admin/utilisateurs/administrateurs/page.tsx",
  "/home/solomon/gaz-point/app/dashboard/admin/utilisateurs/collaborateurs/page.tsx",
  "/home/solomon/gaz-point/app/dashboard/admin/utilisateurs/tous/page.tsx",
];

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(/const currentPath = .*\n/, "");
  fs.writeFileSync(file, content);
  console.log("Fixed", file);
}
console.log("All done");
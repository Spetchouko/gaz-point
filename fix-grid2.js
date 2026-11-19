const fs = require("fs");
const files = [
  "/home/solomon/gaz-point/app/dashboard/admin/utilisateurs/clients/page.tsx",
  "/home/solomon/gaz-point/app/dashboard/admin/utilisateurs/vendeurs/page.tsx",
  "/home/solomon/gaz-point/app/dashboard/admin/utilisateurs/administrateurs/page.tsx",
  "/home/solomon/gaz-point/app/dashboard/admin/utilisateurs/collaborateurs/page.tsx",
  "/home/solomon/gaz-point/app/dashboard/admin/utilisateurs/tous/page.tsx",
];

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(
    /grid gap-3 grid-cols-1 sm:grid-cols-2/g,
    "grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
  );
  fs.writeFileSync(file, content);
  console.log("Fixed", file);
}
console.log("All done");
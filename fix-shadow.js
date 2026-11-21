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
  // Add shadow-sm to the base class of StatCard Link
  content = content.replace(
    /"group p-3 flex flex-col items-center transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-0 bg-card no-underline"/g,
    '"group p-3 flex flex-col items-center transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 border-0 bg-card no-underline"'
  );
  fs.writeFileSync(file, content);
  console.log("Fixed", file);
}
console.log("All done");
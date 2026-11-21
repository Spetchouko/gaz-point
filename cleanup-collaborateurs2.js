const fs = require("fs");
const filePath = "/home/solomon/gaz-point/app/dashboard/admin/collaborateurs/page.tsx";
let content = fs.readFileSync(filePath, "utf8");

// Remove saving state
content = content.replace(
  /const \[saving, setSaving\] = useState<Set<string>>\(new Set\(\)\);\n/,
  ""
);

// Remove roleColor function
content = content.replace(
  /\n\s*const roleColor = \(role: string\) => \{[\s\S]*?\n\s*\}\n/,
  "\n"
);

// Remove permissionLabels function
content = content.replace(
  /\n\s*const permissionLabels = \(perms: string\[\]\) =>\s*[\s\S]*?\n\s*\}\n/,
  "\n"
);

fs.writeFileSync(filePath, content);
console.log("Done");
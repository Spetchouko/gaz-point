const fs = require("fs");
const filePath = "/home/solomon/gaz-point/app/dashboard/admin/collaborateurs/page.tsx";
let content = fs.readFileSync(filePath, "utf8");

// Remove saving state declaration
content = content.replace(/const \[saving, setSaving\] = useState<Set<string>>\(new Set\(\)\);\n/, "");

fs.writeFileSync(filePath, content);
console.log("Done");
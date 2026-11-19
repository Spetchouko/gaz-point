const fs = require("fs");
const filePath = "/home/solomon/gaz-point/app/dashboard/admin/collaborateurs/page.tsx";
let content = fs.readFileSync(filePath, "utf8");

// Remove toggleCollaboratorStatus function
content = content.replace(
  /\n\s*\/\/ Toggle collaborator status\n\s*const toggleCollaboratorStatus = async \(id: string, currentActive: boolean\) => \{[\s\S]*?\n\s*\}\n/,
  "\n"
);

// Remove resetCollaboratorPassword function
content = content.replace(
  /\n\s*\/\/ Reset collaborator password \(generate new temporary password\)\n\s*const resetCollaboratorPassword = async \(id: string\) => \{[\s\S]*?\n\s*\}\n/,
  "\n"
);

fs.writeFileSync(filePath, content);
console.log("Done");
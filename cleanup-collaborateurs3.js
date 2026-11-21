const fs = require("fs");
const filePath = "/home/solomon/gaz-point/app/dashboard/admin/collaborateurs/page.tsx";
let content = fs.readFileSync(filePath, "utf8");

// Remove saving.has references in onSubmit
content = content.replace(/saving\.has\(c\.id\)/g, "false");
content = content.replace(/saving\.has\(editUser\?\.\?\s*\"\"\)/g, "false");
content = content.replace(/saving\.has\(deleteUser\?\.\?\s*\"\"\)/g, "false");
content = content.replace(/saving\.has\(viewPoint\?\.\?\s*\"\"\)/g, "false");
content = content.replace(/saving\.has\(suspendPoint\?\.\?\s*\"\"\)/g, "false");
content = content.replace(/saving\.has\(deletePoint\?\.\?\s*\"\"\)/g, "false");
content = content.replace(/saving\.has\(editItem\?\.\?\s*\"\"\)/g, "false");

fs.writeFileSync(filePath, content);
console.log("Done");
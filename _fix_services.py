#!/usr/bin/env python3
import io

# Corriger services/page.tsx
path = "/home/solomon/gaz-point/app/(public)/services/page.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Remplacer la fin incorrecte
old = "      </section>\n    </section>\n  )\n}"
new = "      </section>\n    </section>\n    </>\n  )\n}"
content = content.replace(old, new)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modification terminée pour services/page.tsx")

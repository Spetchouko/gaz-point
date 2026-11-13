#!/usr/bin/env python3
import io

path = "/home/solomon/gaz-point/app/(public)/devenir-vendeur/page.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Remplacer la fin incorrecte
old = "        </div>\n      </section>\n    </div>\n  )\n}"
new = "        </div>\n      </section>\n    </div>\n    </>\n  )\n}"
content = content.replace(old, new)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modification terminée pour devenir-vendeur/page.tsx")

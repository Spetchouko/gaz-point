#!/usr/bin/env python3
import io
import re

def add_webpage_jsonld(path, name, description, url):
    with io.open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Ajouter l'import de WebPageJsonLd s'il n'existe pas déjà
    if "WebPageJsonLd" not in content:
        # Trouver la dernière ligne d'import
        import_pattern = r'(import \{[^}]*\} from "@/app/_components/'
        match = re.search(import_pattern, content)
        if match:
            # Insérer après le dernier import
            last_import_end = match.end()
            content = content[:last_import_end] + "\nimport { WebPageJsonLd } from "@/app/_components/json-ld" + content[last_import_end:]

    # Ajouter le composant WebPageJsonLd avant le premier composant enfant
    # Chercher le premier <Composant / ou <Composant >
    old_return_pattern = r'(export default function \w+\(\)\s*\{[^}]*?\n)(\s*<)'
    match = re.search(old_return_pattern, content, re.DOTALL)
    if match:
        insert_pos = match.end(1)
        webpage_jsonld = f'''      <WebPageJsonLd
        name="{name}"
        description="{description}"
        url="{url}"
      />
'''
        content = content[:insert_pos] + webpage_jsonld + content[insert_pos:]

    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Modification terminée pour {path}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 5:
        print("Usage: python3 _add_webpage_jsonld2.py <path> <name> <description> <url>")
        sys.exit(1)
    add_webpage_jsonld(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])

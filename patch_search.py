content = open('/home/solomon/gaz-point/lib/search-service.ts', 'r').read()

# Find the second occurrence of deliveryFee: (in normalizeResultItem)
first_idx = content.find('deliveryFee:')
second_idx = content.find('deliveryFee:', first_idx + 1)

# Find from second_idx to the end of the normalizeResultItem function
# The function ends with '    }\n  }\n}' followed by newline and export
end_marker = '\n    }\n  }\n}\n\nexport const searchService'
end_idx = content.find(end_marker, second_idx)
if end_idx == -1:
    print("Could not find end marker")
else:
    # Extract from deliveryFee: to just before \nexport const searchService
    old_block = content[second_idx:end_idx]
    print("Old block:")
    print(repr(old_block))
    
    new_block = old_block.replace(
        '          : null,\n    }',
        '          : null,\n      distanceKm:\n        raw.distanceKm != null && !Number.isNaN(Number(raw.distanceKm))\n          ? Number(raw.distanceKm)\n          : null,\n    }'
    )
    
    content = content.replace(old_block, new_block, 1)
    open('/home/solomon/gaz-point/lib/search-service.ts', 'w').write(content)
    print("\nREPLACED")

with open('/home/solomon/gaz-point/app/(auth)/validation-email/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

features = {
    'AutoComplete one-time-code': 'autoComplete="one-time-code"' in content,
    'InputMode numeric': 'inputMode="numeric"' in content,
    'MaxLength 1': 'maxLength={1}' in content,
    'Auto-verification useEffect': 'verificationTriggeredRef.current === code' in content,
    'Verifying state': 'const [verifying, setVerifying]' in content,
    'Verification ref': 'verificationTriggeredRef' in content,
    'Verifying in button disabled': 'verifying || !email' in content,
    'Verifying in input disabled': 'verifying || !email' in content,
    'Verifying state reset on error': 'setVerifying(false)' in content,
    'Verification ref reset on error': 'verificationTriggeredRef.current = null' in content,
    'Verifying state in verifier': 'setVerifying(true)' in content,
}

print('=== OTP Auto-Verification Features ===')
for feature, status in features.items():
    print(f'  {"OK" if status else "MISSING"}: {feature}')

open_b = content.count('{')
close_b = content.count('}')
open_p = content.count('(')
close_p = content.count(')')
print(f'\nSyntax: Braces balanced={open_b==close_b}, Parens balanced={open_p==close_p}')
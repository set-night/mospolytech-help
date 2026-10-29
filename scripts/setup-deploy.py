#!/usr/bin/env python3
"""Pass a Pages-only token directly to GitHub's encrypted environment secret."""
import getpass
import subprocess

secret = getpass.getpass('Cloudflare Pages API token (ввод скрыт): ').strip()
if len(secret) < 20 or any(character.isspace() for character in secret):
    raise SystemExit('Похоже, токен введён некорректно. Секрет не сохранён.')
result = subprocess.run(
    ['gh', 'secret', 'set', 'CLOUDFLARE_API_TOKEN', '--env', 'production', '--repo', 'set-night/mospolytech-help'],
    input=secret.encode(), check=False,
)
secret = None
if result.returncode:
    raise SystemExit(result.returncode)
print('Токен сохранён в GitHub environment production. В файлы и историю команд он не записывался.')

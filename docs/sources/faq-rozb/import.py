#!/usr/bin/env python3
"""Snapshot the public FAQ. Run: uv run --with beautifulsoup4 docs/sources/faq-rozb/import.py"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
from xml.etree import ElementTree
import json
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parent
BASE='https://faq.rozb.pw/'
def fetch(url):
    return subprocess.check_output(['curl','--fail','--silent','--show-error','--location','--max-time','30',url]).decode()

def article(url):
    html=fetch(url)
    soup=BeautifulSoup(html,'html.parser')
    answer=soup.select_one('.answer')
    sources=[{'title':a.get_text(' ',strip=True),'url':a['href']} for a in soup.select('.sources a[href]')]
    return {'url':url,'slug':url.rsplit('/',1)[-1].removesuffix('.html'),'title':soup.h1.get_text(' ',strip=True),'answer_html':str(answer) if answer else '', 'answer':answer.get_text('\n',strip=True) if answer else '', 'sources':sources,'stage':soup.select_one('.tags .chip').get_text(' ',strip=True),'status':[x.get_text(' ',strip=True) for x in soup.select('.tags .pill')], 'notice':soup.select_one('.notice').get_text(' ',strip=True) if soup.select_one('.notice') else ''}

if __name__=='__main__':
    sitemap=fetch(BASE+'sitemap.xml')
    ROOT.joinpath('sitemap.xml').write_text(sitemap)
    urls=[e.text for e in ElementTree.fromstring(sitemap).iter() if e.tag.endswith('loc') and '/q/' in e.text]
    with ThreadPoolExecutor(max_workers=5) as pool: data=list(pool.map(article,urls))
    ROOT.joinpath('snapshot.json').write_text(json.dumps({'source':BASE,'fetchedAt':'2026-10-29','articles':data},ensure_ascii=False,indent=2))
    for row in data:print(row['slug'],row['title'],row['status'],'\n',row['answer'],'\n')

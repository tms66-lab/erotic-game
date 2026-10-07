"""Télécharge les images d'un export Instagram (format Apify « instagram-scraper »).

Usage : python3 -I tools/fetch_insta_images.py EXPORT.json DOSSIER_SORTIE

Les images sont rangées par post : DOSSIER_SORTIE/<shortCode>/<n>.jpg, avec un
index.json (légende, likes, date, fichiers). Les liens du CDN Instagram expirent
quelques jours après l'export ; il faut alors relancer le scraper.
"""
import concurrent.futures
import json
import os
import sys
import urllib.request


def post_urls(post):
    urls = []
    for c in post.get('childPosts') or []:
        if c.get('displayUrl'):
            urls.append(c['displayUrl'])
    for u in post.get('images') or []:
        if u not in urls:
            urls.append(u)
    if not urls and post.get('displayUrl'):
        urls.append(post['displayUrl'])
    return urls


def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return path, None
    try:
        with urllib.request.urlopen(url, timeout=30) as r, open(path, 'wb') as f:
            f.write(r.read())
        return path, None
    except Exception as e:  # noqa: BLE001 — on note l'erreur et on continue
        return path, str(e)


def main(src, out):
    posts = json.load(open(src, encoding='utf-8'))
    os.makedirs(out, exist_ok=True)
    jobs, index = [], []
    for p in posts:
        code = p.get('shortCode') or p['id']
        d = os.path.join(out, code)
        os.makedirs(d, exist_ok=True)
        files = []
        for i, u in enumerate(post_urls(p)):
            path = os.path.join(d, f'{i:02d}.jpg')
            files.append(os.path.relpath(path, out))
            jobs.append((u, path))
        index.append({
            'shortCode': code,
            'timestamp': p.get('timestamp'),
            'likes': p.get('likesCount'),
            'caption': (p.get('caption') or '').split('#')[0].strip(),
            'files': files,
        })

    errors = 0
    with concurrent.futures.ThreadPoolExecutor(8) as ex:
        for n, (path, err) in enumerate(ex.map(lambda j: fetch(*j), jobs), 1):
            if err:
                errors += 1
                print(f'ERREUR {path}: {err}', file=sys.stderr)
            if n % 50 == 0:
                print(f'{n}/{len(jobs)}')

    json.dump(index, open(os.path.join(out, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'Terminé : {len(jobs) - errors}/{len(jobs)} images, {len(posts)} posts.')
    return 1 if errors == len(jobs) else 0


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1], sys.argv[2]))

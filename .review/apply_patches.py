#!/usr/bin/env python3
"""Integrator: apply agent patches to Quizzy question banks atomically.

Reads .review/patches/*.json, applies set/delete ops, rewrites the four
shipped bank files + pending files, reports a summary. Idempotence not
guaranteed after partial failure — run once on a clean tree.
"""
import json, sys, glob, collections

ROOT = '/Users/erwangranger/Documents/quizzy'
BANK_FILES = [
    'questions/general-knowledge_en.json',
    'questions/general-knowledge_fr.json',
    'questions/recent-news.json',
    'questions/fr-recent-news.json',
    'questions/pending/news-2026-10-23.json',
    'questions/pending/fr-news-2026-10-23.json',
    'questions/pending/news-2026-11-06.json',
    'questions/pending/fr-news-2026-11-06.json',
]
ALLOWED_FIELDS = {'question', 'correct_answer', 'incorrect_answers',
                  'explanation', 'difficulty'}

banks = {}   # path -> list of question dicts (ordered)
index = {}   # id -> (path, position)
for rel in BANK_FILES:
    with open(f'{ROOT}/{rel}', encoding='utf-8') as f:
        banks[rel] = json.load(f)
    for i, q in enumerate(banks[rel]):
        assert q['id'] not in index, f"duplicate id {q['id']} in {rel} and {index[q['id']][0]}"
        index[q['id']] = (rel, i)

patches = sorted(glob.glob(f'{ROOT}/.review/patches/*.json'))
edits = collections.Counter()
deletes = []
skipped = []

for pp in patches:
    with open(pp, encoding='utf-8') as f:
        patch = json.load(f)
    for e in patch.get('edit_log', []):
        qid = e['id']
        if qid not in index:
            skipped.append(f"{pp}: id {qid} not found")
            continue
        rel, i = index[qid]
        q = banks[rel][i]
        bad = set(e.get('set', {})) - ALLOWED_FIELDS
        if bad:
            skipped.append(f"{pp}: illegal fields {bad} for {qid}")
            continue
        if q['lang'] != e.get('lang', q['lang']):
            skipped.append(f"{pp}: lang mismatch {qid} ({e.get('lang')} vs {q['lang']})")
            continue
        for k, v in e['set'].items():
            old = q[k]
            q[k] = v
            if old != v:
                edits[qid] += 1
    for qid in patch.get('delete_ids', []):
        if qid not in index:
            skipped.append(f"{pp}: delete id {qid} not found")
            continue
        deletes.append((qid, pp))

deleted = set(qid for qid, _ in deletes)
for rel in BANK_FILES:
    before = len(banks[rel])
    banks[rel] = [q for q in banks[rel] if q['id'] not in deleted]
    if len(banks[rel]) != before:
        print(f"{rel}: {before} -> {len(banks[rel])} (-{before - len(banks[rel])})")

for rel in BANK_FILES:
    with open(f'{ROOT}/{rel}', 'w', encoding='utf-8') as f:
        json.dump(banks[rel], f, ensure_ascii=False, indent=2)
        f.write('\n')

n_set = sum(len(e.get('set', {})) for pp in patches for e in
            json.load(open(pp))['edit_log'])
print(f"patches: {len(patches)} | edit entries: "
      f"{sum(len(json.load(open(pp))['edit_log']) for pp in patches)} "
      f"| field changes: {n_set} | deleted: {len(deleted)} {sorted(deleted)}")
if skipped:
    print('SKIPPED / ISSUES:')
    for s in skipped:
        print(' -', s)
    sys.exit(1)
print('OK')

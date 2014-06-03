import os
import hashlib

import requests

# URL = 'http://translate.google.com/translate_tts?ie=UTF-8&q=forskning&tl=sv'
URL = 'http://translate.google.com/translate_tts'

def download_mp3(word, locale):
    # if filename is None:
    #     filename = hashlib.md5(
    #         '%s%s' % (word.encode('utf-8'), locale)
    #     ).hexdigest()
    url = URL
    payload = {
        'ie': 'UTF-8',
        'q': word,
        'tl': locale
    }
    headers = {'User-Agent': 'Mozilla'}
    res = requests.get(url, params=payload, headers=headers)
    return res.content

    with open(file_path, 'wb') as f:
        f.write(res.content)

    return file_path

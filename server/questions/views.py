import os
import functools
import time
import stat

from django.db.utils import IntegrityError
from django.contrib.sites.models import RequestSite
from jsonview.decorators import json_view
from sorl.thumbnail import get_thumbnail

from .models import Question, QuestionGroup, Word


def add_CORS_header(f):
    @functools.wraps(f)
    def wrapper(request, *args, **kw):
        response = f(request, *args, **kw)
        response['Access-Control-Allow-Origin'] = '*'
        return response
    return wrapper


def thumbnail(filename, geometry, **options):
    try:
        return get_thumbnail(filename, geometry, **options)
    except IOError:
        return None
    except IntegrityError:
        # annoyingly, this happens sometimes because kvstore in sorl
        # doesn't check before writing properly
        # see https://bugzilla.mozilla.org/show_bug.cgi?id=817765
        # try again
        time.sleep(1)
        return thumbnail(filename, geometry, **options)


@add_CORS_header
@json_view
def home(request):
    group = request.GET.get('group', 'swedish')
    group = QuestionGroup.objects.get(name__icontains=group)
    geometry = request.GET.get('geometry', '200x200')
    questions_qs = Question.objects.filter(group=group)
    questions = []

    base_url = '%s://%s' % (
        request.is_secure() and 'https' or 'http',
        RequestSite(request).domain
    )
    #base_url='http://192.168.42.90'
    def absolute_url(url):
        if '://' not in url:
            url = base_url + url
        return url

    def serialize_word(word):
        data = {
            'word': word.word,
            'id': word.id,
        }
        if word.explanation:
            data['explanation'] = word.explanation
        if word.mp3file:
            data['mp3file'] = absolute_url(word.mp3file.url)
        if word.oggfile:
            data['oggfile'] = absolute_url(word.oggfile.url)
        return data

    for item in questions_qs.order_by('created'):
        thumb = thumbnail(item.picture, geometry)
        question = {
            'picture': {
                'url': absolute_url(thumb.url),
                'width': thumb.width,
                'height': thumb.height
            },
            'correct': [],
            # 'incorrect': [],
        }
        for word in item.correct.all():
            if has_audio_file(word):
                question['correct'].append(word.id)
        # for word in item.incorrect.all():
        #     if has_audio_file(word):
        #         question['incorrect'].append(serialize_word(word))

        # if question['correct'] and question['incorrect']:
        if question['correct']:
            questions.append(question)

    words = {}
    words_qs = Word.objects.filter(locale=group.locale, mp3file__isnull=False)
    for word in words_qs:
        if has_audio_file(word):
            words[word.id] = serialize_word(word)

    context = {
        'locale': group.locale.code,
        'name': group.name,
        'questions': questions,
        'words': words,
    }
    return context


def has_audio_file(word):
    if word.mp3file:
        if os.path.isfile(word.mp3file.path):
            if os.stat(word.mp3file.path)[stat.ST_SIZE]:
                return True
            else:
                word.mp3file = None
                word.save()
    return False

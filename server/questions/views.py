import os
import functools
import time
import stat
from collections import defaultdict

from django.db.utils import IntegrityError
from django.contrib.sites.models import RequestSite
from django.core.urlresolvers import reverse

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
def questions(request, id):
    group = QuestionGroup.objects.get(id=id)
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
            'id': word.uuid,
        }
        if word.explanation:
            data['explanation'] = word.explanation
        if word.mp3file:
            data['mp3file'] = absolute_url(word.mp3file.url)
        if word.oggfile:
            data['oggfile'] = absolute_url(word.oggfile.url)
        return data

    words_qs = (
        Question.correct.through.objects
        .filter(question__in=questions_qs)
        .filter(word__mp3file__isnull=False)
    )

    words = defaultdict(list)
    for correct in words_qs.select_related('word', 'question'):
        word = correct.word
        if has_audio_file(word):
            words[correct.question.id].append(serialize_word(word))
        else:
            print repr(word), "lacks audio file"

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
        question['correct'] = words[item.id]

        if question['correct']:
            questions.append(question)

    context = {
        'locale': group.locale.code,
        'group': {
            # 'locale': group.locale.code,
            'name': group.name,
            'id': group.id,
            # 'wordcount': correct_wordcount,
        },
        'questions': questions,
        # 'words': words,
    }

    return context, 200, {'Access-Control-Allow-Origin': '*'}


def has_audio_file(word):
    if word.mp3file:
        return True
    return False


@add_CORS_header
@json_view
def groups(request):
    base_url = '%s://%s' % (
        request.is_secure() and 'https' or 'http',
        RequestSite(request).domain
    )

    def serialize_group(g):
        correct_wordcount = 0
        correct_wordcount = (
            Question.correct.through.objects
            .filter(question__in=Question.objects.filter(group=g)).count()
        )

        return {
            'name': g.name,
            'id': g.id,
            'locale': g.locale.code,
            'word_count': correct_wordcount,
            'url': base_url + reverse('questions:questions', args=(g.id,)),
        }
    context = {
        'groups': [
            serialize_group(x)
            for x in
            QuestionGroup.objects.all().select_related('locale')
            #if Question.objects.filter(group=x)
        ]
    }
    return context, 200, {'Access-Control-Allow-Origin': '*'}

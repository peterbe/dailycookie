import functools
import time

from django.db.utils import IntegrityError
from django.contrib.sites.models import RequestSite
from jsonview.decorators import json_view
from sorl.thumbnail import get_thumbnail

from .models import Question, QuestionGroup


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
    def absolute_url(url):
        if '://' not in url:
            url = base_url + url
        return url

    for item in questions_qs.order_by('created'):
        thumb = thumbnail(item.picture, geometry)
        questions.append({
            'picture': {
                'url': absolute_url(thumb.url),
                'width': thumb.width,
                'height': thumb.height
            },
            'correct': item.correct,
            'incorrect': item.incorrect
        })
    context = {
        'locale': group.locale,
        'name': group.name,
        'questions': questions,
    }
    return context

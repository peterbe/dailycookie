import time

from django.db.utils import IntegrityError
from jsonview.decorators import json_view
from sorl.thumbnail import get_thumbnail

from .models import Question, QuestionGroup


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


def home(request):
    group = request.GET.get('group')
    geometry = request.GET.get('geometry', '200x200')
    questions_qs = Question.objects.all()
    questions = []
    for item in questions_qs.order_by('created'):
        thumb = thumbnail(item.picture)
        questions.append({
            'picture': {
                'url': thumb.url,
                'width': thumb.width,
                'height': thumb.height
            },
            'correct': question.correct.word,
            'incorrect': [x.word for x in question.incorrect.all()]
        })

    return questions

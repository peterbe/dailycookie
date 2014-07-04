import os
import functools
import time
import stat
from collections import defaultdict

from django.db.utils import IntegrityError
from django.contrib.sites.models import RequestSite
from django.core.urlresolvers import reverse
from django.shortcuts import render
from django.template.loader import TemplateDoesNotExist
from django import http

from jsonview.decorators import json_view
from sorl.thumbnail import get_thumbnail

from server.questions.models import Question, QuestionGroup, Word


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


def home(request):
    return render(request, 'cms/home.html')


def partial(request, template):
    try:
        return render(request, 'cms/partials/%s' % template)
    except TemplateDoesNotExist:
        raise http.Http404()

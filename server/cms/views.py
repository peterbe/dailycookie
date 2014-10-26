import os
import functools
import time
import stat
from collections import defaultdict

from django.db.utils import IntegrityError
from django.contrib.sites.models import RequestSite
from django.core.urlresolvers import reverse
from django.shortcuts import render, get_object_or_404
from django.template.loader import TemplateDoesNotExist
from django import http
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

from jsonview.decorators import json_view

from server.questions.models import Question, QuestionGroup, Word
from server.questions.views import thumbnail
from . import forms

def add_CORS_header(f):
    @functools.wraps(f)
    def wrapper(request, *args, **kw):
        response = f(request, *args, **kw)
        response['Access-Control-Allow-Origin'] = '*'
        return response
    return wrapper


@login_required
def home(request):
    if 'text/html' not in request.META.get('HTTP_ACCEPT'):
        # an angular AJAX request gone rogue
        raise http.Http404()

    return render(request, 'cms/home.html')


def partial(request, template):
    try:
        return render(request, 'cms/partials/%s' % template)
    except TemplateDoesNotExist:
        raise http.Http404()


@login_required
@json_view
def group(request, group_id):
    group = get_object_or_404(QuestionGroup, id=group_id)
    return {
        'name': group.name,
        'locale': {
            'name': group.locale.name,
            'code': group.locale.code
        },
    }


@login_required
@json_view
def group_questions(request, group_id):
    group = get_object_or_404(QuestionGroup, id=group_id)
    geometry = request.GET.get('geometry', '200x200')
    qs = Question.objects.filter(group=group).select_related('author')
    questions = []
    for question in qs:
        words = []
        thumb = thumbnail(question.picture, geometry, crop='center')
        for word in question.correct.all().select_related('author'):
            words.append({
                'word': word.word,
                'mp3file': word.mp3file.url,
                'explanation': word.explanation,
                'author': word.author.username,
                'created': word.created.isoformat(),
                'modified': word.modified.isoformat(),
            })
        questions.append({
            'thumbnail': {
                'url': thumb.url,
                'width': thumb.width,
                'height': thumb.height
            },
            'words': words,
            'author': question.author.username,
            'created': question.created.isoformat(),
            'modified': question.modified.isoformat(),
        })
    return {'questions': questions}


@login_required
@require_POST
@json_view
def upload(request, group_id):
    group = get_object_or_404(QuestionGroup, id=group_id)
    form = forms.UploadForm(request.POST, request.FILES)
    if not form.is_valid():
        raise BadRequest # XXX

    question = form.save(commit=False)
    question.group = group
    question.author = request.user
    question.save()

    return {'question': {'id': question.id}}
    # raise NotImplementedError(group)
